import React, { useState, useEffect } from "react";
import "./LoginOtpModal.css";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { DotLottiePlayer } from '@lottiefiles/dotlottie-react';

const LoginOtpModal = ({ handleValidateLoginOtp, handleResendOtp, loading }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [resendCount, setResendCount] = useState(0); // Track the number of resends
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button after first click
  const [timer, setTimer] = useState(0); // Timer for countdown

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return; // Allow only numbers
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move focus to the next input
    if (element.value && index < 5) {
      document.getElementById(`login-otp-input-${index + 1}`).focus();
    }
  };

  const handleBackspace = (element, index) => {
    if (!element.value && index > 0) {
      document.getElementById(`login-otp-input-${index - 1}`).focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    handleValidateLoginOtp(enteredOtp); // Pass the full OTP to the parent function
  };

  const handleResendOtpClick = () => {
    if (resendCount < 2) {
      // Increment the resend count
      setResendCount((prevCount) => prevCount + 1);
      handleResendOtp(); // Trigger the OTP resend function
      setIsButtonDisabled(true); // Disable the resend button

      // Start the countdown for 3 minutes (180 seconds)
      setTimer(180);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval); // Cleanup interval on unmount
    } else {
      setIsButtonDisabled(false); // Re-enable the button when the timer ends
    }
  }, [timer]);

  useEffect(() => {
    // Dynamically load the script for dotlottie player
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs";
    script.type = "module";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Cleanup the script when unmounted
    };
  }, []);

  return (
    <div className="login-otp-modal-overlay">
      <div className="login-otp-modal-container">
        <h3>Login OTP Validation</h3>
        <p>Please enter the OTP sent to your email:</p>

        {/* Add the dotlottie-player directly */}
        <div className="animation" style={{ marginTop: "20px", textAlign: "center" }}>
          <dotlottie-player
            src="https://lottie.host/7493a96b-9004-479c-b5a3-15ef775ac49b/Bgtf9gczj5.lottie"
            background="transparent"
            speed="1"
            style={{ width: "120px", height: "120px" }}
            direction="1"
            playMode="normal"
            loop
            autoplay
          ></dotlottie-player>
        </div>

        <form className="validationform" onSubmit={handleSubmit}>
          <div className="login-otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`login-otp-input-${index}`}
                type="text"
                maxLength="1"
                value={otp[index]}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) =>
                  e.key === "Backspace" && handleBackspace(e.target, index)
                }
                className="login-otp-input-box"
              />
            ))}
          </div>

          <div className="login-otp-modal-actions">
            <button type="submit">Validate OTP</button>
            <button
              type="button"
              onClick={handleResendOtpClick}
              disabled={isButtonDisabled || resendCount >= 2}>
              Resend OTP
            </button>
          </div>
          
          {/* Display countdown timer if active */}
          {isButtonDisabled && timer > 0 && (
            <p style={{ marginTop: "0px", color: "red", alignContent:"center"  }}>
              Please wait {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}
              {timer % 60} to resend OTP
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginOtpModal;
