
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import shared components
import { PageHeader, RecentBookings } from '../components/shared';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import BookingModal from '../components/shared/BookingModal';

export default function UserDashboardPage({ user }) {
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [availableVenues, setAvailableVenues] = useState([]);

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

          <AvailablePlacesGrid places={availableVenues} />
        <RecentBookings bookings={todaysEvents} title="Recent Bookings" onAddBooking={() => setBookingModalOpen(true)} />

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
