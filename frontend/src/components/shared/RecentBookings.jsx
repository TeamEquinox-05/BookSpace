import React from 'react';
import { motion } from 'framer-motion';
import BookingCard from '../ui/BookingCard';
import { Plus, Calendar, Sparkles } from 'lucide-react';

const RecentBookings = ({ bookings, onAddBooking }) => (
  <motion.div 
    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Recent Bookings</h3>
      </div>
      <motion.button 
        onClick={onAddBooking} 
        className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-xl"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={18} />
        <span>New Booking</span>
      </motion.button>
    </div>
    
    {bookings.length > 0 ? (
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {bookings.map((booking, index) => (
          <motion.div
            key={booking._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <BookingCard booking={booking} />
          </motion.div>
        ))}
      </motion.div>
    ) : (
      <motion.div 
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-4">
          <Sparkles className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No bookings yet</h4>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Start by creating your first booking to see them appear here.
        </p>
        <motion.button
          onClick={onAddBooking}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={18} />
          <span>Create First Booking</span>
        </motion.button>
      </motion.div>
    )}
  </motion.div>
);

export default RecentBookings;