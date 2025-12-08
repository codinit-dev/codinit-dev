import { memo, useMemo } from 'react';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { IconButton } from '~/components/ui/IconButton';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { diffLines, type Change } from 'diff';

interface DiffViewHeaderProps {
  filename: string;
  beforeCode: string;
  afterCode: string;
  hasChanges: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const DiffViewHeader = memo(
  ({ filename, beforeCode, afterCode, hasChanges, isFullscreen, onToggleFullscreen }: DiffViewHeaderProps) => {
    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    const { additions, deletions } = useMemo(() => {
      if (!hasChanges) {
        return { additions: 0, deletions: 0 };
      }

      const changes = diffLines(beforeCode, afterCode, {
        newlineIsToken: false,
        ignoreWhitespace: true,
        ignoreCase: false,
      });

      return changes.reduce(
        (acc: { additions: number; deletions: number }, change: Change) => {
          if (change.added) {
            acc.additions += change.value.split('\n').length;
          }

          if (change.removed) {
            acc.deletions += change.value.split('\n').length;
          }

          return acc;
        },
        { additions: 0, deletions: 0 },
      );
    }, [hasChanges, beforeCode, afterCode]);

    const showStats = additions > 0 || deletions > 0;

    return (
      <div className="flex relative items-center gap-2 py-2 h-12 pl-2 pr-3 z-50">
        {/* Toggle Buttons Section */}
        <div className="flex items-center gap-2 ml-8">
          <div className="flex items-center gap-1">
            <IconButton
              icon="i-lucide:eye"
              className="w-8 h-8"
              title="Preview"
              onClick={() => setSelectedView('preview')}
            />
            <IconButton icon="i-lucide:code" className="w-8 h-8" title="Code" onClick={() => setSelectedView('code')} />
            <IconButton
              icon="i-lucide:git-compare-arrows"
              className="w-8 h-8"
              title="Diff"
              onClick={() => setSelectedView('diff')}
            />
          </div>
          <div className="flex items-center">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 text-codinit-elements-item-contentDefault bg-transparent hover:text-codinit-elements-item-contentActive rounded-md hover:bg-codinit-elements-item-backgroundActive transition-colors"
                  title="More Options"
                >
                  <span className="i-lucide:settings size-4"></span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                className="min-w-[240px] z-[250] bg-codinit-elements-background-depth-3 rounded-lg shadow-xl border border-codinit-elements-borderColor animate-in fade-in-0 zoom"
                sideOffset={5}
                align="start"
              >
                <DropdownMenu.Item
                  className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive gap-2 rounded-md group relative"
                  onClick={onToggleFullscreen}
                >
                  <div className="flex items-center gap-2">
                    <span className={isFullscreen ? 'i-lucide:minimize-2' : 'i-lucide:maximize-2'} />
                    <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* File Info Section */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 bg-codinit-elements-background-depth-1 rounded-full border border-codinit-elements-borderColor">
          <div className="i-lucide:file h-4 w-4 text-codinit-elements-textTertiary" />
          <span className="text-sm text-codinit-elements-textPrimary truncate max-w-[300px]">{filename}</span>
          {showStats && (
            <div className="flex items-center gap-1 text-xs ml-2">
              {additions > 0 && <span className="text-green-700 dark:text-green-500">+{additions}</span>}
              {deletions > 0 && <span className="text-red-700 dark:text-red-500">-{deletions}</span>}
            </div>
          )}
          {hasChanges ? (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">Modified</span>
          ) : (
            <span className="text-xs text-green-700 dark:text-green-400 ml-2">No Changes</span>
          )}
        </div>

        {/* Right Section - Fullscreen Button */}
        <div className="ml-auto">
          <IconButton
            icon={isFullscreen ? 'i-lucide:minimize-2' : 'i-lucide:maximize-2'}
            className="w-8 h-8"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            onClick={onToggleFullscreen}
          />
        </div>
      </div>
    );
  },
);
