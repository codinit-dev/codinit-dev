import { memo } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogClose } from '~/components/ui/Dialog';
import { McpServerForm } from './McpServerForm';
import type { MCPServerConfig } from '~/types/mcp';
import { IconButton } from '~/components/ui/IconButton';

interface AddMcpServerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, config: MCPServerConfig) => Promise<void>;
  onTest?: (config: MCPServerConfig) => Promise<{ success: boolean; error?: string }>;
}

export const AddMcpServerDialog = memo(({ isOpen, onClose, onSave, onTest }: AddMcpServerDialogProps) => {
  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      {isOpen && (
        <Dialog className="max-w-2xl w-full" showCloseButton={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <DialogTitle>Add MCP Server</DialogTitle>
              <DialogClose asChild>
                <IconButton icon="i-ph:x" onClick={onClose} />
              </DialogClose>
            </div>

            <div className="text-sm text-codinit-elements-textSecondary mb-6">
              Configure a new Model Context Protocol server. Choose the appropriate server type and fill in the required
              details.
            </div>

            <McpServerForm onSave={onSave} onCancel={onClose} onTest={onTest} />
          </div>
        </Dialog>
      )}
    </DialogRoot>
  );
});
