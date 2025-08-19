import React from 'react';

const StatCard = ({ icon: Icon, title, value, change, color = 'bg-blue-500', isLoading = false }) => {
  const getTrendColor = () => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-slate-500 dark:text-slate-400';
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            {title}
          </p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {change !== undefined && (
                <div className={`flex items-center space-x-1 text-sm mt-1 ${getTrendColor()}`}>
                  <span>{change > 0 ? '▲' : '▼'} {Math.abs(change)}%</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">vs last month</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} text-white shadow-lg`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;