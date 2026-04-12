import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // Logged in, show the protected content
  return children;
};

export default ProtectedRoute;