import React from 'react';

/**
 * Unified Card component for consistent card styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effects
 * @param {'sm' | 'md' | 'lg'} props.padding - Padding size
 */
const Card = ({
  children,
  className = '',
  hover = false,
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
    bg-white dark:bg-[#0a0a0a] 
    rounded-2xl 
    shadow-sm 
    border border-slate-200 dark:border-[#1a1a1a]
  `;
  
  const hoverStyles = hover 
    ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer' 
    : '';
  
  const combinedClassName = `${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`.trim();
  
  return (
    <div className={combinedClassName} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

// Card Header sub-component
Card.Header = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-b border-slate-200 dark:border-[#1a1a1a] ${className}`} 
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
    className={`px-6 py-4 border-t border-slate-200 dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#0a0a0a] rounded-b-2xl ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export default Card;
