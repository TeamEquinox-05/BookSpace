import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { PageHeader } from '../components/shared';
import { Check, X, Calendar, Clock, User, MapPin, Package, Mail, AlertCircle, Inbox, Building2 } from 'lucide-react';
import { useToast, EmptyState, Badge } from '../components/ui';
import logger from '../utils/logger';

const BookingRequestCard = ({ booking, onApprove, onReject, isProcessing, processingAction }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectClick = () => setShowRejectForm(true);
  const handleCancelReject = () => { setShowRejectForm(false); setRejectionReason(''); };
  const handleConfirmReject = () => { onReject(booking._id, rejectionReason); setShowRejectForm(false); setRejectionReason(''); };

  const startDate = new Date(booking.eventStartTime);
  const endDate = new Date(booking.eventEndTime);
  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userInitials = (booking.userId?.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#1a1a1a] overflow-hidden shadow-sm"
    >
      {/* Blue top accent */}
      <div className="h-0.5 bg-blue-500" />

      {/* Card Header */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        {/* Venue Icon Block */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight truncate">
                {booking.eventTitle}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {booking.placeId?.name || 'N/A'}
              </p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Pending
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100 dark:border-[#1a1a1a]" />

      {/* Details */}
      <div className="px-5 py-4 space-y-3">
        {/* Requested by */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">{userInitials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-white leading-tight">{booking.userId?.name || 'N/A'}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{booking.userId?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Date & Time row */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#111111] rounded-xl px-4 py-3 border border-slate-100 dark:border-[#1a1a1a]">
          <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium">{dateStr}</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-[#2a2a2a]" />
          <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
            <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium">{startTime} – {endTime}</span>
          </div>
        </div>

        {/* Facilities */}
        {booking.requestedFacilities?.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {booking.requestedFacilities.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 text-xs font-medium"
                >
                  <Package className="w-3 h-3" />
                  {f.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-600 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              {booking.requestedFacilities.length} facility email{booking.requestedFacilities.length > 1 ? 's' : ''} will be notified on approval
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-5 pb-5">
          {!showRejectForm ? (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(booking._id)}
                disabled={isProcessing}
                className="flex-1 h-10 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-500/20"
              >
                {isProcessing && processingAction === 'approve' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" />Approve</>
                )}
              </button>

              <button
                onClick={handleRejectClick}
                disabled={isProcessing}
                className="flex-1 h-10 bg-white dark:bg-[#0a0a0a] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Provide a reason for rejection
              </div>
              <textarea
                className="w-full p-3 text-sm border border-slate-200 dark:border-[#2a2a2a] rounded-xl bg-slate-50 dark:bg-[#111111] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
                rows="3"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelReject}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing && processingAction === 'reject' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><X className="w-4 h-4" />Confirm Reject</>
                  )}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
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
      logger.error('Error approving booking:', err);

      // 409 = overlap conflict — show the server's descriptive message
      if (err.response?.status === 409) {
        addToast({
          message: err.response.data.msg || 'This time slot is already booked for this venue.',
          type: 'error',
          duration: 9000
        });
      } else {
        addToast({
          message: 'Failed to approve booking. Please try again.',
          type: 'error',
          duration: 6000
        });
      }
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
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
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
        <div className="max-w-4xl mx-auto">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Requests</h2>
              {!loading && pendingBookings.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} awaiting your review
                </p>
              )}
            </div>
            {!loading && pendingBookings.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                {pendingBookings.length} Pending
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#1a1a1a] overflow-hidden animate-pulse">
                  <div className="h-0.5 bg-blue-500" />
                  <div className="px-5 pt-5 pb-4 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#1a1a1a]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-[#1a1a1a] rounded w-2/3" />
                      <div className="h-3 bg-slate-200 dark:bg-[#1a1a1a] rounded w-1/3" />
                    </div>
                  </div>
                  <div className="mx-5 border-t border-slate-100 dark:border-[#1a1a1a]" />
                  <div className="px-5 py-4 space-y-3">
                    <div className="h-10 bg-slate-200 dark:bg-[#1a1a1a] rounded-xl" />
                    <div className="h-10 bg-slate-200 dark:bg-[#1a1a1a] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingBookings.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No Pending Requests"
              description="All booking requests have been processed. New requests will appear here."
              size="lg"
            />
          ) : (
            <div className="space-y-4">
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
