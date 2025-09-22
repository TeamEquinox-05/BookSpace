import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Spinner = ({ size = 'md', color, centered = true }) => {
  const { darkMode } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinnerColorClass = color ? `border-${color}-500` : (darkMode ? 'border-white' : 'border-blue-500');

  const containerClasses = centered 
    ? 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20'
    : 'flex justify-center items-center';

  return (
    <div className={containerClasses}>
      <div className={`animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${sizeClasses[size]} ${spinnerColorClass}`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;
