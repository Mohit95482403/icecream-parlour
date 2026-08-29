import React from 'react';
import { Navigate } from 'react-router-dom';

// Placeholder: In a real implementation, this would check AuthContext for admin role
const isAuthenticated = false; // Mock
const userRole = 'customer'; // Mock

const AdminRoute = ({ children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    // If authenticated but not admin, redirect to home or unauthorized page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
