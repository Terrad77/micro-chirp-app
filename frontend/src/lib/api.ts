import axios from "axios";

// Base URL for the API requests
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for adding JWT token to authorized requests
api.interceptors.request.use(
  (config) => {
    // get token from localStorage
    const token = localStorage.getItem("authToken");

    // checking if token exists and adding it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Обробка помилок запиту
    return Promise.reject(error);
  }
);

// Interceptor for handling response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (Unauthorized) error is received and it's not a login/register route
    // (We explicitly check for originalRequest.url to not be auth routes to prevent redirect loops)
    const isAuthRoute =
      error.config.url.endsWith("/auth/login") ||
      error.config.url.endsWith("/auth/register");

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("Unauthorized request. Logging out user.");
      // Clear token and redirect to login page
      localStorage.removeItem("authToken");
      window.location.href = "/login"; // Force reload to trigger client-side auth check
    }
    return Promise.reject(error);
  }
);

export default api;
