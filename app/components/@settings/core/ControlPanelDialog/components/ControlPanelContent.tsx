import { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { TAB_LABELS } from '~/components/@settings/core/constants';
import type { TabType } from '~/components/@settings/core/types';
import { TextShimmer } from '~/components/ui/text-shimmer';

const ProfileTab = lazy(() =>
  import('~/components/@settings/tabs/profile/ProfileTab').then((module) => ({ default: module.default })),
);
const SettingsTab = lazy(() =>
  import('~/components/@settings/tabs/settings/SettingsTab').then((module) => ({ default: module.default })),
);
const NotificationsTab = lazy(() =>
  import('~/components/@settings/tabs/notifications/NotificationsTab').then((module) => ({ default: module.default })),
);
const FeaturesTab = lazy(() =>
  import('~/components/@settings/tabs/features/FeaturesTab').then((module) => ({ default: module.default })),
);
const DataTab = lazy(() =>
  import('~/components/@settings/tabs/data/DataTab').then((module) => ({ default: module.DataTab })),
);
const CloudProvidersTab = lazy(() =>
  import('~/components/@settings/tabs/providers/cloud/CloudProvidersTab').then((module) => ({
    default: module.default,
  })),
);
const LocalProvidersTab = lazy(() =>
  import('~/components/@settings/tabs/providers/local/LocalProvidersTab').then((module) => ({
    default: module.default,
  })),
);
const ServiceStatusTab = lazy(() =>
  import('~/components/@settings/tabs/providers/status/ServiceStatusTab').then((module) => ({
    default: module.default,
  })),
);
const ConnectionsTab = lazy(() =>
  import('~/components/@settings/tabs/connections/ConnectionsTab').then((module) => ({ default: module.default })),
);
const DebugTab = lazy(() =>
  import('~/components/@settings/tabs/debug/DebugTab').then((module) => ({ default: module.default })),
);
const UpdateTab = lazy(() =>
  import('~/components/@settings/tabs/update/UpdateTab').then((module) => ({ default: module.default })),
);
const ApiKeysTab = lazy(() =>
  import('~/components/@settings/tabs/api-keys/APIKeysTab').then((module) => ({ default: module.default })),
);

interface ControlPanelContentProps {
  activeTab: TabType;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-codinit-elements-textSecondary">
        <div className="i-svg-spinners:90-ring-with-bg w-5 h-5 animate-spin" />
        <TextShimmer className="text-sm">Loading...</TextShimmer>
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: TabType }) {
  switch (tab) {
    case 'profile':
      return <ProfileTab />;
    case 'settings':
      return <SettingsTab />;
    case 'notifications':
      return <NotificationsTab />;
    case 'features':
      return <FeaturesTab />;
    case 'data':
      return <DataTab />;
    case 'cloud-providers':
      return <CloudProvidersTab />;
    case 'local-providers':
      return <LocalProvidersTab />;
    case 'service-status':
      return <ServiceStatusTab />;
    case 'connection':
      return <ConnectionsTab />;
    case 'debug':
      return <DebugTab />;
    case 'update':
      return <UpdateTab />;
    case 'api-keys':
      return <ApiKeysTab />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-codinit-elements-textSecondary">
          <div className="text-center">
            <div className="i-lucide:alert-triangle w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Tab not found</p>
          </div>
        </div>
      );
  }
}

export function ControlPanelContent({ activeTab }: ControlPanelContentProps) {
  return (
    <div
      className={classNames(
        'flex-1 pb-10 relative overflow-y-auto flex flex-col',
        'bg-codinit-elements-background-depth-1 px-8',
      )}
    >
      {/* Header */}
      <div className="bg-codinit-elements-background-depth-1 sticky top-0 z-layer-3 pt-12 mb-4">
        <div className="min-h-9 flex flex-col gap-2">
          <h2 className="text-lg font-semibold truncate text-codinit-elements-textPrimary">{TAB_LABELS[activeTab]}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1"
          >
            <Suspense fallback={<LoadingFallback />}>
              <TabContent tab={activeTab} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
