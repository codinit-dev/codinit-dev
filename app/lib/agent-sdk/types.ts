import { z } from 'zod';

export const AGENT_STATUS_SCHEMA = z.enum([
  'idle',
  'planning',
  'executing',
  'observing',
  'reflecting',
  'complete',
  'failed',
  'aborted',
]);
export type AgentStatus = z.infer<typeof AGENT_STATUS_SCHEMA>;

export const REASONING_PATTERN_TYPE_SCHEMA = z.enum(['plan-execute', 'react', 'tree-of-thoughts']);
export type ReasoningPatternType = z.infer<typeof REASONING_PATTERN_TYPE_SCHEMA>;

export const AGENT_CONFIG_SCHEMA = z.object({
  name: z.string().default('agent'),
  model: z.string().default('claude-sonnet-4.5'),
  provider: z.string().optional(),
  reasoningPattern: REASONING_PATTERN_TYPE_SCHEMA.default('plan-execute'),
  maxIterations: z.number().int().positive().default(20),
  tokenBudget: z.number().int().positive().default(200000),
  enableSelfCorrection: z.boolean().default(true),
  enableMemory: z.boolean().default(true),
  enableCheckpointing: z.boolean().default(true),
  toolTimeout: z.number().int().positive().default(30000),
  systemPrompt: z.string().optional(),
});

export type AgentConfig = z.infer<typeof AGENT_CONFIG_SCHEMA>;

export const PLAN_STEP_SCHEMA = z.object({
  number: z.number().int().positive(),
  description: z.string(),
  tools: z.array(z.string()).default([]),
  dependencies: z.array(z.number().int()).default([]),
  estimatedComplexity: z.enum(['low', 'medium', 'high']).default('medium'),
  expectedOutcome: z.string().optional(),
});

export type PlanStep = z.infer<typeof PLAN_STEP_SCHEMA>;

export const PLAN_SCHEMA = z.object({
  type: z.literal('plan'),
  steps: z.array(PLAN_STEP_SCHEMA),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
  estimatedTokens: z.number().int().optional(),
});

export type Plan = z.infer<typeof PLAN_SCHEMA>;

export const TOOL_CALL_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.any()),
  timestamp: z.number(),
});

export type ToolCall = z.infer<typeof TOOL_CALL_SCHEMA>;

export const TOOL_RESULT_SCHEMA = z.object({
  toolCallId: z.string(),
  success: z.boolean(),
  output: z.any(),
  error: z.string().optional(),
  duration: z.number().optional(),
});

export type ToolResult = z.infer<typeof TOOL_RESULT_SCHEMA>;

export const OBSERVATION_SCHEMA = z.object({
  content: z.string(),
  success: z.boolean(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type Observation = z.infer<typeof OBSERVATION_SCHEMA>;

export const REFLECTION_SCHEMA = z.object({
  goalAchieved: z.boolean(),
  issues: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
  shouldContinue: z.boolean(),
  timestamp: z.number(),
});

export type Reflection = z.infer<typeof REFLECTION_SCHEMA>;

export const STEP_RESULT_SCHEMA = z.object({
  stepNumber: z.number().int(),
  success: z.boolean(),
  observations: z.array(OBSERVATION_SCHEMA),
  artifacts: z.array(z.string()).default([]),
  error: z.string().optional(),
});

export type StepResult = z.infer<typeof STEP_RESULT_SCHEMA>;

export const AGENT_STATE_SCHEMA = z.object({
  status: AGENT_STATUS_SCHEMA,
  currentIteration: z.number().int().default(0),
  currentStep: z.number().int().optional(),
  plan: PLAN_SCHEMA.optional(),
  history: z.array(z.any()).default([]),
  observations: z.array(OBSERVATION_SCHEMA).default([]),
  reflections: z.array(REFLECTION_SCHEMA).default([]),
  tokensUsed: z.number().int().default(0),
  startTime: z.number(),
  endTime: z.number().optional(),
});

export type AgentState = z.infer<typeof AGENT_STATE_SCHEMA>;

export const AGENT_RESULT_SCHEMA = z.object({
  success: z.boolean(),
  output: z.string(),
  artifacts: z.array(z.string()).default([]),
  tokensUsed: z.number().int(),
  iterations: z.number().int(),
  duration: z.number(),
  error: z.string().optional(),
});

export type AgentResult = z.infer<typeof AGENT_RESULT_SCHEMA>;

export interface AgentContext {
  apiKeys: Record<string, string>;
  files?: Record<string, any>;
  webcontainer?: any;
  workingDirectory?: string;
}

export interface AgentEvent {
  type: 'plan' | 'step-start' | 'tool-call' | 'tool-result' | 'observation' | 'reflection' | 'error' | 'complete';
  data: any;
  timestamp: number;
}

export const ERROR_RECOVERY_SCHEMA = z.object({
  strategy: z.enum(['retry', 'skip', 'escalate', 'alternative']),
  correction: z.any().optional(),
  alternativeTool: z.string().optional(),
  reason: z.string(),
});

export type ErrorRecovery = z.infer<typeof ERROR_RECOVERY_SCHEMA>;

export const CHECKPOINT_SCHEMA = z.object({
  id: z.string(),
  threadId: z.string(),
  agentId: z.string(),
  state: AGENT_STATE_SCHEMA,
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type Checkpoint = z.infer<typeof CHECKPOINT_SCHEMA>;

export const EXECUTION_RECORD_SCHEMA = z.object({
  id: z.string(),
  task: z.string(),
  result: AGENT_RESULT_SCHEMA,
  plan: PLAN_SCHEMA.optional(),
  toolCalls: z.array(TOOL_CALL_SCHEMA).default([]),
  timestamp: z.number(),
});

export type ExecutionRecord = z.infer<typeof EXECUTION_RECORD_SCHEMA>;
