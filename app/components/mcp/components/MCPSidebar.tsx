/* eslint-disable @typescript-eslint/naming-convention */
import { classNames } from '~/utils/classNames';

type TabType = 'integrations' | 'marketplace' | 'history';

interface MCPSidebarProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

const MCP_TABS = [
  {
    id: 'integrations' as const,
    label: 'Integrations',
    icon: 'i-ph:plug',
  },
  {
    id: 'marketplace' as const,
    label: 'Marketplace',
    icon: 'i-ph:storefront',
  },
  {
    id: 'history' as const,
    label: 'History',
    icon: 'i-ph:clock-counter-clockwise',
  },
] as const;

export function MCPSidebar({ activeTab = 'integrations', onTabChange }: MCPSidebarProps) {
  const renderTabButton = (tab: (typeof MCP_TABS)[number]) => {
    const isActive = activeTab === tab.id;

    return (
      <li key={tab.id} className="first:mt-0">
        <button
          onClick={() => onTabChange?.(tab.id)}
          className={classNames(
            'w-full flex items-center shrink-0 justify-center md:justify-start gap-3 h-[33px] px-2.5 rounded-md text-sm font-medium',
            'focus-visible:outline-2 focus-visible:outline-codinit-elements-borderColor',
            'transition-colors duration-200',
            isActive
              ? 'bg-codinit-elements-item-backgroundActive text-codinit-elements-textPrimary'
              : 'bg-transparent hover:bg-codinit-elements-background-depth-3 text-codinit-elements-textTertiary hover:text-codinit-elements-textPrimary',
          )}
        >
          <span className={classNames('shrink-0 text-base', tab.icon)} />
          <span className="truncate hidden md:block">{tab.label}</span>
        </button>
      </li>
    );
  };

  return (
    <aside
      className={classNames(
        'h-full overflow-y-auto flex flex-col',
        'max-w-80 w-12 md:w-auto md:min-w-1/8',
        'bg-codinit-elements-background-depth-2 border-r border-codinit-elements-borderColor',
        'p-2 md:p-4 pt-0 md:pt-0',
      )}
    >
      <div className="flex-1 flex flex-col gap-4">
        <section className="flex flex-col">
          <div className="sticky top-0 bg-codinit-elements-background-depth-2 z-layer-1 text-codinit-elements-textTertiary text-xs font-semibold hidden md:block p-2 md:p-4">
            MCP
          </div>
          <ul className="flex flex-col gap-1">{MCP_TABS.map(renderTabButton)}</ul>
        </section>
      </div>
    </aside>
  );
}
