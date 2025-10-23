import { memo, useState } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogClose } from '~/components/ui/Dialog';
import type { MCPServerConfig } from '~/lib/services/mcpService';
import type { MCPTemplate } from './MCPMarketplace';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';

interface MCPTemplateConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: MCPTemplate | null;
  onSave: (name: string, config: MCPServerConfig) => Promise<void>;
}

export const McpTemplateConfigDialog = memo(({ isOpen, onClose, template, onSave }: MCPTemplateConfigDialogProps) => {
  const [serverName, setServerName] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!template) {
      return;
    }

    // Validate server name
    if (!serverName.trim()) {
      setError('Server name is required');
      return;
    }

    // Validate required fields
    for (const field of template.requiredFields) {
      if (field.required && !fieldValues[field.key]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      // Build config based on template
      const config: MCPServerConfig = { ...template.config };

      // Add headers for SSE/HTTP types with credentials
      if (config.type === 'sse' || config.type === 'streamable-http') {
        const headers: Record<string, string> = {};

        // Map field values to headers
        for (const field of template.requiredFields) {
          const value = fieldValues[field.key]?.trim();

          if (value) {
            // Common header mappings
            if (field.key === 'apiKey' || field.key === 'token' || field.key === 'accessToken') {
              headers.Authorization = `Bearer ${value}`;
            } else if (field.key === 'projectApiKey') {
              headers['X-API-Key'] = value;
            } else {
              headers[`X-${field.key}`] = value;
            }
          }
        }

        // Update URL if host field is provided
        if (fieldValues.host?.trim()) {
          config.url = fieldValues.host.trim();
        } else if (fieldValues.url?.trim()) {
          config.url = fieldValues.url.trim();
        }

        if (Object.keys(headers).length > 0) {
          config.headers = headers;
        }
      }

      await onSave(serverName.trim(), config);

      // Reset form
      setServerName('');
      setFieldValues({});
      onClose();
    } catch {
      setError('Failed to save server configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setServerName('');
    setFieldValues({});
    setError(null);
    onClose();
  };

  if (!template) {
    return null;
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={handleClose}>
      {isOpen && (
        <Dialog className="max-w-lg w-full" showCloseButton={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: template.iconBgColor }}
                >
                  <i className={classNames(template.icon, 'text-xl')} style={{ color: template.iconColor }} />
                </div>
                <div>
                  <DialogTitle>Configure {template.name}</DialogTitle>
                  <p className="text-xs text-bolt-elements-textSecondary mt-0.5">{template.description}</p>
                </div>
              </div>
              <DialogClose asChild>
                <IconButton icon="i-ph:x" onClick={handleClose} />
              </DialogClose>
            </div>

            <div className="space-y-4">
              {/* Server Name */}
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder={`e.g., ${template.name.toLowerCase()}`}
                  className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                />
              </div>

              {/* Template Fields */}
              {template.requiredFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  />
                </div>
              ))}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-500">
                  ✗ {error}
                </div>
              )}

              {/* Info Message */}
              <div className="p-3 rounded-lg text-xs bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textSecondary">
                <i className="i-ph:info inline-block mr-1" />
                Your credentials are stored locally and never sent to our servers.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-6">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !serverName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <i className="i-svg-spinners:90-ring-with-bg animate-spin" />}
                Add Integration
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </DialogRoot>
  );
});
