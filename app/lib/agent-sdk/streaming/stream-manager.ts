import type { DataStreamWriter } from 'ai';
import type { Plan, PlanStep, ToolCall, ToolResult, Observation, Reflection, AgentResult } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('StreamManager');

export class StreamManager {
  private _dataStream: DataStreamWriter;

  constructor(dataStream: DataStreamWriter) {
    this._dataStream = dataStream;
  }

  private _emit(type: string, data: any, eventName?: string): void {
    try {
      this._dataStream.writeMessageAnnotation({ type, ...data } as any);
      logger.debug(eventName || `Emitted ${type}`);
    } catch (error) {
      logger.error(`Failed to emit ${type}:`, error);
    }
  }

  private _emitProgress(phase: string, status: string, message?: string): void {
    try {
      this._dataStream.writeData({ type: 'agent-progress', phase, status, message, timestamp: Date.now() } as any);
    } catch (error) {
      logger.error('Failed to emit progress:', error);
    }
  }

  emitPlanGenerated(plan: Plan): void {
    this._emit('agent-plan', {
      steps: plan.steps,
      estimatedComplexity: plan.estimatedComplexity,
      estimatedTokens: plan.estimatedTokens,
    });
    this._emitProgress('planning', 'complete', `Plan generated with ${plan.steps.length} steps`);
  }

  emitStepStarted(step: PlanStep): void {
    this._emit('agent-step-start', { stepNumber: step.number, description: step.description, tools: step.tools });
    this._emitProgress('execution', 'in-progress', step.description);
  }

  emitToolCall(call: ToolCall): void {
    this._emit(
      'agent-tool-call',
      { toolCallId: call.id, toolName: call.name, arguments: call.arguments, timestamp: call.timestamp },
      `tool call: ${call.name}`,
    );
  }

  emitToolResult(result: ToolResult): void {
    this._emit('agent-tool-result', result, `tool result: ${result.toolCallId}`);
  }

  emitObservation(observation: Observation): void {
    this._emit('agent-observation', observation);
  }

  emitReflection(reflection: Reflection): void {
    this._emit('agent-reflection', reflection);
    this._emitProgress('reflection', 'complete', reflection.goalAchieved ? 'Goal achieved' : 'Continuing execution');
  }

  emitError(error: string, recoverable = false): void {
    this._emit('agent-error', { error, recoverable, timestamp: Date.now() });
    this._emitProgress('error', 'failed', error);
    logger.error('Agent error:', error);
  }

  emitComplete(result: AgentResult): void {
    this._emit('agent-complete', result);
    this._emitProgress(
      'complete',
      result.success ? 'complete' : 'failed',
      result.success ? 'Execution completed' : 'Execution failed',
    );
    logger.info('Agent execution completed');
  }

  emitProgress(phase: string, status: string, message?: string): void {
    this._emitProgress(phase, status, message);
  }
}
