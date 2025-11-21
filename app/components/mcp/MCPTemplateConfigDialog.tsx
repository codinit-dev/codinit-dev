import { memo, useState, useEffect } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogClose } from '~/components/ui/Dialog';
import type { MCPServerConfig } from '~/types/mcp';
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
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form when template changes
  useEffect(() => {
    if (template && template.id.startsWith('edit-')) {
      // Editing existing server
      setIsEditing(true);
      setServerName(template.name);

      // Pre-fill form with existing config
      const initialValues: Record<string, string> = {};

      if (template.config.type === 'stdio') {
        initialValues.command = template.config.command || '';
        initialValues.args = template.config.args?.join(' ') || '';
        initialValues.cwd = template.config.cwd || '';
      } else {
        initialValues.url = template.config.url || '';

        // Extract headers to field values
        if (template.config.headers) {
          const headers = template.config.headers;

          if (headers.Authorization && headers.Authorization.startsWith('Bearer ')) {
            initialValues.apiKey = headers.Authorization.substring(7);
          } else if (headers['X-API-Key']) {
            initialValues.projectApiKey = headers['X-API-Key'];
          }
        }
      }

      setFieldValues(initialValues);
    } else {
      // Adding new server
      setIsEditing(false);
      setServerName('');
      setFieldValues({});
    }
  }, [template]);

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

      if (config.type === 'stdio') {
        // Handle STDIO configuration
        config.command = fieldValues.command?.trim() || '';

        if (fieldValues.args?.trim()) {
          config.args = fieldValues.args
            .trim()
            .split(/\s+/)
            .filter((arg) => arg.length > 0);
        }

        if (fieldValues.cwd?.trim()) {
          config.cwd = fieldValues.cwd.trim();
        }
      } else {
        // Handle SSE/HTTP configuration
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
            } else if (field.key === 'headers') {
              try {
                const customHeaders = JSON.parse(value);
                Object.assign(headers, customHeaders);
              } catch {
                // Skip invalid JSON
              }
            } else {
              headers[`X-${field.key}`] = value;
            }
          }
        }

        // Update URL if provided
        if (fieldValues.url?.trim()) {
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
                  <p className="text-xs text-codinit-elements-textSecondary mt-0.5">{template.description}</p>
                </div>
              </div>
              <DialogClose asChild>
                <IconButton icon="i-ph:x" onClick={handleClose} />
              </DialogClose>
            </div>

            <div className="space-y-4">
              {/* Server Name */}
              <div>
                <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                  Server Name <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder={`e.g., ${template.name.toLowerCase()}`}
                  className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                />
              </div>

              {/* Template Fields */}
              {template.requiredFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
                    {field.label} {field.required && <span className="text-red-600 dark:text-red-400">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
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
              <div className="p-3 rounded-lg text-xs bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor text-codinit-elements-textSecondary">
                <i className="i-ph:info inline-block mr-1" />
                Your credentials are stored locally and never sent to our servers.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-6">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-3 transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !serverName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <i className="i-svg-spinners:90-ring-with-bg animate-spin" />}
                {isEditing ? 'Update Integration' : 'Add Integration'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </DialogRoot>
  );
});
