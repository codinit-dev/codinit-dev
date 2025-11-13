import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { Switch } from '~/components/ui/Switch';
import type { SearchableSetting } from '~/components/@settings/shared/utils/settingsSearch';

interface SettingResultItemProps {
  setting: SearchableSetting;
  onToggle?: (settingId: string, value: boolean) => void;
  onSelect?: (settingId: string, value: string) => void;
  onAction?: (setting: SearchableSetting) => void;
  isSelected?: boolean;
  className?: string;
}

export const SettingResultItem: React.FC<SettingResultItemProps> = ({
  setting,
  onToggle,
  onSelect,
  onAction,
  isSelected = false,
  className,
}) => {
  const handleClick = () => {
    if (setting.type === 'action' && onAction) {
      onAction(setting);
    }
  };

  const renderControl = () => {
    switch (setting.type) {
      case 'toggle':
        return (
          <Switch checked={Boolean(setting.value)} onCheckedChange={(checked) => onToggle?.(setting.id, checked)} />
        );

      case 'select':
        return (
          <select
            value={setting.value || ''}
            onChange={(e) => onSelect?.(setting.id, e.target.value)}
            className={classNames(
              'px-3 py-1 text-sm rounded-lg',
              'bg-gray-50 dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-1 focus:ring-blue-500/50',
              'min-w-[120px]',
            )}
          >
            {getSelectOptions(setting.id)}
          </select>
        );

      case 'action':
        return (
          <button
            onClick={handleClick}
            className={classNames(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'bg-blue-500 hover:bg-blue-600 text-white',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
            )}
          >
            Execute
          </button>
        );

      default:
        return null;
    }
  };

  const getSelectOptions = (settingId: string) => {
    switch (settingId) {
      case 'language':
        return (
          <>
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="it">🇮🇹 Italiano</option>
            <option value="pt">🇵🇹 Português</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ko">🇰🇷 한국어</option>
          </>
        );
      case 'timezone':
        return (
          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
            🌍 {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </option>
        );
      default:
        return <option value={setting.value}>{setting.value}</option>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Preferences':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Features':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'Actions':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      className={classNames(
        'flex items-center justify-between',
        'px-6 py-4',
        'rounded-xl',
        'bg-white/60 dark:bg-gray-800/40',
        'border border-gray-200/50 dark:border-gray-700/30',
        'hover:bg-white/80 dark:hover:bg-gray-800/60',
        'hover:border-gray-300/60 dark:hover:border-gray-600/40',
        'transition-all duration-200 ease-out',
        'group',
        setting.type === 'action' ? 'cursor-pointer' : 'cursor-default',
        ...(isSelected ? ['ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'] : []),
        className,
      )}
      onClick={setting.type === 'action' ? handleClick : undefined}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={classNames(
            'flex-shrink-0 w-12 h-12 rounded-xl',
            'flex items-center justify-center',
            'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
            'ring-2 ring-gray-200/50 dark:ring-gray-600/30',
            'group-hover:ring-gray-300/60 dark:group-hover:ring-gray-500/40',
            'transition-all duration-200',
          )}
        >
          <div className={classNames(setting.icon, 'w-6 h-6 text-gray-600 dark:text-gray-300')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base leading-tight truncate">
              {setting.title}
            </h4>
            <span
              className={classNames('px-2 py-0.5 text-xs rounded-full font-medium', getCategoryColor(setting.category))}
            >
              {setting.category}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{setting.description}</p>
          {setting.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {setting.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Control */}
      <div className="flex-shrink-0 ml-4">{renderControl()}</div>
    </motion.div>
  );
};
