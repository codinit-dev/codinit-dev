import type { Message } from 'ai';
import { generateId } from 'ai';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ContextManager');

export interface ContextManagerOptions {
  maxTokens: number;
  estimatedTokensPerChar?: number;
}

export class ContextManager {
  private _messages: Message[] = [];
  private _maxTokens: number;
  private _estimatedTokensPerChar: number;

  constructor(maxTokens: number = 100000, options: Partial<ContextManagerOptions> = {}) {
    this._maxTokens = maxTokens;
    this._estimatedTokensPerChar = options.estimatedTokensPerChar || 0.25;
  }

  addMessage(message: Message): void {
    this._messages.push(message);
    this._trimIfNeeded();
  }

  addMessages(messages: Message[]): void {
    this._messages.push(...messages);
    this._trimIfNeeded();
  }

  getMessages(): Message[] {
    return [...this._messages];
  }

  getContextWindow(): Message[] {
    return this.getMessages();
  }

  clear(): void {
    this._messages = [];
    logger.debug('Context cleared');
  }

  estimateTokenCount(): number {
    const totalChars = this._messages.reduce((sum, msg) => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return sum + content.length;
    }, 0);

    return Math.ceil(totalChars * this._estimatedTokensPerChar);
  }

  private _trimIfNeeded(): void {
    let estimatedTokens = this.estimateTokenCount();

    while (estimatedTokens > this._maxTokens && this._messages.length > 1) {
      const removed = this._messages.shift();
      logger.debug(`Removed message to stay within token limit. Removed role: ${removed?.role}`);
      estimatedTokens = this.estimateTokenCount();
    }

    if (estimatedTokens > this._maxTokens) {
      logger.warn(`Context still exceeds token limit after trimming: ${estimatedTokens} > ${this._maxTokens}`);
    }
  }

  setMaxTokens(maxTokens: number): void {
    this._maxTokens = maxTokens;
    this._trimIfNeeded();
  }

  getMaxTokens(): number {
    return this._maxTokens;
  }

  getMessageCount(): number {
    return this._messages.length;
  }

  async summarizeAndCompress(summaryFn: (messages: Message[]) => Promise<string>): Promise<void> {
    if (this._messages.length <= 2) {
      logger.debug('Not enough messages to summarize');
      return;
    }

    const messagesToSummarize = this._messages.slice(0, -2);
    const recentMessages = this._messages.slice(-2);

    try {
      const summary = await summaryFn(messagesToSummarize);

      this._messages = [
        {
          id: generateId(),
          role: 'system',
          content: `Summary of previous conversation:\n${summary}`,
        },
        ...recentMessages,
      ];

      logger.info('Context compressed via summarization');
    } catch (error) {
      logger.error('Failed to summarize context:', error);
    }
  }
}
