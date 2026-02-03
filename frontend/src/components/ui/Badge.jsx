import React from 'react';

/**
 * Unified Badge component for status indicators and tags
 * 
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info' | 'default'} props.variant - Badge color variant
 * @param {'sm' | 'md'} props.size - Badge size
 * @param {React.ReactNode} props.children - Badge content
 * @param {boolean} props.dot - Show status dot
 */
const Badge = ({
  variant = 'default',
  size = 'sm',
  children,
  dot = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  
  const variantStyles = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  };
  
  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-slate-400',
  };
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};

// Helper function to get badge variant from booking status
Badge.fromStatus = (status) => {
  const statusMap = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    cancelled: 'error',
    active: 'success',
    inactive: 'default',
  };
  return statusMap[status?.toLowerCase()] || 'default';
};

export default Badge;
