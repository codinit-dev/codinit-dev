/* eslint-disable @typescript-eslint/naming-convention */
import { useMCPStore } from '~/lib/stores/mcp';
import { McpExecutionHistory } from '~/components/mcp/MCPExecutionHistory';
import { toast } from 'react-toastify';

function MCPHistoryTab() {
  const toolExecutions = useMCPStore((state) => state.toolExecutions);
  const clearExecutionHistory = useMCPStore((state) => state.clearExecutionHistory);

  const handleExportHistory = (executions: any[]) => {
    const dataStr = JSON.stringify(executions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-execution-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRetryExecution = (execution: any) => {
    toast.info(`Retrying execution: ${execution.toolName}`);
  };

  return (
    <>
      <div className="text-sm text-codinit-elements-textSecondary mb-6">
        <p>
          View and manage your MCP tool execution history. Monitor tool usage, debug issues, and export execution logs
          for analysis.
        </p>
      </div>

      <McpExecutionHistory
        executions={toolExecutions}
        onClearHistory={clearExecutionHistory}
        onExportHistory={handleExportHistory}
        onRetryExecution={handleRetryExecution}
      />
    </>
  );
}

export default MCPHistoryTab;
