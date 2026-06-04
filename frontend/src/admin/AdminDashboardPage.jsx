import React, { useState, useEffect } from 'react';
import api from '../utils/api';

import { PageHeader } from '../components/shared';
import { AdminStatsGrid } from '../components/admin';
import AvailablePlacesGrid from '../components/shared/AvailablePlacesGrid';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] rounded-xl shadow-2xl p-4 min-w-[150px] backdrop-blur-sm">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{payload[0].value}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">bookings</span>
        </div>
      </div>
    );
  }
  return null;
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
      const [statsResult, placesResult, chartResult] = await Promise.allSettled([
        api.get('/stats'),
        api.get('/places'),
        api.get('/stats/bookings-by-month'),
      ]);
      if (statsResult.status === 'fulfilled') setStats(statsResult.value.data);
      if (placesResult.status === 'fulfilled') setAvailablePlaces(placesResult.value.data);
      if (chartResult.status === 'fulfilled') setChartData(chartResult.value.data);
      if ([statsResult, placesResult, chartResult].some(r => r.status === 'rejected'))
        setError('Some dashboard data failed to load.');
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const totalChartBookings = chartData.reduce((sum, item) => sum + (item.bookings || 0), 0);
  const avgBookings = chartData.length > 0 ? (totalChartBookings / chartData.filter(m => m.bookings > 0).length || 1) : 0;
  const maxBookings = chartData.length > 0 ? Math.max(...chartData.map(item => item.bookings || 0)) : 0;

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Admin Dashboard" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
          {loading ? (
            <CardGridSkeleton count={8} />
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <AvailablePlacesGrid places={availablePlaces} role={user?.role} />
              <AdminStatsGrid stats={stats} />

              {/* Chart Section */}
              <div className="mt-6">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1a1a1a]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bookings Overview</h3>
                          <p className="text-sm text-slate-400 dark:text-slate-500">Monthly booking statistics for {new Date().getFullYear()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-[#111] px-4 py-2.5 rounded-xl border border-slate-100 dark:border-[#222]">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{totalChartBookings}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                            <ArrowUpRight className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-wider">Avg</p>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{avgBookings.toFixed(1)}/mo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="p-6 pt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="25%">
                          <defs>
                            <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="barGradientDefault" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={darkMode ? '#64748b' : '#94a3b8'} stopOpacity={0.9} />
                              <stop offset="100%" stopColor={darkMode ? '#475569' : '#64748b'} stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 500 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 12 }}
                            dx={-5}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip darkMode={darkMode} />} cursor={{ fill: darkMode ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.12)', radius: 8 }} />
                          <Bar dataKey="bookings" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.bookings === maxBookings && maxBookings > 0 ? 'url(#barGradientActive)' : 'url(#barGradientDefault)'}
                                className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-500">
                        <div className="p-4 bg-slate-100 dark:bg-[#111] rounded-2xl mb-4">
                          <BarChart3 className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">No booking data available</p>
                        <p className="text-xs mt-1 text-slate-300 dark:text-zinc-600">Bookings will appear here once created</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {availablePlaces.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
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
