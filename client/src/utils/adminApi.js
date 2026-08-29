import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const adminBaseURL = apiBase.endsWith('/admin') ? apiBase : `${apiBase.replace(/\/$/, '')}/admin`;

const adminApi = axios.create({
  baseURL: adminBaseURL,
  withCredentials: true // send cookies
});

// Request interceptor to attach Authorization header if token exists in storage
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401/403
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid infinite redirects if already on login page
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
