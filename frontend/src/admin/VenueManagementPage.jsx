import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PageHeader } from '../components/shared';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import VenueModal from '../components/admin/VenueModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import TableSkeleton from '../components/ui/TableSkeleton';
export default function VenueManagementPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/places');
      setVenues(res.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching venues:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (venueData) => {
    try {
      const method = venueData._id ? 'put' : 'post';
      const url = venueData._id ? `/places/${venueData._id}` : '/places';
      await axios[method](url, venueData);

      fetchVenues(); // Refresh the list
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving venue:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/places/${venueToDelete}`);

      fetchVenues(); // Refresh the list
      setIsConfirmModalOpen(false);
      setVenueToDelete(null);
    } catch (err) {
      console.error("Error deleting venue:", err);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Venue Management" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Venues</h2>
            <button onClick={() => { setSelectedVenue(null); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
              <Plus size={20} className="mr-2" />
              Add New Venue
            </button>
          </div>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {venues.map((venue) => (
                    <tr key={venue._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{venue.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{venue.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{venue.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{venue.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => { setSelectedVenue(venue); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={20} /></button>
                        <button onClick={() => { setVenueToDelete(venue._id); setIsConfirmModalOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      <VenueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} venue={selectedVenue} />
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Venue"
        message="Are you sure you want to delete this venue? This action cannot be undone."
      />
    </>
  );
}
