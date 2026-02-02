import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { PageHeader } from '../components/shared';
import { Check, X, Calendar, Clock, User, MapPin, Package, Mail } from 'lucide-react';
import { Spinner, useToast } from '../components/ui';
export default function BookingRequestsPage() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track which booking ID is being updated and whether it's being approved or rejected
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null); // 'approve' or 'reject'

  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  
  // Toast notification system
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchPendingBookings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bookings/pending');
        if (isMounted) {
          setPendingBookings(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          console.error("Error fetching pending bookings:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPendingBookings();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/pending');
      setPendingBookings(res.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching pending bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, status, reason = '') => {
    // Set which booking and action is being processed
    setProcessingBookingId(bookingId);
    setProcessingAction(status === 'approved' ? 'approve' : 'reject');
    
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status, reason });

      // Clear rejection state after successful update
      setRejectingBookingId(null);
      setRejectionReasonInput('');
      
      // Check email sending status
      if (response.data.emailResults) {
        const { userEmailSent, facilitiesNotified, facilitiesSuccess } = response.data.emailResults;
        
        // Show notification about email status
        if (userEmailSent && (facilitiesNotified === 0 || facilitiesSuccess === facilitiesNotified)) {
          // All emails sent successfully
          addToast({
            message: `All notifications sent successfully! User and ${facilitiesSuccess} facilities notified.`,
            type: 'success',
            duration: 6000
          });
        } else if (userEmailSent && facilitiesSuccess < facilitiesNotified) {
          // User email sent but some facility emails failed
          addToast({
            message: `User notified, but only ${facilitiesSuccess}/${facilitiesNotified} facility emails delivered.`,
            type: 'warning',
            duration: 6000
          });
        } else {
          // User email failed
          addToast({
            message: `Failed to send some notifications. Check logs for details.`,
            type: 'error',
            duration: 6000
          });
        }
      }
      
      // Refresh the list of pending bookings
      fetchPendingBookings();
    } catch (err) {
      setError(err.message);
      console.error("Error updating booking status:", err);
    } finally {
      // Clear processing state
      setProcessingBookingId(null);
      setProcessingAction(null);
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
      <ToastContainer />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pending Booking Requests</h2>
        {loading ? (
          <div className="flex justify-center items-center h-64 w-full">
            <Spinner size="lg" centered={false} text="Loading booking requests" />
          </div>
        ) : pendingBookings.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No pending booking requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{booking.eventTitle}</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <MapPin size={18} className="mr-2 flex-shrink-0" />
                        <span>{booking.placeId?.name || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <User size={18} className="mr-2 flex-shrink-0" />
                        <span>{booking.userId?.name || 'N/A'} ({booking.userId?.email || 'N/A'})</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <Calendar size={18} className="mr-2 flex-shrink-0" />
                        <span>{new Date(booking.eventStartTime).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <Clock size={18} className="mr-2 flex-shrink-0" />
                        <span>
                          {new Date(booking.eventStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.eventEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      {booking.requestedFacilities?.length > 0 && (
                        <div className="flex items-start text-gray-600 dark:text-gray-300">
                          <Package size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span>Requested facilities: {booking.requestedFacilities?.map(f => f.name).join(', ')}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <Mail size={14} className="mr-1" />
                              {booking.requestedFacilities.length} facility emails will be notified
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-2">
                    <button
                      onClick={() => handleStatusChange(booking._id, 'approved')}
                      className="flex-1 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-60"
                      disabled={processingBookingId !== null}
                    >
                      {processingBookingId === booking._id && processingAction === 'approve' ? (
                        <Spinner size="sm" centered={false} text="Approving" />
                      ) : (
                        <>
                          <Check size={18} className="mr-2" />
                          Approve
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setRejectingBookingId(booking._id)}
                      className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-60"
                      disabled={processingBookingId !== null}
                    >
                      <X size={18} className="mr-2" />
                      Reject
                    </button>
                  </div>
                  
                  {rejectingBookingId === booking._id && (
                    <div className="mt-4 w-full">
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows="3"
                        placeholder="Enter rejection reason..."
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end space-x-3 mt-3">
                        <button
                          onClick={() => handleStatusChange(booking._id, 'rejected', rejectionReasonInput)}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-60"
                          disabled={processingBookingId !== null || !rejectionReasonInput.trim()}
                        >
                          {processingBookingId === booking._id && processingAction === 'reject' ? (
                            <Spinner size="sm" centered={false} text="Rejecting" />
                          ) : (
                            <>Confirm Reject</>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingBookingId(null);
                            setRejectionReasonInput('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                          disabled={processingBookingId !== null}
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
