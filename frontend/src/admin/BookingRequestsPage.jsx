import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { PageHeader } from '../components/shared';
import { Check, X, Calendar, Clock, User, MapPin, Package, Mail, AlertCircle, Inbox } from 'lucide-react';
import { Spinner, useToast, EmptyState, Badge } from '../components/ui';
import logger from '../utils/logger';

const BookingRequestCard = ({ booking, onApprove, onReject, isProcessing, processingAction }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    onReject(booking._id, rejectionReason);
    setShowRejectForm(false);
    setRejectionReason('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Status bar at top */}
      <div className="h-1 bg-amber-400" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              {booking.eventTitle}
            </h3>
            <Badge variant="warning" dot size="sm">
              Pending Approval
            </Badge>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm">{booking.placeId?.name || 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-sm">
              <span className="font-medium">{booking.userId?.name || 'N/A'}</span>
              <span className="text-slate-400 dark:text-slate-500 ml-1">({booking.userId?.email || 'N/A'})</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm">{new Date(booking.eventStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm">
              {new Date(booking.eventStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.eventEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>

        {/* Requested Facilities */}
        {booking.requestedFacilities?.length > 0 && (
          <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Package className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Requested facilities: {booking.requestedFacilities?.map(f => f.name).join(', ')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                  <Mail className="w-3 h-3 mr-1" />
                  {booking.requestedFacilities.length} facility email{booking.requestedFacilities.length > 1 ? 's' : ''} will be notified
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <AnimatePresence mode="wait">
          {!showRejectForm ? (
            <motion.div 
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={() => onApprove(booking._id)}
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing && processingAction === 'approve' ? (
                  <Spinner size="sm" centered={false} />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approve
                  </>
                )}
              </motion.button>
              
              <motion.button
                onClick={handleRejectClick}
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reject
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="reject-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Please provide a reason for rejection</span>
              </div>
              <textarea
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                rows="3"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <motion.button
                  onClick={handleCancelReject}
                  disabled={isProcessing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirmReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing && processingAction === 'reject' ? (
                    <Spinner size="sm" centered={false} />
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Confirm Reject
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function BookingRequestsPage() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track which booking ID is being updated and whether it's being approved or rejected
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null); // 'approve' or 'reject'
  
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
          logger.error('Error fetching pending bookings:', err);
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
      logger.error('Error fetching pending bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setProcessingBookingId(bookingId);
    setProcessingAction('approve');
    
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status: 'approved' });
      
      // Check email sending status
      if (response.data.emailResults) {
        const { userEmailSent, facilitiesNotified, facilitiesSuccess } = response.data.emailResults;
        
        if (userEmailSent && (facilitiesNotified === 0 || facilitiesSuccess === facilitiesNotified)) {
          addToast({
            message: `Booking approved! User and ${facilitiesSuccess} facilities notified.`,
            type: 'success',
            duration: 6000
          });
        } else if (userEmailSent && facilitiesSuccess < facilitiesNotified) {
          addToast({
            message: `Approved! User notified, but only ${facilitiesSuccess}/${facilitiesNotified} facility emails delivered.`,
            type: 'warning',
            duration: 6000
          });
        } else {
          addToast({
            message: `Approved, but some notifications failed. Check logs.`,
            type: 'error',
            duration: 6000
          });
        }
      }
      
      fetchPendingBookings();
    } catch (err) {
      setError(err.message);
      logger.error('Error approving booking:', err);
      addToast({
        message: 'Failed to approve booking. Please try again.',
        type: 'error',
        duration: 6000
      });
    } finally {
      setProcessingBookingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (bookingId, reason) => {
    setProcessingBookingId(bookingId);
    setProcessingAction('reject');
    
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status: 'rejected', reason });
      
      if (response.data.emailResults) {
        const { userEmailSent } = response.data.emailResults;
        
        if (userEmailSent) {
          addToast({
            message: 'Booking rejected. User has been notified.',
            type: 'success',
            duration: 6000
          });
        } else {
          addToast({
            message: 'Booking rejected, but failed to notify user.',
            type: 'warning',
            duration: 6000
          });
        }
      }
      
      fetchPendingBookings();
    } catch (err) {
      setError(err.message);
      logger.error('Error rejecting booking:', err);
      addToast({
        message: 'Failed to reject booking. Please try again.',
        type: 'error',
        duration: 6000
      });
    } finally {
      setProcessingBookingId(null);
      setProcessingAction(null);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Booking Requests" subtitle="Review and manage pending booking requests" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
          <EmptyState
            icon={AlertCircle}
            title="Error Loading Requests"
            description={error}
            actionLabel="Try Again"
            onAction={() => window.location.reload()}
            size="lg"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="Booking Requests" subtitle="Review and manage pending booking requests" />
      <ToastContainer />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with count */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Requests</h2>
              {!loading && pendingBookings.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} awaiting your review
                </p>
              )}
            </div>
            {!loading && pendingBookings.length > 0 && (
              <Badge variant="warning" size="md">
                {pendingBookings.length} Pending
              </Badge>
            )}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" centered={false} text="Loading booking requests" />
            </div>
          ) : pendingBookings.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No Pending Requests"
              description="All booking requests have been processed. New requests will appear here."
              size="lg"
            />
          ) : (
            <motion.div 
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              <AnimatePresence>
                {pendingBookings.map((booking) => (
                  <BookingRequestCard
                    key={booking._id}
                    booking={booking}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isProcessing={processingBookingId === booking._id}
                    processingAction={processingAction}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
