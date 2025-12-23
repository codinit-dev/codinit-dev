export type {
  AgentStatus,
  AgentConfig,
  AgentState,
  AgentResult,
  AgentContext,
  AgentEvent,
  Plan,
  PlanStep,
  ToolCall,
  ToolResult,
  Observation,
  Reflection,
  StepResult,
  ErrorRecovery,
  Checkpoint,
  ExecutionRecord,
  ReasoningPatternType,
} from '~/lib/agent-sdk/types';

export {
  AGENT_STATUS_SCHEMA,
  AGENT_CONFIG_SCHEMA,
  AGENT_STATE_SCHEMA,
  PLAN_STEP_SCHEMA,
  PLAN_SCHEMA,
  TOOL_CALL_SCHEMA,
  TOOL_RESULT_SCHEMA,
  OBSERVATION_SCHEMA,
  REFLECTION_SCHEMA,
  STEP_RESULT_SCHEMA,
  AGENT_RESULT_SCHEMA,
  ERROR_RECOVERY_SCHEMA,
  CHECKPOINT_SCHEMA,
  EXECUTION_RECORD_SCHEMA,
  REASONING_PATTERN_TYPE_SCHEMA,
} from '~/lib/agent-sdk/types';

export interface AgentExecution {
  id: string;
  status: AgentStatus;
  task: string;
  plan?: Plan;
  currentStep?: number;
  toolCalls: ToolCall[];
  observations: Observation[];
  reflections: Reflection[];
  error?: string;
  recoveryAttempts: number;
  elapsedTime: number;
  tokensUsed: number;
  startTime: number;
  endTime?: number;
}

export type AgentProgressEvent =
  | {
      type: 'agent-plan';
      plan: Plan;
    }
  | {
      type: 'agent-step-start';
      step: PlanStep;
    }
  | {
      type: 'agent-tool-call';
      call: ToolCall;
    }
  | {
      type: 'agent-tool-result';
      result: ToolResult;
    }
  | {
      type: 'agent-observation';
      observation: Observation;
    }
  | {
      type: 'agent-reflection';
      reflection: Reflection;
    }
  | {
      type: 'agent-error';
      error: string;
    }
  | {
      type: 'agent-complete';
      result: AgentResult;
    };

import type {
  AgentStatus,
  Plan,
  PlanStep,
  ToolCall,
  ToolResult,
  Observation,
  Reflection,
  AgentResult,
} from '~/lib/agent-sdk/types';
