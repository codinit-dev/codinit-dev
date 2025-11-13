import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Switch } from '~/components/ui/Switch';
import { SettingsSection } from '~/components/@settings/shared/components/SettingsCard';
import { SettingsGroup, SettingsPanel } from '~/components/@settings/shared/components/SettingsPanel';
import type { UserProfile } from '~/components/@settings/core/types';
import { isMac } from '~/utils/os';

// Helper to get modifier key symbols/text
const getModifierSymbol = (modifier: string): string => {
  switch (modifier) {
    case 'meta':
      return isMac ? '⌘' : 'Win';
    case 'alt':
      return isMac ? '⌥' : 'Alt';
    case 'shift':
      return '⇧';
    default:
      return modifier;
  }
};

export default function SettingsTab() {
  const [currentTimezone, setCurrentTimezone] = useState('');
  const [settings, setSettings] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('codinit_user_profile');
    return saved
      ? JSON.parse(saved)
      : {
          notifications: true,
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
  });

  useEffect(() => {
    setCurrentTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Save settings automatically when they change
  useEffect(() => {
    try {
      // Get existing profile data
      const existingProfile = JSON.parse(localStorage.getItem('codinit_user_profile') || '{}');

      // Merge with new settings
      const updatedProfile = {
        ...existingProfile,
        notifications: settings.notifications,
        language: settings.language,
        timezone: settings.timezone,
      };

      localStorage.setItem('codinit_user_profile', JSON.stringify(updatedProfile));
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    }
  }, [settings]);

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Preferences"
        description="Customize your application experience"
        icon="i-ph:palette-fill"
        delay={0.1}
      >
        <SettingsGroup layout="grid" columns={2}>
          <SettingsPanel variant="section" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="i-ph:translate-fill w-5 h-5 text-blue-500" />
                <label className="text-sm font-semibold text-codinit-elements-textPrimary">Language</label>
              </div>
              <select
                value={settings.language}
                onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
                className={classNames(
                  'w-full px-4 py-3 rounded-xl text-sm font-medium',
                  'bg-white dark:bg-[#0F0F0F]',
                  'border-2 border-gray-200 dark:border-[#2A2A2A]',
                  'text-codinit-elements-textPrimary',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
                  'hover:border-gray-300 dark:hover:border-[#3A3A3A]',
                  'transition-all duration-200',
                  'shadow-sm',
                )}
              >
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
              </select>
            </div>
          </SettingsPanel>

          <SettingsPanel variant="section" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="i-ph:bell-fill w-5 h-5 text-blue-500" />
                <label className="text-sm font-semibold text-codinit-elements-textPrimary">Notifications</label>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-codinit-elements-textPrimary">Push Notifications</span>
                  <span className="text-xs text-codinit-elements-textSecondary">
                    {settings.notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => {
                    setSettings((prev) => ({ ...prev, notifications: checked }));

                    const existingProfile = JSON.parse(localStorage.getItem('codinit_user_profile') || '{}');
                    const updatedProfile = {
                      ...existingProfile,
                      notifications: checked,
                    };
                    localStorage.setItem('codinit_user_profile', JSON.stringify(updatedProfile));
                    window.dispatchEvent(
                      new StorageEvent('storage', {
                        key: 'codinit_user_profile',
                        newValue: JSON.stringify(updatedProfile),
                      }),
                    );
                    toast.success(`Notifications ${checked ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>
            </div>
          </SettingsPanel>
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection
        title="Time Settings"
        description="Configure timezone and time-related preferences"
        icon="i-ph:clock-fill"
        delay={0.2}
      >
        <SettingsPanel variant="section" className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="i-ph:globe-fill w-5 h-5 text-blue-500" />
              <label className="text-sm font-semibold text-codinit-elements-textPrimary">Timezone</label>
            </div>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
              className={classNames(
                'w-full px-4 py-3 rounded-xl text-sm font-medium',
                'bg-white dark:bg-[#0F0F0F]',
                'border-2 border-gray-200 dark:border-[#2A2A2A]',
                'text-codinit-elements-textPrimary',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
                'hover:border-gray-300 dark:hover:border-[#3A3A3A]',
                'transition-all duration-200',
                'shadow-sm',
              )}
            >
              <option value={currentTimezone}>🌍 {currentTimezone}</option>
            </select>
            <p className="text-xs text-codinit-elements-textSecondary">
              Your timezone is automatically detected based on your system settings.
            </p>
          </div>
        </SettingsPanel>
      </SettingsSection>

      <SettingsSection
        title="Keyboard Shortcuts"
        description="Essential shortcuts for quick actions"
        icon="i-ph:keyboard-fill"
        delay={0.3}
      >
        <SettingsPanel variant="highlight" className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <div className="i-ph:keyboard w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-codinit-elements-textPrimary">Toggle Theme</h4>
                <p className="text-sm text-codinit-elements-textSecondary">Switch between light and dark mode</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-2 text-xs font-bold text-codinit-elements-textSecondary bg-white dark:bg-[#0F0F0F] border-2 border-gray-300 dark:border-[#2A2A2A] rounded-lg shadow-sm">
                {getModifierSymbol('meta')}
              </kbd>
              <span className="text-codinit-elements-textSecondary font-medium">+</span>
              <kbd className="px-3 py-2 text-xs font-bold text-codinit-elements-textSecondary bg-white dark:bg-[#0F0F0F] border-2 border-gray-300 dark:border-[#2A2A2A] rounded-lg shadow-sm">
                {getModifierSymbol('alt')}
              </kbd>
              <span className="text-codinit-elements-textSecondary font-medium">+</span>
              <kbd className="px-3 py-2 text-xs font-bold text-codinit-elements-textSecondary bg-white dark:bg-[#0F0F0F] border-2 border-gray-300 dark:border-[#2A2A2A] rounded-lg shadow-sm">
                {getModifierSymbol('shift')}
              </kbd>
              <span className="text-codinit-elements-textSecondary font-medium">+</span>
              <kbd className="px-3 py-2 text-xs font-bold text-codinit-elements-textSecondary bg-white dark:bg-[#0F0F0F] border-2 border-gray-300 dark:border-[#2A2A2A] rounded-lg shadow-sm">
                D
              </kbd>
            </div>
          </div>
        </SettingsPanel>
      </SettingsSection>
    </div>
  );
}
