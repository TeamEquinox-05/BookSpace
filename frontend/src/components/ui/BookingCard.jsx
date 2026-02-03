import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, MapPin, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const BookingCard = ({ booking, onClick }) => {
  const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    if (isNaN(date)) return 'Invalid Time';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const statusConfig = {
    approved: { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      label: 'Approved'
    },
    pending: { 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertCircle,
      label: 'Pending'
    },
    rejected: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle,
      label: 'Rejected'
    },
  };

  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Calculate duration
  const getDuration = () => {
    if (!booking.eventStartTime || !booking.eventEndTime) return null;
    const start = new Date(booking.eventStartTime);
    const end = new Date(booking.eventEndTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <motion.div 
      className={`bg-white dark:bg-slate-800 rounded-xl border ${status.border} hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group`}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Bar */}
      <div className={`h-1.5 ${status.bg.replace('100', '500').replace('900/30', '500')}`}></div>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={booking.eventTitle}>
              {booking.eventTitle || 'Untitled Event'}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600 dark:text-slate-400 truncate" title={booking.placeId?.name}>
                {booking.placeId?.name || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} ${status.text} flex-shrink-0 ml-2`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{status.label}</span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
              {booking.userId?.name || 'Unknown User'}
            </p>
          </div>
        </div>

        {/* Time Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(booking.eventStartTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {formatTime(booking.eventStartTime)} - {formatTime(booking.eventEndTime)}
              </span>
            </div>
            {getDuration() && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                {getDuration()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCard;