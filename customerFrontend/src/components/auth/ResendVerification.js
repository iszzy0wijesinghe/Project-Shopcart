import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ResendVerification() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const BASE_URL = "http://localhost:8090";

  // Trigger toast error when errorMessage changes.
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await axios.post(`${BASE_URL}/api/custAuth/customer-resend-verification`, { email });
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to resend verification email."
      );
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      {/* Header with logo */}
      <header className="w-full py-4 bg-white shadow-sm">
        <div className="container mx-auto px-4 flex justify-center">
          <Link to="/">
            <div className="text-2xl font-bold text-orange-500">YourStore</div>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 w-full max-w-md mx-auto flex items-center justify-center p-4">
        <div className="w-full bg-white rounded-lg shadow-md p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <Mail className="w-16 h-16 text-orange-500 mx-auto" />
                <h1 className="text-3xl font-bold text-gray-800">Resend Verification</h1>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a new verification link.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Resend Verification Email"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-orange-500 hover:underline"
                >
                  Return to Homepage
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Mail className="w-20 h-20 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800">Email Sent!</h1>
                <p className="text-gray-600">
                  We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your email address.
                </p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-md border border-gray-300 transition-colors"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>
              Need help?{" "}
              <a href="/contact" className="text-orange-500 hover:underline">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
