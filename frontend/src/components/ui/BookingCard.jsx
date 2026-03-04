import React from 'react';
import { Clock, MapPin } from 'lucide-react';

const BookingCard = ({ booking }) => {
  const fmt = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (isNaN(d)) return 'Invalid Date';
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const statusStyles = {
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-600/10 dark:ring-emerald-500/20',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-600/10 dark:ring-amber-500/20',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-1 ring-red-600/10 dark:ring-red-500/20',
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#1a1a1a] hover:shadow-md hover:border-slate-300 dark:hover:border-[#2a2a2a] transition-all overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-[15px] font-semibold text-slate-900 dark:text-white leading-snug truncate" title={booking.placeId?.name}>
            {booking.placeId?.name || 'N/A'}
          </h4>
          <span className={'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ' + (statusStyles[booking.status] || '')}>
            {booking.status}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-300 truncate" title={booking.eventTitle}>
          {booking.eventTitle}
        </p>
        <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-0.5">
          By {booking.userId?.name || 'N/A'}
        </p>
      </div>

      {/* Time details */}
      <div className="mx-4 mb-4 mt-1 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[13px]">
          <Clock size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="text-slate-700 dark:text-zinc-300">{fmt(booking.eventStartTime)} — {fmt(booking.eventEndTime)}</span>
        </div>
        {booking.placeId?.location && (
          <div className="flex items-center gap-2 text-[13px]">
            <MapPin size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
            <span className="text-slate-600 dark:text-zinc-400 truncate">{booking.placeId.location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;