import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, BookingModal } from '../components/shared';
import { Spinner } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/custom-calendar.css'; // Custom styles for calendar

const localizer = momentLocalizer(moment);

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
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

  useEffect(() => {
    localStorage.setItem('calendarView', view);
    localStorage.setItem('calendarDate', date.toISOString());
  }, [view, date]);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const [placeRes, bookingsRes] = await Promise.all([
          axios.get(`/places/${id}`),
          axios.get(`/places/${id}/bookings`),
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
      const bookingsRes = await axios.get(`/places/${id}/bookings`);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingSubmit = async (bookingDetails) => {
    try {
      await axios.post('/bookings', bookingDetails);
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

    const statusColors = {
      confirmed: {
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: '2px solid #059669',
      },
      pending: {
        backgroundColor: '#f59e0b',
        color: '#ffffff', 
        border: '2px solid #d97706',
      },
      cancelled: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: '2px solid #dc2626',
      },
    };

    return { 
      style: { 
        ...baseStyle, 
        ...statusColors[event.status] || statusColors.pending 
      } 
    };
  };

  const CustomToolbar = ({ date, view, onNavigate, onView }) => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row justify-between items-center mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {/* Navigation Controls */}
        <div className="flex items-center gap-3 mb-4 lg:mb-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('PREV', view)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Previous</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('TODAY', view)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <CalendarIcon size={18} />
            <span className="hidden sm:inline">Today</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('NEXT', view)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* Date Display */}
        <div className="flex items-center gap-2 mb-4 lg:mb-0">
          <CalendarIcon className="text-blue-500 dark:text-blue-400" size={24} />
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            {moment(date).isValid() ? moment(date).format('MMMM YYYY') : moment().format('MMMM YYYY')}
          </h3>
        </div>

        {/* View Controls */}
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { key: 'month', label: 'Month', icon: CalendarIcon },
            { key: 'week', label: 'Week', icon: Clock },
            { key: 'day', label: 'Day', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onView(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
                view === key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline text-sm font-medium">{label}</span>
            </motion.button>
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
                      <Clock className="text-orange-500" size={20} />
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
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
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
                    Booking Status Legend
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                      <span className="text-gray-700 dark:text-gray-300">Confirmed Bookings</span>
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
                          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
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
                          eventPropGetter={eventPropGetter}
                          components={{
                            toolbar: () => null, // Hide default toolbar since we have custom one
                          }}
                          popup
                          popupOffset={{ x: 30, y: 20 }}
                          formats={{
                            dateFormat: 'DD',
                            dayFormat: (date, culture, localizer) =>
                              localizer.format(date, 'dddd', culture),
                            weekdayFormat: (date, culture, localizer) =>
                              localizer.format(date, 'dddd', culture),
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
    </div>
  );
}