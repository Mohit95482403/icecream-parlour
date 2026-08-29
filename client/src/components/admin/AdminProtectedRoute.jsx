import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../utils/adminApi';

const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="w-8 h-8 border-2 border-espresso border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Double check authorization, frontend-only role checks can be manipulated
  // But for fast UX we check role first
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
