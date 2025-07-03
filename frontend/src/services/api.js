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

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const refreshResponse = await api.post("/api/auth/secure/refresh_token");

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