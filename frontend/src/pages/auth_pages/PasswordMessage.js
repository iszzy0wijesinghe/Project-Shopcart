import React from "react";

const PasswordMessage = ({ password, show }) => {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;

  return (
    <div
      id="password-message"
      style={{
        display: show ? "block" : "none", // Show or hide based on the `show` prop
      }}
    >
      <h3>Password must contain:</h3>
      <p className={hasLowercase ? "valid" : "invalid"}>
        At least <b>one lowercase letter</b>
      </p>
      <p className={hasUppercase ? "valid" : "invalid"}>
        At least <b>one uppercase letter</b>
      </p>
      <p className={hasNumber ? "valid" : "invalid"}>
        At least <b>one number</b>
      </p>
      <p className={hasMinLength ? "valid" : "invalid"}>
        Minimum <b>8 characters</b>
      </p>
    </div>
  );
};

export default PasswordMessage;
