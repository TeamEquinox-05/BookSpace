import React from 'react';
import StatCard from '../ui/StatCard';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

const AdminStatsGrid = ({ stats }) => {
  // Provide default values to prevent undefined errors
  const safeStats = {
    totalPlaces: stats?.totalPlaces || { value: 0 },
    activeBookings: stats?.activeBookings || { value: 0 },
    pendingApprovals: stats?.pendingApprovals || { value: 0 },
    todayBookings: stats?.todayBookings || { value: 0 },
    totalBookings: stats?.totalBookings || { value: 0 },
    rejectedBookings: stats?.rejectedBookings || { value: 0 },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard 
        icon={MapPin} 
        title="Total Venues" 
        value={safeStats.totalPlaces.value} 
      />
      <StatCard 
        icon={CheckCircle} 
        title="Active Bookings" 
        value={safeStats.activeBookings.value} 
      />
      <StatCard 
        icon={Clock} 
        title="Pending Approvals" 
        value={safeStats.pendingApprovals.value} 
      />
      <StatCard 
        icon={Calendar} 
        title="Today's Bookings" 
        value={safeStats.todayBookings.value} 
      />
      <StatCard 
        icon={FileText} 
        title="Total Bookings" 
        value={safeStats.totalBookings.value} 
      />
      <StatCard 
        icon={XCircle} 
        title="Rejected Bookings" 
        value={safeStats.rejectedBookings.value} 
      />
    </div>
  );
};

export default AdminStatsGrid;