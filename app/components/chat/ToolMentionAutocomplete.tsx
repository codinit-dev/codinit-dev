import type { ToolItem } from '~/lib/hooks/useToolMentionAutocomplete';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '~/utils/classNames';

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
      <div className="max-h-[300px] overflow-y-auto p-2">
        {tools.length === 0 ? (
          <div className="py-4 text-center text-sm text-codinit-elements-textTertiary">
            No tools found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          serverNames.map((serverName) => {
            const serverTools = groupedTools[serverName];

            return (
              <div key={serverName} className="mb-2">
                {showServerGroups && (
                  <div className="px-3 py-2 text-xs font-medium text-codinit-elements-textSecondary">
                    📦 {serverName}
                  </div>
                )}
                {serverTools.map((tool) => {
                  const currentIndex = globalIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={`${serverName}-${tool.name}`}
                      onClick={() => onSelect(tool.name)}
                      onMouseEnter={() => onHover(currentIndex)}
                      data-selected={isSelected}
                      className={classNames(
                        'cursor-pointer rounded-md px-3 py-2 mb-1 transition-colors',
                        isSelected
                          ? 'bg-accent-500 text-white'
                          : 'hover:bg-codinit-elements-item-backgroundDefault text-codinit-elements-textPrimary',
                      )}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔧</span>
                          <span className="font-medium text-sm">{tool.name}</span>
                        </div>
                        {tool.description && (
                          <div
                            className={classNames(
                              'text-xs ml-6',
                              isSelected ? 'text-white opacity-90' : 'text-codinit-elements-textSecondary',
                            )}
                          >
                            {tool.description.length > 100 ? `${tool.description.slice(0, 100)}...` : tool.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
