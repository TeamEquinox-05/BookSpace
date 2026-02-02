import React, { useEffect, useCallback } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui';

const PrivateRoute = ({ adminOnly }) => {
  const { user, loading, refreshUser } = useAuth();

  // Memoize the refresh check to avoid unnecessary re-renders
  const checkAuth = useCallback(() => {
    if (!loading && !user) {
      refreshUser();
    }
  }, [loading, user, refreshUser]);

  // On mount, verify authentication is still valid
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Display loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Spinner size="lg" color="blue" />
      </div>
    );
  }

  // 1. Check if user is logged in at all. If not, redirect to login with replace=true
  if (!user) {
    console.log('PrivateRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" replace={true} />;
  }

  // 2. Check if the route is for admins and if the user has the correct role.
  if (adminOnly && user.role !== 'admin') {
    console.log('PrivateRoute: User is not admin, redirecting to dashboard');
    // If a non-admin tries to access an admin route, send them to their own dashboard.
    return <Navigate to="/dashboard" replace={true} />;
  }

  // 3. Prevent admins from accessing non-admin specific routes (like user dashboard)
  if (!adminOnly && user.role === 'admin') {
    console.log('PrivateRoute: Admin accessing user route, redirecting to admin dashboard');
    return <Navigate to="/admin" replace={true} />;
  }

  // 4. If all checks pass, render the requested component.
  return <Outlet />;
};

export default PrivateRoute;
