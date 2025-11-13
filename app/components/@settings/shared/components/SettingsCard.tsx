import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface SettingsCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient' | 'compact';
  className?: string;
  delay?: number;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ children, variant = 'default', className, delay = 0 }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return classNames(
          'bg-white dark:bg-[#0F0F0F]',
          'border border-[#E5E5E5] dark:border-[#2A2A2A]',
          'shadow-lg dark:shadow-xl',
          'hover:shadow-xl dark:hover:shadow-2xl',
          'hover:border-blue-200 dark:hover:border-blue-800/30',
          'rounded-xl',
          'backdrop-blur-sm',
        );
      case 'gradient':
        return classNames(
          'bg-gradient-to-br from-white to-gray-50/50 dark:from-[#0F0F0F] dark:to-[#1A1A1A]',
          'border border-[#E5E5E5] dark:border-[#2A2A2A]',
          'shadow-md dark:shadow-lg',
          'hover:shadow-lg dark:hover:shadow-xl',
          'hover:border-blue-300 dark:hover:border-blue-700/40',
          'rounded-2xl',
          'relative overflow-hidden',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/5 before:to-purple-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
        );
      case 'compact':
        return classNames(
          'bg-white dark:bg-[#0A0A0A]',
          'border border-[#E5E5E5] dark:border-[#1A1A1A]',
          'shadow-sm dark:shadow-none',
          'hover:shadow-md dark:hover:shadow-lg',
          'hover:border-blue-200 dark:hover:border-blue-800/20',
          'rounded-lg',
        );
      default:
        return classNames(
          'bg-white dark:bg-[#0A0A0A]',
          'border border-[#E5E5E5] dark:border-[#1A1A1A]',
          'shadow-sm dark:shadow-none',
          'hover:shadow-md dark:hover:shadow-lg',
          'hover:border-blue-200 dark:hover:border-blue-800/20',
          'rounded-xl',
          'transition-all duration-300 ease-out',
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

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
  className,
  delay = 0,
}) => {
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
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className={classNames(icon, 'w-6 h-6 text-blue-500 flex-shrink-0')} />}
        <div>
          <h3 className="text-lg font-semibold text-codinit-elements-textPrimary">{title}</h3>
          {description && <p className="text-sm text-codinit-elements-textSecondary mt-1">{description}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
};
