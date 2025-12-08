import { memo } from 'react';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { IconButton } from '~/components/ui/IconButton';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface CodeModeHeaderProps {
  onDownloadZip: () => void;
  onSyncFiles: () => void;
  onPushToGitHub: () => void;
  isSyncing: boolean;
  setIsPushDialogOpen: (open: boolean) => void;
}

export const CodeModeHeader = memo(
  ({ onDownloadZip, onSyncFiles, onPushToGitHub, isSyncing, setIsPushDialogOpen }: CodeModeHeaderProps) => {
    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

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
                  onClick={onDownloadZip}
                >
                  <div className="flex items-center gap-2">
                    <span className="i-lucide:download text-current"></span>
                    <span>Download Code</span>
                  </div>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive gap-2 rounded-md group relative"
                  onClick={onSyncFiles}
                  disabled={isSyncing}
                >
                  <div className="flex items-center gap-2">
                    {isSyncing ? (
                      <span className="i-lucide:loader-2 text-current animate-spin" />
                    ) : (
                      <span className="i-lucide:cloud-download text-current" />
                    )}
                    <span>{isSyncing ? 'Syncing...' : 'Sync Files'}</span>
                  </div>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive gap-2 rounded-md group relative"
                  onClick={onPushToGitHub}
                >
                  <div className="flex items-center gap-2">
                    <span className="i-lucide:git-branch text-current" />
                    <span>Push to GitHub</span>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="ml-auto">
          <div className="flex gap-3">
            <div className="flex gap-1 empty:hidden"></div>
            <button
              className="items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-ds-brandHighlight bg-codinit-elements-textPrimary text-codinit-elements-background-depth-1 flex gap-1.7 shrink-0 h-8 text-sm px-3"
              type="button"
              aria-controls="publish-menu"
              onClick={() => setIsPushDialogOpen(true)}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    );
  },
);
