import { useMCPStore } from '~/lib/stores/mcp';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';
import WithTooltip from '~/components/ui/Tooltip';

export function McpServerSelector() {
  const serverTools = useMCPStore((state) => state.serverTools);
  const selectedMCP = useMCPStore((state) => state.selectedMCP);
  const setSelectedMCP = useMCPStore((state) => state.setSelectedMCP);
  const isEnabled = useMCPStore((state) => state.settings.enabled);

  if (!isEnabled) {
    return null;
  }

  const availableServers = Object.entries(serverTools).filter(([_, server]) => server.status === 'available');

  if (availableServers.length === 0) {
    return null;
  }

  const displayText = selectedMCP || 'All';

  return (
    <DropdownMenu.Root>
      <WithTooltip tooltip="Select MCP Server">
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={classNames(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-md',
              'text-xs font-medium',
              'bg-codinit-elements-item-backgroundDefault',
              'text-codinit-elements-textSecondary',
              'hover:bg-codinit-elements-item-backgroundActive',
              'border border-codinit-elements-borderColor',
              'transition-colors duration-150',
              'outline-none',
            )}
          >
            <div className="i-ph:cpu text-sm" />
            <span>{displayText}</span>
            <div className="i-ph:caret-down text-xs" />
          </button>
        </DropdownMenu.Trigger>
      </WithTooltip>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={classNames(
            'bg-codinit-elements-background-depth-2',
            'border border-codinit-elements-borderColor',
            'rounded-lg shadow-lg',
            'p-1',
            'z-50',
            'max-h-64 overflow-y-auto',
            'min-w-48',
          )}
          sideOffset={5}
        >
          <DropdownMenu.Item
            className={classNames(
              'flex items-center justify-between gap-2 px-3 py-2 rounded-md',
              'text-sm text-codinit-elements-textPrimary',
              'cursor-pointer outline-none',
              'hover:bg-codinit-elements-item-backgroundActive',
              {
                'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent': !selectedMCP,
              },
            )}
            onSelect={() => setSelectedMCP(null)}
          >
            <span>All Servers</span>
            {!selectedMCP && <div className="i-ph:check text-sm" />}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-codinit-elements-borderColor my-1" />

          {availableServers.map(([serverName, server]) => (
            <DropdownMenu.Item
              key={serverName}
              className={classNames(
                'flex items-center justify-between gap-2 px-3 py-2 rounded-md',
                'text-sm text-codinit-elements-textPrimary',
                'cursor-pointer outline-none',
                'hover:bg-codinit-elements-item-backgroundActive',
                {
                  'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent':
                    selectedMCP === serverName,
                },
              )}
              onSelect={() => setSelectedMCP(serverName)}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{serverName}</span>
                {server.status === 'available' && (
                  <span className="text-xs text-codinit-elements-textTertiary">
                    {Object.keys(server.tools).length} tools
                  </span>
                )}
              </div>
              {selectedMCP === serverName && <div className="i-ph:check text-sm" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
