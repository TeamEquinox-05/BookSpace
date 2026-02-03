import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCell = ({ width = 'w-3/4', delay = 0 }) => (
  <td className="px-6 py-4 whitespace-nowrap">
    <motion.div 
      className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${width}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: delay * 0.1 
      }}
    />
  </td>
);

const SkeletonRow = ({ index, columns, showActions = true }) => (
  <motion.tr 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    {columns.map((col, i) => (
      <SkeletonCell key={i} width={col.width} delay={index + i} />
    ))}
    {showActions && (
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-3">
          <motion.div 
            className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
          />
          <motion.div 
            className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 + 0.1 }}
          />
        </div>
      </td>
    )}
  </motion.tr>
);

// Default column widths for variety
const defaultColumnWidths = ['w-3/4', 'w-1/2', 'w-24', 'w-32', 'w-20', 'w-28', 'w-16'];

const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  showActions = true,
  showHeader = true,
  showPagination = true,
}) => {
  // Handle both number and array for columns
  const columnConfig = typeof columns === 'number'
    ? Array.from({ length: columns }, (_, i) => ({ 
        width: defaultColumnWidths[i % defaultColumnWidths.length] 
      }))
    : columns;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header Skeleton */}
      {showHeader && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <motion.div 
              className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-28"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {columnConfig.map((col, i) => (
                <th key={i} scope="col" className="px-6 py-3 text-left">
                  <motion.div 
                    className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-20"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                  />
                </th>
              ))}
              {showActions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {[...Array(rows)].map((_, i) => (
              <SkeletonRow key={i} index={i} columns={columnConfig} showActions={showActions} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <motion.div 
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex gap-2">
              {[1, 2, 3].map((_, i) => (
                <motion.div 
                  key={i}
                  className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSkeleton;
