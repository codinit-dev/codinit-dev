import { memo, useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { SearchInput } from '~/components/ui/SearchInput';
import { classNames } from '~/utils/classNames';

interface ToolExecution {
  id: string;
  toolName: string;
  serverName: string;
  parameters: Record<string, any>;
  result: any;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
  duration: number;
  error?: string;
}

interface McpExecutionHistoryProps {
  executions: ToolExecution[];
  className?: string;
  onClearHistory?: () => void;
  onExportHistory?: (executions: ToolExecution[]) => void;
  onRetryExecution?: (execution: ToolExecution) => void;
}

export const McpExecutionHistory = memo(
  ({ executions, className, onClearHistory, onExportHistory, onRetryExecution }: McpExecutionHistoryProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const filteredExecutions = useMemo(() => {
      let filtered = executions;

      // Filter by status
      if (selectedStatus !== 'all') {
        filtered = filtered.filter((exec) => exec.status === selectedStatus);
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (exec) =>
            exec.toolName.toLowerCase().includes(query) ||
            exec.serverName.toLowerCase().includes(query) ||
            (exec.result && typeof exec.result === 'string' && exec.result.toLowerCase().includes(query)),
        );
      }

      return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [executions, selectedStatus, searchQuery]);

    const statusCounts = useMemo(() => {
      const counts = {
        all: executions.length,
        completed: executions.filter((e) => e.status === 'completed').length,
        failed: executions.filter((e) => e.status === 'failed').length,
        pending: executions.filter((e) => e.status === 'pending').length,
        executing: executions.filter((e) => e.status === 'executing').length,
      };
      return counts;
    }, [executions]);

    const statusOptions = [
      { value: 'all', label: 'All', count: statusCounts.all },
      { value: 'completed', label: 'Completed', count: statusCounts.completed },
      { value: 'failed', label: 'Failed', count: statusCounts.failed },
      { value: 'pending', label: 'Pending', count: statusCounts.pending },
      { value: 'executing', label: 'Executing', count: statusCounts.executing },
    ];

    const toggleExpanded = (id: string) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }

        return newSet;
      });
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'completed':
          return (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Success
            </Badge>
          );
        case 'failed':
          return <Badge variant="destructive">Failed</Badge>;
        case 'executing':
          return (
            <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Running
            </Badge>
          );
        case 'pending':
          return <Badge variant="outline">Pending</Badge>;
        default:
          return <Badge variant="outline">Unknown</Badge>;
      }
    };

    const formatDuration = (ms: number) => {
      if (ms < 1000) {
        return `${ms}ms`;
      }

      if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`;
      }

      return `${(ms / 60000).toFixed(1)}m`;
    };

    const formatResult = (result: any, status: string) => {
      if (status === 'failed') {
        return <span className="text-red-600 dark:text-red-400">{result || 'Execution failed'}</span>;
      }

      if (result === null || result === undefined) {
        return <span className="text-codinit-elements-textTertiary">No result</span>;
      }

      if (typeof result === 'string') {
        if (result.length > 100) {
          return (
            <div>
              <div className="font-mono text-sm bg-codinit-elements-background-depth-1 p-2 rounded mb-2">
                {result.substring(0, 100)}...
              </div>
              <Button variant="outline" size="sm">
                <i className="i-ph:eye mr-2" />
                View Full Result
              </Button>
            </div>
          );
        }

        return <div className="font-mono text-sm bg-codinit-elements-background-depth-1 p-2 rounded">{result}</div>;
      }

      if (typeof result === 'object') {
        return (
          <div className="font-mono text-sm bg-codinit-elements-background-depth-1 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(result, null, 2)}
          </div>
        );
      }

      return <span className="text-codinit-elements-textTertiary">{String(result)}</span>;
    };

    const getServerIcon = (serverName: string) => {
      const name = serverName.toLowerCase();

      if (name.includes('database') || name.includes('db')) {
        return 'i-ph:database';
      }

      if (name.includes('github') || name.includes('git')) {
        return 'i-ph:git-branch';
      }

      if (name.includes('slack')) {
        return 'i-ph:chat-circle-dots';
      }

      if (name.includes('openai') || name.includes('ai')) {
        return 'i-ph:sparkle';
      }

      return 'i-ph:plug';
    };

    return (
      <div className={classNames('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-codinit-elements-textPrimary">
            Execution History ({filteredExecutions.length})
          </h2>
          <div className="flex gap-1">
            {onExportHistory && (
              <Button variant="outline" size="sm" onClick={() => onExportHistory(executions)}>
                <i className="i-ph:download mr-1" />
                Export
              </Button>
            )}
            {onClearHistory && executions.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearHistory}>
                <i className="i-ph:trash mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <SearchInput
              placeholder="Search executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <Button
                key={status.value}
                variant={selectedStatus === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status.value)}
                className="flex items-center gap-1 text-xs"
              >
                {status.label}
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {status.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Execution List */}
        {filteredExecutions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <i className="i-ph:clock-counter-clockwise text-3xl text-codinit-elements-textTertiary mb-3" />
              <h3 className="text-base font-medium text-codinit-elements-textPrimary mb-2">No execution history</h3>
              <p className="text-sm text-codinit-elements-textSecondary">
                {executions.length === 0
                  ? 'Tool executions will appear here once you start using MCP tools.'
                  : 'No executions match your current filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExecutions.map((execution) => (
              <Card key={execution.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <i className={getServerIcon(execution.serverName)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium text-codinit-elements-textPrimary truncate">
                            {execution.toolName}
                          </h3>
                          {getStatusBadge(execution.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-codinit-elements-textSecondary mt-1">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {execution.serverName}
                          </Badge>
                          <span className="truncate">{execution.timestamp.toLocaleString()}</span>
                          {execution.duration > 0 && <span>{formatDuration(execution.duration)}</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpanded(execution.id)} className="p-1 ml-2">
                      <i
                        className={classNames(
                          'i-ph:caret-down transition-transform',
                          expandedItems.has(execution.id) ? 'rotate-180' : '',
                        )}
                      />
                    </Button>
                  </div>
                </CardHeader>

                {expandedItems.has(execution.id) && (
                  <CardContent className="border-t border-codinit-elements-borderColor pt-3">
                    <div className="space-y-3">
                      {/* Parameters */}
                      {Object.keys(execution.parameters).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-codinit-elements-textPrimary mb-2">Parameters</h4>
                          <div className="font-mono text-xs bg-codinit-elements-background-depth-1 p-2 rounded space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(execution.parameters).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-codinit-elements-textSecondary flex-shrink-0">{key}:</span>
                                <span className="text-codinit-elements-textPrimary break-all">
                                  {JSON.stringify(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Result */}
                      <div>
                        <h4 className="text-sm font-medium text-codinit-elements-textPrimary mb-2">Result</h4>
                        {formatResult(execution.result, execution.status)}
                      </div>

                      {/* Error */}
                      {execution.error && (
                        <div>
                          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Error</h4>
                          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                            {execution.error}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {execution.status === 'failed' && onRetryExecution && (
                          <Button variant="outline" size="sm" onClick={() => onRetryExecution(execution)}>
                            <i className="i-ph:arrow-counter-clockwise mr-1" />
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(execution, null, 2));
                          }}
                        >
                          <i className="i-ph:copy mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  },
);

McpExecutionHistory.displayName = 'McpExecutionHistory';
