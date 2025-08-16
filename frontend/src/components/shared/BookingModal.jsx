import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, places, onBookingSubmit, initialBooking }) => {
  const [bookingDetails, setBookingDetails] = useState(initialBooking || {
    placeId: '', eventTitle: '', description: '', eventStartTime: '', eventEndTime: '',
  });
  const [selectedFacilities, setSelectedFacilities] = useState(initialBooking?.requestedFacilities || []);
  const [availableFacilities, setAvailableFacilities] = useState([]);
  const [error, setError] = useState(null);

  const getMinBookingTime = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const getMaxBookingTime = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialBooking) {
        setBookingDetails({
          ...initialBooking,
          eventStartTime: new Date(initialBooking.eventStartTime).toISOString().slice(0, 16),
          eventEndTime: new Date(initialBooking.eventEndTime).toISOString().slice(0, 16),
        });
        setSelectedFacilities(initialBooking.requestedFacilities || []);
      } else {
        const initialPlaceId = places.length > 0 ? places[0]._id : '';
        setBookingDetails({ placeId: initialPlaceId, eventTitle: '', description: '', eventStartTime: '', eventEndTime: '' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (new Date(bookingDetails.eventEndTime) <= new Date(bookingDetails.eventStartTime)) {
      setError('End time must be after start time.');
      return;
    }
    try {
      await onBookingSubmit({ ...bookingDetails, requestedFacilities: selectedFacilities });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{initialBooking ? "Edit Booking" : "Request a Booking"}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Content */}
          <div>
            <label htmlFor="placeId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Venue</label>
            <select id="placeId" name="placeId" value={bookingDetails.placeId} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              {places.map(place => <option key={place._id} value={place._id}>{place.name}</option>)}
            </select>
          </div>
          {availableFacilities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Available Facilities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableFacilities.map(facility => (
                  <label key={facility.name} className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
                    <input type="checkbox" checked={selectedFacilities.some(f => f.name === facility.name)} onChange={() => handleFacilityChange(facility)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{facility.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="eventTitle" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Event Title</label>
            <input type="text" id="eventTitle" name="eventTitle" value={bookingDetails.eventTitle} onChange={handleChange} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description</label>
            <textarea id="description" name="description" value={bookingDetails.description} onChange={handleChange} rows="3" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventStartTime" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Start Time</label>
              <input type="datetime-local" id="eventStartTime" name="eventStartTime" value={bookingDetails.eventStartTime} onChange={handleChange} min={getMinBookingTime()} max={getMaxBookingTime()} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
            </div>
            <div>
              <label htmlFor="eventEndTime" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">End Time</label>
              <input type="datetime-local" id="eventEndTime" name="eventEndTime" value={bookingDetails.eventEndTime} onChange={handleChange} min={bookingDetails.eventStartTime || getMinBookingTime()} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {initialBooking ? "Update Booking" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;