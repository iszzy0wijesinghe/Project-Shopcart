import bcrypt from 'bcryptjs';
import crypto from "crypto";
import logger from '../utils/logger.js';
import sendEmail from '../utils/sendEmail.js';
import { custGenerateToken, custVerifyToken } from '../utils/custGenerateToken.js';
import { validatePassword, validatePhone } from '../utils/customerValidation.js';
import { verificationEmailTemplate } from "../utils/emailTemplates.js";
import Customer from '../models/Customer.js';
import Token from '../models/Token.js';
import { OAuth2Client } from 'google-auth-library';

// TODO: use sendEmail calls should be updated to use the new sendEmail function

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRE = process.env.JWT_EXPIRE

// Registering a new customer
export const registerCustomer = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
    
        // Check if user already exists
        const existingUser = await Customer.findOne({ 
            $or: [{ email: email.toLowerCase() }, { phone }] 
        });

        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'An account with this email or phone already exists' 
            });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: passwordValidation.message 
            });
        }

        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: phoneValidation.message 
            });
        }
    
        // Create a new Customer record
        const newUser = new Customer({
            email: email.toLowerCase(),
            passwordHash: password,
            firstName,
            lastName,
            phoneNo: phone,
            emailVerified: false
        });
    
        await newUser.save();
    
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await new Token({
            userId: newUser._id,
            token: verificationToken,
            type: 'emailVerification',
            expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hours
        }).save();

        // Send verification email
        // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const emailContent = verificationEmailTemplate(verificationUrl);
        await sendEmail(newUser.email, "Verify Your Email", emailContent);

        // Generate auth tokens
        const { accessToken, refreshToken } = custGenerateToken(newUser);
    
        // Save refresh token
        await new Token({
            userId: newUser._id,
            token: refreshToken,
            type: 'refresh',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }).save();

        // Set refresh token as HTTP-only cookie
        res.cookie('custRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/custAuth/secure',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Set access token as HTTP-only cookie
        res.cookie('custAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        const loggerMsg = `${newUser.firstName} successfully Registered to the system | Verification email sent to ${newUser.email}`;
        logger.info(loggerMsg);

        return res.status(201).json({
            success: true,
            message: `Registration successful, we sent you a verification link to your email ${newUser.email}`,
            data: {
              user: {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phone: newUser.phoneNo,
                emailVerified: newUser.isVerified
              },
            //   accessToken
            }
        });
    } catch (error) {
        logger.error('Registration error =>');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.'
        });
    }
}

// Login a customer
export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;
  
        // Find the customer
        const customer = await Customer.findOne({ email: email.toLowerCase() });
        if (!customer) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }

        if (customer.authType == 'google'){
            return res.status(401).json({
                success: false,
                message: 'Use the Sign In with Google Option'
            });
        }

        // Verify password
        const isPasswordValid = await customer.comparePassword(password);
        if (!isPasswordValid) {
            // Update failed login attempts
            customer.failedLoginAttempts = (customer.failedLoginAttempts || 0) + 1;
            
            // Lock account after 5 failed attempts
            if (customer.failedLoginAttempts >= 5) {
                customer.accountLocked = true;
                customer.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                await customer.save();
            
                return res.status(401).json({
                    success: false,
                    message: 'Account locked due to multiple failed login attempts. Please try again in 30 minutes or reset your password.'
                });
            }
            
            await customer.save();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (customer.accountLocked && customer.lockUntil > Date.now()) {
            return res.status(401).json({
            success: false,
            message: 'Account is locked. Please try again later or reset your password.'
            });
        }

        // Reset failed login attempts on successful login
        if (customer.failedLoginAttempts > 0 || customer.accountLocked) {
            customer.failedLoginAttempts = 0;
            customer.accountLocked = false;
            customer.lockUntil = null;
            await customer.save();
        }

        // Generate auth tokens
        const { accessToken, refreshToken } = custGenerateToken(customer);

        // Save refresh token
        await Token.deleteMany({ userId: customer._id, type: 'refresh' });
        await new Token({
            userId: customer._id,
            token: refreshToken,
            type: 'refresh',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }).save();

        // Log login activity
        customer.lastLoginAt = new Date();
        customer.lastLoginIp = req.ip;
        await customer.save();

        const loggerMsg = `${customer.firstName} successfully Logged in to the system`;
        logger.info(loggerMsg);

        // Set refresh token as HTTP-only cookie
        res.cookie('custRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/custAuth/secure',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Set access token as HTTP-only cookie
        res.cookie('custAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            // data: {
            //     cutomer : {
            //         id: customer._id,
            //         email: customer.email,
            //         firstName: customer.firstName,
            //         lastName: customer.lastName,
            //         phone: customer.phoneNo,
            //         emailVerified: customer.isVerified
            //     },
                // accessToken
            // }
        });
    } catch (error) {
        logger.error('Login error => ');
        logger.error(error);
        return res.status(500).json({
          success: false,
          message: 'Login failed. Please try again later.'
        });
    }
}

export const googleAuth = async(req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ success: false, message: 'No credential provided' });
        }

        logger.info(`Google Authentication Started`)

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        // 1. Verify the token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID, // must match your client ID
        });
        const payload = ticket.getPayload();

        // payload now contains user info from Google:
        // e.g., payload.email, payload.given_name, payload.family_name, payload.sub, etc.

        if (!payload.email_verified) {
            return res.status(400).json({ 
            success: false, 
            message: 'Google account not verified' 
            });
        }

        logger.info(`Payload from Google => ${payload}`)

        // 2. Check if user exists
        let user = await Customer.findOne({ email: payload.email.toLowerCase() });
        if (!user) {
            // 3. If user doesn't exist, create a new record (Registration)
            user = new Customer({
                email: payload.email.toLowerCase(),
                firstName: payload.given_name || '',
                lastName: payload.family_name || '',
                // Optionally store the Google user id in a separate field
                googleId: payload.sub,
                authType: 'google',
                // Mark as verified if you trust Google's email verification
                emailVerified: true,
            });

            logger.info(`${user.firstName} Registed Successfully using Google Payload`)
            await user.save();
        }

        // 4. Generate your normal tokens
        const { accessToken, refreshToken } = custGenerateToken(user);

        // 5. Save the refresh token in DB (like your normal login flow)
        await Token.deleteMany({ userId: user._id, type: 'refresh' }); // clear old tokens if desired
        await new Token({
            userId: user._id,
            token: refreshToken,
            type: 'refresh',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }).save();

        // 6. Set cookies
        res.cookie('custRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/custAuth/secure',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.cookie('custAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        logger.info(`${user.firstName} did a Successfull Google Authentication`)

        // 7. Respond
        return res.status(200).json({
            success: true,
            message: 'Google login successful',
        });
    } catch (error) {
        logger.error('Google Auth error => ');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Google login failed. Please try again later.'
        });
    }
}

// Refresh the access token using refresh token
export const refreshToken = async (req, res) => {
    logger.info('Refresh token called');
    try {
        const refreshToken = req.cookies.custRefreshToken;

        // If neither token is available, it likely means the user is logged out.
        if (!refreshToken) {
            logger.info('-------------------------------1')
            res.clearCookie('custAccessToken');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized | Refresh token not found'
            });
        }

        // Verify token exists in database
        const tokenDoc = await Token.findOne({ token: refreshToken, type: 'refresh' });
        if (!tokenDoc) {
            logger.info('-------------------------------2')
            res.clearCookie('custAccessToken');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized | Invalid refresh token'
            });
        }

        // Check if token is expired
        if (tokenDoc.expiresAt < new Date()) {
            await Token.deleteOne({ _id: tokenDoc._id });
            logger.info('-------------------------------3')
            res.clearCookie('custAccessToken');
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired'
            });
        }

        // Find the customer
        const customer = await Customer.findById(tokenDoc.userId);
        if (!customer) {
            logger.info('-------------------------------4')
            res.clearCookie('custAccessToken');
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = custGenerateToken(customer);

        // Update refresh token
        tokenDoc.token = newRefreshToken;
        tokenDoc.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await tokenDoc.save();

        // Set new refresh token as HTTP-only cookie
        res.cookie('custRefreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/custAuth/secure',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Set access token as HTTP-only cookie
        res.cookie('custAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        const loggerMsg = `Access token of the ${customer.firstName} successfully refreshed`;
        logger.warn(loggerMsg);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                // accessToken
            }
        });
    } catch (error) {
        logger.error('Refresh token error => ');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
}

// Logout a customer
export const logoutCustomer = async (req, res) => {
    try {
        const refreshToken = req.cookies.custRefreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized | Refresh token not found'
            });
        }
      
        if (refreshToken) {
            // Remove token from database
            await Token.deleteOne({ token: refreshToken, type: 'refresh' });
        }

        // Clear cookie
        // res.clearCookie('custRefreshToken');
        res.clearCookie('custRefreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: '/api/custAuth/secure',
          });
        res.clearCookie('custAccessToken');

        const loggerMsg = `Logged Out Successfully`;
        logger.info(loggerMsg);

        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Logout error => ');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
}

// Password reset request
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find the customer
        const customer = await Customer.findOne({ email: email.toLowerCase() });
        if (!customer) {
            // Not revealing that email doesn't exist
            return res.status(200).json({
                success: true,
                message: 'If your email is registered, you will receive a password reset link'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Save token to database
        await Token.deleteMany({ userId: customer._id, type: 'passwordReset' });
        await new Token({
            userId: customer._id,
            token: resetToken,
            type: 'passwordReset',
            expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
        }).save();

        // Send password reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        // const resetUrl = `${process.env.BACKEND_URL}/api/custAuth/customer-reset-password/${resetToken}`;
        const emailContent = verificationEmailTemplate(resetUrl);
        await sendEmail(customer.email, "Reset Your Password Email", emailContent);

        // await sendEmail({
        //     to: customer.email,
        //     subject: 'Reset Your Password',
        //     template: 'password-reset',
        //     context: {
        //         name: customer.firstName,
        //         resetUrl
        //     }
        // });

        const loggerMsg = `Reset Password URL is sent to ${customer.firstName} successfully | Reset email sent to ${customer.email}`;
        logger.info(loggerMsg);

        return res.status(200).json({
            success: true,
            message: 'If your email is registered, you will receive a password reset link'
        });   
    } catch (error) {
        logger.error('Forgot password error => ');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process password reset email'
        });
    }
}

// Reset password using token
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        // Find token
        const resetToken = await Token.findOne({ 
          token, 
          type: 'passwordReset',
          expiresAt: { $gt: new Date() }
        });
        
        if (!resetToken) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }
  
        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({ 
            success: false, 
            message: passwordValidation.message 
          });
        }
  
        // Find the customer using ther user ID from the refresh token
        const customer = await Customer.findById(resetToken.userId);
        if (!customer) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
  
        // Update password(password is hashed in the model)
        // const salt = await bcrypt.genSalt(12);
        // const hashedPassword = await bcrypt.hash(password, salt);
        customer.passwordHash = password;
        customer.passwordChangedAt = new Date();
        
        // Reset failed login attempts and unlock account
        customer.failedLoginAttempts = 0;
        customer.accountLocked = false;
        customer.lockUntil = null;
        
        await customer.save();
  
        // Delete all user's refresh tokens to force re-login with new password
        await Token.deleteMany({ userId: customer._id, type: 'refresh' });
        
        // Delete the used reset token
        await Token.deleteOne({ _id: resetToken._id });
  
        // Send password changed confirmation email
        const msg = `Hi, ${customer.firstName} Your password has been changed successfully. If you did not perform this action, please contact us immediately.`;
        const emailContent = verificationEmailTemplate(msg);
        await sendEmail(customer.email, "Your Password Has Been Reset", emailContent);

        // await sendEmail({
        //   to: customer.email,
        //   subject: 'Your Password Has Been Reset',
        //   template: 'password-changed',
        //   context: {
        //     name: customer.firstName
        //   }
        // });
  
        const loggerMsg = `${customer.firstName} successfully reset their password`;
        logger.info(loggerMsg);

        return res.status(200).json({
          success: true,
          message: 'Password reset successful. Please log in with your new password.'
        });
    } catch (error) {
        logger.error('Reset password error =>');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
}

// Verify email using token
export const verifyEmail = async (req, res) => {
    try {
        // const { token } = req.body;
        const { token } = req.params;
        
        // Find verification token
        const verificationToken = await Token.findOne({ 
          token, 
          type: 'emailVerification',
          expiresAt: { $gt: new Date() }
        });
        
        if (!verificationToken) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }
  
        // Find the customer using ther user ID from the verification token
        const customer = await Customer.findById(verificationToken.userId);
        if (!customer) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
  
        // Update user
        customer.isVerified = true;
        await customer.save();
  
        // Delete the used token
        await Token.deleteOne({ _id: verificationToken._id });

        const loggerMsg = `${customer.firstName} successfully verified their email | Email: ${customer.email}`;
        logger.info(loggerMsg);
  
        return res.status(200).json({
          success: true,
          message: 'Email verified successfully'
        });
    } catch (error) {
        logger.error('Email verification error =>');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify email'
        });
    }
}

// Request to resend email verification
export const resendVerificationEmail = async (req, res) => {
    try {
        // const customer = await Customer.findById(req.user.id);
        // if (!customer) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'User not found'
        //     });
        // }

        const { email } = req.body; // Get the email from the request body
        if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
        }
        
        // Find the customer by email
        const customer = await Customer.findOne({ email });
        if (!customer) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
        }

        if (customer.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Check if a verification was sent recently (within the last 15 minutes)
        const recentToken = await Token.findOne({
            userId: customer._id,
            type: 'emailVerification',
            createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) } // Within last 15 mins
        });

        if (recentToken) {
            return res.status(429).json({
                success: false,
                message: 'A verification email was sent recently. Please wait before requesting another one.'
            });
        }

        // Delete any existing verification tokens
        await Token.deleteMany({ userId: customer._id, type: 'emailVerification' });
  
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await new Token({
            userId: customer._id,
            token: verificationToken,
            type: 'emailVerification',
            expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
        }).save();
  
        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        // const verificationUrl = `${process.env.BACKEND_URL}/api/custAuth/customer-verify-email/${verificationToken}`;
        const emailContent = verificationEmailTemplate(verificationUrl);
        await sendEmail(customer.email, "Resend Vefification Email", emailContent);

        // await sendEmail({
        //   to: customer.email,
        //   subject: 'Verify Your Email Address',
        //   template: 'email-verification',
        //   context: {
        //     name: customer.firstName,
        //     verificationUrl
        //   }
        // });
  
        const loggerMsg = `Resent the verification email to ${customer.firstName} | ${customer.email}`;
        logger.info(loggerMsg);

        return res.status(200).json({
          success: true,
          message: 'Verification email sent successfully'
        });
    } catch (error) {
        logger.error('Resend verification email error =>');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend verification email'
        });
    }
}

// Get current customer info
export const getCurrentCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id).select('-passwordHash');

        if (!customer) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
        }

        const loggerMsg = `Current Customer ${customer.firstName} is shown `;
        logger.info(loggerMsg);

        return res.status(200).json({
            success: true,
            data: {
              customer: {
                id: customer._id,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phoneNo,
                addresses: customer.addresses,
                preferences: customer.preferences,
                emailVerified: customer.emailVerified,
                createdAt: customer.createdAt
              }
            }
          });
    } catch (error) {
        logger.error('Get current customer error =>');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch the customer information'
        });
    }
}

// Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Find user
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).json({
            success: false,
            message: 'User not found'
            });
        }
  
        // Verify current password
        const isPasswordValid = await customer.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
              success: false,
              message: 'New password must be different from the current password'
            });
        }          
  
        // Validate new password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: passwordValidation.message 
            });
        }

        // Check if password was changed in the last 10 minutes
        const now = new Date();
        if (customer.passwordChangedAt && (now - customer.passwordChangedAt) < 10 * 60 * 1000) {
        return res.status(429).json({
            success: false,
            message: 'Password can only be changed once per 10 minutes'
        });
        }
  
        // Update password
        customer.passwordHash = newPassword;
        customer.passwordChangedAt = new Date();

        // Reset failed login attempts and unlock account
        customer.failedLoginAttempts = 0;
        customer.accountLocked = false;
        customer.lockUntil = null;
        await customer.save();
  
        // Delete all user's refresh tokens to force re-login with new password
        await Token.deleteMany({ userId: customer._id, type: 'refresh' });
  
        // Clear cookie
        res.clearCookie('custRefreshToken');
  
        // Send password changed confirmation email
        const msg = `Hi, ${customer.firstName} Your password has been changed successfully. If you did not perform this action, please contact us immediately.`;
        const emailContent = verificationEmailTemplate(msg);
        await sendEmail(customer.email, "Your Password Has Been Changed", emailContent);

        // await sendEmail({
        //   to: customer.email,
        //   subject: 'Your Password Has Been Changed',
        //   template: 'password-changed',
        //   context: {
        //     name: customer.firstName
        //   }
        // });
  
        const loggerMsg = `Customer ${customer.firstName} changed their password successfully`;
        logger.info(loggerMsg);

        return res.status(200).json({
          success: true,
          message: 'Password changed successfully. Please log in with your new password.'
        });
    } catch (error) {
        logger.error('Change password error =>');
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
}