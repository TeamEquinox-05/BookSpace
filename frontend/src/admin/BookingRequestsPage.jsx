import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PageHeader } from '../components/shared';
import { Check, X, Loader2 } from 'lucide-react';

export default function BookingRequestsPage() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);

  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/bookings/pending');
      setPendingBookings(res.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching pending bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, status, reason = '') => {
    if (isUpdating) return; // Prevent multiple submissions
    setIsUpdating(true);
    try {
      await axios.put(`/bookings/${bookingId}/status`, { status, reason });

      // Clear rejection state after successful update
      setRejectingBookingId(null);
      setRejectionReasonInput('');
      // Refresh the list of pending bookings
      fetchPendingBookings();
    } catch (err) {
      setError(err.message);
      console.error("Error updating booking status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Booking Requests" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="text-center text-red-500">Error: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="Booking Requests" />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pending Booking Requests</h2>
        {loading ? (
          <div className="space-y-4">
            <CardGridSkeleton count={3} />
          </div>
        ) : pendingBookings.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No pending booking requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.eventTitle}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Place: {booking.placeId?.name || 'N/A'}</p>
                    <p className="text-gray-600 dark:text-gray-400">Requested by: {booking.userId?.name || 'N/A'} ({booking.userId?.email || 'N/A'})</p>
                    <p className="text-gray-600 dark:text-gray-400">Time: {new Date(booking.eventStartTime).toLocaleString()} - {new Date(booking.eventEndTime).toLocaleString()}</p>
                    <p className="text-gray-600 dark:text-gray-400">Facilities: {booking.requestedFacilities?.map(f => f.name).join(', ') || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(booking._id, 'approved')}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
                      title="Approve"
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    </button>
                    <button
                      onClick={() => setRejectingBookingId(booking._id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                      title="Reject"
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
                    </button>
                  </div>
                  {rejectingBookingId === booking._id && (
                    <div className="mt-4 w-full">
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows="3"
                        placeholder="Enter rejection reason..."
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => handleStatusChange(booking._id, 'rejected', rejectionReasonInput)}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                          disabled={isUpdating || !rejectionReasonInput.trim()}
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectingBookingId(null);
                            setRejectionReasonInput('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </main>
    </div>
  );
}
