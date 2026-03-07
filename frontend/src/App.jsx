import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import PrivateRoute from './components/shared/PrivateRoute.jsx';
import Layout from './components/shared/Layout.jsx';

import AdminDashboardPage from './admin/AdminDashboardPage.jsx';
import BookingRequestsPage from './admin/BookingRequestsPage.jsx';
import AllBookingsPage from './admin/AllBookingsPage.jsx';
import VenueManagementPage from './admin/VenueManagementPage.jsx';
import UserManagementPage from './admin/UserManagementPage.jsx';

import UserDashboardPage from './user/UserDashboardPage.jsx';
import MyBookingsPage from './user/MyBookingsPage.jsx';

import LoginPage from './auth/LoginPage.jsx';
import SignupPage from './auth/SignupPage.jsx';

import SettingsPage from './settings/SettingsPage.jsx';
import PlaceDetailsPage from './places/PlaceDetailsPage.jsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
        {/* Public routes - accessible whether logged in or not */}
        <Route path="/login" element={user ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) : <LoginPage />} />
        <Route path="/signup" element={user ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) : <SignupPage />} />

        {/* Routes with Layout - for authenticated users */}
        <Route element={<Layout />}>
          {/* Regular user routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<UserDashboardPage />} end />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/places/:id" element={<PlaceDetailsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<PrivateRoute adminOnly={true} />}>
            <Route path="/admin" element={<AdminDashboardPage />} end />
            <Route path="/admin/requests" element={<BookingRequestsPage />} />
            <Route path="/admin/bookings" element={<AllBookingsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/venues" element={<VenueManagementPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/places/:id" element={<PlaceDetailsPage />} />
          </Route>
        </Route>

        {/* Root path redirect */}
        <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) : <Navigate to="/login" replace />} />

        {/* Catch-all route - always redirects to login if not authenticated or to appropriate dashboard if authenticated */}
        <Route path="*" element={!user 
          ? <Navigate to="/login" replace /> 
          : (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />)} 
        />
      </Routes>
  );
}

export default App;
