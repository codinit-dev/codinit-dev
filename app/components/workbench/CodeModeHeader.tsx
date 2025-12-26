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
      <div className="flex items-center justify-center gap-4 h-10 pl-2 pr-2 bg-codinit-elements-background-depth-2 border-b border-codinit-elements-borderColor">
        {/* Toggle Buttons Section */}
        <div className="flex items-center gap-1 bg-codinit-elements-background-depth-2 rounded-full p-0.5 border border-codinit-elements-borderColor">
          <IconButton
            icon="i-lucide:eye"
            className="w-7 h-7"
            title="Preview"
            onClick={() => setSelectedView('preview')}
          />
          <IconButton
            icon="i-lucide:code"
            className="w-7 h-7 rounded-md bg-codinit-elements-item-backgroundActive text-codinit-elements-item-contentAccent"
            title="Code"
            onClick={() => setSelectedView('code')}
          />
          <IconButton
            icon="i-lucide:git-compare-arrows"
            className="w-7 h-7"
            title="Diff"
            onClick={() => setSelectedView('diff')}
          />
          <div className="flex items-center">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <IconButton icon="i-lucide:settings" className="w-7 h-7" title="More Options" />
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

        {/* Spacer to match Address Bar position */}
        <div className="flex justify-center max-w-md w-full pointer-events-none" />

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 bg-codinit-elements-background-depth-2 rounded-full p-0.5 border border-codinit-elements-borderColor">
          <div className="flex gap-2">
            <div className="flex gap-1 empty:hidden"></div>
            <IconButton
              onClick={() => setIsPushDialogOpen(true)}
              title="Publish"
              className="px-3 w-auto flex gap-1 h-7 text-xs font-medium bg-codinit-elements-textPrimary text-codinit-elements-background-depth-1 rounded-md"
            >
              <div className="i-lucide:github text-base" />
              <span>Publish</span>
            </IconButton>
          </div>
        </div>
      </div>
    );
  },
);
