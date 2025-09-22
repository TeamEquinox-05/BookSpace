import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Spinner = ({ size = 'md', color, centered = true, text = "Loading" }) => {
  const { darkMode } = useTheme();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClass = color === 'white' ? 'text-white' : 
                      color ? `text-${color}-500` : 
                      (darkMode ? 'text-white' : 'text-blue-600');

  const containerClasses = centered 
    ? 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20'
    : 'inline-flex justify-center items-center w-full';

  return (
    <div className={containerClasses}>
      <div className={`inline-flex items-center ${sizeClasses[size]} ${textColorClass}`} role="status">
        <span className="font-medium">{text}</span>
        <div className="ml-1 inline-flex">
          <span className="ellipsis-dot">.</span>
          <span className="ellipsis-dot">.</span>
          <span className="ellipsis-dot">.</span>
        </div>
      </div>
    </div>
  );
};

export default Spinner;
