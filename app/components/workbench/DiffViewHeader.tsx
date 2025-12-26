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
      <div className="flex relative items-center justify-center gap-4 h-10 pl-2 pr-2 z-50 bg-codinit-elements-background-depth-2 border-b border-codinit-elements-borderColor">
        {/* Toggle Buttons Section */}
        <div className="flex items-center gap-1 bg-codinit-elements-background-depth-2 rounded-full p-0.5 border border-codinit-elements-borderColor">
          <IconButton
            icon="i-lucide:eye"
            className="w-7 h-7"
            title="Preview"
            onClick={() => setSelectedView('preview')}
          />
          <IconButton icon="i-lucide:code" className="w-7 h-7" title="Code" onClick={() => setSelectedView('code')} />
          <IconButton
            icon="i-lucide:git-compare-arrows"
            className="w-7 h-7 rounded-md bg-codinit-elements-item-backgroundActive text-codinit-elements-item-contentAccent"
            title="Diff"
            onClick={() => setSelectedView('diff')}
          />
          <div className="flex items-center">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 text-codinit-elements-item-contentDefault bg-transparent hover:text-codinit-elements-item-contentActive rounded-md hover:bg-codinit-elements-item-backgroundActive transition-colors"
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

        {/* File Info Section (Centered to match Address Bar) */}
        <div className="flex justify-center max-w-md w-full">
          <div className="flex items-center gap-2 px-3 py-0.5 bg-codinit-elements-background-depth-1 rounded-full border border-codinit-elements-borderColor shadow-sm">
            <div className="i-lucide:file h-3.5 w-3.5 text-codinit-elements-textTertiary" />
            <span className="text-xs text-codinit-elements-textPrimary truncate max-w-[300px]">{filename}</span>
            {showStats && (
              <div className="flex items-center gap-1 text-[10px] ml-2">
                {additions > 0 && <span className="text-green-700 dark:text-green-500">+{additions}</span>}
                {deletions > 0 && <span className="text-red-700 dark:text-red-500">-{deletions}</span>}
              </div>
            )}
            {hasChanges ? (
              <span className="text-[10px] text-yellow-600 dark:text-yellow-400 ml-2">Modified</span>
            ) : (
              <span className="text-[10px] text-green-700 dark:text-green-400 ml-2">No Changes</span>
            )}
          </div>
        </div>

        {/* Right Section - Fullscreen Button */}
        <div className="flex items-center gap-1 bg-codinit-elements-background-depth-2 rounded-full p-0.5 border border-codinit-elements-borderColor">
          <IconButton
            icon={isFullscreen ? 'i-lucide:minimize-2' : 'i-lucide:maximize-2'}
            className="w-7 h-7"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            onClick={onToggleFullscreen}
          />
        </div>
      </div>
    );
  },
);
