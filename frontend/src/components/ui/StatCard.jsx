import React from 'react';

const StatCard = ({ icon: Icon, title, value, change, isLoading = false }) => {
  const getTrendColor = () => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-500 dark:text-zinc-400';
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-slate-200 dark:border-[#1a1a1a] hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">{title}</p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-7 bg-slate-200 dark:bg-[#1a1a1a] rounded-lg w-20 mb-2"></div>
              <div className="h-3.5 bg-slate-200 dark:bg-[#1a1a1a] rounded-lg w-24"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              {change !== undefined && (
                <div className={'flex items-center gap-1.5 text-[13px] mt-1.5 ' + getTrendColor()}>
                  <span className="font-medium">{change > 0 ? '\u25B2' : '\u25BC'} {Math.abs(change)}%</span>
                  <span className="text-slate-400 dark:text-zinc-500">vs last month</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;