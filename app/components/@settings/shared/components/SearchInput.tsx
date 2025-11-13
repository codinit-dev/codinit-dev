import React, { useState, useEffect, useRef } from 'react';
import { classNames } from '~/utils/classNames';

interface SearchInputProps {
  onQueryChange: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onQueryChange,
  placeholder = 'Search settings...',
  autoFocus = true,
  className,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    onQueryChange(query);
  }, [query, onQueryChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={classNames('relative w-full', className)}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <div className="i-ph:magnifying-glass w-5 h-5 text-gray-400" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={classNames(
          'w-full pl-12 pr-10 py-4 text-lg',
          'bg-white dark:bg-gray-900',
          'border-2 border-gray-200 dark:border-gray-700',
          'rounded-xl',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
          'hover:border-gray-300 dark:hover:border-gray-600',
          'transition-all duration-200',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'text-gray-900 dark:text-white',
          'shadow-sm',
        )}
      />

      {query && (
        <button
          onClick={handleClear}
          className={classNames(
            'absolute right-4 top-1/2 -translate-y-1/2',
            'w-5 h-5',
            'flex items-center justify-center',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            'transition-colors duration-200',
            'rounded-full hover:bg-gray-100 dark:hover:bg-gray-800',
          )}
        >
          <div className="i-ph:x w-4 h-4" />
        </button>
      )}
    </div>
  );
};
