import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboardPage from './admin/AdminDashboardPage.jsx';
import BookingRequestsPage from './admin/BookingRequestsPage.jsx';
import UserDashboardPage from './user/UserDashboardPage.jsx';
import MyBookingsPage from './user/MyBookingsPage.jsx';
import LoginPage from './auth/LoginPage.jsx';
import SignupPage from './auth/SignupPage.jsx';
import SettingsPage from './settings/SettingsPage.jsx';
import PlaceDetailsPage from './places/PlaceDetailsPage.jsx';
import VenueManagementPage from './admin/VenueManagementPage.jsx';
import VenueDetailPage from './venues/VenueDetailPage.jsx';
import PrivateRoute from './components/shared/PrivateRoute.jsx';
import Layout from './components/shared/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Routes with Layout */}
      <Route element={<Layout />}>
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/places/:id" element={<PlaceDetailsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<PrivateRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/requests" element={<BookingRequestsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/venues" element={<VenueManagementPage />} />
          <Route path="/admin/places/:id" element={<VenueDetailPage role="admin" />} />
        </Route>
      </Route>

      {/* Catch-all for unauthenticated users trying to access protected routes */}
      {!user && <Route path="*" element={<Navigate to="/login" />} />}

      {/* Wildcard route redirects to root for logic handling */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
