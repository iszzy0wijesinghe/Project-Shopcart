import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';
import Notification from "../common/Notification";
import './Auth.css';

const Login = ({ isPopup, onClose, switchMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ message: "", type: "" });
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 10000); // Hide notification after 10 seconds
  };

  // Advanced validation function for email and password.
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
  
      case "password":
        if (!trimmedValue) return "Password is required.";
        if (trimmedValue.length < 8)
          return "Password must be at least 8 characters long.";
        // Ensure at least one lowercase, one uppercase, one number, and one special character.
        const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        if (!complexityRegex.test(trimmedValue))
          return "Password must include at least one uppercase letter, one lowercase letter, and one number";
        return "";
  
      default:
        return "";
    }
  };

  // Real-time input change handler that validates fields as the user types.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    }
    if (name === "password") {
      setPassword(value);
    }
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
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
      if (!credential) {
        console.error('No credential returned by Google');
        toast.error('No credential returned by Google');
        setIsLoading(false);
        return;
      }

      // 2. Send credential to your backend for verification & login/registration
      // const response = await api.post('/api/custAuth/google', { credential });
      const response = await googleLogin(credential);

      // 3. If successful, you can store tokens, update global auth context, etc.
      console.log('Google login success:', response.data.message);
      // showNotification(response.data.message, response.data.success);
      toast.success(response.data.message);
      if(isPopup) onClose();
      navigate('/');
    } catch (error) {
      console.error('Error handling Google login:', error);
      const errorMessage = error.response?.data.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, false);
      // toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    console.log('Google Login Failed');
    // showNotification('Google Login Failed', false);
    toast.error('Google Login Failed');
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate both fields before proceeding.
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);
    const newErrors = { email: emailError, password: passwordError };
    setErrors(newErrors);

    if (emailError || passwordError) return;
    
    setIsLoading(true);
    
    try {
      const response = await login(email, password);

      // showNotification(response.data.message, response.data.success);
      toast.success(response.data.message);
      if(isPopup) onClose();
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
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
          <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562829/Asset_4_shbgzu.png" alt="Shopcart" width={150} height={30} />
        </div>
      </header> ) : ( <></> )}

      <div className="auth-form-container">

        {isLoading && <LoadingScreen />}

        <div className="auth-header">
          <button className="back-button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1>Log in</h1>
        </div>
        
        <div className="social-auth-options">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              type='standard'
              text="signin"
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
          <div className="form-group">
            {/* <label htmlFor="email">Enter Your Email</label> */}
            <input
              type="email"
              id="email"
              name="email"
              placeholder=' '
              value={email}
              // onChange={(e) => setEmail(e.target.value)}
              onChange={handleInputChange}
              required
            />
            <label for="email">Email</label>
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            {/* <label htmlFor="email">Enter Your Password</label> */}
            <input
              type="password"
              id="password"
              name="password"
              placeholder=' '
              value={password}
              onChange={handleInputChange}
              required
            />
            <label for="password">Password</label>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Continue'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account?</p>

          {isPopup ? (
            <button 
              className="switch-auth-link" 
              onClick={switchMode}
            >
              Sign up
            </button>
          ) : (
            <Link to="/signup" className="switch-auth-link">
              Sign up
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

export default Login;