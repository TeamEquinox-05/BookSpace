import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';

// Import components from their organized barrel files
import { PageHeader } from '../components/shared';
import { AdminStatsGrid } from '../components/admin';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { Spinner } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 min-w-[140px]">
        <p className="text-sm font-semibold text-slate-800 dark:text-white mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">Bookings:</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Legend Component
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex justify-center items-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState({
    totalPlaces: { value: 0 },
    activeBookings: { value: 0 },
    pendingApprovals: { value: 0 },
    todayBookings: { value: 0 },
    totalBookings: { value: 0 },
    rejectedBookings: { value: 0 },
  });
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, placesRes, chartRes] = await Promise.all([
          api.get('/stats'),
          api.get('/places'),
          api.get('/stats/bookings-by-month'),
        ]);

        setStats(statsRes.data);
        setAvailablePlaces(placesRes.data);
        setChartData(chartRes.data);
      } catch (error) {
        logger.error('Error fetching dashboard data:', error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate total bookings for the chart summary
  const totalChartBookings = chartData.reduce((sum, item) => sum + (item.bookings || 0), 0);
  const avgBookings = chartData.length > 0 ? Math.round(totalChartBookings / chartData.length) : 0;
  const maxBookings = chartData.length > 0 ? Math.max(...chartData.map(item => item.bookings || 0)) : 0;

  // Colors for bars - highlight the max value
  const getBarColor = (value) => {
    if (value === maxBookings && maxBookings > 0) return '#3b82f6'; // Blue for max
    return darkMode ? '#64748b' : '#94a3b8'; // Slate for others
  };

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
              
              {/* Improved Chart Section */}
              <div className="mt-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                  {/* Chart Header */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Bookings Overview</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Monthly booking statistics</p>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{totalChartBookings}</p>
                          </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Average</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{avgBookings}/mo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart Body */}
                  <div className="p-6">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart 
                          data={chartData} 
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                          barCategoryGap="20%"
                        >
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={darkMode ? '#334155' : '#e2e8f0'} 
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                              fill: darkMode ? '#94a3b8' : '#64748b', 
                              fontSize: 12,
                              fontWeight: 500
                            }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                              fill: darkMode ? '#94a3b8' : '#64748b', 
                              fontSize: 12 
                            }}
                            dx={-10}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            content={<CustomTooltip />}
                            cursor={{ fill: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)', radius: 8 }}
                          />
                          <Legend content={<CustomLegend />} />
                          <Bar 
                            dataKey="bookings" 
                            radius={[8, 8, 0, 0]}
                            maxBarSize={60}
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getBarColor(entry.bookings)}
                                className="transition-all duration-300 hover:opacity-80"
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                        <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm font-medium">No booking data available</p>
                        <p className="text-xs mt-1">Bookings will appear here once created</p>
                      </div>
                    )}
                  </div>
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
