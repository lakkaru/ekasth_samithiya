import axios from "axios";
import { navigate } from "gatsby";

// Create Axios instance
// Prefer the Gatsby env var (used across the frontend). Fall back to REACT_APP if present.
const API_BASE = process.env.GATSBY_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "";
const api = axios.create({
  baseURL: API_BASE, // Set your API base URL
});

// Add an interceptor to include the token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if it's an authentication error
    if (error.response && error.response.status === 401) {
      // 401 means token expired or invalid - logout and redirect
      localStorage.removeItem("authToken");
      
      // Dispatch logout event to clear component states
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        // Show a brief message before redirecting
        const notification = document.createElement("div");
        notification.innerHTML = "ඔබගේ ප්‍රවේශ කාලය අවසන් වී ඇත. ප්‍රවේශ පිටුවට හරවා යමින්...";
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #ff9800;
          color: white;
          padding: 16px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 300px;
        `;
        document.body.appendChild(notification);
        
        // Redirect after a short delay
        setTimeout(() => {
          document.body.removeChild(notification);
          navigate("/login/user-login");
        }, 2000);
      }
    } else if (error.response && error.response.status === 403) {
      // 403 means user is authenticated but doesn't have permission
      // Don't logout, just show the error message
      console.log("Access denied - insufficient permissions");
      // The error will be handled by the calling component
    }
    
    return Promise.reject(error);
  }
);

export default api;
