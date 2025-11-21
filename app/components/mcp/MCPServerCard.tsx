import { memo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import type { MCPServer } from '~/types/mcp';
import styles from './MCPServerCard.module.scss';

interface MCPServerCardProps {
  serverName: string;
  server: MCPServer;
  onDelete?: (serverName: string) => void;
  onEdit?: (serverName: string) => void;
  onRetry?: (serverName: string) => void;
  isCheckingServers?: boolean;
}

export const McpServerCard = memo(
  ({ serverName, server, onDelete, onEdit, onRetry, isCheckingServers }: MCPServerCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isAvailable = server.status === 'available';
    const isConnecting = server.status === 'connecting';
    const isUnavailable = server.status === 'unavailable';
    const serverTools = isAvailable ? Object.entries(server.tools) : [];
    const toolCount = serverTools.length;

    // Get icon based on server name/type
    const getServerIcon = () => {
      const name = serverName.toLowerCase();

      if (name.includes('database') || name.includes('db') || name.includes('postgres') || name.includes('sql')) {
        return 'i-ph:database';
      }

      if (name.includes('file') || name.includes('fs')) {
        return 'i-ph:folder-open';
      }

      if (name.includes('github') || name.includes('git')) {
        return 'i-ph:git-branch';
      }

      if (name.includes('slack')) {
        return 'i-ph:chat-circle-dots';
      }

      if (name.includes('fetch') || name.includes('http') || name.includes('api')) {
        return 'i-ph:globe';
      }

      return 'i-ph:plug';
    };

    // Get description based on config
    const getDescription = () => {
      if (server.config.type === 'sse' || server.config.type === 'streamable-http') {
        return server.config.url;
      }

      return `${server.config.command} ${server.config.args?.join(' ') || ''}`;
    };

    return (
      <div className={styles.serverItem}>
        {/* Main row */}
        <div className={styles.serverRow}>
          {/* Icon */}
          <div className={styles.serverIcon}>
            <i className={getServerIcon()} />
          </div>

          {/* Content */}
          <div className={styles.serverContent}>
            <h3>{serverName}</h3>
            <p className={styles.description}>{getDescription()}</p>
            {isUnavailable && server.error && <p className={styles.errorMessage}>⚠ {server.error}</p>}
            {isConnecting && <p className={styles.errorMessage}>⟳ Connecting... ({server.retryCount || 0} retries)</p>}
            {isAvailable && toolCount > 0 && (
              <button onClick={() => setIsExpanded(!isExpanded)} className={styles.toolsToggle}>
                <i className={classNames('i-ph:caret-down', { expanded: isExpanded })} />
                {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(serverName)}
                className="p-2 rounded-lg text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary hover:bg-codinit-elements-background-depth-1 transition-all"
                title="Edit server"
              >
                <i className="i-ph:pencil-simple text-base" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(serverName)}
                className="p-2 rounded-lg text-codinit-elements-textSecondary hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Delete server"
              >
                <i className="i-ph:trash text-base" />
              </button>
            )}

            <div className="flex items-center gap-2">
              {/* Connection status indicator */}
              <div
                className={classNames(
                  'w-2 h-2 rounded-full',
                  isConnecting
                    ? 'bg-yellow-500 animate-pulse'
                    : isCheckingServers
                      ? 'bg-blue-500 animate-pulse'
                      : isAvailable
                        ? 'bg-green-500'
                        : 'bg-red-500',
                )}
              />
              {isConnecting ? (
                <span className="text-sm text-yellow-600">Connecting...</span>
              ) : isAvailable ? (
                <span className="text-sm text-green-600">Connected</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Failed</span>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(serverName)}
                      disabled={isCheckingServers}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                      title="Retry connection"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded tools */}
        {isExpanded && isAvailable && toolCount > 0 && (
          <div className={styles.toolsList}>
            {serverTools.map(([toolName, toolSchema]) => (
              <div key={toolName} className={styles.toolItem}>
                <div className={styles.toolName}>{toolName}</div>
                {toolSchema.description && <div className={styles.toolDescription}>{toolSchema.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
