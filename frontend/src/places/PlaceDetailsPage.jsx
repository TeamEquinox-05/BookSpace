import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/shared';

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const res = await axios.get(`/places/${id}`);
        setPlace(res.data);
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

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title={loading ? 'Loading...' : place?.name || 'Details'} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {loading ? (
            <DetailViewSkeleton />
          ) : !place ? (
            <div className="text-center">Place not found.</div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{place.name}</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">{place.details}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><span className="font-semibold">Capacity:</span> {place.capacity}</p>
                  <p><span className="font-semibold">Location:</span> {place.location}</p>
                  <p><span className="font-semibold">Status:</span> {place.status}</p>
                  <p><span className="font-semibold">Facilities:</span> {place.facilities.map(f => f.name).join(', ')}</p>
                </div>
                {/* Calendar will go here */}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
