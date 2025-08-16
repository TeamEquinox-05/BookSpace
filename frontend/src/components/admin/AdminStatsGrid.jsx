import React from 'react';
import StatCard from '../ui/StatCard';
import { Calendar, MapPin, Users, Clock, TrendingUp, AlertCircle, PieChart } from 'lucide-react';

const AdminStatsGrid = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard icon={MapPin} title="Total Places" value={stats.totalPlaces.value} change={stats.totalPlaces.change} lightColor="bg-blue-500" darkColor="dark:bg-blue-600" />
    <StatCard icon={Calendar} title="Active Bookings" value={stats.activeBookings.value} change={stats.activeBookings.change} lightColor="bg-green-500" darkColor="dark:bg-green-600" />
    <StatCard icon={Clock} title="Pending Approvals" value={stats.pendingApprovals.value} change={stats.pendingApprovals.change} lightColor="bg-yellow-500" darkColor="dark:bg-yellow-600" />
    <StatCard icon={Users} title="Today's Bookings" value={stats.todayBookings.value} change={stats.todayBookings.change} lightColor="bg-purple-500" darkColor="dark:bg-purple-600" />
    <StatCard icon={TrendingUp} title="Monthly Growth" value={stats.monthlyGrowth.value} change={stats.monthlyGrowth.change} lightColor="bg-indigo-500" darkColor="dark:bg-indigo-600"/>
    <StatCard icon={PieChart} title="Utilization Rate" value={stats.utilizationRate.value} change={stats.utilizationRate.change} lightColor="bg-teal-500" darkColor="dark:bg-teal-600" />
    <StatCard icon={AlertCircle} title="Issues Reported" value={stats.issuesReported.value} change={stats.issuesReported.change} lightColor="bg-red-500" darkColor="dark:bg-red-600" />
  </div>
);

export default AdminStatsGrid;