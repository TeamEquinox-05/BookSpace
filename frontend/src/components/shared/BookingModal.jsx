import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BookingModal = ({ isOpen, onClose, places, onBookingSubmit, initialBooking }) => {
  const [bookingDetails, setBookingDetails] = useState({
    placeId: '', 
    eventTitle: '', 
    description: '', 
    eventStartTime: '', 
    eventEndTime: ''
  });
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [availableFacilities, setAvailableFacilities] = useState([]);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  
  // Determine if this is an edit mode (existing booking with an ID)
  const isEditMode = initialBooking && initialBooking._id;

  const getMinBookingTime = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const getMaxBookingTime = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialBooking.eventStartTime && initialBooking.eventEndTime) {
        // For editing existing bookings with dates
        setBookingDetails({
          placeId: initialBooking.placeId || '',
          eventTitle: initialBooking.eventTitle || '',
          description: initialBooking.description || '',
          eventStartTime: new Date(initialBooking.eventStartTime).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(' ', 'T'),
          eventEndTime: new Date(initialBooking.eventEndTime).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(' ', 'T'),
        });
        setSelectedFacilities(initialBooking.requestedFacilities || []);
      } else if (initialBooking && initialBooking.placeId) {
        // For new bookings with a pre-selected place
        setBookingDetails({ 
          placeId: initialBooking.placeId, 
          eventTitle: '', 
          description: '', 
          eventStartTime: '', 
          eventEndTime: '' 
        });
        setSelectedFacilities([]);
      } else {
        // For completely new bookings
        const initialPlaceId = places.length > 0 ? places[0]._id : '';
        setBookingDetails({ 
          placeId: initialPlaceId, 
          eventTitle: '', 
          description: '', 
          eventStartTime: '', 
          eventEndTime: '' 
        });
        setSelectedFacilities([]);
      }
    }
  }, [isOpen, places, initialBooking]);

  useEffect(() => {
    if (bookingDetails.placeId) {
      const selectedPlace = places.find(p => p._id === bookingDetails.placeId);
      setAvailableFacilities(selectedPlace?.facilities || []);
      // Reset selected facilities if the new place doesn't have the previously selected ones
      setSelectedFacilities(prev => prev.filter(sf => selectedPlace?.facilities.some(af => af.name === sf.name)));
    }
  }, [bookingDetails.placeId, places]);

  const handleChange = (e) => setBookingDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFacilityChange = (facility) => {
    setSelectedFacilities(prev => prev.some(f => f.name === facility.name) ? prev.filter(f => f.name !== facility.name) : [...prev, facility]);
  };

  const checkAvailability = async () => {
    if (!bookingDetails.placeId || !bookingDetails.eventStartTime || !bookingDetails.eventEndTime) {
      setIsAvailable(true);
      setAvailabilityMessage('');
      return;
    }

    try {
      const startDate = new Date(bookingDetails.eventStartTime);
      const endDate = new Date(bookingDetails.eventEndTime);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setIsAvailable(false);
        setAvailabilityMessage('Please enter valid start and end times.');
        return;
      }

      const res = await axios.post('/bookings/check-availability', {
        placeId: bookingDetails.placeId,
        eventStartTime: startDate.toISOString(),
        eventEndTime: endDate.toISOString(),
      });
      setIsAvailable(res.data.available);
      setAvailabilityMessage(res.data.msg);
    } catch (err) {
      console.error('Error checking availability:', err);
      setIsAvailable(false);
      setAvailabilityMessage('Error checking availability.');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500); // Debounce for 500ms
    return () => clearTimeout(timeoutId);
  }, [bookingDetails.placeId, bookingDetails.eventStartTime, bookingDetails.eventEndTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const startDate = new Date(bookingDetails.eventStartTime);
    const endDate = new Date(bookingDetails.eventEndTime);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Please enter valid start and end times.');
      setIsSubmitting(false);
      return;
    }
    
    if (endDate <= startDate) {
      setError('End time must be after start time.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const submissionDetails = {
        ...bookingDetails,
        eventStartTime: startDate.toISOString(),
        eventEndTime: endDate.toISOString(),
        requestedFacilities: selectedFacilities
      };
      await onBookingSubmit(submissionDetails);
      onClose();
    } catch (err) {
      // Check if the error has a response from the server and a message
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg); // Use the specific message from the backend
      } else {
        setError(err.message || 'An unexpected error occurred.'); // Fallback to generic message
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {isEditMode ? "Edit Booking" : "Create New Booking"}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {isEditMode ? "Modify your booking details" : "Reserve your perfect venue"}
                    </p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Venue Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-3"
                >
                  <label htmlFor="placeId" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <MapPin size={16} className="text-blue-500" />
                    Select Venue
                  </label>
                  <div className="relative">
                    <select 
                      id="placeId" 
                      name="placeId" 
                      value={bookingDetails.placeId} 
                      onChange={handleChange} 
                      className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:text-white appearance-none cursor-pointer shadow-sm hover:shadow-md"
                    >
                      {places.map(place => (
                        <option key={place._id} value={place._id}>
                          {place.name} - Capacity: {place.capacity}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Facilities Selection */}
                {availableFacilities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-3"
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Settings size={16} className="text-green-500" />
                      Available Facilities
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        (Select as needed)
                      </span>
                    </label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {availableFacilities.map(facility => (
                        <motion.label 
                          key={facility.name}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 shadow-sm hover:shadow-md ${
                            selectedFacilities.some(f => f.name === facility.name)
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 shadow-blue-200 dark:shadow-blue-900/50'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              checked={selectedFacilities.some(f => f.name === facility.name)} 
                              onChange={() => handleFacilityChange(facility)} 
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600"
                            />
                            {selectedFacilities.some(f => f.name === facility.name) && (
                              <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-blue-500" />
                            )}
                          </div>
                          <span className="text-sm font-medium flex-1">{facility.name}</span>
                        </motion.label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Event Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <label htmlFor="eventTitle" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <FileText size={16} className="text-purple-500" />
                      Event Title
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        id="eventTitle" 
                        name="eventTitle" 
                        value={bookingDetails.eventTitle} 
                        onChange={handleChange} 
                        required 
                        placeholder="Enter a descriptive event title..."
                        className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md" 
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Users size={16} className="text-orange-500" />
                      Availability Status
                    </label>
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      isAvailable 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-green-100 dark:shadow-green-900/30' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 shadow-red-100 dark:shadow-red-900/30'
                    } shadow-md`}>
                      <div className="flex items-center gap-3">
                        {isAvailable ? (
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                            <CheckCircle className="text-white" size={20} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
                            <AlertCircle className="text-white" size={20} />
                          </div>
                        )}
                        <div className="flex-1">
                          <span className={`text-sm font-semibold ${
                            isAvailable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>
                            {isAvailable ? 'Venue Available' : 'Venue Not Available'}
                          </span>
                          {availabilityMessage && (
                            <p className={`text-xs mt-1 ${
                              isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {availabilityMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FileText size={16} className="text-indigo-500" />
                    Event Description
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <textarea 
                      id="description" 
                      name="description" 
                      value={bookingDetails.description} 
                      onChange={handleChange} 
                      rows="4" 
                      placeholder="Provide details about your event, special requirements, expected attendance, etc..."
                      className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none shadow-sm hover:shadow-md"
                    />
                    <div className="absolute top-4 right-4 pointer-events-none">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-3"
                  >
                    <label htmlFor="eventStartTime" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Clock size={16} className="text-green-500" />
                      Start Date & Time
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="datetime-local" 
                        id="eventStartTime" 
                        name="eventStartTime" 
                        value={bookingDetails.eventStartTime} 
                        onChange={handleChange} 
                        min={getMinBookingTime()} 
                        max={getMaxBookingTime()} 
                        required 
                        className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:text-white shadow-sm hover:shadow-md [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:bg-gray-100 [&::-webkit-calendar-picker-indicator]:dark:hover:bg-gray-600 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded" 
                      />
                      <div className="absolute inset-y-0 right-12 flex items-center pr-2 pointer-events-none">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Select when your event begins
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <label htmlFor="eventEndTime" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Clock size={16} className="text-red-500" />
                      End Date & Time
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="datetime-local" 
                        id="eventEndTime" 
                        name="eventEndTime" 
                        value={bookingDetails.eventEndTime} 
                        onChange={handleChange} 
                        min={bookingDetails.eventStartTime || getMinBookingTime()} 
                        required 
                        className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:text-white shadow-sm hover:shadow-md [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:bg-gray-100 [&::-webkit-calendar-picker-indicator]:dark:hover:bg-gray-600 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded" 
                      />
                      <div className="absolute inset-y-0 right-12 flex items-center pr-2 pointer-events-none">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Select when your event ends
                    </p>
                  </motion.div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                      <AlertCircle className="text-red-500" size={18} />
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Actions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={onClose} 
                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: isAvailable && !isSubmitting ? 1.02 : 1 }}
                    whileTap={{ scale: isAvailable && !isSubmitting ? 0.98 : 1 }}
                    type="submit" 
                    disabled={!isAvailable || isSubmitting} 
                    className={`flex-1 sm:flex-none px-6 py-3 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      isAvailable && !isSubmitting
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                        : 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        {isEditMode ? "Update Booking" : "Create Booking"}
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;