import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

// Import actual settings components
import ProfileTab from '~/components/@settings/tabs/profile/ProfileTab';
import SettingsTab from '~/components/@settings/tabs/settings/SettingsTab';
import NotificationsTab from '~/components/@settings/tabs/notifications/NotificationsTab';
import FeaturesTab from '~/components/@settings/tabs/features/FeaturesTab';
import { DataTab } from '~/components/@settings/tabs/data/DataTab';
import DebugTab from '~/components/@settings/tabs/debug/DebugTab';
import { EventLogsTab } from '~/components/@settings/tabs/event-logs/EventLogsTab';
import UpdateTab from '~/components/@settings/tabs/update/UpdateTab';
import ConnectionsTab from '~/components/@settings/tabs/connections/ConnectionsTab';
import CloudProvidersTab from '~/components/@settings/tabs/providers/cloud/CloudProvidersTab';
import ServiceStatusTab from '~/components/@settings/tabs/providers/status/ServiceStatusTab';
import LocalProvidersTab from '~/components/@settings/tabs/providers/local/LocalProvidersTab';
import TaskManagerTab from '~/components/@settings/tabs/task-manager/TaskManagerTab';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  component?: React.ComponentType;
}

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const tabs: TabItem[] = [
  // Workspace section
  { id: 'workspace', label: 'Workspace', icon: <div className="i-ph:code-bold w-5 h-5" />, section: 'Workspace' },
  { id: 'people', label: 'People', icon: <div className="i-ph:users w-5 h-5" />, section: 'Workspace' },
  { id: 'billing', label: 'Plans & credits', icon: <div className="i-ph:credit-card w-5 h-5" />, section: 'Workspace' },
  { id: 'usage', label: 'Cloud & AI balance', icon: <div className="i-ph:chart-bar w-5 h-5" />, section: 'Workspace' },
  {
    id: 'privacy-security',
    label: 'Privacy & security',
    icon: <div className="i-ph:shield w-5 h-5" />,
    section: 'Workspace',
  },

  // Account section
  {
    id: 'account',
    label: 'Account',
    icon: <div className="i-ph:user w-5 h-5" />,
    section: 'Account',
    component: ProfileTab,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <div className="i-ph:gear w-5 h-5" />,
    section: 'Account',
    component: SettingsTab,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <div className="i-ph:bell w-5 h-5" />,
    section: 'Account',
    component: NotificationsTab,
  },
  {
    id: 'features',
    label: 'Features',
    icon: <div className="i-ph:star w-5 h-5" />,
    section: 'Account',
    component: FeaturesTab,
  },
  {
    id: 'data',
    label: 'Data',
    icon: <div className="i-ph:database w-5 h-5" />,
    section: 'Account',
    component: DataTab,
  },
  {
    id: 'connection',
    label: 'Connections',
    icon: <div className="i-ph:wifi w-5 h-5" />,
    section: 'Account',
    component: ConnectionsTab,
  },
  { id: 'debug', label: 'Debug', icon: <div className="i-ph:bug w-5 h-5" />, section: 'Account', component: DebugTab },
  {
    id: 'event-logs',
    label: 'Event Logs',
    icon: <div className="i-ph:file-text w-5 h-5" />,
    section: 'Account',
    component: EventLogsTab,
  },
  {
    id: 'update',
    label: 'Update',
    icon: <div className="i-ph:arrow-clockwise w-5 h-5" />,
    section: 'Account',
    component: UpdateTab,
  },

  // Tools section
  { id: 'tools', label: 'Tools', icon: <div className="i-ph:wrench w-5 h-5" />, section: 'Tools' },
  { id: 'labs', label: 'Labs', icon: <div className="i-ph:test-tube w-5 h-5" />, section: 'Labs' },

  // Providers section
  {
    id: 'cloud-providers',
    label: 'Cloud Providers',
    icon: <div className="i-ph:cloud w-5 h-5" />,
    section: 'Providers',
    component: CloudProvidersTab,
  },
  {
    id: 'local-providers',
    label: 'Local Providers',
    icon: <div className="i-ph:cpu w-5 h-5" />,
    section: 'Providers',
    component: LocalProvidersTab,
  },
  {
    id: 'service-status',
    label: 'Service Status',
    icon: <div className="i-ph:activity w-5 h-5" />,
    section: 'Providers',
    component: ServiceStatusTab,
  },
  {
    id: 'task-manager',
    label: 'Task Manager',
    icon: <div className="i-ph:chart-line w-5 h-5" />,
    section: 'Providers',
    component: TaskManagerTab,
  },

  // Integrations section
  { id: 'supabase', label: 'Supabase', icon: <div className="i-ph:database w-5 h-5" />, section: 'Integrations' },
  { id: 'github', label: 'GitHub', icon: <div className="i-ph:github-logo w-5 h-5" />, section: 'Integrations' },
];

export function WorkspaceModal({ isOpen, onClose, children }: WorkspaceModalProps) {
  const [activeTab, setActiveTab] = useState('account');

  const groupedTabs = tabs.reduce(
    (acc, tab) => {
      const section = tab.section || 'Other';

      if (!acc[section]) {
        acc[section] = [];
      }

      acc[section].push(tab);

      return acc;
    },
    {} as Record<string, TabItem[]>,
  );

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  const renderTabContent = () => {
    if (children) {
      return children;
    }

    if (ActiveComponent) {
      return <ActiveComponent />;
    }

    // Default content for tabs without components
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          {activeTabData?.icon}
        </div>
        <h2 className="text-2xl font-semibold mb-4">{activeTabData?.label || 'Content'}</h2>
        <p className="text-muted-foreground">This feature is coming soon. Check back later!</p>
      </div>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]" />
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[90vw] h-[90vh] max-w-7xl"
          >
            <Dialog.Content className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full h-full flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-full md:w-[240px] border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {Object.entries(groupedTabs).map(([section, sectionTabs]) => (
                    <div key={section}>
                      {section !== 'Workspace' && (
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 mt-6 first:mt-0">
                          {section}
                        </div>
                      )}
                      <div className="space-y-0.5 px-4 py-6">
                        {sectionTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={classNames(
                              'flex min-h-10 w-full items-center justify-start gap-3 rounded-md px-2.5 py-2 text-start text-base transition-colors',
                              'hover:bg-gray-100 dark:hover:bg-gray-800',
                              activeTab === tab.id ? 'bg-gray-100 dark:bg-gray-800' : '',
                              'md:min-h-8 md:w-auto md:gap-2 md:text-sm [&>svg]:size-5 md:[&>svg]:size-4',
                              '-ml-0.5',
                            )}
                          >
                            {tab.icon}
                            <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="px-6 py-6 md:px-10 md:py-6">{renderTabContent()}</div>
                </div>
              </div>
            </Dialog.Content>
          </motion.div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
