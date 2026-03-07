import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

import logger from '../../utils/logger';

const BookingModal = ({ isOpen, onClose, places, onBookingSubmit, initialBooking }) => {
  const [bookingDetails, setBookingDetails] = useState({
    placeId: '',
    eventTitle: '',
    description: '',
    eventStartTime: '',
    eventEndTime: ''
  });

  // Separate date / time / period state
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');

  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');

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

  // --- helpers ---
  const to12h = (h24) => {
    const period = h24 >= 12 ? 'PM' : 'AM';
    let hour = h24 % 12;
    if (hour === 0) hour = 12;
    return { hour: String(hour), period };
  };

  const to24h = (hour, period) => {
    let h = parseInt(hour, 10);
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return h;
  };

  const pad = (n) => String(n).padStart(2, '0');

  const composeDateTime = (date, hour, minute, period) => {
    if (!date) return '';
    const h24 = to24h(hour, period);
    return `${date}T${pad(h24)}:${pad(minute)}`;
  };

  const getMinDate = () => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Sync composed datetime into bookingDetails whenever parts change
  useEffect(() => {
    const start = composeDateTime(startDate, startHour, startMinute, startPeriod);
    const end = composeDateTime(endDate, endHour, endMinute, endPeriod);
    setBookingDetails(prev => ({ ...prev, eventStartTime: start, eventEndTime: end }));
  }, [startDate, startHour, startMinute, startPeriod, endDate, endHour, endMinute, endPeriod]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialBooking.eventStartTime && initialBooking.eventEndTime) {
        // For editing existing bookings with dates
        // placeId may be a populated object or a plain string ID - normalize to string
        const placeId = initialBooking.placeId?._id ?? initialBooking.placeId ?? '';
        const sDate = new Date(initialBooking.eventStartTime);
        const eDate = new Date(initialBooking.eventEndTime);
        const s12 = to12h(sDate.getHours());
        const e12 = to12h(eDate.getHours());

        setBookingDetails(prev => ({
          ...prev,
          placeId: typeof placeId === 'object' ? placeId.toString() : placeId,
          eventTitle: initialBooking.eventTitle || '',
          description: initialBooking.description || '',
        }));

        setStartDate(`${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}`);
        setStartHour(s12.hour);
        setStartMinute(pad(sDate.getMinutes()));
        setStartPeriod(s12.period);

        setEndDate(`${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}`);
        setEndHour(e12.hour);
        setEndMinute(pad(eDate.getMinutes()));
        setEndPeriod(e12.period);

        setSelectedFacilities(initialBooking.requestedFacilities || []);
      } else if (initialBooking && initialBooking.placeId) {
        // For new bookings with a pre-selected place - normalize ID
        const placeId = initialBooking.placeId?._id ?? initialBooking.placeId;
        setBookingDetails({
          placeId: typeof placeId === 'object' ? placeId.toString() : String(placeId),
          eventTitle: '',
          description: '',
          eventStartTime: '',
          eventEndTime: ''
        });
        setStartDate(''); setStartHour('9'); setStartMinute('00'); setStartPeriod('AM');
        setEndDate(''); setEndHour('10'); setEndMinute('00'); setEndPeriod('AM');
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
        setStartDate(''); setStartHour('9'); setStartMinute('00'); setStartPeriod('AM');
        setEndDate(''); setEndHour('10'); setEndMinute('00'); setEndPeriod('AM');
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
      const startDateObj = new Date(bookingDetails.eventStartTime);
      const endDateObj = new Date(bookingDetails.eventEndTime);

      // Check if dates are valid
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        setIsAvailable(false);
        setAvailabilityMessage('Please enter valid start and end times.');
        return;
      }

      // Guard: don't hit the server with an invalid range
      if (endDateObj <= startDateObj) {
        setIsAvailable(false);
        setAvailabilityMessage('End time must be after start time.');
        return;
      }

      const res = await api.post('/bookings/check-availability', {
        placeId: bookingDetails.placeId,
        eventStartTime: startDateObj.toISOString(),
        eventEndTime: endDateObj.toISOString(),
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

    const startDateObj = new Date(bookingDetails.eventStartTime);
    const endDateObj = new Date(bookingDetails.eventEndTime);

    // Validate dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setError('Please enter valid start and end times.');
      setIsSubmitting(false);
      return;
    }

    if (endDateObj <= startDateObj) {
      setError('End time must be after start time.');
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionDetails = {
        ...bookingDetails,
        eventStartTime: startDateObj.toISOString(),
        eventEndTime: endDateObj.toISOString(),
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

  // Common input styling
  const inputCls = 'h-11 px-3 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  // Reusable time selector row
  const renderTimeRow = ({ label, date, setDate, hour, setHour, minute, setMinute, period, setPeriod }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
        <Clock size={13} className="text-blue-500" />
        {label} <span className="text-red-500 normal-case font-normal">*</span>
      </label>

      <div className="flex items-center gap-2">
        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={getMinDate()}
          max={getMaxDate()}
          required
          className={`${inputCls} flex-1 min-w-0 [color-scheme:light] dark:[color-scheme:dark]`}
        />

        {/* Hour */}
        <div className="relative">
          <select
            value={hour}
            onChange={e => setHour(e.target.value)}
            className={`${selectCls} w-[4.25rem] pr-7 text-center`}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
              <option key={h} value={String(h)}>{h}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
            <svg className="w-3 h-3 text-slate-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <span className="text-slate-400 dark:text-zinc-500 font-bold select-none">:</span>

        {/* Minute */}
        <div className="relative">
          <select
            value={minute}
            onChange={e => setMinute(e.target.value)}
            className={`${selectCls} w-[4.25rem] pr-7 text-center`}
          >
            {['00', '15', '30', '45'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
            <svg className="w-3 h-3 text-slate-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* AM / PM toggle */}
        <div className="flex rounded-xl border border-slate-200 dark:border-[#2a2a2a] overflow-hidden flex-shrink-0">
          {['AM', 'PM'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`h-11 px-3 text-xs font-semibold transition-colors ${
                period === p
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-slate-50 dark:bg-[#111111] text-slate-500 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-zinc-600">
        {label === 'Start' ? 'When your event begins' : 'When your event ends'}
      </p>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={onClose}
        >
          <div
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
                          {place.name}
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
                      <Settings size={13} className="text-blue-500" />
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
                                ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                                : 'bg-slate-50 dark:bg-[#111111] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#2a2a2a] hover:border-blue-400 dark:hover:border-blue-600'
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
                      <FileText size={13} className="text-blue-500" />
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
                      <Users size={13} className="text-slate-500" />
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
                    <FileText size={13} className="text-slate-400" />
                    Description
                    <span className="normal-case font-normal text-slate-400 dark:text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={bookingDetails.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Special requirements, expected attendance, notes..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                  {renderTimeRow({
                    label: 'Start',
                    date: startDate, setDate: setStartDate,
                    hour: startHour, setHour: setStartHour,
                    minute: startMinute, setMinute: setStartMinute,
                    period: startPeriod, setPeriod: setStartPeriod,
                  })}
                  {renderTimeRow({
                    label: 'End',
                    date: endDate, setDate: setEndDate,
                    hour: endHour, setHour: setEndHour,
                    minute: endMinute, setMinute: setEndMinute,
                    period: endPeriod, setPeriod: setEndPeriod,
                  })}
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl"
                  >
                      <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={15} />
                      <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    </div>
                  )}

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
                  <span className="inline-flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                ) : (
                  <>
                    <Calendar size={15} />
                    {isEditMode ? 'Update Booking' : 'Create Booking'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;
