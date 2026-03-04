import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { Spinner } from '../ui';
import logger from '../../utils/logger';

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
  
  // Ref to track if component is mounted (to prevent state updates on unmounted component)
  const isMountedRef = useRef(true);
  // Ref to store abort controller for cancelling pending requests
  const abortControllerRef = useRef(null);
  
  // Determine if this is an edit mode (existing booking with an ID)
  const isEditMode = initialBooking && initialBooking._id;

  // Reliable datetime-local input formatter (avoids locale-dependent toLocaleString output)
  const formatForInput = (date) => {
    const d = new Date(date);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

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
        // placeId may be a populated object or a plain string ID â€” normalize to string
        const placeId = initialBooking.placeId?._id ?? initialBooking.placeId ?? '';
        setBookingDetails({
          placeId: typeof placeId === 'object' ? placeId.toString() : placeId,
          eventTitle: initialBooking.eventTitle || '',
          description: initialBooking.description || '',
          eventStartTime: formatForInput(initialBooking.eventStartTime),
          eventEndTime: formatForInput(initialBooking.eventEndTime),
        });
        setSelectedFacilities(initialBooking.requestedFacilities || []);
      } else if (initialBooking && initialBooking.placeId) {
        // For new bookings with a pre-selected place â€” normalize ID
        const placeId = initialBooking.placeId?._id ?? initialBooking.placeId;
        setBookingDetails({ 
          placeId: typeof placeId === 'object' ? placeId.toString() : String(placeId), 
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
  }, [isOpen, places, initialBooking, isEditMode]);

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

  const checkAvailability = useCallback(async (signal) => {
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

      // Guard: don't hit the server with an invalid range
      if (endDate <= startDate) {
        setIsAvailable(false);
        setAvailabilityMessage('End time must be after start time.');
        return;
      }

      const res = await api.post('/bookings/check-availability', {
        placeId: bookingDetails.placeId,
        eventStartTime: startDate.toISOString(),
        eventEndTime: endDate.toISOString(),
      }, { signal });
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsAvailable(res.data.available);
        setAvailabilityMessage(res.data.msg);
      }
    } catch (err) {
      // Ignore abort errors (expected when component unmounts or request is cancelled)
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return;
      }
      logger.error('Error checking availability:', err);
      if (isMountedRef.current) {
        setIsAvailable(false);
        setAvailabilityMessage('Error checking availability.');
      }
    }
  }, [bookingDetails.placeId, bookingDetails.eventStartTime, bookingDetails.eventEndTime]);

  useEffect(() => {
    // Set mounted ref
    isMountedRef.current = true;
    
    // Cleanup function to abort pending requests and mark component as unmounted
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    const timeoutId = setTimeout(() => {
      checkAvailability(abortControllerRef.current.signal);
    }, 500); // Debounce for 500ms
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [bookingDetails.placeId, bookingDetails.eventStartTime, bookingDetails.eventEndTime, checkAvailability]);

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
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-slate-200 dark:border-[#1a1a1a] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1a1a1a] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                    {isEditMode ? 'Edit Booking' : 'New Booking'}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    {isEditMode ? 'Update your reservation details' : 'Reserve your perfect venue'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Venue */}
                <div className="space-y-1.5">
                  <label htmlFor="placeId" className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                    <MapPin size={13} className="text-blue-500" />
                    Venue
                  </label>
                  <div className="relative">
                    <select
                      id="placeId"
                      name="placeId"
                      value={bookingDetails.placeId}
                      onChange={handleChange}
                      className="w-full h-11 px-4 pr-10 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                    >
                      {places.map(place => (
                        <option key={place._id} value={place._id}>
                          {place.name} â€” Capacity: {place.capacity}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                {availableFacilities.length > 0 && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                      <Settings size={13} className="text-green-500" />
                      Facilities
                      <span className="normal-case font-normal text-slate-400 dark:text-zinc-600">(select as needed)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableFacilities.map(facility => {
                        const checked = selectedFacilities.some(f => f.name === facility.name);
                        return (
                          <button
                            key={facility.name}
                            type="button"
                            onClick={() => handleFacilityChange(facility)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                              checked
                                ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm shadow-blue-500/20'
                                : 'bg-slate-50 dark:bg-[#111111] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#2a2a2a] hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${checked ? 'bg-white' : 'bg-slate-300 dark:bg-zinc-600'}`} />
                            {facility.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Event Title + Availability */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="eventTitle" className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                      <FileText size={13} className="text-purple-500" />
                      Event Title <span className="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <input
                      type="text"
                      id="eventTitle"
                      name="eventTitle"
                      value={bookingDetails.eventTitle}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Annual Tech Fest"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Availability pill */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                      <Users size={13} className="text-yellow-500" />
                      Availability
                    </label>
                    <div className={`h-11 px-4 rounded-xl border flex items-center gap-3 text-sm font-medium transition-colors ${
                      !bookingDetails.eventStartTime || !bookingDetails.eventEndTime
                        ? 'bg-slate-50 dark:bg-[#111111] border-slate-200 dark:border-[#2a2a2a] text-slate-400 dark:text-zinc-600'
                        : isAvailable
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'
                    }`}>
                      {!bookingDetails.eventStartTime || !bookingDetails.eventEndTime ? (
                        <span className="text-slate-400 dark:text-zinc-600 text-xs">Pick dates to check</span>
                      ) : isAvailable ? (
                        <>
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          Available
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                          <span className="truncate text-xs">{availabilityMessage || 'Not available'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="description" className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                    <FileText size={13} className="text-indigo-500" />
                    Description
                    <span className="normal-case font-normal text-slate-400 dark:text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={bookingDetails.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Special requirements, expected attendance, notesâ€¦"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="eventStartTime" className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                      <Clock size={13} className="text-green-500" />
                      Start <span className="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="eventStartTime"
                      name="eventStartTime"
                      value={bookingDetails.eventStartTime}
                      onChange={handleChange}
                      min={getMinBookingTime()}
                      max={getMaxBookingTime()}
                      required
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                    />
                    <p className="text-xs text-slate-400 dark:text-zinc-600">When your event begins</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="eventEndTime" className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                      <Clock size={13} className="text-red-500" />
                      End <span className="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="eventEndTime"
                      name="eventEndTime"
                      value={bookingDetails.eventEndTime}
                      onChange={handleChange}
                      min={bookingDetails.eventStartTime || getMinBookingTime()}
                      required
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                    />
                    <p className="text-xs text-slate-400 dark:text-zinc-600">When your event ends</p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl"
                    >
                      <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={15} />
                      <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-[#1a1a1a] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-10 text-sm font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#2a2a2a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="booking-form"
                disabled={!isAvailable || isSubmitting}
                onClick={handleSubmit}
                className={`px-5 h-10 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
                  isAvailable && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-200 dark:bg-[#1a1a1a] text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <Spinner centered={false} size="sm" text="Savingâ€¦" />
                ) : (
                  <>
                    <Calendar size={15} />
                    {isEditMode ? 'Update Booking' : 'Create Booking'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
