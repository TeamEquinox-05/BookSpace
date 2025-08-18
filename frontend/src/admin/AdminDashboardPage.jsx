import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import components from their organized barrel files
import { PageHeader } from '../components/shared';
import { AdminStatsGrid } from '../components/admin';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { Spinner } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPlaces: { value: 0, change: '' },
    activeBookings: { value: 0, change: '' },
    pendingApprovals: { value: 0, change: '' },
    todayBookings: { value: 0, change: '' },
    monthlyGrowth: { value: '0%', change: '' },
    utilizationRate: { value: '0%', change: '' },
    issuesReported: { value: 0, change: '' },
  });
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, placesRes, chartRes] = await Promise.all([
          axios.get('/stats'),
          axios.get('/places'),
          axios.get('/stats/bookings-by-month'),
        ]);

        setStats(statsRes.data);
        setAvailablePlaces(placesRes.data);
        setChartData(chartRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Admin Dashboard" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <AvailablePlacesGrid places={availablePlaces} role={user?.role} />
              <AdminStatsGrid stats={stats} />
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Bookings per Month</h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {availablePlaces.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No Venues to Display</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Add a new venue to get started.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
