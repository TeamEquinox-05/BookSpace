import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, title, value, change, color = 'bg-blue-500', isLoading = false }) => {
  const getTrendColor = () => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-slate-500 dark:text-slate-400';
  };

  return (
    <motion.div 
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group"
      whileHover={{ 
        y: -8, 
        shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        scale: 1.02 
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {title}
          </p>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-9 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-24"></div>
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded w-20"></div>
            </div>
          ) : (
            <>
              <motion.p 
                className="text-3xl font-bold text-slate-800 dark:text-white mb-2"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </motion.p>
              {change !== undefined && (
                <motion.div 
                  className={`flex items-center space-x-2 text-sm ${getTrendColor()}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    change > 0 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {change > 0 ? '↗' : '↘'} {Math.abs(change)}%
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">vs last month</span>
                </motion.div>
              )}
            </>
          )}
        </div>
        <motion.div 
          className={`p-4 rounded-xl ${color} text-white shadow-lg group-hover:shadow-xl`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon size={24} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatCard;