import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { API_URL } from '../config/api-config';
import logger from '../utils/logger';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/shared';
import DetailViewSkeleton from '../components/ui/DetailViewSkeleton';

const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${path}`;
};
export default function VenueDetailPage({ role = 'user' }) {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        const res = await api.get(`/places/${id}`);
        setVenue(res.data);
      } catch (err) {
        setError(err.message);
        logger.error('Error fetching venue details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [id]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title={loading ? 'Loading...' : venue?.name || 'Venue Details'} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
          {loading ? (
            <DetailViewSkeleton />
          ) : !venue ? (
            <div className="text-center">Venue not found.</div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {venue.image && (
                  <img
                    src={resolveImageUrl(venue.image)}
                    alt={venue.name}
                    className="w-full h-56 object-cover rounded-lg mb-4 shadow-md"
                  />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{venue.name}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{venue.details}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Capacity:</p>
                    <p className="text-gray-900 dark:text-white">{venue.capacity} people</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Location:</p>
                    <p className="text-gray-900 dark:text-white">{venue.location}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Facilities:</p>
                  <ul className="list-disc list-inside text-gray-900 dark:text-white">
                    {venue.facilities.map((facility, index) => (
                      <li key={index}>{facility.name}</li>
                    ))}
                  </ul>
                </div>
                {role === 'admin' && (
                  <div className="mt-6 text-right">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mr-2">Edit Venue</button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete Venue</button>
                  </div>
                )}
                {role === 'user' && (
                  <div className="mt-6 text-right">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Request Booking</button>
                  </div>
                )}
              </div>
              {/* Calendar will go here */}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
