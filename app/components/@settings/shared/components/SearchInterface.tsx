import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { toast } from 'react-toastify';
import {
  searchSettings,
  updateSettingValue,
  getRecentSettings,
  type SearchableSetting,
} from '~/components/@settings/shared/utils/settingsSearch';

interface SearchInterfaceProps {
  userProfile: any; // From the profile store
  onSettingChange?: (settingId: string, value: any) => void;
  className?: string;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  userProfile: _userProfile,
  onSettingChange,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableSetting[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with recent settings
  useEffect(() => {
    const recent = getRecentSettings();
    setResults(recent.length > 0 ? recent : []);
  }, []);

  // Handle search query changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(-1);

    if (newQuery.trim()) {
      setIsLoading(true);

      // Debounce search for better performance
      setTimeout(() => {
        const searchResults = searchSettings(newQuery);
        setResults(searchResults);
        setIsLoading(false);
      }, 150);
    } else {
      // Show recent settings when no query
      const recent = getRecentSettings();
      setResults(recent.length > 0 ? recent : []);
      setIsLoading(false);
    }
  }, []);

  // Handle setting changes
  const handleSettingChange = useCallback(
    (settingId: string, value: any) => {
      updateSettingValue(settingId, value);

      // Call external handler if provided
      onSettingChange?.(settingId, value);

      // Show success feedback
      const setting = results.find((r) => r.id === settingId);

      if (setting) {
        toast.success(`${setting.title} updated`);
      }
    },
    [results, onSettingChange],
  );

  // Handle action execution
  const handleActionExecute = useCallback((setting: SearchableSetting) => {
    if (setting.action) {
      try {
        const result = setting.action();

        if (result instanceof Promise) {
          result
            .then(() => {
              toast.success(`${setting.title} executed`);
            })
            .catch((error) => {
              console.error('Action failed:', error);
              toast.error(`Failed to execute ${setting.title}`);
            });
        } else {
          toast.success(`${setting.title} executed`);
        }
      } catch (error) {
        console.error('Action failed:', error);
        toast.error(`Failed to execute ${setting.title}`);
      }
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (results.length === 0) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        case 'Enter':
          e.preventDefault();

          if (selectedIndex >= 0 && selectedIndex < results.length) {
            const setting = results[selectedIndex];

            if (setting.type === 'action') {
              handleActionExecute(setting);
            } else if (setting.type === 'toggle') {
              handleSettingChange(setting.id, !setting.value);
            }
          }

          break;
        case 'Escape':
          setQuery('');
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, handleSettingChange, handleActionExecute]);

  return (
    <div className={classNames('w-full max-w-4xl mx-auto', className)}>
      {/* Search Input */}
      <div className="mb-8">
        <SearchInput onQueryChange={handleQueryChange} placeholder="Search settings..." autoFocus />
      </div>

      {/* Results */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {query && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </h3>
          </div>
        )}

        {!query && results.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Settings</h3>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <SearchResults
            results={results}
            onSettingChange={handleSettingChange}
            onActionExecute={handleActionExecute}
            selectedIndex={selectedIndex}
          />
        )}

        {!query && results.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 mx-auto">
              <div className="i-ph:gear w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start typing to search settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search by name, description, or category to find what you need.
            </p>
          </div>
        )}
      </motion.div>

      {/* Keyboard shortcuts hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>⎋ Clear</span>
        </div>
      </motion.div>
    </div>
  );
};
