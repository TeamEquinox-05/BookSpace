import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ adminOnly }) => {
  const role = localStorage.getItem('role');

  // 1. Check if user is logged in at all. If not, redirect to login.
  if (!role) {
    return <Navigate to="/login" />;
  }

  // 2. Check if the route is for admins and if the user has the correct role.
  if (adminOnly && role !== 'admin') {
    // If a non-admin tries to access an admin route, send them to their own dashboard.
    return <Navigate to="/dashboard" />;
  }

  // 3. If all checks pass, render the requested component.
  return <Outlet />;
};

export default PrivateRoute;
