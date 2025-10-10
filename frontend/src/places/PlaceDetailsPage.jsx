import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, BookingModal } from '../components/shared';
import { Spinner } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin, Plus, X, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/custom-calendar.css'; // Custom styles for calendar

const localizer = momentLocalizer(moment);

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [place, setPlace] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [date, setDate] = useState(() => {
    const savedDate = localStorage.getItem('calendarDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  const [view, setView] = useState(() => localStorage.getItem('calendarView') || 'month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('calendarView', view);
    localStorage.setItem('calendarDate', date.toISOString());
  }, [view, date]);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const [placeRes, bookingsRes] = await Promise.all([
          api.get(`/places/${id}`),
          api.get(`/places/${id}/bookings`),
        ]);
        setPlace(placeRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching place details:', err);
      } finally {
        setLoading(false);
        setBookingsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [id]);

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const bookingsRes = await api.get(`/places/${id}/bookings`);
      console.log('Fetched bookings:', bookingsRes.data);
      console.log('First booking user data:', bookingsRes.data[0]?.userId);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingSubmit = async (bookingDetails) => {
    try {
      await api.post('/bookings', bookingDetails);
      // Refresh bookings after successful booking
      await fetchBookings();
      setBookingModalOpen(false);
    } catch (error) {
      console.error('Booking failed:', error);
      // Re-throw to be caught by the modal
      throw error;
    }
  };

  const handleNavigate = (newDate, view, action) => {
    let targetDate = newDate;
    
    // Handle string actions from toolbar
    if (typeof newDate === 'string') {
      switch (newDate) {
        case 'PREV':
          targetDate = moment(date).subtract(1, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month').toDate();
          break;
        case 'NEXT':
          targetDate = moment(date).add(1, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month').toDate();
          break;
        case 'TODAY':
          targetDate = new Date();
          break;
        default:
          targetDate = new Date(newDate);
      }
    }
    
    setDate(targetDate);
    localStorage.setItem('calendarDate', targetDate.toISOString());
  };

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('calendarView', newView);
  };

  const handleEventClick = (event) => {
    // Find the full booking details from the bookings array
    const fullBooking = bookings.find(b => b._id === event.id);
    console.log('Clicked event:', event);
    console.log('Full booking details:', fullBooking);
    console.log('User data in booking:', fullBooking?.userId);
    if (fullBooking) {
      setSelectedEvent(fullBooking);
      setIsEventDetailsOpen(true);
    }
  };

  // Generate consistent color for each event based on its ID
  const getEventColor = (eventId, status) => {
    // If cancelled, always show red
    if (status === 'cancelled' || status === 'rejected') {
      return {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: '2px solid #991b1b',
      };
    }

    // If pending, show yellow/orange
    if (status === 'pending') {
      return {
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        border: '2px solid #d97706',
      };
    }

    // For approved/confirmed events, assign unique colors
    // Expanded high-contrast color palette (15 distinct colors)
    const colors = [
      { bg: '#3b82f6', border: '#2563eb' },   // 1. Bright Blue
      { bg: '#10b981', border: '#059669' },   // 2. Emerald Green
      { bg: '#8b5cf6', border: '#7c3aed' },   // 3. Purple
      { bg: '#ec4899', border: '#db2777' },   // 4. Hot Pink
      { bg: '#f97316', border: '#ea580c' },   // 5. Orange
      { bg: '#06b6d4', border: '#0891b2' },   // 6. Cyan
      { bg: '#6366f1', border: '#4f46e5' },   // 7. Indigo
      { bg: '#eab308', border: '#ca8a04' },   // 8. Yellow
      { bg: '#ef4444', border: '#dc2626' },   // 9. Red
      { bg: '#a855f7', border: '#9333ea' },   // 10. Violet
      { bg: '#84cc16', border: '#65a30d' },   // 11. Lime Green
      { bg: '#0ea5e9', border: '#0284c7' },   // 12. Sky Blue
      { bg: '#f43f5e', border: '#e11d48' },   // 13. Rose/Pink-Red
      { bg: '#14b8a6', border: '#0d9488' },   // 14. Teal
      { bg: '#a16207', border: '#854d0e' },   // 15. Brown/Gold
    ];

    // Use event ID to consistently assign same color to same event
    const hash = eventId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colorIndex = Math.abs(hash) % colors.length;
    const selectedColor = colors[colorIndex];

    return {
      backgroundColor: selectedColor.bg,
      color: '#ffffff',
      border: `2px solid ${selectedColor.border}`,
    };
  };

  const eventPropGetter = (event) => {
    const baseStyle = {
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '600',
      padding: '6px 10px',
      boxShadow: darkMode 
        ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
        : '0 2px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    };

    const eventColors = getEventColor(event.id, event.status);

    return { 
      style: { 
        ...baseStyle, 
        ...eventColors
      } 
    };
  };

  // Custom Event Component with Tooltip
  const EventComponent = ({ event }) => {
    const startDate = moment(event.start).format('MMM DD, YYYY');
    const endDate = moment(event.end).format('MMM DD, YYYY');
    const startTime = moment(event.start).format('h:mm A');
    const endTime = moment(event.end).format('h:mm A');
    
    // Check if start and end are on same day
    const sameDay = startDate === endDate;
    
    const tooltipText = sameDay
      ? `${event.title}\n${startDate}\n${startTime} - ${endTime}`
      : `${event.title}\n${startDate} ${startTime} - ${endDate} ${endTime}`;
    
    return (
      <div 
        className="h-full truncate" 
        title={tooltipText}
      >
        {event.title}
      </div>
    );
  };

  // Custom Week Event Component (shows time)
  const WeekEventComponent = ({ event }) => {
    return (
      <div className="h-full flex flex-col justify-between p-1">
        <div className="font-semibold truncate text-xs">{event.title}</div>
        <div className="text-xs opacity-90 mt-0.5">
          {moment(event.start).format('h:mm A')}
        </div>
      </div>
    );
  };

  const CustomToolbar = ({ date, view, onNavigate, onView }) => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Top Section: Date & Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Date Display */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-yellow-500 dark:text-yellow-400" size={20} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {moment(date).isValid() ? moment(date).format('MMMM YYYY') : moment().format('MMMM YYYY')}
            </h3>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('PREV', view)}
              className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors shadow-sm"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              onClick={() => onNavigate('TODAY', view)}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm text-sm font-medium"
            >
              Today
            </button>
            
            <button
              onClick={() => onNavigate('NEXT', view)}
              className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors shadow-sm"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Bottom Section: View Toggle */}
        <div className="flex justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50">
          {[
            { key: 'month', label: 'Month', icon: CalendarIcon },
            { key: 'week', label: 'Week', icon: Clock },
            { key: 'day', label: 'Day', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onView(key)}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                view === key
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon size={16} />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  if (error) return <div className="text-center text-red-500 dark:text-red-400">Error: {error}</div>;

  const events = bookings
    .filter(booking => {
      const start = new Date(booking.eventStartTime);
      const end = new Date(booking.eventEndTime);
      // Only show confirmed/approved bookings on the calendar
      const isApproved = booking.status === 'confirmed' || booking.status === 'approved';
      return !isNaN(start) && !isNaN(end) && isApproved;
    })
    .map(booking => ({
      id: booking._id,
      title: booking.eventTitle || 'Untitled Event',
      start: new Date(booking.eventStartTime),
      end: new Date(booking.eventEndTime),
      status: booking.status || 'pending',
    }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title={loading ? 'Loading...' : place?.name || 'Details'} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : !place ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Place not found.</div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Place Details */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-1"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  {place?.imageUrl && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-48 object-cover rounded-lg mb-4 shadow-md"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {place?.name}
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <MapPin className="text-blue-500" size={20} />
                      <span>{place?.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Users className="text-green-500" size={20} />
                      <span>Capacity: {place?.capacity} people</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Clock className="text-yellow-500" size={20} />
                      <span>Status: {place?.status}</span>
                    </div>
                  </div>
                  {place?.details && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {place.details}
                      </p>
                    </div>
                  )}
                  {place?.facilities && place.facilities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Facilities:</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {place.facilities.map(f => f.name).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="mt-6 space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBookingModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus size={20} />
                      Create Booking
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(-1)}
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium transition-all duration-200"
                    >
                      Go Back
                    </motion.button>
                  </div>
                </div>

                {/* Booking Legend */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Booking Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Confirmed (Various Colors)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                      <span className="text-gray-700 dark:text-gray-300">Pending Approval</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                      <span className="text-gray-700 dark:text-gray-300">Cancelled</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Each confirmed booking has a unique color for easy identification
                  </p>
                </motion.div>
              </motion.div>

              {/* Calendar Section */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <CustomToolbar
                  date={date}
                  view={view}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                />
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <CalendarIcon className="text-blue-500" size={24} />
                      Booking Calendar
                    </h3>
                    
                    {bookingsLoading ? (
                      <div className="flex justify-center items-center h-96">
                        <Spinner size="lg" />
                      </div>
                    ) : events.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          No bookings available for this place.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBookingModalOpen(true)}
                          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          <Plus size={18} />
                          Create First Booking
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="calendar-container"
                      >
                        <Calendar
                          localizer={localizer}
                          events={events}
                          startAccessor="start"
                          endAccessor="end"
                          style={{ height: '600px' }}
                          className={`rbc-calendar ${darkMode ? 'dark' : ''}`}
                          date={date}
                          view={view}
                          onNavigate={(newDate) => handleNavigate(newDate, view)}
                          onView={handleViewChange}
                          onSelectEvent={handleEventClick}
                          eventPropGetter={eventPropGetter}
                          components={{
                            toolbar: () => null, // Hide default toolbar since we have custom one
                            event: EventComponent, // Custom event for month/day view with tooltip
                            week: {
                              event: WeekEventComponent, // Custom event for week view with time
                            },
                          }}
                          popup
                          popupOffset={{ x: 30, y: 20 }}
                          formats={{
                            dateFormat: 'DD',
                            dayFormat: (date, culture, localizer) =>
                              localizer.format(date, 'dddd', culture),
                            weekdayFormat: (date, culture, localizer) =>
                              localizer.format(date, 'dddd', culture),
                            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                              localizer.format(start, 'h:mm A', culture) + ' - ' + localizer.format(end, 'h:mm A', culture),
                            timeGutterFormat: (date, culture, localizer) =>
                              localizer.format(date, 'h A', culture),
                          }}
                          dayPropGetter={(date) => {
                            if (moment(date).isSame(new Date(), 'day')) {
                              return {
                                className: 'rbc-today-custom',
                                style: {
                                  backgroundColor: darkMode ? '#1e40af20' : '#dbeafe',
                                  borderRadius: '8px',
                                }
                              };
                            }
                            return {};
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        places={place ? [place] : []}
        onBookingSubmit={handleBookingSubmit}
        initialBooking={{ placeId: id }}
      />
      
      {/* Event Details Modal */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsEventDetailsOpen(false)}
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
            isEventDetailsOpen ? '' : 'hidden'
          }`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedEvent.eventTitle || 'Event Details'}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedEvent.status === 'confirmed' || selectedEvent.status === 'approved'
                        ? 'bg-green-500 text-white'
                        : selectedEvent.status === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {selectedEvent.status?.toUpperCase()}
                      {console.log('Rendering modal with selectedEvent:', selectedEvent)}
                      {console.log('selectedEvent.userId:', selectedEvent.userId)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEventDetailsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Date & Time Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="text-yellow-500" size={20} />
                  Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {moment(selectedEvent.eventStartTime).format('MMM DD, YYYY')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {moment(selectedEvent.eventStartTime).format('h:mm A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">End</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {moment(selectedEvent.eventEndTime).format('MMM DD, YYYY')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {moment(selectedEvent.eventEndTime).format('h:mm A')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {selectedEvent.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="text-yellow-500" size={20} />
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Booker Info Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="text-yellow-500" size={20} />
                  Booked By
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      {selectedEvent.userId?.name || 'Unknown User'}
                    </span>
                  </div>
                  {user?.role === 'admin' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                        <span className="text-base font-medium text-gray-900 dark:text-white">
                          {selectedEvent.userId?.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Booking ID</span>
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                          {selectedEvent._id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {moment(selectedEvent.createdAt).format('MMM DD, YYYY h:mm A')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Venue Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin className="text-yellow-500" size={20} />
                  Venue
                </h3>
                <div className="space-y-2">
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {place?.name}
                  </p>
                  {place?.location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {place.location}
                    </p>
                  )}
                  {place?.capacity && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capacity: {place.capacity} people
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEventDetailsOpen(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
