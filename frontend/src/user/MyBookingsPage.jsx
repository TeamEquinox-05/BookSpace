
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';
import { PageHeader } from '../components/shared';
import BookingModal from '../components/shared/BookingModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { CardGridSkeleton } from '../components/ui';
import { Calendar, Clock, MapPin, Package, Pencil, Trash2, CheckCircle2, XCircle, Timer, CalendarX } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   accent: 'from-amber-400 to-orange-400',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/40', dot: 'bg-amber-500',   icon: Timer },
  approved:  { label: 'Approved',  accent: 'from-green-400 to-emerald-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40',  dot: 'bg-green-500',  icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  accent: 'from-red-400 to-rose-400',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40',           dot: 'bg-red-500',    icon: XCircle },
  cancelled: { label: 'Cancelled', accent: 'from-slate-400 to-slate-500',   badge: 'bg-slate-100 text-slate-600 dark:bg-[#1a1a1a] dark:text-zinc-500 border-slate-200 dark:border-[#2a2a2a]',      dot: 'bg-slate-400',  icon: CalendarX },
};

const BookingCard = ({ booking, onEdit, onDelete }) => {
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.cancelled;
  const StatusIcon = cfg.icon;

  const startDate = new Date(booking.eventStartTime);
  const endDate = new Date(booking.eventEndTime);
  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#1a1a1a] overflow-hidden shadow-sm flex flex-col"
    >
      {/* Gradient top accent */}
      <div className={`h-0.5 bg-gradient-to-r ${cfg.accent}`} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate">
            {booking.eventTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {booking.placeId?.name || 'Unknown Venue'}
          </p>
        </div>
        {/* Status badge */}
        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${booking.status === 'pending' ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </span>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100 dark:border-[#1a1a1a]" />

      {/* Date / Time */}
      <div className="px-5 py-3 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-medium">{dateStr}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-medium">{startTime} – {endTime}</span>
        </div>
      </div>

      {/* Facilities */}
      {booking.requestedFacilities?.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {booking.requestedFacilities.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 text-xs font-medium"
            >
              <Package className="w-2.5 h-2.5" />
              {f.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions (pending only) */}
      {booking.status === 'pending' && (
        <>
          <div className="mx-5 border-t border-slate-100 dark:border-[#1a1a1a]" />
          <div className="px-5 py-3 flex gap-2 mt-auto">
            <button
              onClick={() => onEdit(booking)}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => onDelete(booking)}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [availablePlaces, setAvailablePlaces] = useState([]);

  const fetchBookingsAndPlaces = async () => {
    setLoading(true);
    try {
      const [bookingsRes, placesRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/places'),
      ]);
      setBookings(bookingsRes.data);
      setAvailablePlaces(placesRes.data.filter(place => place.status === 'available'));
    } catch (err) {
      setError(err.message);
      logger.error('Error fetching bookings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookingsAndPlaces(); }, []);

  const handleEditClick = (booking) => { setCurrentBooking(booking); setIsEditModalOpen(true); };
  const handleDeleteClick = (booking) => { setCurrentBooking(booking); setIsDeleteModalOpen(true); };

  const handleUpdateBooking = async (updatedDetails) => {
    logger.debug('Attempting to update booking with ID:', currentBooking._id);
    try {
      await api.put(`/bookings/${currentBooking._id}`, updatedDetails);
      setIsEditModalOpen(false);
      fetchBookingsAndPlaces();
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
      throw err;
    }
  };

  const handleDeleteBooking = async () => {
    try {
      await api.delete(`/bookings/${currentBooking._id}`);
      setIsDeleteModalOpen(false);
      fetchBookingsAndPlaces();
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    }
  };

  const pending = bookings.filter(b => b.status === 'pending');
  const others  = bookings.filter(b => b.status !== 'pending');

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="My Bookings" subtitle="Track and manage your venue reservations" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <CardGridSkeleton count={6} />
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-4">
                  <CalendarX className="w-7 h-7 text-slate-400 dark:text-zinc-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">No bookings yet</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-500">Your booking history will appear here once you make a reservation.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pending */}
                {pending.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">Pending</h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{pending.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pending.map(b => (
                        <BookingCard key={b._id} booking={b} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Others */}
                {others.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">History</h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-[#1a1a1a] dark:text-zinc-400">{others.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {others.map(b => (
                        <BookingCard key={b._id} booking={b} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {isEditModalOpen && currentBooking && (
        <BookingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          places={availablePlaces}
          onBookingSubmit={handleUpdateBooking}
          initialBooking={currentBooking}
        />
      )}

      {isDeleteModalOpen && currentBooking && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteBooking}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the booking for "${currentBooking.eventTitle}" at ${currentBooking.placeId?.name || 'Unknown Venue'}? This action cannot be undone.`}
        />
      )}
    </>
  );
};

export default MyBookingsPage;
