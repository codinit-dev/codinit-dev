import { motion, type Variants, AnimatePresence } from 'framer-motion';
import { memo, useState, useMemo, useEffect } from 'react';
import { cubicEasingFn } from '~/utils/easings';
import { useMCPStore } from '~/lib/stores/mcp';
import { McpServerCard } from './MCPServerCard';
import { IconButton } from '~/components/ui/IconButton';
import { AddMcpServerDialog } from './AddMcpServerDialog';
import { McpMarketplace } from './MCPMarketplace';
import { McpTemplateConfigDialog } from './MCPTemplateConfigDialog';
import { McpToolRegistry } from './MCPToolRegistry';
import { McpExecutionHistory } from './MCPExecutionHistory';
import type { MCPServerConfig } from '~/lib/services/mcpService';
import type { MCPTemplate } from './MCPMarketplace';
import { toast } from 'react-toastify';
import styles from './MCPIntegrationPanel.module.scss';

interface McpIntegrationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const panelVariants = {
  closed: {
    x: '100%',
    transition: {
      duration: 0.3,
      ease: cubicEasingFn,
    },
  },
  open: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

const backdropVariants = {
  closed: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type TabType = 'integrations' | 'marketplace' | 'tools' | 'history' | 'secrets';

export const McpIntegrationPanel = memo(({ isOpen, onClose }: McpIntegrationPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('integrations');
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MCPTemplate | null>(null);
  const [isTemplateConfigOpen, setIsTemplateConfigOpen] = useState(false);

  const isInitialized = useMCPStore((state) => state.isInitialized);
  const serverTools = useMCPStore((state) => state.serverTools);
  const settings = useMCPStore((state) => state.settings);
  const initialize = useMCPStore((state) => state.initialize);
  const checkServersAvailabilities = useMCPStore((state) => state.checkServersAvailabilities);
  const updateSettings = useMCPStore((state) => state.updateSettings);
  const isCheckingServers = useMCPStore((state) => state.isCheckingServers);
  const toolExecutions = useMCPStore((state) => state.toolExecutions);

  const clearExecutionHistory = useMCPStore((state) => state.clearExecutionHistory);

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

      const newConfig = {
        ...settings,
        mcpConfig: {
          mcpServers: {
            ...settings.mcpConfig.mcpServers,
            [actualName]: config,
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

    // Create a temporary template from existing server config
    const editTemplate: MCPTemplate = {
      id: `edit-${serverName}`,
      name: serverName,
      description: `Edit configuration for ${serverName}`,
      icon: 'i-ph:gear',
      iconColor: '#666666',
      iconBgColor: '#f0f0f0',
      category: 'development',
      config: serverConfig,
      requiredFields:
        serverConfig.type === 'stdio'
          ? [
              { key: 'command', label: 'Command', placeholder: 'mcp-server-command', type: 'text', required: true },
              {
                key: 'args',
                label: 'Arguments (optional)',
                placeholder: '--arg1 --arg2',
                type: 'text',
                required: false,
              },
              {
                key: 'cwd',
                label: 'Working Directory (optional)',
                placeholder: '/path/to/working/dir',
                type: 'text',
                required: false,
              },
            ]
          : [
              {
                key: 'url',
                label: 'Server URL',
                placeholder: 'https://api.example.com/mcp',
                type: 'url',
                required: true,
              },
              {
                key: 'headers',
                label: 'Headers (JSON, optional)',
                placeholder: '{"Authorization": "Bearer token"}',
                type: 'text',
                required: false,
              },
            ],
    };

    setSelectedTemplate(editTemplate);
    setIsTemplateConfigOpen(true);
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

  const handleSelectTemplate = (template: MCPTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateConfigOpen(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mcp-backdrop"
              initial="closed"
              animate="open"
              exit="closed"
              variants={backdropVariants}
              className={styles.backdrop}
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              key="mcp-panel"
              initial="closed"
              animate="open"
              exit="closed"
              variants={panelVariants}
              className={styles.mcpPanel}
            >
              {/* Header */}
              <div className={styles.header}>
                <div className={styles.titleBar}>
                  <h2>MCP Integrations</h2>
                  <IconButton icon="i-ph:x" size="xl" onClick={onClose} />
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                  <button
                    onClick={() => setActiveTab('integrations')}
                    className={activeTab === 'integrations' ? styles.active : ''}
                  >
                    <i className="i-ph:plug" />
                    Integrations
                  </button>
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className={activeTab === 'marketplace' ? styles.active : ''}
                  >
                    <i className="i-ph:storefront" />
                    Marketplace
                  </button>
                  <button onClick={() => setActiveTab('tools')} className={activeTab === 'tools' ? styles.active : ''}>
                    <i className="i-ph:wrench" />
                    Tools
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={activeTab === 'history' ? styles.active : ''}
                  >
                    <i className="i-ph:clock-counter-clockwise" />
                    History
                  </button>
                  <button
                    onClick={() => setActiveTab('secrets')}
                    className={activeTab === 'secrets' ? styles.active : ''}
                  >
                    <i className="i-ph:key" />
                    Secrets
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className={styles.content}>
                {activeTab === 'marketplace' && <McpMarketplace onSelectTemplate={handleSelectTemplate} />}

                {activeTab === 'integrations' && (
                  <>
                    {/* Description */}
                    <div className={styles.description}>
                      <p>
                        Manage your connected MCP servers. Need a quick integration? Check out Marketplace tab for
                        pre-configured templates.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actions}>
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
                        className={styles.refreshButton}
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
                      <div className={styles.error}>
                        <p>{error}</p>
                      </div>
                    )}

                    {/* Server List */}
                    {serverEntries.length > 0 ? (
                      <div className={styles.serverList}>
                        {serverEntries.map(([serverName, server]) => (
                          <McpServerCard
                            key={serverName}
                            serverName={serverName}
                            server={server}
                            onDelete={handleDeleteServer}
                            onEdit={handleEditServer}
                            isCheckingServers={isCheckingServers}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        <i className="i-ph:plug text-4xl text-codinit-elements-textTertiary mb-4" />
                        <h3>No MCP servers configured</h3>
                        <p>Add your first MCP server to get started with integrations.</p>
                        <button
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all"
                        >
                          Add Server
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'tools' && <McpToolRegistry className="p-4" />}

                {activeTab === 'history' && (
                  <McpExecutionHistory
                    executions={toolExecutions}
                    onClearHistory={clearExecutionHistory}
                    onExportHistory={(executions) => {
                      const dataStr = JSON.stringify(executions, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'mcp-execution-history.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    onRetryExecution={(execution) => {
                      toast.info(`Retrying execution: ${execution.toolName}`);
                    }}
                  />
                )}

                {activeTab === 'secrets' && (
                  <div className={styles.emptyState}>
                    <i className="i-ph:key text-4xl text-codinit-elements-textTertiary mb-4" />
                    <h3>Secrets Management</h3>
                    <p>Manage your API keys and secrets securely. Coming soon.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AddMcpServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddServer}
        onTest={handleTestConnection}
      />

      <McpTemplateConfigDialog
        isOpen={isTemplateConfigOpen}
        onClose={() => setIsTemplateConfigOpen(false)}
        template={selectedTemplate}
        onSave={handleAddServer}
      />
    </>
  );
});

McpIntegrationPanel.displayName = 'McpIntegrationPanel';
