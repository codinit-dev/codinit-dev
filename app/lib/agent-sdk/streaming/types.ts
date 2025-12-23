import type { Plan, PlanStep, ToolCall, ToolResult, Observation, Reflection, AgentResult } from '~/types';

export type StreamEvent =
  | PlanEvent
  | StepStartEvent
  | ToolCallEvent
  | ToolResultEvent
  | ObservationEvent
  | ReflectionEvent
  | ErrorEvent
  | CompleteEvent;

export interface PlanEvent {
  type: 'agent-plan';
  plan: Plan;
  timestamp: number;
}

export interface StepStartEvent {
  type: 'agent-step-start';
  step: PlanStep;
  timestamp: number;
}

export interface ToolCallEvent {
  type: 'agent-tool-call';
  call: ToolCall;
  timestamp: number;
}

export interface ToolResultEvent {
  type: 'agent-tool-result';
  result: ToolResult;
  timestamp: number;
}

export interface ObservationEvent {
  type: 'agent-observation';
  observation: Observation;
  timestamp: number;
}

export interface ReflectionEvent {
  type: 'agent-reflection';
  reflection: Reflection;
  timestamp: number;
}

export interface ErrorEvent {
  type: 'agent-error';
  error: string;
  recoverable: boolean;
  timestamp: number;
}

export interface CompleteEvent {
  type: 'agent-complete';
  result: AgentResult;
  timestamp: number;
}
