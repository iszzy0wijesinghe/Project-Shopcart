import mongoose from "mongoose";

const loginAttemptsSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: true,
      unique: true, // Ensure one login attempt per storeId at a time
    },
    otp: {
      type: String,
      required: false, // OTP will only exist after verification
    },
    otp_expires: {
      type: Date,
      required: false, // Expiration time for the OTP
    },
    encrypt_code: {
      type: String, // Hashed encrypt code
    },
    secondary_is_locked: {
      type: Boolean, // Indicates if the account is locked
      default: false,
    },
    status: {
      type: String,
      default: "pending", // Can be 'pending', 'verified', or 'failed'
    },
    gps_latitude: {
      type: Number,
      required: false,
    },
    gps_longitude: {
      type: Number,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    secondary_failed_attempts: {
      type: Number,
      default: 0, // Tracks failed OTP attempts
    },
    secondary_fail_count: {
      type: Number,
      default: 0, // Tracks failed OTP attempts
    },
    email_sent: {
      type: Boolean,
      default: false, // Tracks if an email was sent for this login attempt
    },
    secondary_is_blocked: {
      type: Boolean,
      default: false, // Tracks if the user is blocked due to excessive failed attempts
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    secondary_lock_until: {
      type: Date,
      default: null,
    },
    resend_otp_lock_until: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoginAttempts", loginAttemptsSchema);
