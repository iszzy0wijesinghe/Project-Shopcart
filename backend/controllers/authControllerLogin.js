import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import crypto from "crypto";

import logger from '../utils/logger.js';
import sendEmail from '../utils/sendEmail.js';
import ShopOwner from '../models/ShopOwner.js';
import LoginAttempt from '../models/LoginAttempt.js';
import FailAttempt from '../models/FailAttempt.js';
import Driver from "../models/Driver.js";

import generateToken from "../utils/generateToken.js";
import { otpEmailTemplateLogin, blockAccountTemplateLogin, yourAccountBlockedTemplate } from "../utils/emailTemplates.js";

// EXAMPLE: 3rd-party IP check. 
// If "false" => suspicious => block immediately
// Example with ipinfo.io

// In your .env, set IPINFO_TOKEN=xxxxxxxxxxxx
const IPINFO_TOKEN = process.env.IPINFO_TOKEN;

async function isIpSafe(ip) {
  if (!ip) return true; // If no IP provided, decide how to handle. For now, let’s say "safe."

  try {
    // Call ipinfo's API
    const { data } = await axios.get(`https://ipinfo.io/${ip}`, {
      params: {
        token: IPINFO_TOKEN, // pass your token here
      },
    });

    // 7.010345058161531, 79.93903311343769
    // 7.010840778394422, 79.9369008274297
    // 7.013557284723894, 79.93747153497246
    // 7.013198111515306, 79.93917335345519

    // 'data' might look like:
    // {
    //   ip: "xxx.xxx.xxx.xxx",
    //   city: "SomeCity",
    //   region: "SomeRegion",
    //   country: "US",
    //   loc: "37.3860,-122.0838",
    //   org: "AS15169 Google LLC",
    //   postal: "94035",
    //   timezone: "America/Los_Angeles",
    //   bogon: false
    // }

    // Perform your checks:
    // 1. Possibly check if it's a known "bogon" or private IP
    if (data.bogon) {
      // ipinfo.io returns 'bogon' = true for private or invalid IPs
      return false;
    }

    // 2. You could also check if the user is coming from a country you disallow:
    // if (data.country !== 'US') {
    //   return false;
    // }

    // 3. If you want to check if the IP is flagged as a proxy or VPN,
    // you'd use a different service or a premium ipinfo feature.

    // If none of your conditions fail, consider it safe:

    return true;

  } catch (error) {
    console.error('Error calling ipinfo.io:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Compare user’s location to a stored location
function locationMatchesDB(userLat, userLon, dbLat, dbLon) {
  // logger.info(`userLat => ${userLat} |`);
  // logger.info(`userLon => ${userLon} |`);
  // logger.info(`dbLat => ${dbLat} |`);
  // logger.info(`dbLon => ${dbLon} |`);
  // const threshold = 0.0;
  // return (
  //   Math.abs(userLat - dbLat) <= threshold &&
  //   Math.abs(userLon - dbLon) <= threshold
  // );
  return true;
}

// Helper to increment fails & possibly lock/block 
// (NO storeId usage; identified by deviceId / browserToken only).
async function handleFailAttempt(deviceId, browserToken, res, failMsg) {
  try {
    // Build the query to find the `FailAttempt` record
    const query = {};
    if (deviceId) query.device_id = deviceId;
    if (browserToken) query.browser_token = browserToken;

    // Find or create a fail attempt record
    let failDoc = await FailAttempt.findOne(query);
    if (!failDoc) {
      failDoc = new FailAttempt({
        device_id: deviceId || '',
        browser_token: browserToken || '',
        failed_attempts: 0,
        is_locked: false,
        is_blocked: false,
        fail_count: 0,
        lockUntil: null,
      });
    }

    // Increment the failed attempts
    failDoc.failed_attempts += 1;

    // Lock the device if failed attempts reach 3
    if (failDoc.failed_attempts >= 3) {
      failDoc.is_locked = true;
      failDoc.failed_attempts = 0; // Reset failed attempts
      failDoc.fail_count += 1; // Increment fail count
      failDoc.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }

    // Block the device if fail_count reaches 2
    if (failDoc.fail_count >= 2) {
      failDoc.is_blocked = true;
      failDoc.is_locked = false; // Remove lock if the device is permanently blocked
      failDoc.lockUntil = null; // Clear lockUntil
    }

    // Save the updated `FailAttempt` document
    await failDoc.save();

    // Respond with appropriate message
    return res.status(401).json({
      success: false,
      message: failMsg,
      locked: failDoc.is_locked,
      blocked: failDoc.is_blocked,
      lockUntil: failDoc.lockUntil, // Include lockUntil for client-side awareness
    });
  } catch (error) {
    console.error('Error in handleFailAttempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in handling login failure.',
    });
  }
}

// Primary Validation
export const login = async (req, res) => {
  try {
    const {
      storeId,
      password,
      encryptedCode, // The plain encryption code provided by the user
      gps_latitude,
      gps_longitude,
      deviceId,
      browserToken,
      ipAddress,
    } = req.body;

    // 1) IP safety check
    const safeIP = await isIpSafe(ipAddress);
    if (!safeIP) {
      const query = {};
      if (deviceId) query.device_id = deviceId;
      if (browserToken) query.browser_token = browserToken;

      let failDoc = await FailAttempt.findOne(query);
      if (!failDoc) {
        failDoc = new FailAttempt({
          device_id: deviceId || '',
          browser_token: browserToken || '',
        });
      }

      failDoc.is_blocked = true;
      await failDoc.save();

      return res.status(403).json({
        success: false,
        message: 'IP address is invalid. Device has been blocked.',
      });
    }

    // 2) Check if device is locked or blocked
    const query = {};
    if (deviceId) query.device_id = deviceId;
    if (browserToken) query.browser_token = browserToken;

    let failDoc = await FailAttempt.findOne(query);

    if (failDoc) {
      // Dynamically check lock expiration
      if (failDoc.is_locked && failDoc.lockUntil && Date.now() > failDoc.lockUntil) {
        // Auto-unlock if the lock duration has passed
        failDoc.is_locked = false;
        failDoc.lockUntil = null;
        failDoc.failed_attempts = 0; // Reset failed attempts
        await failDoc.save();
      }

      // Check if device is still blocked
      if (failDoc.is_blocked) {
        return res.status(403).json({
          success: false,
          message: 'Device is blocked.',
        });
      }

      // Check if device is still locked
      if (failDoc.is_locked) {
        return res.status(403).json({
          success: false,
          message: 'Device is locked. Please wait.',
        });
      }
    } else {
      // If no failDoc exists, create one for tracking
      failDoc = new FailAttempt({
        device_id: deviceId || '',
        browser_token: browserToken || '',
      });
      await failDoc.save();
    }

    // 3) Validate the storeId and encryption code
    const loginDoc = await LoginAttempt.findOne({ storeId });
    if (!loginDoc) {
      return handleFailAttempt(
        deviceId,
        browserToken,
        res,
        'No login attempt record found for this storeId.'
      );
    }

    // Compare the provided code with the stored hashed code using bcrypt
    const isCodeValid = await bcrypt.compare(encryptedCode, loginDoc.encrypt_code);
    if (!isCodeValid) {
      return handleFailAttempt(
        deviceId,
        browserToken,
        res,
        'Invalid encryption code.'
      );
    }

    // 4) Validate location (if required)
    const locationMatches = locationMatchesDB(
      gps_latitude,
      gps_longitude,
      loginDoc.gps_latitude,
      loginDoc.gps_longitude
    );
    if (!locationMatches) {
      return handleFailAttempt(
        deviceId,
        browserToken,
        res,
        'Location mismatch.'
      );
    }

    // STEP B) Primary Validation Successful - Start Secondary Validation
    const secondaryValidationResult = await secondaryValidation({
      storeId,
      deviceId,
      browserToken,
      loginDoc,
      password,
    });

    // Handle response from secondary validation
    if (!secondaryValidationResult.success) {
      return res.status(secondaryValidationResult.status).json({
        success: false,
        message: secondaryValidationResult.message,
      });
    }

    // STEP C) Primary + Secondary Validation Passed - Send OTP
    return res.status(200).json({
      success: true,
      message: 'Primary and Secondary validation successful. OTP sent.',
    });
  } catch (error) {
    console.error('Error in login controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, please try again later.',
    });
  }
};

// Secondary Validation 
export const secondaryValidation = async ({ storeId, deviceId, browserToken, loginDoc, password }) => {
  try {
    // STEP A) Remove any primary validation failures
    if (deviceId || browserToken) {
      const query = {};
      if (deviceId) query.device_id = deviceId;
      if (browserToken) query.browser_token = browserToken;
      await FailAttempt.deleteOne(query);
    }

    // STEP B) Handle lock and block scenarios for secondary validation
    if (loginDoc.secondary_is_locked) {
      if (loginDoc.secondary_lock_until && new Date() > loginDoc.secondary_lock_until) {
        // Auto-unlock if lock period has expired
        loginDoc.secondary_is_locked = false;
        loginDoc.secondary_lock_until = null;
        loginDoc.secondary_failed_attempts = 0;
        await loginDoc.save();
      } else {
        return {
          success: false,
          status: 403,
          message: 'Account is locked. Please wait or contact support.',
        };
      }
    }

    if (loginDoc.secondary_is_blocked) {
      return {
        success: false,
        status: 403,
        message: 'Account is blocked. Contact support.',
      };
    }

    // STEP C) Fetch ShopOwner and verify password
    const shopOwner = await ShopOwner.findOne({ storeId });
    if (!shopOwner) {
      // Increment secondary failure and return
      await incrementSecondaryFail(loginDoc, shopOwner);
      return {
        success: false,
        status: 404,
        message: 'Account not found.',
      };
    }

    // STEP D) Compare hashed password with bcrypt
    const isMatch = await bcrypt.compare(password, shopOwner.password);
    if (!isMatch) {
      // Increment secondary failure and return
      await incrementSecondaryFail(loginDoc, shopOwner);
      return {
        success: false,
        status: 401,
        message: 'Incorrect password.',
      };
    }

    // STEP E) If password is correct => Generate OTP in loginDoc
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    loginDoc.otp = hashedOtp;
    loginDoc.otp_expires = new Date(Date.now() + 5 * 60 * 1000); // 10 min expiry
    loginDoc.secondary_failed_attempts = 0; // Reset failed attempts
    loginDoc.secondary_fail_count = 0; // Reset fail count
    await loginDoc.save();

    // STEP F) Generate a new block token and link
    const blockToken = generateToken(storeId);
    const blockLink = `${process.env.BACKEND_URL}/api/auth/block_account/${blockToken}`;

    const otpContent = otpEmailTemplateLogin(otp, shopOwner.fname, blockLink);
    await sendEmail(shopOwner.email, "Your OTP Code", otpContent);

    // Secondary validation successful
    return {
      success: true,
      status: 200,
      message: 'Secondary validation successful. OTP sent.',
    };
  } catch (error) {
    console.error('Error in secondaryValidation:', error);
    return {
      success: false,
      status: 500,
      message: 'Server error. Please try again later.',
    };
  }
};

// Handling the secondary validation fail attempt
async function incrementSecondaryFail(loginDoc, shopOwner) {
  try {
    loginDoc.secondary_failed_attempts += 1;

    if (loginDoc.secondary_failed_attempts >= 3) {
      // Lock the account for 30 minutes
      loginDoc.secondary_is_locked = true;
      loginDoc.secondary_lock_until = new Date(Date.now() + 30 * 60 * 1000);
      loginDoc.secondary_failed_attempts = 0;
      loginDoc.secondary_fail_count += 1;

      // Ensure storeId is retrieved from shopOwner
      const storeId = shopOwner.storeId; 
      if (!storeId) {
        throw new Error("Store ID is missing in shopOwner object.");
      }

      // Generate a new block token and link
      const blockToken = generateToken(storeId);
      const blockLink = `${process.env.BACKEND_URL}/api/auth/block_account/${blockToken}`;

      const blockContent = blockAccountTemplateLogin(shopOwner.storeId, shopOwner.fname, shopOwner.phone_no, shopOwner.email, shopOwner.store_name, shopOwner.store_address, blockLink);
      await sendEmail(process.env.COMPANY_EMAIL, "Account Locked - Investigate or Block", blockContent);
    }

    // If fail_count >= 2 => block
    if (loginDoc.secondary_fail_count >= 2) {
      loginDoc.secondary_is_blocked = true;
    }

    await loginDoc.save();
  } catch (error) {
    console.error('Error incrementing secondary fails:', error);
  }
}

// block endpoint in authController.js or separate controller, this will cause the user with email to get blcoked 
export const blockAccount = async (req, res) => {
  const { token } = req.params;

  try {
    // Step 1: Decode the token and extract the storeId
    const decoded = generateToken.verify(token);
    const { storeId } = decoded;

    // Step 2: Find the ShopOwner and check if already verified
    const loginDoc = await LoginAttempt.findOne({ storeId });
    if (!loginDoc) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    if (loginDoc.secondary_is_blocked) {
      return res.status(400).json({ message: "Account is already Blocked." });
    }

    // Step 3: Mark the Account as blocked
    loginDoc.secondary_is_blocked = true;
    loginDoc.secondary_is_locked = false;
    loginDoc.secondary_lock_until = null;
    loginDoc.otp = null;
    loginDoc.otp_expires = null;
    loginDoc.secondary_failed_attempts = 0;
    loginDoc.secondary_fail_count = 0;
    await loginDoc.save();

    // Fetch the associated ShopOwner details
    const shopOwner = await ShopOwner.findOne({ storeId });
    if (shopOwner) {
      // Send email to notify the user that their account has been blocked
      const yourAccBlockContent = yourAccountBlockedTemplate(shopOwner.fname);
      await sendEmail(shopOwner.email, 'Account Blocked', yourAccBlockContent);
    } else {
      console.error(`ShopOwner not found for Store ID: ${storeId}`);
    }

    // Respond to the client
    return res.status(200).json({
      success: true,
      message: 'Account blocked and email sent.',
    });
  } catch (err) {
    console.error('Error in blockAccount:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error blocking account.',
    });
  }
};

// if OTP has not been obtained 
export const resendOtpLogin = async (req, res) => {
  try {
    const { storeId } = req.body;

    // Find the LoginAttempt for the given storeId
    const loginDoc = await LoginAttempt.findOne({ storeId });
    if (!loginDoc) {
      return res.status(404).json({
        success: false,
        message: 'Invalid store ID.',
      });
    }

    // Check if resend OTP is locked
    if (loginDoc.resend_otp_lock_until && new Date() < loginDoc.resend_otp_lock_until) {
      const remainingTime = Math.ceil((loginDoc.resend_otp_lock_until - new Date()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingTime} seconds before requesting another OTP.`,
      });
    }

    // Generate a new OTP
    const newotp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const newhashedOtp = await bcrypt.hash(newotp, 10);
    loginDoc.otp = newhashedOtp;
    loginDoc.otp_expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // Lock resend OTP for 5 minutes
    loginDoc.resend_otp_lock_until = new Date(Date.now() + 5 * 60 * 1000); // 5 mins lock
    await loginDoc.save();

    // Fetch user email from ShopOwner collection
    const shopOwner = await ShopOwner.findOne({ storeId });
    if (!shopOwner) {
      return res.status(404).json({
        success: false,
        message: 'Store ID does not correspond to a valid user.',
      });
    }

    const newblockToken = generateToken(storeId);
    const blockLink = `${process.env.BACKEND_URL}/api/auth/block_account/${newblockToken}`;

    const otpContent = otpEmailTemplateLogin(newotp, shopOwner.fname, blockLink);
    await sendEmail(shopOwner.email, "Your Resent OTP Code", otpContent);

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully. Check your email.',
    });
  } catch (err) {
    console.error('Error in resendOtp:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

// generating JWT tokens
const generateTokens = (storeId) => {
  const accessToken = jwt.sign(
    { storeId }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { storeId }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

// Validating the OTP
export const validateOtp = async (req, res) => {
  const { storeId, otp } = req.body;

  try {
    // Find the LoginAttempt for the given storeId
    const loginDoc = await LoginAttempt.findOne({ storeId });
    if (!loginDoc) {
      return res.status(404).json({
        success: false,
        message: `Invalid store ID`
      });
    }

    // Check if the OTP has expired
    if (new Date() > loginDoc.otp_expires) {
      loginDoc.otp = null;
      loginDoc.otp_expires = null;
      loginDoc.secondary_failed_attempts = 0;
      loginDoc.secondary_fail_count = 0;
      loginDoc.resend_otp_lock_until = null;
      await loginDoc.save();

      return res.status(401).json({
        success: false,
        message: 'OTP has expired. Redirecting to login.'
      });
    }

    // Check if the OTP is correct
    const isMatch = await bcrypt.compare(otp, loginDoc.otp);
    logger.info(`otp comparison => ${otp} | ${loginDoc.otp} | ${isMatch}`);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid OTP. Please try again." 
      });
    }

    // If OTP is valid, reset fields
    loginDoc.otp = null;
    loginDoc.otp_expires = null;
    loginDoc.secondary_failed_attempts = 0;
    loginDoc.secondary_fail_count = 0;
    loginDoc.resend_otp_lock_until = null;
    await loginDoc.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(storeId);

    // Save refresh token to user document
    const user = await ShopOwner.findOne({ storeId });
    await user.addRefreshToken(refreshToken);

    const userName = user.fname;

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/secure',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.cookie('userName', userName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(200).json({
      success: true,
      message: 'OTP validated successfully.',
      // token, // Send the JWT token to the client
    });
  } catch (err) {
    logger.error('Error in validateOtp:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Add refresh token endpoint
export const refreshToken = async (req, res) => {
  try {
    const { storeId } = req.user;  // Populated by validateRefreshToken middleware
    const oldRefreshToken = req.refreshToken;

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(storeId);

    // Update refresh token in database:
    // 1) Remove the old hashed refresh token
    // 2) Add the new hashed refresh token
    const user = await ShopOwner.findOne({ storeId });
    await user.removeRefreshToken(oldRefreshToken);
    await user.addRefreshToken(newRefreshToken);

    // Set new cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/secure',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    const loggerMsg = `New Tokens are issued for the ${storeId}`;
    logger.warn(loggerMsg);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully'
    });
  } catch (error) {
    const loggerErrMsg = `Error in refreshToken: ${error}`;
    logger.error(loggerErrMsg);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};

// Logout with clearing cookies and removing tokens
export const logout = async (req, res) => {
  try {
    // Extract refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    const { storeId } = req.user;

    if (!refreshToken) {
      return res.status(400).json({ message: "No active session found." });
    }

    // Optional: Blacklist refresh token to prevent reuse
    // await blacklist.create({ token: refreshToken });

    // Remove the refresh token from the ShopOwner Collection
    const user = await ShopOwner.findOne({ storeId });
    await user.removeRefreshToken(refreshToken);

    // Clear both cookies to fully log out the user
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/secure",
    });

    res.clearCookie("userName", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Log logout event
    logger.info("User logged out successfully.");

    res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    logger.error("Logout Error: " + error.message);
    res.status(500).json({ message: "Server error during logout.", error: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.storeId;
    // Check if the user is a ShopOwner
    const shop = await ShopOwner.findOne({ storeId: userId });
    if (shop) {
      return res.status(200).json({
        message: "Authenticated",
        role: "shopOwner",
      });
    }

    // Check if the user is a Driver
    const driver = await Driver.findOne({ driverId: userId });
    if (driver) {
      return res.status(200).json({
        message: "Authenticated",
        role: "driver",
      });
    }

    // If user is not found in either collection, return unauthorized
    return res.status(401).json({ message: "Unauthorized: User not found in system" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};