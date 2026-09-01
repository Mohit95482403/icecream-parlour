import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getValidAdminToken } from '../../utils/adminApi';

const AdminProtectedRoute = ({ children }) => {
  const { adminUser, isAdminAuthenticated, isAdminLoading } = useAdminAuth();
  const location = useLocation();

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="w-8 h-8 border-2 border-espresso border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const token = getValidAdminToken();
  if (!isAdminAuthenticated || !token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (adminUser && adminUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
