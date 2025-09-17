import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import moment from 'moment';
import { PageHeader } from '../components/shared';
import { Spinner, TableSkeleton } from '../components/ui';
import { ShieldX, Download, FileText, FileType, FileJson } from 'lucide-react';

const FilterControls = ({ places, filters, setFilters }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', placeId: '', date: '' });
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="w-full">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="place-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place</label>
          <select
            id="place-filter"
            name="placeId"
            value={filters.placeId}
            onChange={handleInputChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Places</option>
            {places.map(place => (
              <option key={place._id} value={place._id}>{place.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            id="date-filter"
            name="date"
            value={filters.date}
            onChange={handleInputChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="w-full flex items-end">
          <button
            onClick={clearFilters}
            className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

const DownloadReport = ({ filters, sortConfig, disabled }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCSV = async () => {
    setIsDownloading(true);
    // This is a simplified CSV generation. For a real app, a library like papaparse would be better.
    const headers = ['Event', 'Place', 'User', 'Start Time', 'Status'];
    const query = new URLSearchParams({
      ...filters,
      sortKey: sortConfig.key,
      sortDirection: sortConfig.direction,
    }).toString();
    const response = await axios.get(`/bookings?${query}`);
    const bookings = response.data;

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    bookings.forEach(b => {
      const row = [
        `"${b.eventTitle}"`, // Corrected: escaped quotes within template literals
        `"${b.placeId?.name || 'N/A'}"`, // Corrected: escaped quotes within template literals
        `"${b.userId?.name || 'N/A'}"`, // Corrected: escaped quotes within template literals
        `"${moment(b.eventStartTime).format('YYYY-MM-DD HH:mm')}"`, // Corrected: escaped quotes within template literals
        `"${b.status}"` // Corrected: escaped quotes within template literals
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
    setIsDownloading(false);
  };

  const downloadFromServer = async (format) => {
    setIsDownloading(true);
    try {
      const query = new URLSearchParams({
        format,
        ...filters,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      }).toString();

      const response = await axios.get(`/bookings/report?${query}`, {
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
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="group">
        <button
          type="button"
          disabled={disabled || isDownloading}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <><Spinner size="sm" className="mr-2" /> Downloading...</>
          ) : (
            <><Download className="mr-2 h-5 w-5" /> Download Report</>
          )}
        </button>
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <a href="#" onClick={() => downloadCSV()} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
              <FileJson className="mr-3 h-5 w-5" /> Download as CSV
            </a>
            <a href="#" onClick={() => downloadFromServer('pdf')} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
              <FileType className="mr-3 h-5 w-5" /> Download as PDF
            </a>
            <a href="#" onClick={() => downloadFromServer('docx')} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
              <FileText className="mr-3 h-5 w-5" /> Download as DOCX
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'eventStartTime', direction: 'descending' });
  const [filters, setFilters] = useState({ status: '', placeId: '', date: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, placesRes] = await Promise.all([
          axios.get('/bookings'),
          axios.get('/places')
        ]);
        setBookings(bookingsRes.data);
        setPlaces(placesRes.data);
      } catch (err) {
        setError('Failed to fetch data. You might not have the required permissions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedBookings = useMemo(() => {
    let filteredItems = [...bookings];

    if (filters.status) {
      filteredItems = filteredItems.filter(item => item.status === filters.status);
    }
    if (filters.placeId) {
      filteredItems = filteredItems.filter(item => item.placeId?._id === filters.placeId);
    }
    if (filters.date) {
      filteredItems = filteredItems.filter(item => moment(item.eventStartTime).isSame(filters.date, 'day'));
    }

    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
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
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const renderContent = () => {
    if (loading) return <TableSkeleton rows={10} columns={5} />;
    if (error) return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <ShieldX className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">An Error Occurred</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
    if (bookings.length === 0) return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No Bookings Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">There are currently no bookings in the system.</p>
      </div>
    );

    return (
      <>
        <FilterControls places={places} filters={filters} setFilters={setFilters} />
        <div className="p-4 flex justify-end">
          <DownloadReport filters={filters} sortConfig={sortConfig} disabled={filteredAndSortedBookings.length === 0} />
        </div>
        {filteredAndSortedBookings.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No Bookings Match Filters</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Try adjusting or clearing the filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('eventTitle')}>
                    Event{getSortIndicator('eventTitle')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('placeId.name')}>
                    Place{getSortIndicator('placeId.name')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('userId.name')}>
                    User{getSortIndicator('userId.name')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('eventStartTime')}>
                    Start Time{getSortIndicator('eventStartTime')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('status')}>
                    Status{getSortIndicator('status')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{booking.eventTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.placeId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.userId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{moment(booking.eventStartTime).format('YYYY-MM-DD HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AllBookingsPage;