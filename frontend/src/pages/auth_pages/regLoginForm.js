import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import axios from "axios";
import "./regLoginForm.css";
// Import logo image
import OtpModal from "./OtpModal"; // Import the OTP Modal
import Notification from "../../utils/Notification"; // Import Notification
import LoginOtpModal from "./LoginOtpModal"; // Import Login OTP Modal
import PasswordMessage from "./PasswordMessage";
import { authApi } from '../../services/api';

const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 7.6, // Default latitude
  lng: 80.7, // Default longitude
};

const RegistrationLoginForm = () => {
  const [regFormData, setRegFormData] = useState({
    storeId: "",
    fname: "",
    lname: "",
    email: "",
    password: "",
    phone_no: "",
    store_name: "",
    store_address: "",
    location_coords: { lat: "", lng: "" },
  });

  const [loginFormData, setLoginFormData] = useState({
    storeId: "",
    password: "",
    encryptedCode: "",
    gps_latitude: "",
    gps_longitude: "",
    deviceId: "",
    browserToken: "",
    ipAddress: "",
  });

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showLoginOtpPopup, setShowLoginOtpPopup] = useState(false);
  // const [showMap, setShowMap] = useState(false);
  const [showPasswordMessage, setShowPasswordMessage] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [browserToken, setBrowserToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 10000); // Hide notification after 10 seconds
  };

  const BASE_URL = process.env.REACT_APP_API_URL || 'https://project-shopcart-production.up.railway.app';

  // REGISTRATION HANDLERS
  // const { isLoaded } = useJsApiLoader({
    
  // });

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // const handleMapClick = (event) => {
  //   const lat = event.latLng.lat();
  //   const lng = event.latLng.lng();
  //   setRegFormData((prevData) => ({
  //     ...prevData,
  //     location_coords: { lat, lng },
  //   }));
  //   // Also update the input field with lat and lng
  //   document.getElementById("location-input").value = `${lat}, ${lng}`;
  //   setShowMap(false); // Hide the map after a location is selected
  // };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Show loading animation

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, regFormData, {
        headers: { "Content-Type": "application/json" },
      });
      showNotification(response.data.message, "success");
      setShowOtpPopup(true); // Show OTP popup after successful registration
    } catch (error) {
      const errorMessage = error.response?.data?.message || "REG | Something went wrong. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // Hide loading animation
    }
  };

  const handleOtpSubmit = async (enteredOtp) => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/verify-otp`,
        {
          storeId: regFormData.storeId,
          otp: enteredOtp,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      showNotification(response.data.message, "success");
      setShowOtpPopup(false); // Close the popup on success
      // Reset the form state to its initial values
      setRegFormData({
        storeId: "",
        fname: "",
        lname: "",
        email: "",
        password: "",
        phone_no: "",
        store_name: "",
        store_address: "",
        location_coords: { lat: "", lng: "" },
      });
      setIsRightPanelActive(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // Hide loading animation
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/resend-otp`,
        {
          storeId: regFormData.storeId,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      showNotification(response.data.message, "success");
      setShowOtpPopup(false);
      setShowOtpPopup(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // Hide loading animation
    }
  };


  // LOGIN HANDLERS

  // Generate persistent BrowserToken and DeviceId
  useEffect(() => {
    const storedBrowserToken = localStorage.getItem("browserToken");
    const storedDeviceId = localStorage.getItem("deviceId");

    if (storedBrowserToken && storedDeviceId) {
      setBrowserToken(storedBrowserToken);
      setDeviceId(storedDeviceId);
    } else {
      const newBrowserToken = btoa(navigator.userAgent + Date.now().toString());
      const newDeviceId =
        navigator.userAgent + Math.random().toString(36).substring(2);

      localStorage.setItem("browserToken", newBrowserToken);
      localStorage.setItem("deviceId", newDeviceId);

      setBrowserToken(newBrowserToken);
      setDeviceId(newDeviceId);
    }
  }, []);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoginFormData((prevData) => ({
          ...prevData,
          gps_latitude: position.coords.latitude,
          gps_longitude: position.coords.longitude,
        }));
        setLocationCaptured(true);
        showNotification("Location captured successfully!", "success");
      },
      (error) => {
        let message = "Unable to capture location!";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable it in settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location unavailable. Check your connection.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            message = "An unknown error occurred.";
            break;
        }
        showNotification(message, "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Increased timeout
        maximumAge: 0,
      }
    );
  };

  // const getDeviceInfo = () => {
  //   const deviceId = window.navigator.userAgent + Math.random().toString(36).substring(2);
  //   const browserToken = btoa(navigator.userAgent + Date.now().toString());
  //   return { deviceId, browserToken };
  // };

  const getIpAddress = async () => {
    try {
      const response = await axios.get("https://api64.ipify.org?format=json");
      return response.data.ip;
    } catch (error) {
      console.error("Failed to get IP address:", error);
      return "0.0.0.0";
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    // if (!locationCaptured) {
    //   showNotification("Please click 'Locate Me' to capture your location before signing in.", "error");
    //   setLoading(false);
    //   return;
    // }

    // Fetch device and IP info
    // const { deviceId, browserToken } = getDeviceInfo();
    // const ipAddress = await getIpAddress();
    const ipAddress = "";

    const requestData = {
      ...loginFormData,
      deviceId,
      browserToken,
      ipAddress,
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      showNotification(response.data.message, "success");
      setShowLoginOtpPopup(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // Hide loading animation
    }
  };

  const handleLoginOtpSubmit = async (enteredOtp) => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/validate_otp`,
        {
          storeId: loginFormData.storeId,
          otp: enteredOtp,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      showNotification(response.data.message, "success");
      setShowLoginOtpPopup(false);

      // Redirect to dashboard or home page
      window.location.href = '/dashboard';
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // Hide loading animation
    }
  };

  const handleLoginResendOtp = async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/resend_otp`,
        {
          storeId: loginFormData.storeId,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      showNotification(response.data.message, "success");
      setShowLoginOtpPopup(false);
      setShowLoginOtpPopup(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // Hide loading animation
    }
  };


  // ANIMATION HANDLERS
  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
  };

  return (
    <div className="regLogForm-uniue">
      <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`}>

        {/* Sign Up Container */}
        <div className="form-container1 sign-up-container">
          <form onSubmit={handleRegSubmit}>
            <h2>Register</h2>

            <div className="signupscroll">

              <div className="formflex">
                {/* firstName */}
                <div className="formitem">
                  <label htmlFor="fname">
                    <b>First Name:</b>
                  </label>
                  <input
                    type="text"
                    name="fname"
                    placeholder="First Name"
                    value={regFormData.fname}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                {/* lastName */}
                <div className="formitem">
                  <label htmlFor="lname">
                    <b>Last Name:</b>
                  </label>
                  <input
                    type="text"
                    name="lname"
                    placeholder="Last Name"
                    value={regFormData.lname}
                    onChange={handleRegChange}
                    required
                  />
                </div>
              </div>

              <div className="formflex">
                <div className="formitem">
                  <label htmlFor="email">
                    <b>Email:</b>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={regFormData.email}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <div className="formitem">
                  <label htmlFor="phone_no">
                    <b>Phone Number:</b>
                  </label>
                  <input
                    type="text"
                    name="phone_no"
                    placeholder="Phone Number"
                    value={regFormData.phone_no}
                    onChange={handleRegChange}
                    required
                  />
                </div>
              </div>

              <div className="formflex">
                <div className="formitem">
                  <label htmlFor="password">
                    <b>Password:</b>
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 characters"
                    value={regFormData.password}
                    onChange={handleRegChange}
                    onFocus={() => setShowPasswordMessage(true)} // Show message on focus
                    onBlur={() => setShowPasswordMessage(false)} // Hide message on blur
                    required
                  />
                  <PasswordMessage password={regFormData.password} show={showPasswordMessage} />
                </div>

                <div className="formitem">
                  <label htmlFor="confirmPassword">
                    <b>Re-Enter Password:</b>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-Enter Password"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 characters"
                    required
                  />
                </div>
              </div>

              <div className="formflex">
                <div className="formitem">
                  <label htmlFor="storeId">
                    <b>Store ID:</b>
                  </label>
                  <input
                    type="text"
                    name="storeId"
                    placeholder="Store ID"
                    value={regFormData.storeId}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <div className="formitem">
                  <label htmlFor="store_name">
                    <b>Store Name:</b>
                  </label>
                  <input
                    type="text"
                    name="store_name"
                    placeholder="Store Name"
                    value={regFormData.store_name}
                    onChange={handleRegChange}
                    required
                  />
                </div>
              </div>

              <div className="formflex">
                {/* <div className="formitem">
                  <label htmlFor="location_coords">
                    <b>Google Map Location:</b>
                  </label>
                  <div className="location-input-container">
                    <input
                      id="location-input"
                      type="text"
                      placeholder="Select Location"
                      readOnly
                    />
                    <span
                      className="location-icon"
                      onClick={() => setShowMap((prev) => !prev)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 28 28"><path fill="#ff6400" d="M14 2.25A9.75 9.75 0 0 1 23.75 12c0 4.12-2.895 8.61-8.61 13.518a1.75 1.75 0 0 1-2.283-.002l-.378-.328C7.017 20.408 4.25 16.028 4.25 12A9.75 9.75 0 0 1 14 2.25m0 6a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5" /></svg>
                    </span>
                  </div>

                  {showMap && isLoaded && (
                    <div className="map-container">
                      <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={defaultCenter}
                        zoom={7}
                        onClick={handleMapClick}
                      >
                        <Marker position={regFormData.location_coords} />
                      </GoogleMap>
                    </div>
                  )}
                </div>  */}

                <div className="formitem">
                  <label htmlFor="store_address">
                    <b>Store Address:</b>
                  </label>
                  <textarea
                    name="store_address"
                    placeholder="Store Address"
                    value={regFormData.store_address}
                    onChange={handleRegChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="last">
              <button type="submit">
                Register
              </button>
            </div>

          </form>
        </div>

        {/* Sign In Container */}
        <div className="form-container1 sign-in-container">
          <div className="signincont">
            <form onSubmit={handleSignIn} noValidate>
              <h1 className="head">Sign in</h1>

              <input
                type="text"
                name="storeId"
                placeholder="Enter Store ID"
                value={loginFormData.storeId}
                onChange={handleLoginChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={loginFormData.password}
                onChange={handleLoginChange}
                required
              />
              <input
                type="text"
                name="encryptedCode"
                placeholder="Enter Security Key"
                value={loginFormData.encryptedCode}
                onChange={handleLoginChange}
                required
              />

              <div className="anchor">
                <a href="#" onClick={handleLocateMe}>
                  Locate Me
                </a>
                {/* <button type="button" onClick={handleLocateMe}>
                  Locate Me
                </button> */}
              </div>

              <button type="submit">Sign In</button>

            </form>
          </div>
        </div>

        {/* Overlay Container */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <div className="image">
                <img
                  src="https://res.cloudinary.com/dfejydorr/image/upload/w_150/v1751562821/Asset_1_eeok9p.png"
                  alt="Logo"
                  width="150px"
                  height="auto"
                />

              </div>
              <h1>Welcome Back!</h1>
              <p>
                Ready to continue your journey with us? <br />
                Log in now & pick up right where you left off.
              </p>
              <button className="ghost" onClick={handleSignInClick}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <div className="image">
                <img src="https://res.cloudinary.com/dfejydorr/image/upload/w_150/v1751562821/Asset_1_eeok9p.png" alt="Logo" />
              </div>
              <h1>Join our journey!</h1>
              <p>
                Want to be a part of our journey? <br />
                Join us now and unlock endless possibilities. <br />
                Your adventure begins here!
              </p>
              <button className="ghost" onClick={handleSignUpClick}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* OTP Modal */}
        {showOtpPopup && (
          <OtpModal
            email={regFormData.email}
            phone={regFormData.phone_no}
            handleValidateOtp={handleOtpSubmit}
            handleResendOtp={handleResendOtp}
            loading={loading}
          />
        )}

        {/* Login OTP Modal */}
        {showLoginOtpPopup && (
          <LoginOtpModal
            handleValidateLoginOtp={handleLoginOtpSubmit}
            handleResendOtp={handleLoginResendOtp}
            loading={loading}
          />
        )}

        {/* Notification */}
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />

      </div>
    </div>
  );
};

export default RegistrationLoginForm;