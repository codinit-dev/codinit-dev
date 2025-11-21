import { memo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import type { MCPServerConfig } from '~/types/mcp';

type ServerType = 'stdio' | 'sse' | 'streamable-http';

interface McpServerFormProps {
  initialData?: {
    name: string;
    config: MCPServerConfig;
  };
  onSave: (name: string, config: MCPServerConfig) => Promise<void>;
  onCancel: () => void;
  onTest?: (config: MCPServerConfig) => Promise<{ success: boolean; error?: string }>;
}

export const McpServerForm = memo(({ initialData, onSave, onCancel, onTest }: McpServerFormProps) => {
  const [serverType, setServerType] = useState<ServerType>(initialData?.config.type || 'stdio');
  const [serverName, setServerName] = useState(initialData?.name || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // STDIO fields
  const [stdioCommand, setStdioCommand] = useState(
    initialData?.config.type === 'stdio' ? initialData.config.command : '',
  );
  const [stdioArgs, setStdioArgs] = useState(
    initialData?.config.type === 'stdio' ? initialData.config.args?.join(' ') || '' : '',
  );
  const [stdioCwd, setStdioCwd] = useState(initialData?.config.type === 'stdio' ? initialData.config.cwd || '' : '');
  const [stdioEnv, setStdioEnv] = useState(
    initialData?.config.type === 'stdio' ? JSON.stringify(initialData.config.env || {}, null, 2) : '{}',
  );

  // SSE/HTTP fields
  const [url, setUrl] = useState(
    initialData?.config.type === 'sse' || initialData?.config.type === 'streamable-http' ? initialData.config.url : '',
  );
  const [headers, setHeaders] = useState(
    initialData?.config.type === 'sse' || initialData?.config.type === 'streamable-http'
      ? JSON.stringify(initialData.config.headers || {}, null, 2)
      : '{}',
  );

  const buildConfig = (): MCPServerConfig | null => {
    try {
      if (serverType === 'stdio') {
        const config: MCPServerConfig = {
          type: 'stdio',
          command: stdioCommand.trim(),
        };

        if (stdioArgs.trim()) {
          config.args = stdioArgs
            .split(' ')
            .map((arg) => arg.trim())
            .filter(Boolean);
        }

        if (stdioCwd.trim()) {
          config.cwd = stdioCwd.trim();
        }

        if (stdioEnv.trim() && stdioEnv.trim() !== '{}') {
          config.env = JSON.parse(stdioEnv);
        }

        return config;
      } else {
        const baseConfig = {
          type: serverType,
          url: url.trim(),
        };

        const config: MCPServerConfig =
          headers.trim() && headers.trim() !== '{}' ? { ...baseConfig, headers: JSON.parse(headers) } : baseConfig;

        return config;
      }
    } catch (err) {
      console.error('Error building config:', err);
      return null;
    }
  };

  const handleTest = async () => {
    if (!onTest) {
      return;
    }

    const config = buildConfig();

    if (!config) {
      setTestResult({ success: false, error: 'Invalid configuration' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(config);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!serverName.trim()) {
      setTestResult({ success: false, error: 'Server name is required' });
      return;
    }

    const config = buildConfig();

    if (!config) {
      setTestResult({ success: false, error: 'Invalid configuration' });
      return;
    }

    setIsSaving(true);

    try {
      await onSave(serverName.trim(), config);
    } catch {
      setTestResult({ success: false, error: 'Failed to save server' });
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Server Name */}
      <div>
        <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">Server Name</label>
        <input
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="e.g., my-mcp-server"
          className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
          disabled={!!initialData}
        />
      </div>

      {/* Server Type */}
      <div>
        <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">Server Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setServerType('stdio')}
            className={classNames(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              serverType === 'stdio'
                ? 'bg-accent-500 text-white'
                : 'bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
            )}
          >
            STDIO
          </button>
          <button
            onClick={() => setServerType('sse')}
            className={classNames(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              serverType === 'sse'
                ? 'bg-accent-500 text-white'
                : 'bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
            )}
          >
            SSE
          </button>
          <button
            onClick={() => setServerType('streamable-http')}
            className={classNames(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              serverType === 'streamable-http'
                ? 'bg-accent-500 text-white'
                : 'bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary',
            )}
          >
            HTTP
          </button>
        </div>
      </div>

      {/* STDIO Fields */}
      {serverType === 'stdio' && (
        <>
          <div>
            <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
              Command <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={stdioCommand}
              onChange={(e) => setStdioCommand(e.target.value)}
              placeholder="e.g., npx"
              className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
              Arguments (space-separated)
            </label>
            <input
              type="text"
              value={stdioArgs}
              onChange={(e) => setStdioArgs(e.target.value)}
              placeholder="e.g., -y @modelcontextprotocol/server-filesystem"
              className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
              Working Directory (optional)
            </label>
            <input
              type="text"
              value={stdioCwd}
              onChange={(e) => setStdioCwd(e.target.value)}
              placeholder="e.g., /path/to/directory"
              className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
              Environment Variables (JSON, optional)
            </label>
            <textarea
              value={stdioEnv}
              onChange={(e) => setStdioEnv(e.target.value)}
              placeholder='{"KEY": "value"}'
              rows={3}
              className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50 font-mono"
            />
          </div>
        </>
      )}

      {/* SSE/HTTP Fields */}
      {(serverType === 'sse' || serverType === 'streamable-http') && (
        <>
          <div>
            <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
              URL <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://api.example.com/mcp"
              className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codinit-elements-textPrimary mb-1.5">
              Headers (JSON, optional)
            </label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Authorization": "Bearer token"}'
              rows={3}
              className="w-full px-3 py-2 bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-lg text-sm text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/50 font-mono"
            />
          </div>
        </>
      )}

      {/* Test Result */}
      {testResult && (
        <div
          className={classNames(
            'p-3 rounded-lg text-sm',
            testResult.success
              ? 'bg-green-500/10 border border-green-500/30 text-green-500'
              : 'bg-red-500/10 border border-red-500/30 text-red-500',
          )}
        >
          {testResult.success ? '✓ Connection successful!' : `✗ ${testResult.error || 'Connection failed'}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-codinit-elements-background-depth-1 text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-3 transition-all disabled:opacity-50"
        >
          Cancel
        </button>

        {onTest && (
          <button
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-codinit-elements-background-depth-3 text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-4 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isTesting && <i className="i-svg-spinners:90-ring-with-bg animate-spin" />}
            Test Connection
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || !serverName.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <i className="i-svg-spinners:90-ring-with-bg animate-spin" />}
          {initialData ? 'Update' : 'Add'} Server
        </button>
      </div>
    </div>
  );
});
