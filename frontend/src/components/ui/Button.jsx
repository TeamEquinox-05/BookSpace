import React from 'react';
import Spinner from './Spinner';

/**
 * Unified Button component for consistent styling across the app
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {React.ReactNode} props.icon - Icon to display before text
 * @param {React.ReactNode} props.iconRight - Icon to display after text
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 */
const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconRight,
  children,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black';
  
  // Size variants
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  
  // Color variants
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md disabled:bg-blue-400',
    secondary: 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md disabled:bg-red-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md disabled:bg-green-400',
    ghost: 'bg-transparent text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] focus:ring-slate-500',
    outline: 'border-2 border-slate-300 dark:border-[#1a1a1a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] focus:ring-slate-500',
  };
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Disabled styles
  const disabledStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';
  
  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${disabledStyles} ${className}`.trim();
  
  const buttonContent = (
    <>
      {loading ? (
        <Spinner size="sm" centered={false} text="" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </>
  );
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={combinedClassName}
      {...props}
    >
      {buttonContent}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
