import React from 'react';

const FormSkeleton = () => {
  const SkeletonField = () => (
    <div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
    </div>
  );

  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
        <div className="mt-6 text-right">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded inline-block"></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonField />
          <SkeletonField />
        </div>
        <div className="mt-6 text-right">
          <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded inline-block"></div>
        </div>
      </div>
    </div>
  );
};

export default FormSkeleton;
