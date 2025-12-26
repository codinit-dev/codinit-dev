import { classNames } from '~/utils/classNames';
import { TAB_ICONS, TAB_LABELS } from '~/components/@settings/core/constants';
import type { TabType, TabVisibilityConfig } from '~/components/@settings/core/types';

interface ControlPanelSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabs: TabVisibilityConfig[];
}

export function ControlPanelSidebar({ activeTab, onTabChange, tabs }: ControlPanelSidebarProps) {
  // Group tabs into primary and secondary sections
  const primaryTabs = tabs.slice(0, 8); // First 8 tabs as primary
  const secondaryTabs = tabs.slice(8); // Rest as secondary

  const renderTabButton = (tab: TabVisibilityConfig) => {
    const isActive = activeTab === tab.id;
    const iconClass = TAB_ICONS[tab.id];
    const label = TAB_LABELS[tab.id];

    return (
      <li key={tab.id} className="first:mt-0">
        <button
          id={`settings-item-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={classNames(
            'w-full flex items-center shrink-0 justify-center md:justify-start gap-3 h-[36px] px-3 rounded-full text-sm font-medium',
            'focus-visible:outline-2 focus-visible:outline-codinit-elements-borderColor',
            'transition-all duration-200',
            isActive
              ? 'bg-codinit-elements-item-backgroundActive text-codinit-elements-textPrimary font-semibold shadow-sm'
              : 'bg-transparent hover:bg-codinit-elements-background-depth-2 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
          )}
        >
          <span className={classNames('shrink-0 text-base', iconClass)} />
          <span className="truncate hidden md:block">{label}</span>
        </button>
      </li>
    );
  };

  return (
    <aside
      className={classNames(
        'h-full overflow-y-auto flex flex-col',
        'max-w-80 w-12 md:w-64', // Fixed width for better stability
        'bg-codinit-elements-background-depth-2 border-r border-codinit-elements-borderColor',
        'p-4', // Consistent padding
      )}
    >
      <div className="flex-1 flex flex-col gap-4">
        {/* Primary Settings Section */}
        {primaryTabs.length > 0 && (
          <section className="flex flex-col">
            <div className="sticky top-0 bg-codinit-elements-background-depth-2 z-layer-1 text-codinit-elements-textTertiary text-xs font-semibold hidden md:block p-2 md:p-4">
              Settings
            </div>
            <ul className="flex flex-col gap-1">{primaryTabs.map(renderTabButton)}</ul>
          </section>
        )}

        {/* Secondary Settings Section */}
        {secondaryTabs.length > 0 && (
          <section className="flex flex-col">
            <div className="sticky top-0 bg-codinit-elements-background-depth-2 z-layer-1 text-codinit-elements-textTertiary text-xs font-semibold hidden md:block p-2 md:p-4">
              Advanced
            </div>
            <ul className="flex flex-col gap-1">{secondaryTabs.map(renderTabButton)}</ul>
          </section>
        )}
      </div>
    </aside>
  );
}
