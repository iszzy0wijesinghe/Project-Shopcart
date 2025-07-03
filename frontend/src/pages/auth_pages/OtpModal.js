import React, { useState } from "react";
import "./OtpModal.css";
// import { TrophySpin } from "react-loading-indicators";

const OtpModal = ({ email, phone, handleValidateOtp, handleResendOtp, loading }) => {
  const [emailOtp, setEmailOtp] = useState(new Array(6).fill(""));
  const [phoneOtp, setPhoneOtp] = useState(new Array(6).fill(""));

  const handleChange = (element, index, otpType) => {
    if (isNaN(element.value)) return; // Allow only numbers
    const otp = otpType === "email" ? [...emailOtp] : [...phoneOtp];
    otp[index] = element.value;

    if (otpType === "email") {
      setEmailOtp(otp);
    } else {
      setPhoneOtp(otp);
    }

    // Move focus to the next input
    if (element.value && index < 5) {
      document.getElementById(`${otpType}-otp-input-${index + 1}`).focus();
    }
  };

  const handleBackspace = (element, index, otpType) => {
    if (!element.value && index > 0) {
      document.getElementById(`${otpType}-otp-input-${index - 1}`).focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredEmailOtp = emailOtp.join("");
    // const enteredPhoneOtp = phoneOtp.join("");
    handleValidateOtp(enteredEmailOtp); // Pass both OTPs to the parent function
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-container">
        {/* {loading && (
          <div className="otp-loading-overlay">
            <TrophySpin color="#ff6201" size="small" text="Loading" />
          </div>
        )} */}
      
        <h3>OTP Validation</h3>
        <p>Please enter the OTPs sent to your email and phone:</p>

        {/* Email OTP Input */}
        <div className="otp-section">
          <p><b>Email OTP</b> ({email})</p>
          <div className="otp-input-container">
            {emailOtp.map((digit, index) => (
              <input
                key={index}
                id={`email-otp-input-${index}`}
                type="text"
                maxLength="1"
                value={emailOtp[index]}
                onChange={(e) => handleChange(e.target, index, "email")}
                onKeyDown={(e) => e.key === "Backspace" && handleBackspace(e.target, index, "email")}
                className="otp-input-box"
              />
            ))}
          </div>
        </div>

        {/* Phone OTP Input */}
        <div className="otp-section">
          <p><b>Phone OTP</b> ({phone})</p>
          <div className="otp-input-container">
            {phoneOtp.map((digit, index) => (
              <input
                key={index}
                id={`phone-otp-input-${index}`}
                type="text"
                maxLength="1"
                value={phoneOtp[index]}
                onChange={(e) => handleChange(e.target, index, "phone")}
                onKeyDown={(e) => e.key === "Backspace" && handleBackspace(e.target, index, "phone")}
                className="otp-input-box"
              />
            ))}
          </div>
        </div>

        <div className="otp-modal-actions">
        <button type="submit" onClick={handleSubmit} disabled={loading}>
            Validate OTP
          </button>
          <button type="button" onClick={handleResendOtp} disabled={loading}>
            Resend OTP
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default OtpModal;
