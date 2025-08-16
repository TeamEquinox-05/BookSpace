import React from 'react';

const BookingCard = ({ booking }) => {
  const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const statusStyles = {
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 dark:text-white truncate" title={booking.placeId?.name}>{booking.placeId?.name || 'N/A'}</h4>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[booking.status] || 'bg-slate-100 text-slate-800'}`}>
          {booking.status}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 truncate" title={booking.eventTitle}>
        Event: <span className="font-medium text-slate-700 dark:text-slate-300">{booking.eventTitle}</span>
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        Booked by: <span className="font-medium">{booking.userId?.name || 'N/A'}</span>
      </p>
      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-sm text-slate-500 dark:text-slate-400">
        <p><strong>From:</strong> {formatDateTime(booking.eventStartTime)}</p>
        <p><strong>To:</strong> {formatDateTime(booking.eventEndTime)}</p>
      </div>
    </div>
  );
};

export default BookingCard;