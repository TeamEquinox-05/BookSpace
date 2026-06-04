import React from 'react';
import StatCard from '../ui/StatCard';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

const AdminStatsGrid = ({ stats }) => {
  const safeStats = {
    totalPlaces: stats?.totalPlaces || { value: 0 },
    activeBookings: stats?.activeBookings || { value: 0 },
    pendingApprovals: stats?.pendingApprovals || { value: 0 },
    todayBookings: stats?.todayBookings || { value: 0 },
    totalBookings: stats?.totalBookings || { value: 0 },
    rejectedBookings: stats?.rejectedBookings || { value: 0 },
  };

  const cards = [
    { icon: MapPin, title: 'Total Venues', value: safeStats.totalPlaces.value, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400' },
    { icon: CheckCircle, title: 'Active Bookings', value: safeStats.activeBookings.value, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { icon: Clock, title: 'Pending Approvals', value: safeStats.pendingApprovals.value, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
    { icon: Calendar, title: "Today's Bookings", value: safeStats.todayBookings.value, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400' },
    { icon: FileText, title: 'Total Bookings', value: safeStats.totalBookings.value, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-600 dark:text-cyan-400' },
    { icon: XCircle, title: 'Rejected', value: safeStats.rejectedBookings.value, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
};

export default AdminStatsGrid;