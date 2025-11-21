import { create } from 'zustand';
import type { MCPConfig, MCPServerTools } from '~/lib/services/mcpService';

// Tool execution tracking
export interface MCPToolExecution {
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

// Tool performance metrics
export interface MCPToolMetrics {
  toolName: string;
  serverName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageResponseTime: number;
  lastUsed: Date;
}

// Tool approval settings
export interface MCPApprovalSettings {
  autoApproveTrusted: boolean;
  trustedTools: string[];
  requireApprovalFor: string[];
  defaultTimeout: number;
}

const MCP_SETTINGS_KEY = 'mcp_settings';
const isBrowser = typeof window !== 'undefined';

type MCPSettings = {
  mcpConfig: MCPConfig;
  maxLLMSteps: number;
  enabled: boolean;
  approvalSettings: MCPApprovalSettings;
};

const defaultSettings = {
  maxLLMSteps: 5,
  enabled: true,
  mcpConfig: {
    mcpServers: {},
  },
  approvalSettings: {
    autoApproveTrusted: false,
    trustedTools: [],
    requireApprovalFor: [],
    defaultTimeout: 30,
  },
} satisfies MCPSettings;

type Store = {
  isInitialized: boolean;
  settings: MCPSettings;
  serverTools: MCPServerTools;
  error: string | null;
  isUpdatingConfig: boolean;
  isCheckingServers: boolean;
  toolExecutions: MCPToolExecution[];
  toolMetrics: Record<string, MCPToolMetrics>;
  pendingApprovals: MCPToolExecution[];
  selectedMCP: string | null;
};

type Actions = {
  initialize: () => Promise<void>;
  updateSettings: (settings: MCPSettings) => Promise<void>;
  checkServersAvailabilities: () => Promise<void>;
  retryServerConnection: (serverName: string) => Promise<void>;
  addToolExecution: (execution: MCPToolExecution) => void;
  updateToolExecution: (id: string, updates: Partial<MCPToolExecution>) => void;
  approveToolExecution: (id: string) => void;
  denyToolExecution: (id: string) => void;
  clearExecutionHistory: () => void;
  updateToolMetrics: (toolName: string, serverName: string, success: boolean, duration: number) => void;
  getToolExecutions: (toolName?: string) => MCPToolExecution[];
  getPendingApprovals: () => MCPToolExecution[];
  setSelectedMCP: (serverName: string | null) => void;
};

export const useMCPStore = create<Store & Actions>((set, get) => ({
  isInitialized: false,
  settings: defaultSettings,
  serverTools: {},
  error: null,
  isUpdatingConfig: false,
  isCheckingServers: false,
  toolExecutions: [],
  toolMetrics: {},
  pendingApprovals: [],
  selectedMCP: null,
  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    if (isBrowser) {
      const savedConfig = localStorage.getItem(MCP_SETTINGS_KEY);

      if (savedConfig) {
        try {
          const settings = JSON.parse(savedConfig) as MCPSettings;
          const serverTools = await updateServerConfig(settings.mcpConfig);
          set(() => ({ settings, serverTools }));
        } catch (error) {
          console.error('Error parsing saved mcp config:', error);
          set(() => ({
            error: `Error parsing saved mcp config: ${error instanceof Error ? error.message : String(error)}`,
          }));
        }
      } else {
        localStorage.setItem(MCP_SETTINGS_KEY, JSON.stringify(defaultSettings));
      }
    }

    set(() => ({ isInitialized: true }));
  },
  updateSettings: async (newSettings: MCPSettings) => {
    if (get().isUpdatingConfig) {
      return;
    }

    try {
      set(() => ({ isUpdatingConfig: true }));

      const serverTools = await updateServerConfig(newSettings.mcpConfig);

      if (isBrowser) {
        localStorage.setItem(MCP_SETTINGS_KEY, JSON.stringify(newSettings));
      }

      set(() => ({ settings: newSettings, serverTools }));
    } catch (error) {
      throw error;
    } finally {
      set(() => ({ isUpdatingConfig: false }));
    }
  },
  checkServersAvailabilities: async () => {
    if (get().isCheckingServers) {
      return;
    }

    try {
      set(() => ({ isCheckingServers: true }));

      const response = await fetch('/api/mcp-check', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const serverTools = (await response.json()) as MCPServerTools;

      set(() => ({ serverTools }));
    } finally {
      set(() => ({ isCheckingServers: false }));
    }
  },
  retryServerConnection: async (serverName: string) => {
    try {
      const response = await fetch('/api/mcp-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      // Refresh server statuses after retry
      const checkResponse = await fetch('/api/mcp-check', {
        method: 'GET',
      });

      if (checkResponse.ok) {
        const serverTools = (await checkResponse.json()) as MCPServerTools;
        set(() => ({ serverTools }));
      }
    } catch (error) {
      console.error(`Failed to retry connection for server ${serverName}:`, error);
      throw error;
    }
  },

  // Tool execution tracking
  addToolExecution: (execution: MCPToolExecution) => {
    set((state) => ({
      toolExecutions: [execution, ...state.toolExecutions],
    }));
  },

  updateToolExecution: (id: string, updates: Partial<MCPToolExecution>) => {
    set((state) => ({
      toolExecutions: state.toolExecutions.map((exec) => (exec.id === id ? { ...exec, ...updates } : exec)),
    }));
  },

  approveToolExecution: (id: string) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.filter((exec) => exec.id !== id),
      toolExecutions: state.toolExecutions.map((exec) => (exec.id === id ? { ...exec, status: 'approved' } : exec)),
    }));
  },

  denyToolExecution: (id: string) => {
    set((state) => ({
      pendingApprovals: state.pendingApprovals.filter((exec) => exec.id !== id),
      toolExecutions: state.toolExecutions.map((exec) =>
        exec.id === id ? { ...exec, status: 'failed', error: 'Denied by user' } : exec,
      ),
    }));
  },

  clearExecutionHistory: () => {
    set(() => ({
      toolExecutions: [],
      toolMetrics: {},
    }));
  },

  updateToolMetrics: (toolName: string, serverName: string, success: boolean, duration: number) => {
    const key = `${toolName}-${serverName}`;
    set((state) => {
      const current = state.toolMetrics[key] || {
        toolName,
        serverName,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageResponseTime: 0,
        lastUsed: new Date(),
      };

      const updated = {
        ...current,
        totalExecutions: current.totalExecutions + 1,
        successfulExecutions: current.successfulExecutions + (success ? 1 : 0),
        failedExecutions: current.failedExecutions + (success ? 0 : 1),
        averageResponseTime:
          (current.averageResponseTime * current.totalExecutions + duration) / (current.totalExecutions + 1),
        lastUsed: new Date(),
      };

      return {
        toolMetrics: {
          ...state.toolMetrics,
          [key]: updated,
        },
      };
    });
  },

  getToolExecutions: (toolName?: string) => {
    const state = get();

    if (toolName) {
      return state.toolExecutions.filter((exec) => exec.toolName === toolName);
    }

    return state.toolExecutions;
  },

  getPendingApprovals: () => {
    return get().pendingApprovals;
  },

  setSelectedMCP: (serverName: string | null) => {
    set({ selectedMCP: serverName });
  },
}));

async function updateServerConfig(config: MCPConfig) {
  const response = await fetch('/api/mcp-update-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as MCPServerTools;

  return data;
}
