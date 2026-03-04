import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { PageHeader } from '../components/shared';
import { Plus, Edit, Trash2, MapPin, Users, Building2 } from 'lucide-react';
import VenueModal from '../components/admin/VenueModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { TableSkeleton, Badge, EmptyState } from '../components/ui';
import logger from '../utils/logger';

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
            <motion.div 
              className="flex justify-between items-center mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">All Venues</h2>
                {!loading && venues.length > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {venues.length} venue{venues.length > 1 ? 's' : ''} total
                  </p>
                )}
              </div>
              <motion.button
                onClick={() => {
                  setSelectedVenue(null);
                  setIsModalOpen(true);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus size={20} />
                Add New Venue
              </motion.button>
            </motion.div>

            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : venues.length === 0 ? (
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
                <motion.div 
                  className="hidden md:block bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#1a1a1a]">
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Name
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
                      <AnimatePresence>
                        {venues.map((venue, index) => (
                          <motion.tr 
                            key={venue._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`
                              ${index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-slate-50/50 dark:bg-[#0a0a0a]'}
                              hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors
                            `}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {venue.name}
                              </span>
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
                                <motion.button
                                  onClick={() => {
                                    setSelectedVenue(venue);
                                    setIsModalOpen(true);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                  title="Edit venue"
                                >
                                  <Edit size={18} />
                                </motion.button>
                                <motion.button
                                  onClick={() => {
                                    setVenueToDelete(venue._id);
                                    setIsConfirmModalOpen(true);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title="Delete venue"
                                >
                                  <Trash2 size={18} />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </motion.div>

                {/* Mobile Card View */}
                <motion.div 
                  className="md:hidden grid grid-cols-1 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05 }
                    }
                  }}
                >
                  <AnimatePresence>
                    {venues.map((venue) => (
                      <motion.div
                        key={venue._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden"
                      >
                        <div className={`h-1 ${venue.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-[70%]">
                              {venue.name}
                            </h3>
                            <div className="flex gap-1">
                              <motion.button
                                onClick={() => {
                                  setSelectedVenue(venue);
                                  setIsModalOpen(true);
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Edit size={18} />
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setVenueToDelete(venue._id);
                                  setIsConfirmModalOpen(true);
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <Trash2 size={18} />
                              </motion.button>
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
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