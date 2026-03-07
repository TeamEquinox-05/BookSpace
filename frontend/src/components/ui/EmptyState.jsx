import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Unified EmptyState component for consistent empty state displays
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Custom icon component (defaults to Inbox)
 * @param {string} props.title - Main heading text
 * @param {string} props.description - Descriptive text
 * @param {string} props.actionLabel - Button text (optional)
 * @param {function} props.onAction - Button click handler (optional)
 * @param {React.ReactNode} props.actionIcon - Icon for the action button (optional)
 * @param {'sm' | 'md' | 'lg'} props.size - Size variant
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
  actionIcon,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: {
      container: 'py-8',
      iconWrapper: 'w-14 h-14',
      icon: 'w-7 h-7',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      iconWrapper: 'w-20 h-20',
      icon: 'w-10 h-10',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      iconWrapper: 'w-24 h-24',
      icon: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${styles.container} ${className}`}
    >
      <div className={`inline-flex items-center justify-center ${styles.iconWrapper} bg-slate-100 dark:bg-[#1a1a1a] rounded-2xl mb-4`}>
        <Icon className={`${styles.icon} text-slate-400 dark:text-zinc-500`} />
      </div>
      
      <h3 className={`${styles.title} font-semibold text-slate-700 dark:text-slate-300 mb-2`}>
        {title}
      </h3>
      
      <p className={`${styles.description} text-slate-500 dark:text-slate-400 max-w-sm mb-6`}>
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size={size === 'lg' ? 'lg' : 'md'}
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
