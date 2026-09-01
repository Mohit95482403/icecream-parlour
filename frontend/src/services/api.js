import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach Authorization header only when a valid token is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (
    token &&
    typeof token === 'string' &&
    token.trim() !== '' &&
    token !== 'undefined' &&
    token !== 'null' &&
    token !== '[object Object]' &&
    !config.headers.Authorization
  ) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

// Generic error handler to clean up API errors before they reach components
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // If we got 401 on an authenticated customer request (not login/register), clear the invalid token
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
      }
    }
    // Check for nested error object from our standard backend response
    const data = error.response?.data;
    const message = data?.error?.message || data?.message || 'An unexpected error occurred. Please try again.';
    const err = new Error(message);
    if (data?.error?.issues) {
      err.issues = data.error.issues;
    }
    if (data?.error?.code) {
      err.code = data.error.code;
    }
    err.response = error.response;
    return Promise.reject(err);
  }
);

export default api;
