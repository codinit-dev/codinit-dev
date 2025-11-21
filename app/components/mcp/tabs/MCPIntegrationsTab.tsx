/* eslint-disable @typescript-eslint/naming-convention */
import { useState, useMemo, useEffect } from 'react';
import { useMCPStore } from '~/lib/stores/mcp';
import { McpServerCard } from '~/components/mcp/MCPServerCard';
import { AddMcpServerDialog } from '~/components/mcp/AddMcpServerDialog';
import type { MCPServerConfig } from '~/types/mcp';
import { toast } from 'react-toastify';

function MCPIntegrationsTab() {
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const isInitialized = useMCPStore((state) => state.isInitialized);
  const serverTools = useMCPStore((state) => state.serverTools);
  const settings = useMCPStore((state) => state.settings);
  const initialize = useMCPStore((state) => state.initialize);
  const checkServersAvailabilities = useMCPStore((state) => state.checkServersAvailabilities);
  const retryServerConnection = useMCPStore((state) => state.retryServerConnection);
  const updateSettings = useMCPStore((state) => state.updateSettings);
  const isCheckingServers = useMCPStore((state) => state.isCheckingServers);

  const serverEntries = useMemo(() => Object.entries(serverTools), [serverTools]);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  // Set up periodic connection checking
  useEffect(() => {
    if (!isInitialized || serverEntries.length === 0) {
      return undefined;
    }

    // Initial check
    checkServersAvailabilities();

    // Set up periodic checking every 30 seconds
    const interval = setInterval(() => {
      checkServersAvailabilities();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialized, serverEntries.length]);

  const handleCheckServers = () => {
    setError(null);
    checkServersAvailabilities();
  };

  const handleAddServer = async (name: string, config: MCPServerConfig) => {
    try {
      const isEditing = name.startsWith('edit-');
      const actualName = isEditing ? name.replace('edit-', '') : name;

      // Pre-flight validation
      const validationResponse = await fetch('/api/mcp-validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName: actualName, config }),
      });

      if (!validationResponse.ok) {
        const errorData = (await validationResponse.json()) as { error: string };
        toast.error(errorData.error || 'Failed to validate configuration');
        throw new Error(errorData.error);
      }

      const validation = (await validationResponse.json()) as {
        isValid: boolean;
        error?: string;
        config?: MCPServerConfig;
      };

      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid server configuration');
        throw new Error(validation.error);
      }

      const newConfig = {
        ...settings,
        mcpConfig: {
          mcpServers: {
            ...settings.mcpConfig.mcpServers,
            [actualName]: validation.config || config,
          },
        },
      };

      await updateSettings(newConfig);
      setIsAddDialogOpen(false);
      toast.success(`Server "${actualName}" ${isEditing ? 'updated' : 'added'} successfully`);
    } catch (error) {
      toast.error(
        `Failed to ${name.startsWith('edit-') ? 'update' : 'add'} server: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  };

  const handleDeleteServer = async (serverName: string) => {
    if (!confirm(`Are you sure you want to delete "${serverName}"?`)) {
      return;
    }

    try {
      const { [serverName]: _, ...remainingServers } = settings.mcpConfig.mcpServers;
      const newConfig = {
        ...settings,
        mcpConfig: {
          mcpServers: remainingServers,
        },
      };

      await updateSettings(newConfig);
      toast.success(`Server "${serverName}" deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditServer = (serverName: string) => {
    const serverConfig = settings.mcpConfig.mcpServers[serverName];

    if (!serverConfig) {
      toast.error(`Server "${serverName}" not found`);
      return;
    }

    /*
     * For now, we'll open the add dialog with edit mode
     * This will be replaced with a proper edit dialog later
     */
    setIsAddDialogOpen(true);
  };

  const handleTestConnection = async (config: MCPServerConfig): Promise<{ success: boolean; error?: string }> => {
    try {
      if (config.type === 'stdio' && !config.command) {
        return { success: false, error: 'Command is required for STDIO servers' };
      }

      if ((config.type === 'sse' || config.type === 'streamable-http') && !config.url) {
        return { success: false, error: 'URL is required for SSE/HTTP servers' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Invalid configuration' };
    }
  };

  return (
    <>
      {/* Description */}
      <div className="text-sm text-codinit-elements-textSecondary mb-6">
        <p>
          Manage your connected MCP servers. Need a quick integration? Check out Marketplace tab for pre-configured
          templates.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all flex items-center gap-2"
        >
          <i className="i-ph:plus" />
          Add Server
        </button>

        <button
          onClick={handleCheckServers}
          disabled={isCheckingServers || serverEntries.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-codinit-elements-background-depth-2 text-codinit-elements-textSecondary hover:bg-codinit-elements-background-depth-3 hover:text-codinit-elements-textPrimary transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingServers ? (
            <i className="i-svg-spinners:90-ring-with-bg" />
          ) : (
            <i className="i-ph:arrow-counter-clockwise" />
          )}
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <div className="flex items-start gap-3">
            <div className="i-ph:warning-circle w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Configuration Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Initialization Status */}
      {!isInitialized && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
          <div className="flex items-center gap-3">
            <div className="i-svg-spinners:90-ring-with-bg w-5 h-5 animate-spin" />
            <p>Loading MCP configuration...</p>
          </div>
        </div>
      )}

      {/* Server List */}
      {serverEntries.length > 0 ? (
        <div className="grid gap-4">
          {serverEntries.map(([serverName, server]) => (
            <McpServerCard
              key={serverName}
              serverName={serverName}
              server={server}
              onDelete={handleDeleteServer}
              onEdit={handleEditServer}
              onRetry={retryServerConnection}
              isCheckingServers={isCheckingServers}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <i className="i-ph:plug text-4xl text-codinit-elements-textTertiary mb-4" />
          <h3 className="text-lg font-medium text-codinit-elements-textPrimary mb-2">No MCP servers configured</h3>
          <p className="text-sm text-codinit-elements-textSecondary mb-4 max-w-md">
            MCP (Model Context Protocol) servers allow AI models to interact with external tools and services. Add a
            server to enable powerful integrations like file operations, database queries, and API calls.
          </p>
          <div className="flex flex-col gap-3 mb-6">
            <div className="text-xs text-codinit-elements-textTertiary">Popular MCP servers include:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-codinit-elements-background-depth-2 rounded text-xs">File System</span>
              <span className="px-2 py-1 bg-codinit-elements-background-depth-2 rounded text-xs">Git</span>
              <span className="px-2 py-1 bg-codinit-elements-background-depth-2 rounded text-xs">SQLite</span>
              <span className="px-2 py-1 bg-codinit-elements-background-depth-2 rounded text-xs">Web Search</span>
            </div>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all"
          >
            Add Server
          </button>
        </div>
      )}

      {/* Dialogs */}
      <AddMcpServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddServer}
        onTest={handleTestConnection}
      />
    </>
  );
}

export default MCPIntegrationsTab;
