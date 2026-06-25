import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (adminOnly && user.role !== 'admin') {
    // Redirect non-admins away from admin-only routes
    return <Navigate to="/inbox" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;