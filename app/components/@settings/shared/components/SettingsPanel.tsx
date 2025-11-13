import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface SettingsPanelProps {
  children: React.ReactNode;
  variant?: 'section' | 'subsection' | 'compact' | 'highlight';
  className?: string;
  delay?: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  children,
  variant = 'section',
  className,
  delay = 0,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'subsection':
        return classNames(
          'bg-gray-50/50 dark:bg-gray-800/30',
          'border border-gray-200/60 dark:border-gray-700/40',
          'rounded-xl',
          'backdrop-blur-sm',
        );
      case 'highlight':
        return classNames(
          'bg-gradient-to-r from-blue-50/60 to-purple-50/40 dark:from-blue-950/20 dark:to-purple-950/10',
          'border border-blue-200/40 dark:border-blue-800/30',
          'rounded-xl',
          'backdrop-blur-sm',
        );
      case 'compact':
        return classNames(
          'bg-gray-50/30 dark:bg-gray-800/20',
          'border border-gray-200/40 dark:border-gray-700/30',
          'rounded-lg',
        );
      default: // section
        return classNames(
          'bg-white/60 dark:bg-gray-900/40',
          'border border-gray-200/50 dark:border-gray-700/30',
          'rounded-xl',
          'backdrop-blur-sm',
          'shadow-sm dark:shadow-none',
        );
    }
  };

  return (
    <motion.div
      className={classNames(getVariantClasses(), className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
};

interface SettingsListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const SettingsList: React.FC<SettingsListProps> = ({ children, className, delay = 0 }) => {
  return (
    <motion.div
      className={classNames('space-y-1', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
};

interface SettingsListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const SettingsListItem: React.FC<SettingsListItemProps> = ({
  children,
  className,
  onClick,
  disabled = false,
}) => {
  return (
    <motion.div
      className={classNames(
        'flex items-center justify-between',
        'px-6 py-4',
        'rounded-xl',
        'bg-white/40 dark:bg-gray-800/20',
        'border border-transparent',
        'hover:bg-white/60 dark:hover:bg-gray-800/40',
        'hover:border-gray-200/60 dark:hover:border-gray-700/40',
        'transition-all duration-200 ease-out',
        'group',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={onClick ? { scale: 1.005 } : undefined}
      whileTap={onClick ? { scale: 0.995 } : undefined}
    >
      {children}
    </motion.div>
  );
};

interface SettingsGroupProps {
  title?: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  layout?: 'grid' | 'flex' | 'block';
  columns?: 1 | 2 | 3 | 4;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  description,
  icon,
  children,
  className,
  delay = 0,
  layout = 'block',
  columns = 1,
}) => {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return `grid grid-cols-1 md:grid-cols-${columns} gap-6`;
      case 'flex':
        return 'flex flex-wrap gap-6';
      default:
        return 'space-y-4';
    }
  };

  return (
    <motion.div
      className={classNames('space-y-4', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {(title || description) && (
        <div className="flex items-center gap-3">
          {icon && <div className={classNames(icon, 'w-5 h-5 text-blue-500 flex-shrink-0')} />}
          <div>
            {title && <h4 className="text-base font-semibold text-codinit-elements-textPrimary">{title}</h4>}
            {description && <p className="text-sm text-codinit-elements-textSecondary mt-0.5">{description}</p>}
          </div>
        </div>
      )}
      <div className={getLayoutClasses()}>{children}</div>
    </motion.div>
  );
};
