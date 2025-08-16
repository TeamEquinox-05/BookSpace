import React from 'react';

const DetailViewSkeleton = () => {
  const SkeletonLine = ({ width }) => (
    <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${width}`}></div>
  );

  return (
    <div className="animate-pulse max-w-4xl mx-auto">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-5/6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <SkeletonLine width="w-1/3" />
              <SkeletonLine width="w-2/3" />
            </div>
            <div className="space-y-2">
              <SkeletonLine width="w-1/3" />
              <SkeletonLine width="w-1/2" />
            </div>
            <div className="space-y-2">
              <SkeletonLine width="w-1/3" />
              <SkeletonLine width="w-1/4" />
            </div>
            <div className="space-y-2">
              <SkeletonLine width="w-1/3" />
              <SkeletonLine width="w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailViewSkeleton;
