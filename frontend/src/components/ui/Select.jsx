import React from 'react';

/**
 * Unified Select component for consistent dropdown styling
 * 
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {string} props.error - Error message
 * @param {string} props.hint - Helper text
 * @param {Array} props.options - Array of { value, label } objects
 * @param {string} props.placeholder - Placeholder text
 * @param {'sm' | 'md' | 'lg'} props.size - Select size
 */
const Select = React.forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select an option',
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  
  const baseSelectStyles = `
    block w-full rounded-xl border transition-colors duration-200 appearance-none
    bg-white dark:bg-slate-800
    text-slate-900 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-offset-0
    pr-10
  `;
  
  const stateStyles = error
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
    : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20';
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`${baseSelectStyles} ${sizeStyles[size]} ${stateStyles}`.trim()}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

Select.displayName = 'Select';

export default Select;
