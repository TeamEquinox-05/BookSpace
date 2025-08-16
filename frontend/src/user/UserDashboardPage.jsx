
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import shared components
import { PageHeader, RecentBookings } from '../components/shared';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import BookingModal from '../components/shared/BookingModal';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import TableSkeleton from '../components/ui/TableSkeleton';

export default function UserDashboardPage({ user }) {
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [availableVenues, setAvailableVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
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

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="User Dashboard" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {loading ? (
            <>
              <CardGridSkeleton />
              <TableSkeleton />
            </>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <AvailablePlacesGrid places={availableVenues} />
              <RecentBookings bookings={todaysEvents} title="Recent Bookings" onAddBooking={() => setBookingModalOpen(true)} />
              {availableVenues.length === 0 && todaysEvents.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No available places or recent bookings.
                </div>
              )}
            </>
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
