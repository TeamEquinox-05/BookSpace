import React from 'react';

const CardSkeleton = () => (
  <div className="animate-pulse bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-[#1a1a1a]">
    <div className="flex items-center justify-between mb-3">
      <div className="h-5 bg-slate-200 dark:bg-[#1a1a1a] rounded w-2/3"></div>
      <div className="h-5 bg-slate-200 dark:bg-[#1a1a1a] rounded w-1/4"></div>
    </div>
    <div className="h-4 bg-slate-200 dark:bg-[#1a1a1a] rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-slate-200 dark:bg-[#1a1a1a] rounded w-1/3 mb-3"></div>
    <div className="border-t border-slate-200 dark:border-[#1a1a1a] pt-3">
      <div className="h-4 bg-slate-200 dark:bg-[#1a1a1a] rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-200 dark:bg-[#1a1a1a] rounded w-full"></div>
    </div>
  </div>
);

const CardGridSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
};

export default CardGridSkeleton;
