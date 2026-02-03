import React from 'react';
import { motion } from 'framer-motion';

/**
 * Unified Card component for consistent card styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.animate - Enable entrance animation
 * @param {'sm' | 'md' | 'lg'} props.padding - Padding size
 */
const Card = ({
  children,
  className = '',
  hover = false,
  animate = false,
  padding = 'md',
  onClick,
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const baseStyles = `
    bg-white dark:bg-slate-800 
    rounded-2xl 
    shadow-sm 
    border border-slate-100 dark:border-slate-700
  `;
  
  const hoverStyles = hover 
    ? 'hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer' 
    : '';
  
  const combinedClassName = `${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`.trim();
  
  if (animate) {
    return (
      <motion.div
        className={combinedClassName}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={combinedClassName} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

// Card Header sub-component
Card.Header = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

// Card Body sub-component
Card.Body = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer sub-component
Card.Footer = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export default Card;
