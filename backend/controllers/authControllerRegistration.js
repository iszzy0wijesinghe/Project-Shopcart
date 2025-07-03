import ShopOwner from "../models/ShopOwner.js";
import LoginAttempt from "../models/LoginAttempt.js";
import sendEmail from "../utils/sendEmail.js";
import { verificationEmailTemplate, otpEmailTemplate, encryptCodeTemplate, otpEmailTemplateLogin } from "../utils/emailTemplates.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import logger from '../utils/logger.js';

// Register Shop Owner
export const registerShopOwner = async (req, res) => {
  const { storeId, fname, lname, email, password, phone_no, store_name, store_address, location_coords } = req.body;

  try {
    // Step 1: Check if the storeId already exists
    const existingUser = await ShopOwner.findOne({ storeId });
    if (existingUser) {
      return res.status(400).json({ message: "Store ID already exists" });
    }

    // Step 2: Create a new ShopOwner record
    const newShopOwner = await ShopOwner.create({
      storeId,
      fname,
      lname,
      email,
      password,
      phone_no,
      store_name,
      store_address,
      location_coords,
    });

    // Step 3: Generate an email verification token
    const verificationToken = generateToken(storeId);
    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;

    // Step 4: Send the verification email
    const emailContent = verificationEmailTemplate(verificationLink);
    await sendEmail(email, "Verify Your Email", emailContent);

    res.status(201).json({ message: "Registration successful. Verification email sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Resend Email Verification
export const resendVerificationEmail = async (req, res) => {
  const { storeId } = req.body;

  try {
    // Step 1: Find the ShopOwner
    const shopOwner = await ShopOwner.findOne({ storeId });
    if (!shopOwner) {
      return res.status(404).json({ message: "Shop owner not found." });
    }

    if (shopOwner.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    // Step 2: Generate a new verification token and link
    const verificationToken = generateToken(storeId);
    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;

    // Step 3: Send the verification email
    const emailContent = verificationEmailTemplate(verificationLink);
    await sendEmail(shopOwner.email, "Resend Verification Email", emailContent);

    res.status(200).json({ message: "Verification email resent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate Encrypt Code
const generateEncryptCode = () => {
  const segments = [];
  for (let i = 0; i < 5; i++) {
    const segment = Math.random().toString(36).substring(2, 6).toUpperCase(); // Generate 4-character segment
    segments.push(segment);
  }
  return segments.join("-"); // Format as 'XXXX-XXXX-XXXX-XXXX'
};

// Verify Email
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    // Step 1: Decode the token and extract the storeId
    const decoded = generateToken.verify(token);
    const { storeId } = decoded;

    // Step 2: Find the ShopOwner and check if already verified
    const shopOwner = await ShopOwner.findOne({ storeId });
    if (!shopOwner) {
      return res.status(404).json({ message: "Shop owner not found." });
    }

    if (shopOwner.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    // Step 3: Mark the ShopOwner as verified
    shopOwner.isVerified = true;
    await shopOwner.save();

    // Step 4: Generate OTP for the company's security agent
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const hashedOtp = await bcrypt.hash(otp, 10);
    logger.info(`otp is hashed => ${hashedOtp}`);

    // Step 5: Save OTP and required fields in LoginAttempts table
    await LoginAttempt.findOneAndUpdate(
      { storeId },
      {
        storeId,
        otp: hashedOtp,
        otp_expires: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
        encrypt_code: null,
        secondary_is_locked: false,
        status: "otp_sent",
        gps_latitude: shopOwner.location_coords.lat,
        gps_longitude: shopOwner.location_coords.lng,
        city: null,
        country: null,
        secondary_failed_attempts: 0,
        secondary_fail_count: 0,
        email_sent: true,
        secondary_is_blocked: false,
        secondary_lock_until: null,
        resend_otp_lock_until: null
      },
      { upsert: true, new: true }
    );

    // Step 6: Send OTP to the company's email
    const otpContent = otpEmailTemplate(otp, shopOwner.fname);
    await sendEmail(process.env.COMPANY_EMAIL, "New OTP for Shop Owner", otpContent);

    res.status(200).json({ message: "Email verified successfully. OTP sent to company email." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token.", error: error.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { storeId, otp } = req.body;

  try {
    // Step 1: Find the LoginAttempt record by storeId
    const loginAttempt = await LoginAttempt.findOne({ storeId });
    if (!loginAttempt) {
      return res.status(404).json({ message: "No OTP record found for this store ID." });
    }

    // Step 2: Check if OTP is expired
    if (Date.now() > loginAttempt.otp_expires) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Step 3: Compare the entered OTP with the stored OTP
    const isMatch = await bcrypt.compare(otp, loginAttempt.otp);
    logger.info(`otp comparison => ${otp} | ${loginAttempt.otp} | ${isMatch}`);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Step 4: Check if the shop owner is verified
    const shopOwner = await ShopOwner.findOne({ storeId });
    if (!shopOwner || !shopOwner.isVerified) {
      return res.status(400).json({ message: "User is not verified. Please verify your email first." });
    }

    // Step 5: Generate Encrypt Code and Hash It
    const encryptCode = generateEncryptCode();
    const hashedEncryptCode = await bcrypt.hash(encryptCode, 10);
    logger.info(`encryptCode is hashed => ${hashedEncryptCode}`);

    // Step 6: Mark the login attempt as verified and remove OTP data and store the encrypt key
    loginAttempt.encrypt_code = hashedEncryptCode;
    loginAttempt.otp = null;
    loginAttempt.otp_expires = null;
    loginAttempt.resend_otp_lock_until = null;
    loginAttempt.status = "verified";
    await loginAttempt.save();

    // Step 7: Send the Encryption key to the user
    const encryptKeyContent = encryptCodeTemplate(encryptCode, shopOwner.fname);
    await sendEmail(shopOwner.email, "Secure Your Encryption Key", encryptKeyContent);

    res.status(200).json({ message: "OTP verified successfully. Encryption Key is sent to the email and Redirecting to login..." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};


export const resendOtp = async (req, res) => {
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
        message: `REG | Please wait ${remainingTime} seconds before requesting another OTP.`,
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

    const otpContent = otpEmailTemplate(newotp, shopOwner.fname);
    await sendEmail(process.env.COMPANY_EMAIL, "Resent OTP for Shop Owner", otpContent);

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully. Check the Company email.',
    });
  } catch (err) {
    console.error('Error in resendOtp:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};