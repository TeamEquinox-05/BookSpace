import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';

const PrivateRoute = ({ adminOnly }) => {
  const { user, loading, refreshUser } = useAuth();
  const hasAttemptedRefresh = useRef(false);

  // On mount, verify authentication is still valid (only once)
  useEffect(() => {
    // Only attempt refresh once per mount if not loading and no user
    if (!loading && !user && !hasAttemptedRefresh.current) {
      hasAttemptedRefresh.current = true;
      // Add error handling for refreshUser call
      refreshUser().catch((err) => {
        logger.error('PrivateRoute: Error refreshing user:', err);
      });
    }
  }, [loading, user, refreshUser]);

  // Display loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 dark:border-blue-400/20 dark:border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Check if user is logged in at all. If not, redirect to login with replace=true
  if (!user) {
    logger.debug('PrivateRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" replace={true} />;
  }

  // 2. Check if the route is for admins and if the user has the correct role.
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') {
    logger.debug('PrivateRoute: User is not admin, redirecting to dashboard');
    // If a non-admin tries to access an admin route, send them to their own dashboard.
    return <Navigate to="/dashboard" replace={true} />;
  }

  // 3. Prevent admins from accessing non-admin specific routes (like user dashboard)
  if (!adminOnly && (user.role === 'admin' || user.role === 'superadmin')) {
    logger.debug('PrivateRoute: Admin accessing user route, redirecting to admin dashboard');
    return <Navigate to="/admin" replace={true} />;
  }

  // 4. If all checks pass, render the requested component.
  return <Outlet />;
};

export default PrivateRoute;
