import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { API_URL } from '../config/api-config';
import { PageHeader } from '../components/shared';
import { Plus, Edit, Trash2, MapPin, Users, Building2 } from 'lucide-react';
import VenueModal from '../components/admin/VenueModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { TableSkeleton, Badge, EmptyState } from '../components/ui';
import logger from '../utils/logger';

const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${path}`;
};

export default function VenueManagementPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const res = await api.get('/places');
        if (isMounted) {
          setVenues(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          logger.error('Error fetching venues:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVenues();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/places');
      setVenues(res.data);
    } catch (err) {
      setError(err.message);
      logger.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (venueData) => {
    try {
      const method = venueData._id ? 'put' : 'post';
      const url = venueData._id ? `/places/${venueData._id}` : '/places';
      await api[method](url, venueData);

      fetchVenues(); // Refresh the list
      setIsModalOpen(false);
    } catch (err) {
      logger.error('Error saving venue:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/places/${venueToDelete}`);

      fetchVenues(); // Refresh the list
      setIsConfirmModalOpen(false);
      setVenueToDelete(null);
    } catch (err) {
      logger.error('Error deleting venue:', err);
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="Venue Management" subtitle="Manage your venues and spaces" />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
        <TableSkeleton rows={5} cols={5} />
      </main>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="Venue Management" subtitle="Manage your venues and spaces" />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
        <EmptyState
          icon={Building2}
          title="Error Loading Venues"
          description={error}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
          size="lg"
        />
      </main>
    </div>
  );

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Venue Management" subtitle="Manage your venues and spaces" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div 
              className="flex justify-between items-center mb-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">All Venues</h2>
                {!loading && venues.length > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {venues.length} venue{venues.length > 1 ? 's' : ''} total
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedVenue(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus size={20} />
                Add New Venue
              </button>
            </div>

            {!loading && venues.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No Venues Yet"
                description="Get started by adding your first venue."
                actionLabel="Add Venue"
                onAction={() => {
                  setSelectedVenue(null);
                  setIsModalOpen(true);
                }}
                actionIcon={<Plus className="w-4 h-4" />}
                size="lg"
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div 
                  className="hidden md:block bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden"
                >
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#1a1a1a]">
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Venue
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {venues.map((venue, index) => (
                          <tr 
                            key={venue._id}
                            className={`
                              ${index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-slate-50/50 dark:bg-[#0a0a0a]'}
                              hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors
                            `}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {venue.image ? (
                                    <img src={resolveImageUrl(venue.image)} alt={venue.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Building2 size={18} className="text-slate-400 dark:text-zinc-500" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {venue.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Users className="w-4 h-4 text-slate-400" />
                                {venue.capacity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                {venue.location}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={Badge.fromStatus(venue.status)} dot>
                                {venue.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedVenue(venue);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                  title="Edit venue"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setVenueToDelete(venue._id);
                                    setIsConfirmModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title="Delete venue"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div 
                  className="md:hidden grid grid-cols-1 gap-4"
                >
                    {venues.map((venue) => (
                      <div
                        key={venue._id}
                        className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden"
                      >
                        <div className={`h-1 ${venue.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-[70%]">
                              {venue.name}
                            </h3>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setSelectedVenue(venue);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setVenueToDelete(venue._id);
                                  setIsConfirmModalOpen(true);
                                }}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>Capacity: {venue.capacity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{venue.location}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Badge variant={Badge.fromStatus(venue.status)} dot size="sm">
                              {venue.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <>
        <VenueModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          venue={selectedVenue}
        />
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Venue"
          message="Are you sure you want to delete this venue? This action cannot be undone."
        />
      </>
    </>
  );
}