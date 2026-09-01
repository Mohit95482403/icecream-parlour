import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const adminBaseURL = apiBase.endsWith('/admin') ? apiBase : `${apiBase.replace(/\/$/, '')}/admin`;

/**
 * Authoritative helper to retrieve and validate the admin JWT from storage.
 * Returns clean token string if valid, or null.
 */
export function getValidAdminToken() {
  try {
    const token = localStorage.getItem('adminToken');
    if (
      !token ||
      typeof token !== 'string' ||
      token.trim() === '' ||
      token === 'undefined' ||
      token === 'null' ||
      token === '[object Object]'
    ) {
      return null;
    }
    const cleanToken = token.trim().replace(/^["']|["']$/g, '');
    const segments = cleanToken.split('.');
    if (segments.length !== 3 || segments.some(seg => seg.length === 0)) {
      return null;
    }
    return cleanToken;
  } catch {
    return null;
  }
}

const adminApi = axios.create({
  baseURL: adminBaseURL,
  withCredentials: true // send cookies where applicable
});

// Request interceptor: attach authoritative Authorization header on every protected admin request
adminApi.interceptors.request.use(
  (config) => {
    const validToken = getValidAdminToken();
    if (validToken) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${validToken}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${validToken}`;
        config.headers.Authorization = `Bearer ${validToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401/403 admin session expiration cleanly
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        // Only redirect if currently inside an admin route and not on the login page
        if (
          typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/admin') &&
          window.location.pathname !== '/admin/login'
        ) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
