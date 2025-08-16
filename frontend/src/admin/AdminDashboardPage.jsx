import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import components from their organized barrel files
import { PageHeader } from '../components/shared';
import { AdminStatsGrid } from '../components/admin';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, placesRes] = await Promise.all([
          axios.get('/stats'),
          axios.get('/places'),
        ]);

        setStats(statsRes.data);
        setAvailablePlaces(placesRes.data);
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
            <>
              <CardGridSkeleton />
              <AdminStatsGrid stats={stats} />
            </>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <AvailablePlacesGrid places={availablePlaces} role={user?.role} />
              <AdminStatsGrid stats={stats} />
              {availablePlaces.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No available places to display.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
