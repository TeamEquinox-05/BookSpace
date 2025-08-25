
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Import shared components
import { PageHeader, RecentBookings } from '../components/shared';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import BookingModal from '../components/shared/BookingModal';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import TableSkeleton from '../components/ui/TableSkeleton';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw, Calendar, MapPin } from 'lucide-react';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [availableVenues, setAvailableVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      setError(null);
      const [bookingsRes, placesRes] = await Promise.all([
        axios.get('/bookings/approved'),
        axios.get('/places'),
      ]);

      setTodaysEvents(bookingsRes.data);
      setAvailableVenues(placesRes.data.filter(place => place.status === 'available'));
    } catch (error) {
      console.error("Error fetching user dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleBookingSubmit = async (bookingDetails) => {
    try {
      await axios.post('/bookings', bookingDetails);

      // Refresh data after successful booking
      fetchUserData();
      setBookingModalOpen(false);
    } catch (error) {
      console.error('Booking failed:', error);
      // Re-throw to be caught by the modal
      throw error;
    }
  };

  const handleRetry = () => {
    setLoading(true);
    fetchUserData();
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="User Dashboard" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
          {loading ? (
            <motion.div 
              className="flex flex-col justify-center items-center h-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <Spinner size="lg" />
                <motion.div
                  className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              className="flex flex-col justify-center items-center h-64"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto border border-red-100 dark:border-red-900/30">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                <motion.button
                  onClick={handleRetry}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <AvailablePlacesGrid places={availableVenues} />
              <RecentBookings bookings={todaysEvents} title="Recent Bookings" onAddBooking={() => setBookingModalOpen(true)} />
              
              {availableVenues.length === 0 && todaysEvents.length === 0 && (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-12 max-w-lg mx-auto border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Welcome to BookSpace!</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                      You're all set! Start exploring available places and create your first booking to get started.
                    </p>
                    <motion.button
                      onClick={() => setBookingModalOpen(true)}
                      className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Create Your First Booking</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </main>
      </div>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        places={availableVenues}
        onBookingSubmit={handleBookingSubmit}
      />
    </>
  );
}
