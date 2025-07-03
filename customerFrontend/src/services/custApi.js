import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8090';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Outgoing request:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch expired token errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops: don't try to refresh if this is the refresh endpoint itself.
    if (originalRequest.url.includes('/custAuth/secure/customer-refresh-token')) {
      console.error("Refresh endpoint failed:", error.response?.data?.message || error.message);
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Check if error response indicates token expiration
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.message === 'Token expired' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        console.log("Attempting to refresh token...");
        const refreshResponse = await api.post("/api/custAuth/secure/customer-refresh-token");

        if (refreshResponse.status === 200) {
          console.log("Token refreshed successfully, retrying original request...");
          return api(originalRequest); // Retry original request
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError.response?.data?.message || refreshError.message);
      }

      console.log("No valid refresh token, redirecting to login");
      window.location.href = "/login"; // Redirect to login if refresh fails
    }

    return Promise.reject(error);
  }
);

export default api; 