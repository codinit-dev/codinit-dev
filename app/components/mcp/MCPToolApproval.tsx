import { memo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { classNames } from '~/utils/classNames';

interface ToolCall {
  id: string;
  toolName: string;
  serverName: string;
  description: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

interface McpToolApprovalProps {
  toolCall: ToolCall;
  onApprove: (toolCallId: string) => void;
  onDeny: (toolCallId: string) => void;
  onApproveAll: () => void;
  onDenyAll: () => void;
  autoApprove?: boolean;
  trustedTools?: string[];
  className?: string;
}

export const McpToolApproval = memo(
  ({
    toolCall,
    onApprove,
    onDeny,
    onApproveAll,
    onDenyAll,
    autoApprove = false,
    trustedTools = [],
    className,
  }: McpToolApprovalProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);

    const isTrusted = trustedTools.includes(toolCall.toolName);
    const canAutoApprove = autoApprove && isTrusted;

    useEffect(() => {
      if (canAutoApprove) {
        onApprove(toolCall.id);
        return undefined;
      }

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onDeny(toolCall.id);

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [toolCall.id, canAutoApprove, onApprove, onDeny]);

    const formatParameterValue = (value: any): string => {
      if (value === null || value === undefined) {
        return 'null';
      }

      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }

      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 47) + '...';
      }

      return String(value);
    };

    const getParameterIcon = (type: string) => {
      switch (type) {
        case 'string':
          return 'i-ph:text-aa';
        case 'number':
          return 'i-ph:number';
        case 'boolean':
          return 'i-ph:toggle';
        case 'object':
          return 'i-ph:brackets-curly';
        case 'array':
          return 'i-ph:brackets-square';
        default:
          return 'i-ph:question';
      }
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

    if (canAutoApprove) {
      return null; // Auto-approved, no UI needed
    }

    return (
      <Card
        className={classNames(
          'border-l-4 transition-all duration-300',
          timeLeft <= 10
            ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
            : timeLeft <= 20
              ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
              : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
          className,
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <i className={getServerIcon(toolCall.serverName)} />
                <div>
                  <CardTitle className="text-lg">{toolCall.toolName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {toolCall.serverName}
                    </Badge>
                    {isTrusted && (
                      <Badge
                        variant="default"
                        className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        <i className="i-ph:check-circle mr-1" />
                        Trusted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={classNames(
                  'text-sm font-medium',
                  timeLeft <= 10
                    ? 'text-red-600 dark:text-red-400'
                    : timeLeft <= 20
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-blue-600 dark:text-blue-400',
                )}
              >
                {timeLeft}s
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-1">
                <i className={classNames('i-ph:caret-down transition-transform', isExpanded ? 'rotate-180' : '')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-codinit-elements-textSecondary mb-4">{toolCall.description}</p>

          {/* Parameters */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-codinit-elements-textPrimary">Parameters:</h4>
            <div className="space-y-2">
              {Object.entries(toolCall.parameters).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3 p-2 bg-codinit-elements-background-depth-1 rounded">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <i className={getParameterIcon(typeof value)} />
                    <span className="font-mono text-sm text-codinit-elements-textPrimary">{key}</span>
                  </div>
                  <div className="flex-1 text-right">
                    <code className="text-xs bg-codinit-elements-background px-2 py-1 rounded text-codinit-elements-textSecondary">
                      {formatParameterValue(value)}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-codinit-elements-borderColor">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-codinit-elements-textSecondary">Tool ID:</span>
                  <div className="font-mono text-codinit-elements-textPrimary">{toolCall.id}</div>
                </div>
                <div>
                  <span className="text-codinit-elements-textSecondary">Server:</span>
                  <div className="text-codinit-elements-textPrimary">{toolCall.serverName}</div>
                </div>
                <div>
                  <span className="text-codinit-elements-textSecondary">Requested:</span>
                  <div className="text-codinit-elements-textPrimary">{toolCall.timestamp.toLocaleTimeString()}</div>
                </div>
                <div>
                  <span className="text-codinit-elements-textSecondary">Status:</span>
                  <Badge variant={timeLeft <= 10 ? 'destructive' : 'default'} className="text-xs">
                    {timeLeft <= 10 ? 'Expiring Soon' : 'Pending Approval'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => onDeny(toolCall.id)} className="flex-1">
              <i className="i-ph:x mr-2" />
              Deny
            </Button>
            <Button variant="default" onClick={() => onApprove(toolCall.id)} className="flex-1">
              <i className="i-ph:check mr-2" />
              Approve
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => onApproveAll()} className="text-xs">
              <i className="i-ph:check-circle mr-1" />
              Approve All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDenyAll()}
              className="text-xs text-red-600 dark:text-red-400"
            >
              <i className="i-ph:x-circle mr-1" />
              Deny All
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
);

McpToolApproval.displayName = 'McpToolApproval';
