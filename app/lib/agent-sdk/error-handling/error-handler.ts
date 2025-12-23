import type { LLMManager } from '~/lib/modules/llm/manager';
import type { ErrorRecovery } from '~/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ErrorHandler');

export interface ErrorContext {
  step?: any;
  result?: any;
  attempt: number;
  failedTool?: string;
  [key: string]: any;
}

type ErrorType = 'validation' | 'tool-execution' | 'syntax' | 'logic' | 'timeout' | 'unknown';

export class ErrorHandler {
  private _llmManager: LLMManager;

  constructor(_llmManager: LLMManager) {
    this._llmManager = _llmManager;
  }

  async handleError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    logger.info(`Handling error: ${error.message}`);

    const classification = this._classifyError(error);

    switch (classification) {
      case 'validation':
        return await this._handleValidationError(error, context);
      case 'tool-execution':
        return await this._handleToolError(error, context);
      case 'syntax':
        return await this._handleSyntaxError(error, context);
      case 'timeout':
        return await this._handleTimeoutError(error, context);
      case 'logic':
        return await this._handleLogicError(error, context);
      default:
        return this._escalate(error, context);
    }
  }

  private _classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('schema')) {
      return 'validation';
    }

    if (message.includes('timeout')) {
      return 'timeout';
    }

    if (message.includes('syntax') || message.includes('unexpected token')) {
      return 'syntax';
    }

    if (message.includes('tool') || message.includes('execute')) {
      return 'tool-execution';
    }

    if (message.includes('logic') || message.includes('assertion')) {
      return 'logic';
    }

    return 'unknown';
  }

  private async _handleValidationError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    logger.debug('Handling validation error');

    if (context.attempt >= 2) {
      return this._escalate(error, context);
    }

    return {
      strategy: 'retry',
      reason: 'Validation failed, will retry with corrected input',
      correction: {
        validateFirst: true,
      },
    };
  }

  private async _handleToolError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    logger.debug('Handling tool execution error');

    if (context.attempt >= 3) {
      return this._escalate(error, context);
    }

    return {
      strategy: 'retry',
      reason: 'Tool execution failed, retrying',
    };
  }

  private async _handleSyntaxError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    logger.debug('Handling syntax error');

    if (context.attempt >= 2) {
      return this._escalate(error, context);
    }

    return {
      strategy: 'retry',
      reason: 'Syntax error detected, will retry with corrections',
      correction: {
        fixSyntax: true,
        error: error.message,
      },
    };
  }

  private async _handleTimeoutError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    logger.debug('Handling timeout error');

    if (context.attempt >= 2) {
      return this._escalate(error, context);
    }

    return {
      strategy: 'retry',
      reason: 'Operation timed out, retrying',
      correction: {
        increaseTimeout: true,
      },
    };
  }

  private async _handleLogicError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    logger.debug('Handling logic error');

    if (context.attempt >= 2) {
      return this._escalate(error, context);
    }

    return {
      strategy: 'retry',
      reason: 'Logic error detected, rethinking approach',
      correction: {
        rethink: true,
      },
    };
  }

  private _escalate(error: Error, context: ErrorContext): ErrorRecovery {
    logger.warn('Escalating error to human intervention');

    return {
      strategy: 'escalate',
      reason: `Cannot auto-recover from error after ${context.attempt} attempts: ${error.message}`,
    };
  }
}
