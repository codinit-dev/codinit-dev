import type { ToolItem, FileItem } from '~/lib/hooks/useToolMentionAutocomplete';
import { useEffect, useRef } from 'react';
import { classNames } from '~/utils/classNames';
import { File } from 'lucide-react';

interface ToolMentionAutocompleteProps {
  isOpen: boolean;
  tools: ToolItem[];
  files: FileItem[];
  selectedIndex: number;
  position: { x: number; y: number } | null;
  onSelectTool: (toolName: string) => void;
  onSelectFile: (filePath: string) => void;
  onHover: (index: number) => void;
  onClose: () => void;
  searchQuery: string;
  referenceType: 'file' | 'tool';
}

export function ToolMentionAutocomplete({
  isOpen,
  tools,
  files,
  selectedIndex,
  position,
  onSelectTool,
  onSelectFile,
  onHover,
  onClose,
  searchQuery,
  referenceType,
}: ToolMentionAutocompleteProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedItem = dropdownRef.current.querySelector('[data-selected="true"]');

      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) {
      return () => {
        /* empty */
      };
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) {
    return null;
  }

  if (referenceType === 'file') {
    return (
      <div
        ref={dropdownRef}
        className="fixed z-[9999] min-w-[400px] max-w-[500px] bg-codinit-elements-bg-depth-1 border border-codinit-elements-borderColor rounded-lg shadow-lg transition-theme"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="max-h-[300px] overflow-y-auto p-2">
          {files.length === 0 ? (
            <div className="py-4 text-center text-sm text-codinit-elements-textTertiary">
              No files found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium text-codinit-elements-textSecondary">📁 Files</div>
              {files.map((file, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={file.path}
                    onClick={() => onSelectFile(file.relativePath)}
                    onMouseEnter={() => onHover(index)}
                    data-selected={isSelected}
                    className={classNames(
                      'cursor-pointer rounded-md px-3 py-2 mb-1 transition-colors',
                      isSelected
                        ? 'bg-accent-500 text-white'
                        : 'hover:bg-codinit-elements-item-backgroundDefault text-codinit-elements-textPrimary',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <File size={16} className={isSelected ? 'text-white' : 'text-codinit-elements-textSecondary'} />
                      <span className="font-medium text-sm font-mono">{file.relativePath}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
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

  return (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] min-w-[400px] max-w-[500px] bg-codinit-elements-bg-depth-1 border border-codinit-elements-borderColor rounded-lg shadow-lg transition-theme"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
                      onClick={() => onSelectTool(tool.name)}
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
}
