// import axios from 'axios';
// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';

// function VerifyEmail() {
//   const { token } = useParams(); // Extract token from URL
//   const navigate = useNavigate(); // For redirecting after success
//   const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
//   const [message, setMessage] = useState(''); // Message to display to the user
//   const BASE_URL = "http://localhost:8090";

//   useEffect(() => {
//     // Check if token exists
//     if (!token) {
//       setStatus('error');
//       setMessage('Invalid verification link.');
//       return;
//     }

//     // Function to verify email by calling backend
//     const verifyEmail = async () => {
//       try {
//         const response = await axios.get(`${BASE_URL}/api/custAuth/customer-verify-email/${token}`);
//         setStatus('success');
//         setMessage(response.data.message || 'Email verified successfully!');
//         // Redirect to login page after 3 seconds
//         setTimeout(() => {
//           navigate('/login');
//         }, 3000);
//       } catch (error) {
//         setStatus('error');
//         setMessage(error.response?.data?.message || 'Failed to verify email.');
//       }
//     };

//     verifyEmail();
//   }, [token, navigate]);

//   // Render based on status
//   if (status === 'loading') {
//     return <div>Verifying your email...</div>;
//   }

//   if (status === 'success') {
//     return (
//       <div>
//         <p>{message}</p>
//         <p>You will be redirected to the login page shortly.</p>
//       </div>
//     );
//   }

//   if (status === 'error') {
//     return <div>{message}</div>;
//   }
// }

// export default VerifyEmail;


import axios from 'axios';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, User } from "lucide-react";

function VerifyEmail() {
  const { token } = useParams(); // Extract token from URL
  const navigate = useNavigate(); // For redirecting after success
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState(''); // Message to display to the user
  const BASE_URL = "http://localhost:8090";

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/custAuth/customer-verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        // Optionally, redirect after a delay:
        // setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      {/* Header with logo */}
      <header className="w-full py-4 bg-white shadow-sm">
        <div className="container mx-auto px-4 flex justify-center">
          <Link to="/">
            <div className="text-2xl font-bold text-orange-500">Shopcart</div>
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 w-full max-w-md mx-auto flex items-center justify-center p-4">
        <div className="w-full bg-white rounded-lg shadow-md p-8">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h1 className="text-2xl font-bold text-gray-800">Verifying your email...</h1>
              <p className="text-gray-600">Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-24 h-24 text-orange-500 animate-in zoom-in-50 duration-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800">Email Verified!</h1>
                <p className="text-gray-600">Thank you for verifying your email address. Your account is now active.</p>
              </div>
              <div className="pt-6 grid gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-md border border-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Go to My Account
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-5xl text-red-500">!</span>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800">Verification Failed</h1>
                <p className="text-gray-600">
                  {message || "We couldn't verify your email address. The verification link may have expired or is invalid."}
                </p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => navigate("/resend-verification")}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
        <p>
          Need help?{" "}
          <a href="/contact" className="text-orange-500 hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
