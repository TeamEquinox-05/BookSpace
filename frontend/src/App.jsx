import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui';

// Eagerly loaded components (needed for initial render)
import PrivateRoute from './components/shared/PrivateRoute.jsx';
import Layout from './components/shared/Layout.jsx';

// Lazy loaded components - split by route for better code splitting
const AdminDashboardPage = lazy(() => import('./admin/AdminDashboardPage.jsx'));
const BookingRequestsPage = lazy(() => import('./admin/BookingRequestsPage.jsx'));
const AllBookingsPage = lazy(() => import('./admin/AllBookingsPage.jsx'));
const VenueManagementPage = lazy(() => import('./admin/VenueManagementPage.jsx'));
const UserManagementPage = lazy(() => import('./admin/UserManagementPage.jsx'));

const UserDashboardPage = lazy(() => import('./user/UserDashboardPage.jsx'));
const MyBookingsPage = lazy(() => import('./user/MyBookingsPage.jsx'));

const LoginPage = lazy(() => import('./auth/LoginPage.jsx'));
const SignupPage = lazy(() => import('./auth/SignupPage.jsx'));

const SettingsPage = lazy(() => import('./settings/SettingsPage.jsx'));
const PlaceDetailsPage = lazy(() => import('./places/PlaceDetailsPage.jsx'));

// Loading fallback component for Suspense
const PageLoader = () => (
  <div className="min-h-[50vh] flex justify-center items-center">
    <Spinner size="lg" color="blue" />
  </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

export default App;
