import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/shared';
import DetailViewSkeleton from '../components/ui/DetailViewSkeleton';
import { Spinner } from '../components/ui';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error("Error fetching place details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [id]);

  if (error) return <div>Error: {error}</div>;

  const events = bookings.map(booking => ({
    title: booking.eventTitle,
    start: new Date(booking.eventStartTime),
    end: new Date(booking.eventEndTime),
  }));

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title={loading ? 'Loading...' : place?.name || 'Details'} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : !place ? (
            <div className="text-center">Place not found.</div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{place.name}</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">{place.details}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900 dark:text-white">
                  <p><span className="font-semibold">Capacity:</span> {place.capacity}</p>
                  <p><span className="font-semibold">Location:</span> {place.location}</p>
                  <p><span className="font-semibold">Status:</span> {place.status}</p>
                  <p><span className="font-semibold">Facilities:</span> {place.facilities.map(f => f.name).join(', ')}</p>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bookings Calendar</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <Calendar
                      localizer={localizer}
                      events={events}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: 500 }}
                      className="text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
