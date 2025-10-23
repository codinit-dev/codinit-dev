import { motion, type Variants, AnimatePresence } from 'framer-motion';
import { memo, useState, useMemo, useEffect } from 'react';
import { cubicEasingFn } from '~/utils/easings';
import { useMCPStore } from '~/lib/stores/mcp';
import { McpServerCard } from './MCPServerCard';
import { IconButton } from '~/components/ui/IconButton';
import { AddMcpServerDialog } from './AddMcpServerDialog';
import { McpMarketplace } from './MCPMarketplace';
import { McpTemplateConfigDialog } from './MCPTemplateConfigDialog';
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

type TabType = 'integrations' | 'marketplace' | 'secrets';

export const McpIntegrationPanel = memo(({ isOpen, onClose }: McpIntegrationPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('integrations');
  const [isCheckingServers, setIsCheckingServers] = useState(false);
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

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const serverEntries = useMemo(() => Object.entries(serverTools), [serverTools]);

  const handleCheckServers = async () => {
    setIsCheckingServers(true);
    setError(null);

    try {
      await checkServersAvailabilities();
    } catch (e) {
      setError(`Failed to check server availability: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsCheckingServers(false);
    }
  };

  const handleAddServer = async (name: string, config: MCPServerConfig) => {
    try {
      const newConfig = {
        ...settings,
        mcpConfig: {
          mcpServers: {
            ...settings.mcpConfig.mcpServers,
            [name]: config,
          },
        },
      };

      await updateSettings(newConfig);
      setIsAddDialogOpen(false);
      toast.success(`Server "${name}" added successfully`);
    } catch (error) {
      toast.error(`Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleEditServer = (_serverName: string) => {
    toast.info('Edit functionality coming soon');
  };

  const handleTestConnection = async (config: MCPServerConfig): Promise<{ success: boolean; error?: string }> => {
    /*
     * This would need a backend endpoint to test connection
     * For now, just validate the config structure
     */
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            className={styles.backdrop}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
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
                      Manage your connected MCP servers. Need a quick integration? Check out the Marketplace tab for
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <i className="i-ph:plug" />
                      </div>
                      <h3>No MCP servers configured</h3>
                      <p>
                        Configure MCP servers in Settings → MCP Servers to enable additional tools and integrations.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'secrets' && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <i className="i-ph:key" />
                  </div>
                  <h3>Secrets Management</h3>
                  <p>Secure secrets management coming soon. Store API keys, tokens, and other sensitive data.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Add Server Dialog */}
      <AddMcpServerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddServer}
        onTest={handleTestConnection}
      />

      {/* Template Config Dialog */}
      <McpTemplateConfigDialog
        isOpen={isTemplateConfigOpen}
        onClose={() => {
          setIsTemplateConfigOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSave={handleAddServer}
      />
    </AnimatePresence>
  );
});
