import { memo } from 'react';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { IconButton } from '~/components/ui/IconButton';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface CodeModeHeaderProps {
  onTerminalToggle: () => void;
  onDownloadZip: () => void;
  onSyncFiles: () => void;
  onPushToGitHub: () => void;
  isSyncing: boolean;
  setIsPushDialogOpen: (open: boolean) => void;
  showTerminal: boolean;
}

export const CodeModeHeader = memo(
  ({
    onTerminalToggle,
    onDownloadZip,
    onSyncFiles,
    onPushToGitHub,
    isSyncing,
    setIsPushDialogOpen,
    showTerminal,
  }: CodeModeHeaderProps) => {
    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    return (
      <div className="flex relative items-center gap-2 py-2 min-h-[var(--panel-header-height)] pl-0 bg-codinit-elements-background-depth-2">
        {/* Toggle Buttons Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              aria-label="Preview"
              aria-pressed="false"
              className="flex items-center justify-center w-8 h-8 rounded-md text-codinit-elements-icon-secondary hover:text-codinit-elements-item-contentActive hover:bg-codinit-elements-item-backgroundActive transition-colors"
              onClick={() => setSelectedView('preview')}
            >
              <span className="i-lucide:eye size-4"></span>
            </button>
            <button
              aria-label="Code"
              aria-pressed="true"
              className="flex items-center justify-center w-8 h-8 rounded-md text-codinit-elements-item-contentAccent bg-codinit-elements-item-backgroundAccent hover:bg-codinit-elements-item-backgroundActive transition-colors"
              onClick={() => setSelectedView('code')}
            >
              <span className="i-lucide:code size-4"></span>
            </button>
            <button
              aria-label="Database - Connected"
              aria-pressed="false"
              className="flex items-center justify-center w-8 h-8 rounded-md text-codinit-elements-icon-secondary hover:text-codinit-elements-item-contentActive hover:bg-codinit-elements-item-backgroundActive transition-colors"
            >
              <span className="i-lucide:database size-4"></span>
            </button>
            <button
              aria-label="Terminal"
              aria-pressed={showTerminal}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                showTerminal
                  ? 'text-codinit-elements-item-contentAccent bg-codinit-elements-item-backgroundAccent hover:bg-codinit-elements-item-backgroundActive'
                  : 'text-codinit-elements-icon-secondary hover:text-codinit-elements-item-contentActive hover:bg-codinit-elements-item-backgroundActive'
              }`}
              onClick={onTerminalToggle}
            >
              <span className="i-lucide:terminal size-4"></span>
            </button>
          </div>
          <div className="flex items-center">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  className="bg-transparent p-0"
                  aria-label="More Options"
                >
                  <div className="flex items-center bg-transparent text-sm px-2 py-1 rounded-full relative text-codinit-elements-item-contentDefault hover:text-codinit-elements-item-contentActive pl-1 pr-1.5 h-5 opacity-90 hover:opacity-100">
                    <span className="i-lucide:settings text-current w-4 h-4"></span>
                  </div>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                className="min-w-[240px] z-[250] bg-codinit-elements-background-depth-2 dark:bg-[#141414] rounded-lg shadow-xl border border-codinit-elements-borderColor animate-in fade-in-0 zoom"
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
            <div className="flex gap-1">
              <IconButton
                icon="i-codinit:stars"
                className="text-codinit-elements-item-contentDefault bg-transparent rounded-md disabled:cursor-not-allowed enabled:hover:text-codinit-elements-item-contentActive enabled:hover:bg-codinit-elements-item-backgroundActive p-1 relative w-8 h-8"
              />
            </div>
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
