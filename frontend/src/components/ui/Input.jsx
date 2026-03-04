import React from 'react';

/**
 * Unified Input component for consistent form field styling
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.hint - Helper text
 * @param {React.ReactNode} props.icon - Icon to display inside input
 * @param {'sm' | 'md' | 'lg'} props.size - Input size
 */
const Input = React.forwardRef(({
  label,
  error,
  hint,
  icon,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  
  const baseInputStyles = `
    block w-full rounded-xl border transition-colors duration-200
    bg-white dark:bg-[#0a0a0a]
    text-slate-900 dark:text-white
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:ring-2 focus:ring-offset-0
  `;
  
  const stateStyles = error
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
    : 'border-slate-300 dark:border-[#1a1a1a] focus:border-blue-500 focus:ring-blue-500/20';
  
  const iconPadding = icon ? 'pl-10' : '';
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${sizeStyles[size]} ${stateStyles} ${iconPadding}`.trim()}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
