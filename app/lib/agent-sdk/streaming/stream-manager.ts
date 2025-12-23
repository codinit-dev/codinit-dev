import type { DataStreamWriter } from 'ai';
import type { Plan, PlanStep, ToolCall, ToolResult, Observation, Reflection, AgentResult } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('StreamManager');

export class StreamManager {
  private _dataStream: DataStreamWriter;

  constructor(dataStream: DataStreamWriter) {
    this._dataStream = dataStream;
  }

  emitPlanGenerated(plan: Plan): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-plan',
        steps: plan.steps,
        estimatedComplexity: plan.estimatedComplexity,
        estimatedTokens: plan.estimatedTokens,
      } as any);

      this._dataStream.writeData({
        type: 'agent-progress',
        phase: 'planning',
        status: 'complete',
        message: `Plan generated with ${plan.steps.length} steps`,
      });

      logger.debug('Emitted plan generated event');
    } catch (error) {
      logger.error('Failed to emit plan generated:', error);
    }
  }

  emitStepStarted(step: PlanStep): void {
    try {
      this._dataStream.writeData({
        type: 'agent-progress',
        phase: 'execution',
        step: step.number,
        description: step.description,
        status: 'in-progress',
      });

      this._dataStream.writeMessageAnnotation({
        type: 'agent-step-start',
        stepNumber: step.number,
        description: step.description,
        tools: step.tools,
      });

      logger.debug(`Emitted step started: ${step.number}`);
    } catch (error) {
      logger.error('Failed to emit step started:', error);
    }
  }

  emitToolCall(call: ToolCall): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-tool-call',
        toolCallId: call.id,
        toolName: call.name,
        arguments: call.arguments,
        timestamp: call.timestamp,
      });

      logger.debug(`Emitted tool call: ${call.name}`);
    } catch (error) {
      logger.error('Failed to emit tool call:', error);
    }
  }

  emitToolResult(result: ToolResult): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-tool-result',
        toolCallId: result.toolCallId,
        success: result.success,
        output: result.output,
        error: result.error,
        duration: result.duration,
      } as any);

      logger.debug(`Emitted tool result for: ${result.toolCallId}`);
    } catch (error) {
      logger.error('Failed to emit tool result:', error);
    }
  }

  emitObservation(observation: Observation): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-observation',
        content: observation.content,
        success: observation.success,
        timestamp: observation.timestamp,
        metadata: observation.metadata,
      } as any);

      logger.debug('Emitted observation');
    } catch (error) {
      logger.error('Failed to emit observation:', error);
    }
  }

  emitReflection(reflection: Reflection): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-reflection',
        goalAchieved: reflection.goalAchieved,
        issues: reflection.issues,
        nextActions: reflection.nextActions,
        shouldContinue: reflection.shouldContinue,
        timestamp: reflection.timestamp,
      });

      this._dataStream.writeData({
        type: 'agent-progress',
        phase: 'reflection',
        status: 'complete',
        message: reflection.goalAchieved ? 'Goal achieved' : 'Continuing execution',
      });

      logger.debug('Emitted reflection');
    } catch (error) {
      logger.error('Failed to emit reflection:', error);
    }
  }

  emitError(error: string, recoverable: boolean = false): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-error',
        error,
        recoverable,
        timestamp: Date.now(),
      });

      this._dataStream.writeData({
        type: 'agent-progress',
        phase: 'error',
        status: 'failed',
        message: error,
      });

      logger.error('Emitted error:', error);
    } catch (emitError) {
      logger.error('Failed to emit error:', emitError);
    }
  }

  emitComplete(result: AgentResult): void {
    try {
      this._dataStream.writeMessageAnnotation({
        type: 'agent-complete',
        success: result.success,
        output: result.output,
        artifacts: result.artifacts,
        tokensUsed: result.tokensUsed,
        iterations: result.iterations,
        duration: result.duration,
        error: result.error,
      } as any);

      this._dataStream.writeData({
        type: 'agent-progress',
        phase: 'complete',
        status: result.success ? 'complete' : 'failed',
        message: result.success ? 'Agent execution completed' : 'Agent execution failed',
      });

      logger.info('Emitted completion event');
    } catch (error) {
      logger.error('Failed to emit complete:', error);
    }
  }

  emitProgress(phase: string, status: string, message?: string): void {
    try {
      this._dataStream.writeData({
        type: 'agent-progress',
        phase,
        status,
        message,
        timestamp: Date.now(),
      } as any);
    } catch (error) {
      logger.error('Failed to emit progress:', error);
    }
  }
}
