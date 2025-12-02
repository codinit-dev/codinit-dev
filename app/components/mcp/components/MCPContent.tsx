/* eslint-disable @typescript-eslint/naming-convention */
import { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { TextShimmer } from '~/components/ui/text-shimmer';

type TabType = 'integrations' | 'marketplace' | 'history';

const TAB_LABELS = {
  integrations: 'MCP Integrations',
  marketplace: 'MCP Marketplace',
  history: 'Execution History',
} as const;

// Lazy load tab components
const MCPIntegrationsTab = lazy(() =>
  import('../tabs/MCPIntegrationsTab').then((module) => ({ default: module.default })),
);
const MCPMarketplaceTab = lazy(() =>
  import('../tabs/MCPMarketplaceTab').then((module) => ({ default: module.default })),
);
const MCPHistoryTab = lazy(() => import('../tabs/MCPHistoryTab').then((module) => ({ default: module.default })));

interface MCPContentProps {
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
    case 'integrations':
      return <MCPIntegrationsTab />;
    case 'marketplace':
      return <MCPMarketplaceTab />;
    case 'history':
      return <MCPHistoryTab />;
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

export function MCPContent({ activeTab }: MCPContentProps) {
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
