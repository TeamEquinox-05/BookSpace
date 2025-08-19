import React from 'react';
import BookingCard from '../ui/BookingCard';
import { Plus } from 'lucide-react';

const RecentBookings = ({ bookings, onAddBooking }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Recent Bookings</h3>
      <button onClick={onAddBooking} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
        <Plus size={18} />
        <span>New Booking</span>
      </button>
    </div>
    {bookings.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <BookingCard key={booking._id} booking={booking} />
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <p className="text-slate-500 dark:text-slate-400">No recent bookings to display.</p>
      </div>
    )}
  </div>
);

export default RecentBookings;