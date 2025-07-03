import express from "express";
import { body } from "express-validator";
import { registerShopOwner, verifyEmail, verifyOtp, resendOtp, resendVerificationEmail } from "../controllers/authControllerRegistration.js";
import { validateOtp, resendOtpLogin, login, blockAccount, refreshToken, logout, checkAuth } from '../controllers/authControllerLogin.js';
import validateRequest from "../middlewares/validateRegistrationData.js";
import validateLoginData from '../middlewares/validateLoginData.js';
import { generalEndpointLimiter, sensitiveEndpointLimiter } from "../middlewares/rateLimit.js";
import { validateAccessToken, validateRefreshToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Registration Endpoints
router.post(
  "/register",
  [
    body("storeId").notEmpty().withMessage("Store ID is required"),
    body("fname").notEmpty().withMessage("First name is required"),
    body("lname").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("phone_no")
      .matches(/^[0-9]{10,15}$/)
      .withMessage("Valid phone number is required"),
    body("store_name").notEmpty().withMessage("Store name is required"),
    body("store_address").notEmpty().withMessage("Store address is required"),
    body("location_coords.lat")
      .isFloat()
      .withMessage("Latitude is required and must be a number"),
    body("location_coords.lng")
      .isFloat()
      .withMessage("Longitude is required and must be a number"),
  ],
  validateRequest,
  registerShopOwner
);

router.get("/verify-email/:token", verifyEmail);
router.post("/verify-otp", verifyOtp);
router.post("/resend-verify-email", sensitiveEndpointLimiter, resendVerificationEmail);
router.post("/resend-otp", resendOtp);


// Login Endpoints
router.post('/login', validateLoginData, login);
router.get('/block_account/:token', blockAccount);
router.post('/validate_otp', validateOtp);
router.post('/resend_otp', sensitiveEndpointLimiter, resendOtpLogin);
router.post('/secure/refresh_token', validateRefreshToken, refreshToken);

router.post('/secure/logout', validateAccessToken, logout);
router.get('/check_auth', validateAccessToken, checkAuth);

export default router;
