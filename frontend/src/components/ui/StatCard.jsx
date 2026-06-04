import React from 'react';

const StatCard = ({ icon: Icon, title, value, bg, text, isLoading = false }) => {
  return (
    <div className="group bg-white dark:bg-[#0a0a0a] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1a1a1a] hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className={`${bg} p-2.5 rounded-xl ${text} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-7 bg-slate-200 dark:bg-[#1a1a1a] rounded-lg w-16"></div>
          <div className="h-3 bg-slate-200 dark:bg-[#1a1a1a] rounded-lg w-20"></div>
        </div>
      ) : (
        <>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
            {title}
          </p>
        </>
      )}
    </div>
  );
};

export default StatCard;
