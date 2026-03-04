import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import moment from 'moment';
import { PageHeader } from '../components/shared';
import { Spinner, TableSkeleton, Badge, EmptyState } from '../components/ui';
import { ShieldX, Download, FileText, FileType, FileJson, Calendar, Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import logger from '../utils/logger';

const FilterControls = ({ places, filters, setFilters }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', placeId: '', dateFrom: '', dateTo: '', search: '' });
  };

  const setDatePreset = (preset) => {
    let dateFrom = '';
    let dateTo = '';

    switch(preset) {
      case 'today':
        dateFrom = moment().format('YYYY-MM-DD');
        dateTo = moment().format('YYYY-MM-DD');
        break;
      case 'week':
        dateFrom = moment().startOf('week').format('YYYY-MM-DD');
        dateTo = moment().endOf('week').format('YYYY-MM-DD');
        break;
      case 'month':
        dateFrom = moment().startOf('month').format('YYYY-MM-DD');
        dateTo = moment().endOf('month').format('YYYY-MM-DD');
        break;
      case 'last30':
        dateFrom = moment().subtract(30, 'days').format('YYYY-MM-DD');
        dateTo = moment().format('YYYY-MM-DD');
        break;
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  };

  // Count active filters - date range counts as 1 filter, not 2
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.placeId) count++;
    // Count date range as a single filter if either is set
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();

  const DatePresetButton = ({ onClick, children }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
    >
      <Calendar className="w-3 h-3" />
      {children}
    </motion.button>
  );

  return (
    <div className="p-5 bg-slate-50 dark:bg-[#0a0a0a] rounded-t-xl border-b border-slate-200 dark:border-[#1a1a1a]">
      {/* Header with Quick Date Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick filters:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <DatePresetButton onClick={() => setDatePreset('today')}>Today</DatePresetButton>
          <DatePresetButton onClick={() => setDatePreset('week')}>This Week</DatePresetButton>
          <DatePresetButton onClick={() => setDatePreset('month')}>This Month</DatePresetButton>
          <DatePresetButton onClick={() => setDatePreset('last30')}>Last 30 Days</DatePresetButton>
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search Box */}
        <div className="w-full xl:col-span-2">
          <label htmlFor="search-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="search-filter"
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              placeholder="Event, user, or ID..."
              className="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full">
          <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white transition-all"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Place Filter */}
        <div className="w-full">
          <label htmlFor="place-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Place</label>
          <select
            id="place-filter"
            name="placeId"
            value={filters.placeId}
            onChange={handleInputChange}
            className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white transition-all"
          >
            <option value="">All Places</option>
            {places.map(place => (
              <option key={place._id} value={place._id}>{place.name}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="w-full">
          <label htmlFor="date-from-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From Date</label>
          <input
            type="date"
            id="date-from-filter"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleInputChange}
            className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white transition-all"
          />
        </div>

        {/* Date To */}}
        <div className="w-full">
          <label htmlFor="date-to-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To Date</label>
          <input
            type="date"
            id="date-to-filter"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleInputChange}
            className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Clear Filters Button */}}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-lg hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              Clear All Filters
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DownloadReport = ({ filters, sortConfig, disabled }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const downloadCSV = async () => {
    setIsDownloading(true);
    setIsOpen(false);
    try {
      // This is a simplified CSV generation. For a real app, a library like papaparse would be better.
      const headers = ['Event', 'Place', 'User', 'Start Time', 'End Time', 'Duration', 'Status'];
      const query = new URLSearchParams({
        ...filters,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      }).toString();
      const response = await api.get(`/bookings?${query}`);
      const bookings = response.data;

      let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
      bookings.forEach(b => {
        const duration = moment.duration(moment(b.eventEndTime).diff(moment(b.eventStartTime)));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const row = [
          `"${b.eventTitle}"`,
          `"${b.placeId?.name || 'N/A'}"`,
          `"${b.userId?.name || 'N/A'}"`,
          `"${moment(b.eventStartTime).format('YYYY-MM-DD HH:mm')}"`,
          `"${moment(b.eventEndTime).format('YYYY-MM-DD HH:mm')}"`,
          `"${durationText}"`,
          `"${b.status}"`
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "bookings-report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logger.error('CSV download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadFromServer = async (format) => {
    setIsDownloading(true);
    setIsOpen(false);
    try {
      const query = new URLSearchParams({
        format,
        ...filters,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      }).toString();

      const response = await api.get(`/bookings/report?${query}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logger.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.download-report-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left download-report-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isDownloading}
        className="inline-flex justify-center w-full rounded-md border border-slate-300 dark:border-[#2a2a2a] shadow-sm px-4 py-2 bg-white dark:bg-[#1a1a1a] text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <><Spinner size="sm" className="mr-2" /> Downloading...</>
        ) : (
          <><Download className="mr-2 h-5 w-5" /> Download Report</>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-[#1a1a1a] ring-1 ring-black ring-opacity-5 dark:ring-[#2a2a2a] z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button 
              onClick={() => downloadCSV()} 
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" 
              role="menuitem"
            >
              <FileJson className="mr-3 h-5 w-5" /> Download as CSV
            </button>
            <button 
              onClick={() => downloadFromServer('pdf')} 
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" 
              role="menuitem"
            >
              <FileType className="mr-3 h-5 w-5" /> Download as PDF
            </button>
            <button 
              onClick={() => downloadFromServer('docx')} 
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" 
              role="menuitem"
            >
              <FileText className="mr-3 h-5 w-5" /> Download as DOCX
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'eventStartTime', direction: 'descending' });
  const [filters, setFilters] = useState({ status: '', placeId: '', dateFrom: '', dateTo: '', search: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, placesRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/places')
        ]);
        setBookings(bookingsRes.data);
        setPlaces(placesRes.data);
      } catch (err) {
        setError('Failed to fetch data. You might not have the required permissions.');
        logger.error('Error fetching bookings data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedBookings = useMemo(() => {
    let filteredItems = [...bookings];

    // Status filter
    if (filters.status) {
      filteredItems = filteredItems.filter(item => item.status === filters.status);
    }

    // Place filter
    if (filters.placeId) {
      filteredItems = filteredItems.filter(item => item.placeId?._id === filters.placeId);
    }

    // Date range filter
    if (filters.dateFrom) {
      filteredItems = filteredItems.filter(item => 
        moment(item.eventStartTime).isSameOrAfter(filters.dateFrom, 'day')
      );
    }
    if (filters.dateTo) {
      filteredItems = filteredItems.filter(item => 
        moment(item.eventStartTime).isSameOrBefore(filters.dateTo, 'day')
      );
    }

    // Search filter (event title, user name, or booking ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.eventTitle?.toLowerCase().includes(searchLower) ||
        item.userId?.name?.toLowerCase().includes(searchLower) ||
        item.userId?.email?.toLowerCase().includes(searchLower) ||
        item._id?.toLowerCase().includes(searchLower)
      );
    }

    // Helper function to get nested property value
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredItems;
  }, [bookings, sortConfig, filters]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-400 ml-1 inline" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="w-4 h-4 text-blue-500 ml-1 inline" />
      : <ChevronDown className="w-4 h-4 text-blue-500 ml-1 inline" />;
  };

  const renderContent = () => {
    if (loading) return <TableSkeleton rows={10} columns={7} />;
    if (error) return (
      <EmptyState
        icon={ShieldX}
        title="An Error Occurred"
        description={error}
        size="lg"
        className="py-16"
      />
    );
    if (bookings.length === 0) return (
      <EmptyState
        title="No Bookings Found"
        description="There are currently no bookings in the system."
        size="lg"
        className="py-16"
      />
    );

    return (
      <>
        <FilterControls places={places} filters={filters} setFilters={setFilters} />
        <div className="px-5 py-3 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#1a1a1a] flex justify-between items-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredAndSortedBookings.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{bookings.length}</span> bookings
          </div>
          <DownloadReport filters={filters} sortConfig={sortConfig} disabled={filteredAndSortedBookings.length === 0} />
        </div>
        {filteredAndSortedBookings.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Bookings Match Filters"
            description="Try adjusting or clearing the filters to see more results."
            size="md"
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#1a1a1a]">
                  {[
                    { key: 'eventTitle', label: 'Event' },
                    { key: 'placeId.name', label: 'Place' },
                    { key: 'userId.name', label: 'User' },
                    { key: 'eventStartTime', label: 'Start Time' },
                    { key: 'eventEndTime', label: 'End Time' },
                    { key: null, label: 'Duration' },
                    { key: 'status', label: 'Status' },
                  ].map(({ key, label }) => (
                    <th 
                      key={label}
                      scope="col" 
                      className={`px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none' : ''}`}
                      onClick={key ? () => requestSort(key) : undefined}
                    >
                      <span className="inline-flex items-center">
                        {label}
                        {key && getSortIndicator(key)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                <AnimatePresence>
                  {filteredAndSortedBookings.map((booking, index) => {
                    const duration = moment.duration(moment(booking.eventEndTime).diff(moment(booking.eventStartTime)));
                    const hours = Math.floor(duration.asHours());
                    const minutes = duration.minutes();
                    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    
                    return (
                      <motion.tr 
                        key={booking._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={`
                          ${index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-slate-50/50 dark:bg-[#0a0a0a]'}
                          hover:bg-blue-50/50 dark:hover:bg-blue-900/10 
                          transition-colors cursor-pointer
                        `}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {booking.eventTitle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {booking.placeId?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {booking.userId?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {moment(booking.eventStartTime).format('MMM DD, HH:mm')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {moment(booking.eventEndTime).format('MMM DD, HH:mm')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                            {durationText}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={Badge.fromStatus(booking.status)} dot>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="All Bookings" subtitle="View and manage all bookings in the system" />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AllBookingsPage;