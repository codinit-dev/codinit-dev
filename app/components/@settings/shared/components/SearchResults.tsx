import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { SettingResultItem } from './SettingResultItem';
import type { SearchableSetting } from '~/components/@settings/shared/utils/settingsSearch';

interface SearchResultsProps {
  results: SearchableSetting[];
  onSettingChange: (settingId: string, value: any) => void;
  onActionExecute: (setting: SearchableSetting) => void;
  selectedIndex?: number;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSettingChange,
  onActionExecute,
  selectedIndex = -1,
  className,
}) => {
  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={classNames('flex flex-col items-center justify-center py-12 px-6', 'text-center', className)}
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <div className="i-ph:magnifying-glass w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No settings found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search terms or browse categories below.
        </p>
      </motion.div>
    );
  }

  return (
    <div className={classNames('space-y-2', className)}>
      <AnimatePresence mode="popLayout">
        {results.map((setting, index) => (
          <motion.div
            key={setting.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              delay: index * 0.05,
              duration: 0.2,
            }}
            layout
          >
            <SettingResultItem
              setting={setting}
              onToggle={(settingId, value) => onSettingChange(settingId, value)}
              onSelect={(settingId, value) => onSettingChange(settingId, value)}
              onAction={onActionExecute}
              isSelected={selectedIndex === index}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
