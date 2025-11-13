import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { classNames } from '~/utils/classNames';
import type { TabVisibilityConfig } from '~/components/@settings/core/types';
import { TAB_LABELS, TAB_ICONS } from '~/components/@settings/core/constants';

interface TabTileProps {
  tab: TabVisibilityConfig;
  onClick?: () => void;
  isActive?: boolean;
  hasUpdate?: boolean;
  statusMessage?: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const TabTile: React.FC<TabTileProps> = ({
  tab,
  onClick,
  isActive,
  hasUpdate,
  statusMessage,
  description,
  isLoading,
  className,
  children,
}: TabTileProps) => {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.div
            onClick={onClick}
            className={classNames(
              'relative flex flex-col items-center p-10 rounded-2xl',
              'w-full h-full min-h-[200px]',
              'bg-gradient-to-br from-white to-gray-50/30 dark:from-[#0F0F0F] dark:to-[#1A1A1A]',
              'border-2',
              isActive
                ? 'border-blue-400 dark:border-blue-500/60 bg-gradient-to-br from-blue-50/80 to-purple-50/40 dark:from-blue-950/30 dark:to-purple-950/20'
                : 'border-gray-200/60 dark:border-[#2A2A2A] hover:border-blue-300/80 dark:hover:border-blue-700/40',
              'group',
              'hover:shadow-xl dark:hover:shadow-2xl',
              'hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5',
              'transition-all duration-300 ease-out',
              'backdrop-blur-sm',
              isLoading ? 'cursor-wait opacity-70' : '',
              className || '',
            )}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background gradient overlay for active state */}
            {isActive && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
            )}

            {/* Main Content */}
            <div className="relative flex flex-col items-center justify-center flex-1 w-full z-10">
              {/* Icon */}
              <motion.div
                className={classNames(
                  'relative mb-4',
                  'w-16 h-16',
                  'flex items-center justify-center',
                  'rounded-2xl',
                  'bg-gradient-to-br',
                  isActive
                    ? 'from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                    : 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
                  'ring-2',
                  isActive ? 'ring-blue-300/50 dark:ring-blue-400/30' : 'ring-gray-200/50 dark:ring-gray-600/30',
                  'group-hover:ring-blue-400/60 dark:group-hover:ring-blue-500/40',
                  'transition-all duration-300 ease-out',
                  'shadow-md group-hover:shadow-lg',
                )}
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className={classNames(
                    TAB_ICONS[tab.id],
                    'w-8 h-8',
                    isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300',
                    'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                    'transition-colors duration-300',
                  )}
                />
              </motion.div>

              {/* Label and Description */}
              <div className="flex flex-col items-center text-center w-full px-2">
                <h3
                  className={classNames(
                    'text-lg font-semibold leading-tight mb-3',
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200',
                    'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                    'transition-colors duration-300',
                  )}
                >
                  {TAB_LABELS[tab.id]}
                </h3>
                {description && (
                  <p
                    className={classNames(
                      'text-sm leading-relaxed max-w-full text-center',
                      isActive ? 'text-blue-500/80 dark:text-blue-400/70' : 'text-gray-500 dark:text-gray-400',
                      'group-hover:text-blue-500 dark:group-hover:text-blue-400/80',
                      'transition-colors duration-300',
                      'line-clamp-2',
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Update Indicator with Enhanced Tooltip */}
            {hasUpdate && (
              <>
                <motion.div
                  className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <Tooltip.Portal>
                  <Tooltip.Content
                    className={classNames(
                      'px-4 py-2 rounded-xl',
                      'bg-gray-900 dark:bg-gray-800 text-white',
                      'text-sm font-medium',
                      'shadow-xl border border-gray-700/50',
                      'select-none',
                      'z-[100]',
                      'backdrop-blur-sm',
                    )}
                    side="top"
                    sideOffset={8}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      {statusMessage}
                    </div>
                    <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </>
            )}

            {/* Children (e.g. Beta Label) */}
            {children}
          </motion.div>
        </Tooltip.Trigger>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
