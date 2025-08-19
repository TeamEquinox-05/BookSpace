import React from 'react';
import { Plus, CheckCircle, BarChart3, Settings } from 'lucide-react';

const AdminQuickActions = () => (
  <div className="mt-8">
    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ActionCard icon={Plus} text="Add New Place" color="blue" />
      <ActionCard icon={CheckCircle} text="Approve Bookings" color="green" />
      <ActionCard icon={BarChart3} text="View Analytics" color="purple" />
      <ActionCard icon={Settings} text="Manage Settings" color="slate" />
    </div>
  </div>
);

const ActionCard = ({ icon: Icon, text, color }) => {
  const colors = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    slate: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
  }
  return (
    <button className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 dark:border-slate-700">
      <div className={`p-3 rounded-full ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <span className="font-semibold text-slate-700 dark:text-white">{text}</span>
    </button>
  );
};

export default AdminQuickActions;