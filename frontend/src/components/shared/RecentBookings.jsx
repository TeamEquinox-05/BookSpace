import React from 'react';
import BookingCard from '../ui/BookingCard';
import { Plus, Calendar, Sparkles } from 'lucide-react';

const RecentBookings = ({ bookings, onAddBooking }) => (
  <div 
    className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-slate-200 dark:border-[#1a1a1a] hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Recent Bookings</h3>
      </div>
      <button 
        onClick={onAddBooking} 
        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
      >
        <Plus size={18} />
        <span>New Booking</span>
      </button>
    </div>
    
    {bookings.length > 0 ? (
      <div 
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {bookings.map((booking) => (
          <BookingCard key={booking._id} booking={booking} />
        ))}
      </div>
    ) : (
      <div 
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <Sparkles className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No bookings yet</h4>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Start by creating your first booking to see them appear here.
        </p>
        <button
          onClick={onAddBooking}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          <span>Create First Booking</span>
        </button>
      </div>
    )}
  </div>
);

export default RecentBookings;