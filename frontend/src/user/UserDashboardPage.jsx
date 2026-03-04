import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import logger from '../utils/logger';

// Import shared components
import { PageHeader, RecentBookings } from '../components/shared';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import BookingModal from '../components/shared/BookingModal';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw, Calendar, MapPin } from 'lucide-react';

export default function UserDashboardPage() {
  const { user: _user } = useAuth();
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [availableVenues, setAvailableVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      setError(null);
      const [bookingsRes, placesRes] = await Promise.all([
        api.get('/bookings/my-bookings'), // Use user-specific endpoint instead of admin-only
        api.get('/places'),
      ]);

      setTodaysEvents(bookingsRes.data);
      setAvailableVenues(placesRes.data.filter(place => place.status === 'available'));
    } catch (error) {
      logger.error('Error fetching user dashboard data:', error);
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
      await api.post('/bookings', bookingDetails);

      // Refresh data after successful booking
      fetchUserData();
      setBookingModalOpen(false);
    } catch (error) {
      logger.error('Booking failed:', error);
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
          {error ? (
            <motion.div 
              className="flex flex-col justify-center items-center h-64"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto border border-red-100 dark:border-red-900/30">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                <motion.button
                  onClick={handleRetry}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
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
                  <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-lg p-12 max-w-lg mx-auto border border-slate-100 dark:border-[#1a1a1a]">
                    <div className="flex justify-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Welcome to BookSpace!</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                      You're all set! Start exploring available places and create your first booking to get started.
                    </p>
                    <motion.button
                      onClick={() => setBookingModalOpen(true)}
                      className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
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
