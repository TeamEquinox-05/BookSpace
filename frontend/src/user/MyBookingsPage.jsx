
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PageHeader } from '../components/shared';
import BookingModal from '../components/shared/BookingModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [availablePlaces, setAvailablePlaces] = useState([]);

  const fetchBookingsAndPlaces = async () => {
    setLoading(true);
    try {
      const [bookingsRes, placesRes] = await Promise.all([
        axios.get('/bookings/my-bookings'),
        axios.get('/places'), // Fetch all places to populate the dropdown
      ]);

      setBookings(bookingsRes.data);
      setAvailablePlaces(placesRes.data.filter(place => place.status === 'available'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndPlaces();
  }, []);

  const handleEditClick = (booking) => {
    setCurrentBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (booking) => {
    setCurrentBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateBooking = async (updatedDetails) => {
    const token = localStorage.getItem('token');
    console.log('Attempting to update booking with ID:', currentBooking._id);
    try {
      await axios.put(`/bookings/${currentBooking._id}`, updatedDetails, {
        headers: {
          'x-auth-token': token,
        },
      });

      setIsEditModalOpen(false);
      fetchBookingsAndPlaces(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
      throw err; // Re-throw to be caught by the modal
    }
  };

  const handleDeleteBooking = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/bookings/${currentBooking._id}`, {
        headers: {
          'x-auth-token': token,
        },
      });

      setIsDeleteModalOpen(false);
      fetchBookingsAndPlaces(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="My Bookings" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {error && <p className="text-center text-red-500">{error}</p>}
          {loading ? (
            <CardGridSkeleton count={3} />
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No bookings found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map(booking => (
                <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{booking.eventTitle}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{booking.placeId.name}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    <p><strong>Status:</strong> {booking.status}</p>
                    <p><strong>From:</strong> {new Date(booking.eventStartTime).toLocaleString()}</p>
                    <p><strong>To:</strong> {new Date(booking.eventEndTime).toLocaleString()}</p>
                    {booking.requestedFacilities && booking.requestedFacilities.length > 0 && (
                      <p><strong>Facilities:</strong> {booking.requestedFacilities.map(f => f.name).join(', ')}</p>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleEditClick(booking)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(booking)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {isEditModalOpen && currentBooking && (
        <BookingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          places={availablePlaces}
          onBookingSubmit={handleUpdateBooking}
          initialBooking={currentBooking} // Pass current booking for pre-population
        />
      )}

      {isDeleteModalOpen && currentBooking && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteBooking}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the booking for \"${currentBooking.eventTitle}\" at ${currentBooking.placeId.name}? This action cannot be undone.`}
        />
      )}
    </>
  );
};

export default MyBookingsPage;
