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
        lightColor="bg-blue-500" 
        darkColor="dark:bg-blue-600" 
      />
      <StatCard 
        icon={CheckCircle} 
        title="Active Bookings" 
        value={safeStats.activeBookings.value} 
        lightColor="bg-green-500" 
        darkColor="dark:bg-green-600" 
      />
      <StatCard 
        icon={Clock} 
        title="Pending Approvals" 
        value={safeStats.pendingApprovals.value} 
        lightColor="bg-yellow-500" 
        darkColor="dark:bg-yellow-600" 
      />
      <StatCard 
        icon={Calendar} 
        title="Today's Bookings" 
        value={safeStats.todayBookings.value} 
        lightColor="bg-purple-500" 
        darkColor="dark:bg-purple-600" 
      />
      <StatCard 
        icon={FileText} 
        title="Total Bookings" 
        value={safeStats.totalBookings.value} 
        lightColor="bg-indigo-500" 
        darkColor="dark:bg-indigo-600"
      />
      <StatCard 
        icon={XCircle} 
        title="Rejected Bookings" 
        value={safeStats.rejectedBookings.value} 
        lightColor="bg-red-500" 
        darkColor="dark:bg-red-600" 
      />
    </div>
  );
};

export default AdminStatsGrid;