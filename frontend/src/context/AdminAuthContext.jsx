import React, { createContext, useState, useEffect, useContext } from 'react';
import adminApi from '../utils/adminApi';

export const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adminUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const token = localStorage.getItem('adminToken');
    return !!token;
  });

  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (
      !token ||
      typeof token !== 'string' ||
      token.trim() === '' ||
      token === 'undefined' ||
      token === 'null' ||
      token === '[object Object]'
    ) {
      if (token) localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAdminUser(null);
      setIsAdminAuthenticated(false);
      setIsAdminLoading(false);
      return;
    }

    try {
      const savedUserStr = localStorage.getItem('adminUser');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.role === 'admin') {
          setAdminUser(parsed);
          setIsAdminAuthenticated(true);
        } else {
          throw new Error('Invalid admin credentials stored');
        }
      } else {
        setIsAdminAuthenticated(true);
      }
    } catch (err) {
      console.warn('Admin session validation failed:', err.message);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAdminUser(null);
      setIsAdminAuthenticated(false);
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const adminLogin = async ({ email, password }) => {
    // Clear any stale admin auth data prior to fresh login attempt
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    setIsAdminAuthenticated(false);

    const res = await adminApi.post('/auth/login', { email, password });
    if (res.data?.success && res.data?.data) {
      const { admin, token } = res.data.data;
      if (
        token &&
        typeof token === 'string' &&
        token.trim() !== '' &&
        token !== 'undefined' &&
        token !== 'null' &&
        token !== '[object Object]'
      ) {
        localStorage.setItem('adminToken', token.trim());
      }
      if (admin) {
        localStorage.setItem('adminUser', JSON.stringify(admin));
        setAdminUser(admin);
      }
      setIsAdminAuthenticated(true);
      return res.data;
    }
    throw new Error(res.data?.error?.message || 'Admin login failed');
  };

  const adminLogout = async () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } finally {
      setAdminUser(null);
      setIsAdminAuthenticated(false);
    }
  };

  const value = {
    adminUser,
    isAdminAuthenticated,
    isAdminLoading,
    adminLogin,
    adminLogout,
    checkAdminAuth
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
