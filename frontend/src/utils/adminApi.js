import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const adminBaseURL = apiBase.endsWith('/admin') ? apiBase : `${apiBase.replace(/\/$/, '')}/admin`;

const adminApi = axios.create({
  baseURL: adminBaseURL,
  withCredentials: true // send cookies
});

// Request interceptor to attach Authorization header if adminToken exists in storage
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401/403
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        // Only redirect if currently inside an admin route and not on the login page
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
