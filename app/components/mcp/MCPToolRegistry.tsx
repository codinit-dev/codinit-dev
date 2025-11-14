import { memo, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { classNames } from '~/utils/classNames';
import { useMCPStore } from '~/lib/stores/mcp';

interface ToolInfo {
  name: string;
  description: string;
  serverName: string;
  serverType: 'stdio' | 'sse' | 'streamable-http';
  parameters: Record<string, any>;
  status: 'available' | 'unavailable';
  lastUsed?: Date;
  usageCount: number;
}

interface McpToolRegistryProps {
  className?: string;
}

export const McpToolRegistry = memo(({ className }: McpToolRegistryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState<string>('all');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const serverTools = useMCPStore((state) => state.serverTools);

  const tools = useMemo(() => {
    const allTools: ToolInfo[] = [];

    Object.entries(serverTools).forEach(([serverName, server]) => {
      if (server.status === 'available' && server.tools) {
        Object.entries(server.tools).forEach(([toolName, tool]) => {
          allTools.push({
            name: toolName,
            description: tool.description || 'No description available',
            serverName,
            serverType: server.config.type,
            parameters: tool.parameters || {},
            status: server.status,
            usageCount: 0,
          });
        });
      }
    });

    return allTools;
  }, [serverTools]);

  const filteredTools = useMemo(() => {
    let filtered = tools;

    // Filter by server
    if (selectedServer !== 'all') {
      filtered = filtered.filter((tool) => tool.serverName === selectedServer);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.serverName.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [tools, selectedServer, searchQuery]);

  const servers = useMemo(() => {
    const serverList = ['all', ...Object.keys(serverTools)];
    return serverList.map((name) => ({
      value: name,
      label: name === 'all' ? 'All Servers' : name,
      count: name === 'all' ? tools.length : tools.filter((t) => t.serverName === name).length,
    }));
  }, [serverTools, tools]);

  const toggleToolExpanded = (toolName: string) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(toolName)) {
        newSet.delete(toolName);
      } else {
        newSet.add(toolName);
      }

      return newSet;
    });
  };

  const getServerIcon = (serverType: string) => {
    switch (serverType) {
      case 'stdio':
        return 'i-ph:terminal';
      case 'sse':
        return 'i-ph:cloud-arrow-up';
      case 'streamable-http':
        return 'i-ph:globe';
      default:
        return 'i-ph:plug';
    }
  };

  const getParameterType = (param: any) => {
    if (param.type) {
      return param.type;
    }

    if (param.enum) {
      return 'enum';
    }

    if (param.properties) {
      return 'object';
    }

    return 'string';
  };

  const formatParameter = (key: string, param: any) => {
    const type = getParameterType(param);
    const required = param.required ? 'required' : 'optional';

    return (
      <div key={key} className="flex items-center gap-2 text-xs">
        <span className="font-mono bg-codinit-elements-background-depth-2 px-2 py-1 rounded">{key}</span>
        <span className="text-codinit-elements-textSecondary">{type}</span>
        <Badge variant="outline" className="text-xs">
          {required}
        </Badge>
      </div>
    );
  };

  return (
    <div className={classNames('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-codinit-elements-textPrimary">
          Available Tools ({filteredTools.length})
        </h2>
        <div className="text-sm text-codinit-elements-textSecondary">
          {tools.filter((t) => t.status === 'available').length} available
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tools, descriptions, or servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-codinit-elements-background border border-codinit-elements-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-codinit-elements-ring focus:ring-offset-2 placeholder-codinit-elements-textSecondary"
          />
        </div>
        <div className="flex gap-2">
          {servers.map((server) => (
            <Button
              key={server.value}
              variant={selectedServer === server.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedServer(server.value)}
              className="flex items-center gap-2"
            >
              <i
                className={getServerIcon(
                  server.value === 'all' ? 'stdio' : serverTools[server.value]?.config.type || 'stdio',
                )}
              />
              {server.label}
              <Badge variant="secondary" className="text-xs">
                {server.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <i className="i-ph:search text-4xl text-codinit-elements-textTertiary mb-4" />
            <h3 className="text-lg font-medium text-codinit-elements-textPrimary mb-2">No tools found</h3>
            <p className="text-codinit-elements-textSecondary">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <Card key={`${tool.serverName}-${tool.name}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <i className={getServerIcon(tool.serverType)} />
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {tool.serverName}
                        </Badge>
                        <Badge variant={tool.status === 'available' ? 'default' : 'destructive'} className="text-xs">
                          {tool.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleToolExpanded(tool.name)} className="p-1">
                    <i
                      className={classNames(
                        'i-ph:caret-down transition-transform',
                        expandedTools.has(tool.name) ? 'rotate-180' : '',
                      )}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-codinit-elements-textSecondary mb-3">{tool.description}</p>

                {/* Expanded Parameters */}
                {expandedTools.has(tool.name) && Object.keys(tool.parameters).length > 0 && (
                  <div className="space-y-2 border-t border-codinit-elements-borderColor pt-3">
                    <h4 className="text-sm font-medium text-codinit-elements-textPrimary mb-2">Parameters</h4>
                    <div className="space-y-1">
                      {Object.entries(tool.parameters).map(([key, param]) => formatParameter(key, param))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <i className="i-ph:book-open mr-2" />
                    Documentation
                  </Button>
                  <Button variant="default" size="sm" className="flex-1">
                    <i className="i-ph:play mr-2" />
                    Test Tool
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-codinit-elements-textPrimary">
                {Object.keys(serverTools).length}
              </div>
              <div className="text-sm text-codinit-elements-textSecondary">Connected Servers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-codinit-elements-textPrimary">{tools.length}</div>
              <div className="text-sm text-codinit-elements-textSecondary">Total Tools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {tools.filter((t) => t.status === 'available').length}
              </div>
              <div className="text-sm text-codinit-elements-textSecondary">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {tools.filter((t) => t.status === 'unavailable').length}
              </div>
              <div className="text-sm text-codinit-elements-textSecondary">Unavailable</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

McpToolRegistry.displayName = 'McpToolRegistry';
