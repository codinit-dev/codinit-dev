import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '~/components/ui/Command';
import type { ToolItem } from '~/lib/hooks/useToolMentionAutocomplete';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

interface ToolMentionAutocompleteProps {
  tools: ToolItem[];
  selectedIndex: number;
  position: { x: number; y: number } | null;
  onSelect: (toolName: string) => void;
  onHover: (index: number) => void;
  searchQuery: string;
}

export function ToolMentionAutocomplete({
  tools,
  selectedIndex,
  position,
  onSelect,
  onHover,
  searchQuery,
}: ToolMentionAutocompleteProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!position || !dropdownRef.current) {
      setAdjustedPosition(position);

      return;
    }

    const dropdown = dropdownRef.current;
    const rect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let { x, y } = position;

    if (y + rect.height > viewportHeight) {
      y = position.y - rect.height - 10;
    }

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }

    setAdjustedPosition({ x, y });
  }, [position, tools]);

  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedItem = dropdownRef.current.querySelector('[data-selected="true"]');

      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!adjustedPosition || tools.length === 0) {
    return null;
  }

  const groupedTools = tools.reduce(
    (acc, tool) => {
      if (!acc[tool.serverName]) {
        acc[tool.serverName] = [];
      }

      acc[tool.serverName].push(tool);

      return acc;
    },
    {} as Record<string, ToolItem[]>,
  );

  const serverNames = Object.keys(groupedTools);
  const showServerGroups = serverNames.length > 1;

  let globalIndex = 0;

  const content = (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] min-w-[400px] max-w-[500px] bg-codinit-elements-bg-depth-1 border border-codinit-elements-borderColor rounded-lg shadow-lg transition-theme"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <Command className="bg-transparent border-none">
        <CommandList className="max-h-[300px] overflow-y-auto p-2">
          <CommandEmpty className="py-4 text-sm text-codinit-elements-textTertiary">
            No tools found for &quot;{searchQuery}&quot;
          </CommandEmpty>

          {serverNames.map((serverName) => {
            const serverTools = groupedTools[serverName];

            return (
              <CommandGroup
                key={serverName}
                heading={showServerGroups ? `📦 ${serverName}` : undefined}
                className="px-0"
              >
                {serverTools.map((tool) => {
                  const currentIndex = globalIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <CommandItem
                      key={`${serverName}-${tool.name}`}
                      value={tool.name}
                      onSelect={() => onSelect(tool.name)}
                      onMouseEnter={() => onHover(currentIndex)}
                      data-selected={isSelected}
                      className={`
                        cursor-pointer rounded-md px-3 py-2 mb-1
                        ${
                          isSelected
                            ? 'bg-accent-500 text-white'
                            : 'hover:bg-codinit-elements-item-backgroundDefault text-codinit-elements-textPrimary'
                        }
                      `}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔧</span>
                          <span className="font-medium text-sm">{tool.name}</span>
                        </div>
                        {tool.description && (
                          <div
                            className={`text-xs ml-6 ${
                              isSelected ? 'text-white opacity-90' : 'text-codinit-elements-textSecondary'
                            }`}
                          >
                            {tool.description.length > 100 ? `${tool.description.slice(0, 100)}...` : tool.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </div>
  );

  return createPortal(content, document.body);
}
