import axios from "axios";

// Base URL for the API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
    // для безпеки в продакшн-додатках краще використовувати HttpOnly Cookies або інші механізми
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

// Інтерцептор для обробки помилок відповіді (наприклад, 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Якщо отримано 401 (Unauthorized) і це не маршрути логіну/реєстрації
    if (error.response && error.response.status === 401) {
      // Можна додати логіку для виходу користувача:
      // localStorage.removeItem('authToken');
      // window.location.href = '/login'; // Перенаправити на сторінку логіну
      console.warn("Unauthorized request. You might need to log in again.");
    }
    return Promise.reject(error);
  }
);

export default api;
