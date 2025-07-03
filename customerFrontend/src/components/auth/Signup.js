import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Notification from "../common/Notification";
import './Auth.css';

const Signup = ({ isPopup, onClose, switchMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 10000); // Hide notification after 10 seconds
  };

  const validateField = (name, value) => {
    const trimmedValue = value.trim();
    switch (name) {
      case "email":
        if (!trimmedValue) return "Email is required.";
        // The regex allows emails starting with a digit.
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(trimmedValue))
          return "Invalid email address. Please enter a valid email (e.g., user@example.com).";
        return "";
  
      case "firstName":
        if (!trimmedValue) return "First name is required.";
        // Allow letters, spaces, hyphens, and apostrophes.
        if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue))
          return "First name contains invalid characters.";
        return "";
  
      case "lastName":
        if (!trimmedValue) return "Last name is required.";
        if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue))
          return "Last name contains invalid characters.";
        return "";
  
      case "phone":
        if (!trimmedValue) return "Phone number is required.";
        // Show an error if any non-digit is entered.
        if (!/^\d+$/.test(trimmedValue))
          return "Phone number must contain only digits.";
        if (trimmedValue.length !== 10)
          return "Phone number must be exactly 10 digits.";
        return "";
  
      case "password":
        if (!trimmedValue) return "Password is required.";
        if (trimmedValue.length < 8)
          return "Password must be at least 8 characters long.";
        // Ensure at least one lowercase, one uppercase, one number, and one special character.
        const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        if (!complexityRegex.test(trimmedValue))
          return "Password must include at least one uppercase letter, one lowercase letter, and one number.";
        return "";
  
      default:
        return "";
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Validate the field as the user types.
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  useEffect(() => {
      if (isAuthenticated) {
        navigate('/');
      }
    }, [isAuthenticated, navigate]);

  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      // 1. Extract the credential (ID token) from Google
      const { credential } = credentialResponse;
      console.log(credential);
      if (!credential) {
        console.error('No credential returned by Google');
        return;
      }

      // 2. Send credential to your backend for verification & login/registration
      // const response = await api.post('/api/custAuth/google', { credential });
      const response = await googleLogin(credential);

      // 3. If successful, you can store tokens, update global auth context, etc.
      console.log('Google login success:', response.data.message);
      showNotification(response.data.message, response.data.success);
      if(isPopup) onClose();
      navigate('/');
    } catch (error) {
      console.error('Error handling Google login:', error);
      const errorMessage = error.response?.data.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    console.log('Google Login Failed');
    showNotification('Google Login Failed', false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    const newErrors = {};

    // Validate fields based on the current step.
    if (currentStep === 1) {
      // Validate the email field.
      const emailError = validateField("email", formData.email);
      if (emailError) {
        newErrors.email = emailError;
        valid = false;
      }
    } else {
      // Validate all fields in step 2.
      ["firstName", "lastName", "phone", "password"].forEach((field) => {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          valid = false;
        }
      });
    }

    // Update the errors state.
    setErrors(newErrors);

    // If there are any validation errors, abort the submission.
    if (!valid) return;

    // Proceed with submission if fields are valid.
    setIsLoading(true);

    if (currentStep === 1) {
      setCurrentStep(2);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await register(formData);
      
      // showNotification(response.data.message, response.data.success);
      toast.success(response.data.message);
      if(isPopup) onClose();
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isPopup ? 'popup' : 'fullscreen'}`}>
      {!isPopup ? (
      <header className="header">
        <div className="logo-container">
          <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562829/Asset_4_shbgzu.png" alt="Shopcart" width={150} height={30} priority />
        </div>
      </header> ) : ( <></> )}

      <div className="auth-form-container">
        <div className="auth-header">
          <button className={`back-button ${currentStep === 1 ? 'sign1' : 'sign2'}`} onClick={currentStep === 1 ? onClose : () => setCurrentStep(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1>Sign up</h1>
        </div>
        
        {currentStep === 1 ? (
          <>
            <div className="social-auth-options">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                type='standard'
                text="continue_with"
                width={500}
                theme="outline"
                size="large"
                shape="circle"
                logo_alignment="left"
              />
            </div>
            
            <div className="divider">
              <span>or</span>
            </div>
            
            <form onSubmit={handleSubmit}>
              <p className="form-instruction">Enter your email to get started.</p>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder=" "
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <label for="email">Email</label>
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>
              
              <p className="terms-text">
                By continuing, you agree to our <a href="/terms">Terms of Service</a>, <a href="/privacy">Privacy Policy</a> & <a href="/health-data">Health Data Notice</a>.
              </p>
              
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isLoading}
              >
                Continue
              </button>
            </form>
            
            {/* <div className="gocart-business">
              <img src="/images/gocart_logo.png" alt="Gocart Business" />
            </div> */}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder=' '
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <label for="firstName">First Name</label>
              {errors.firstName && <div className="error-message">{errors.firstName}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder=' '
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <label for="lastName">Last Name</label>
              {errors.lastName && <div className="error-message">{errors.lastName}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder=' '
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <label for="phone">Phone Number</label>
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                placeholder=' '
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
              />
              <label for="password">Password</label>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Create Account'}
            </button>
          </form>
        )}
        
        {/* <div className="auth-footer">
          <p>Already have an account?</p>
          <Link to="/login" className="switch-auth-link">Log in</Link>
        </div> */}
        <div className="auth-footer">
          <p>Already have an account?</p>

          {isPopup ? (
            <button 
              className="switch-auth-link" 
              onClick={switchMode}
            >
              Log in
            </button>
          ) : (
            <Link to="/login" className="switch-auth-link">
              Log in
            </Link>
          )}
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />
    </div>
  );
};

export default Signup;