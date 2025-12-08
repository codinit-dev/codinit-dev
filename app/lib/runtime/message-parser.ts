import type { ActionType, BoltAction, BoltActionData, FileAction, ShellAction, SupabaseAction } from '~/types/actions';
import type { CodinitArtifactData, ThinkingArtifactData } from '~/types/artifact';
import type { ThinkingData } from '~/types/thinking';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const ARTIFACT_TAG_OPEN = '<codinitArtifact';
const ARTIFACT_TAG_CLOSE = '</codinitArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<codinitAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</codinitAction>';

// Legacy codinit tags (for backward compatibility)
const CODINIT_ARTIFACT_TAG_OPEN = '<codinitArtifact';
const CODINIT_ARTIFACT_TAG_CLOSE = '</codinitArtifact>';
const CODINIT_ACTION_TAG_OPEN = '<codinitAction';
const CODINIT_ACTION_TAG_CLOSE = '</codinitAction>';

// Thinking tags
const THINKING_TAG_OPEN = '<codinitThinking';
const THINKING_TAG_CLOSE = '</codinitThinking>';

// Thinking artifact tags
const THINKING_ARTIFACT_TAG_OPEN = '<thinkingArtifact';
const THINKING_ARTIFACT_TAG_CLOSE = '</thinkingArtifact>';

const logger = createScopedLogger('MessageParser');

export interface ArtifactCallbackData extends CodinitArtifactData {
  messageId: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: BoltAction;
}

export interface ThinkingCallbackData extends ThinkingData {
  messageId: string;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;
export type ThinkingCallback = (data: ThinkingCallbackData) => void;
export type ThinkingArtifactCallback = (data: ThinkingArtifactCallbackData) => void;

export interface ThinkingArtifactCallbackData extends ThinkingArtifactData {
  messageId: string;
}

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
  onThinkingOpen?: ThinkingCallback;
  onThinkingClose?: ThinkingCallback;
  onThinkingArtifactOpen?: ThinkingArtifactCallback;
  onThinkingArtifactClose?: ThinkingArtifactCallback;
}

interface ElementFactoryProps {
  messageId: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
  thinkingArtifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  insideThinking: boolean;
  insideThinkingArtifact: boolean;
  actionId: number;
  currentArtifact?: CodinitArtifactData;
  currentAction?: BoltActionData;
  currentThinking?: ThinkingData;
  currentThinkingArtifact?: ThinkingArtifactData;
}

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```[\w-]*\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  if (match) {
    return match[1].trim();
  }

  const multilineCodeBlockRegex = /```[\w-]*\s*\n([\s\S]*?)```/g;
  let cleaned = content.replace(multilineCodeBlockRegex, (_match, code) => code.trim());

  const inlineCodeBlockRegex = /^```[\w-]*\s*\n?|```\s*$/gm;
  cleaned = cleaned.replace(inlineCodeBlockRegex, '');

  return cleaned.trim() !== content.trim() ? cleaned.trim() : content;
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();

  constructor(private _options: StreamingMessageParserOptions = {}) {}

  parse(messageId: string, input: string) {
    let state = this.#messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        insideThinking: false,
        insideThinkingArtifact: false,
        currentAction: { content: '' },
        actionId: 0,
      };

      this.#messages.set(messageId, state);
    }

    let output = '';
    let i = state.position;
    let earlyBreak = false;

    while (i < input.length) {
      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (currentArtifact === undefined) {
          unreachable('Artifact not initialized');
        }

        if (state.insideAction) {
          let closeIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);

          // Also check for legacy codinit action close tag
          if (closeIndex === -1) {
            closeIndex = input.indexOf(CODINIT_ACTION_TAG_CLOSE, i);
          }

          const currentAction = state.currentAction;

          if (!currentAction) {
            break;
          }

          if (closeIndex !== -1) {
            currentAction.content += input.slice(i, closeIndex);

            let content = currentAction.content.trim();

            if ('type' in currentAction && currentAction.type === 'file') {
              // Remove markdown code block syntax if present and file is not markdown
              if (!currentAction.filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              content += '\n';
            }

            currentAction.content = content;

            this._options.callbacks?.onActionClose?.({
              artifactId: currentArtifact.id,
              messageId,

              /**
               * We decrement the id because it's been incremented already
               * when `onActionOpen` was emitted to make sure the ids are
               * the same.
               */
              actionId: String(state.actionId - 1),

              action: currentAction as BoltAction,
            });

            state.insideAction = false;
            state.currentAction = { content: '' };

            // Determine which tag was found to get the correct length
            const closeTagLength =
              input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i) === closeIndex
                ? ARTIFACT_ACTION_TAG_CLOSE.length
                : CODINIT_ACTION_TAG_CLOSE.length;

            i = closeIndex + closeTagLength;
          } else {
            if ('type' in currentAction && currentAction.type === 'file') {
              let content = input.slice(i);

              if (!currentAction.filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              this._options.callbacks?.onActionStream?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId - 1),
                action: {
                  ...(currentAction as FileAction),
                  content,
                  filePath: currentAction.filePath,
                },
              });
            }

            break;
          }
        } else {
          let actionOpenIndex = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
          let artifactCloseIndex = input.indexOf(ARTIFACT_TAG_CLOSE, i);
          const thinkingArtifactCloseIndex = input.indexOf(THINKING_ARTIFACT_TAG_CLOSE, i);

          // Also check for legacy codinit tags
          const codinitActionOpenIndex = input.indexOf(CODINIT_ACTION_TAG_OPEN, i);
          const codinitArtifactCloseIndex = input.indexOf(CODINIT_ARTIFACT_TAG_CLOSE, i);

          // Use the earliest action open tag found
          if (codinitActionOpenIndex !== -1 && (actionOpenIndex === -1 || codinitActionOpenIndex < actionOpenIndex)) {
            actionOpenIndex = codinitActionOpenIndex;
          }

          // Use the earliest artifact close tag found
          if (
            codinitArtifactCloseIndex !== -1 &&
            (artifactCloseIndex === -1 || codinitArtifactCloseIndex < artifactCloseIndex)
          ) {
            artifactCloseIndex = codinitArtifactCloseIndex;
          }

          // Use the earliest thinking artifact close tag found
          if (
            thinkingArtifactCloseIndex !== -1 &&
            (artifactCloseIndex === -1 || thinkingArtifactCloseIndex < artifactCloseIndex)
          ) {
            artifactCloseIndex = thinkingArtifactCloseIndex;
          }

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = input.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;

              state.currentAction = this.#parseActionTag(input, actionOpenIndex, actionEndIndex);

              this._options.callbacks?.onActionOpen?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId++),
                action: state.currentAction as BoltAction,
              });

              i = actionEndIndex + 1;
            } else {
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            if (state.currentArtifact) {
              this._options.callbacks?.onArtifactClose?.({ messageId, ...state.currentArtifact });

              state.insideArtifact = false;
              state.currentArtifact = undefined;
            } else if (state.currentThinkingArtifact) {
              // Process thinking artifact content to extract steps
              const content = state.currentThinkingArtifact.content;
              const lines = content.split('\n').filter((line) => line.trim());
              const steps: string[] = [];

              lines.forEach((line) => {
                const trimmed = line.trim();

                const numberedMatch = trimmed.match(/^\d+\.\s*(.+)$/);

                if (numberedMatch) {
                  steps.push(numberedMatch[1]);
                  return;
                }

                const bulletMatch = trimmed.match(/^[-*]\s*(.+)$/);

                if (bulletMatch) {
                  steps.push(bulletMatch[1]);
                  return;
                }

                if (trimmed.length > 0) {
                  steps.push(trimmed);
                }
              });

              const completedThinkingArtifact = {
                ...state.currentThinkingArtifact,
                steps,
              };

              this._options.callbacks?.onThinkingArtifactClose?.({ messageId, ...completedThinkingArtifact });

              state.insideThinkingArtifact = false;
              state.currentThinkingArtifact = undefined;
            }

            // Determine which tag was found to get the correct length
            const closeTagLength =
              input.indexOf(ARTIFACT_TAG_CLOSE, i) === artifactCloseIndex
                ? ARTIFACT_TAG_CLOSE.length
                : input.indexOf(CODINIT_ARTIFACT_TAG_CLOSE, i) === artifactCloseIndex
                  ? CODINIT_ARTIFACT_TAG_CLOSE.length
                  : THINKING_ARTIFACT_TAG_CLOSE.length;

            i = artifactCloseIndex + closeTagLength;
          } else {
            break;
          }
        }
      } else if (input[i] === '<' && input[i + 1] !== '/') {
        let j = i;
        let potentialTag = '';

        const maxTagLength = Math.max(
          ARTIFACT_TAG_OPEN.length,
          CODINIT_ARTIFACT_TAG_OPEN.length,
          THINKING_TAG_OPEN.length,
          THINKING_ARTIFACT_TAG_OPEN.length,
        );

        while (j < input.length && potentialTag.length < maxTagLength) {
          potentialTag += input[j];

          const isCodinitTag = potentialTag === ARTIFACT_TAG_OPEN;
          const isThinkingTag = potentialTag === THINKING_TAG_OPEN;
          const isThinkingArtifactTag = potentialTag === THINKING_ARTIFACT_TAG_OPEN;

          if (isThinkingTag) {
            const nextChar = input[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              output += input.slice(i, j + 1);
              i = j + 1;
              break;
            }

            const openTagEnd = input.indexOf('>', j);

            if (openTagEnd !== -1) {
              const thinkingTag = input.slice(i, openTagEnd + 1);
              const thinkingId = this.#extractAttribute(thinkingTag, 'id') as string;

              state.insideThinking = true;

              const currentThinking = {
                id: thinkingId || `thinking-${Date.now()}`,
                content: '',
              } satisfies ThinkingData;

              state.currentThinking = currentThinking;

              this._options.callbacks?.onThinkingOpen?.({ messageId, ...currentThinking });

              i = openTagEnd + 1;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (isThinkingArtifactTag) {
            const nextChar = input[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              output += input.slice(i, j + 1);
              i = j + 1;
              break;
            }

            const openTagEnd = input.indexOf('>', j);

            if (openTagEnd !== -1) {
              const thinkingArtifactTag = input.slice(i, openTagEnd + 1);
              const thinkingArtifactTitle = this.#extractAttribute(thinkingArtifactTag, 'title') as string;
              const thinkingArtifactId = this.#extractAttribute(thinkingArtifactTag, 'id') as string;

              if (!thinkingArtifactTitle) {
                logger.warn('Thinking artifact title missing');
              }

              if (!thinkingArtifactId) {
                logger.warn('Thinking artifact id missing');
              }

              state.insideThinkingArtifact = true;

              const currentThinkingArtifact = {
                id: thinkingArtifactId,
                title: thinkingArtifactTitle,
                type: 'thinking' as const,
                steps: [],
                content: '',
              } satisfies ThinkingArtifactData;

              state.currentThinkingArtifact = currentThinkingArtifact;

              this._options.callbacks?.onThinkingArtifactOpen?.({ messageId, ...currentThinkingArtifact });

              const thinkingArtifactFactory = this._options.thinkingArtifactElement ?? createThinkingArtifactElement;

              output += thinkingArtifactFactory({ messageId });

              i = openTagEnd + 1;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (isCodinitTag || isCodinitTag) {
            const nextChar = input[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              output += input.slice(i, j + 1);
              i = j + 1;
              break;
            }

            const openTagEnd = input.indexOf('>', j);

            if (openTagEnd !== -1) {
              const artifactTag = input.slice(i, openTagEnd + 1);

              const artifactTitle = this.#extractAttribute(artifactTag, 'title') as string;
              const type = this.#extractAttribute(artifactTag, 'type') as string;
              const artifactId = this.#extractAttribute(artifactTag, 'id') as string;

              if (!artifactTitle) {
                logger.warn('Artifact title missing');
              }

              if (!artifactId) {
                logger.warn('Artifact id missing');
              }

              state.insideArtifact = true;

              const currentArtifact = {
                id: artifactId,
                title: artifactTitle,
                type,
              } satisfies CodinitArtifactData;

              state.currentArtifact = currentArtifact;

              this._options.callbacks?.onArtifactOpen?.({ messageId, ...currentArtifact });

              const artifactFactory = this._options.artifactElement ?? createArtifactElement;

              output += artifactFactory({ messageId });

              i = openTagEnd + 1;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (
            !ARTIFACT_TAG_OPEN.startsWith(potentialTag) &&
            !CODINIT_ARTIFACT_TAG_OPEN.startsWith(potentialTag) &&
            !THINKING_TAG_OPEN.startsWith(potentialTag) &&
            !THINKING_ARTIFACT_TAG_OPEN.startsWith(potentialTag)
          ) {
            output += input.slice(i, j + 1);
            i = j + 1;
            break;
          }

          j++;
        }

        if (
          j === input.length &&
          (ARTIFACT_TAG_OPEN.startsWith(potentialTag) ||
            CODINIT_ARTIFACT_TAG_OPEN.startsWith(potentialTag) ||
            THINKING_TAG_OPEN.startsWith(potentialTag) ||
            THINKING_ARTIFACT_TAG_OPEN.startsWith(potentialTag))
        ) {
          break;
        }
      } else if (state.insideThinking) {
        const closeIndex = input.indexOf(THINKING_TAG_CLOSE, i);

        if (closeIndex !== -1) {
          const content = input.slice(i, closeIndex);

          if (state.currentThinking) {
            state.currentThinking.content += content;

            output += `<div class="__codinitThinking__" data-message-id="${messageId}">${state.currentThinking.content}</div>`;

            this._options.callbacks?.onThinkingClose?.({
              messageId,
              ...state.currentThinking,
            });

            state.insideThinking = false;
            state.currentThinking = undefined;

            i = closeIndex + THINKING_TAG_CLOSE.length;
          } else {
            output += input[i];
            i++;
          }
        } else if (state.insideThinkingArtifact) {
          const closeIndex = input.indexOf(THINKING_ARTIFACT_TAG_CLOSE, i);

          if (closeIndex !== -1) {
            const content = input.slice(i, closeIndex);

            if (state.currentThinkingArtifact) {
              state.currentThinkingArtifact.content += content;
            }

            i = closeIndex;
          } else {
            if (state.currentThinkingArtifact) {
              state.currentThinkingArtifact.content += input.slice(i);
            }

            break;
          }
        } else {
          if (state.currentThinking) {
            state.currentThinking.content += input.slice(i);
          }

          break;
        }
      } else {
        output += input[i];
        i++;
      }

      if (earlyBreak) {
        break;
      }
    }

    state.position = i;

    return output;
  }

  reset() {
    this.#messages.clear();
  }

  #parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
    const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);

    const actionType = this.#extractAttribute(actionTag, 'type') as ActionType;

    const actionAttributes = {
      type: actionType,
      content: '',
    };

    if (actionType === 'supabase') {
      const operation = this.#extractAttribute(actionTag, 'operation');

      if (!operation || !['migration', 'query'].includes(operation)) {
        logger.warn(`Invalid or missing operation for Supabase action: ${operation}`);
        throw new Error(`Invalid Supabase operation: ${operation}`);
      }

      (actionAttributes as SupabaseAction).operation = operation as 'migration' | 'query';

      if (operation === 'migration') {
        const filePath = this.#extractAttribute(actionTag, 'filePath');

        if (!filePath) {
          logger.warn('Migration requires a filePath');
          throw new Error('Migration requires a filePath');
        }

        (actionAttributes as SupabaseAction).filePath = filePath;
      }
    } else if (actionType === 'file') {
      const filePath = this.#extractAttribute(actionTag, 'filePath') as string;

      if (!filePath) {
        logger.debug('File path not specified');
      }

      (actionAttributes as FileAction).filePath = filePath;
    } else if (!['shell', 'start'].includes(actionType)) {
      logger.warn(`Unknown action type '${actionType}'`);
    }

    return actionAttributes as FileAction | ShellAction;
  }

  #extractAttribute(tag: string, attributeName: string): string | undefined {
    const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
    return match ? match[1] : undefined;
  }
}

const createArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__codinitArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];

  return `<div ${elementProps.join(' ')}></div>`;
};

const createThinkingArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__thinkingArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];

  return `<div ${elementProps.join(' ')}></div>`;
};

function camelToDashCase(input: string) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
