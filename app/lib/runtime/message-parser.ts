import type {
  ActionType,
  CodinitAction,
  CodinitActionData,
  FileAction,
  ShellAction,
  SupabaseAction,
} from '~/types/actions';
import type { codinitArticactData } from '~/types/artifact';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const ARTIFACT_TAG_OPEN = '<codinitArtifact';
const ARTIFACT_TAG_CLOSE = '</codinitArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<codinitAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</codinitAction>';
const CODINIT_QUICK_ACTIONS_OPEN = '<codinit-quick-actions>';
const CODINIT_QUICK_ACTIONS_CLOSE = '</codinit-quick-actions>';

const logger = createScopedLogger('MessageParser');

export interface ArtifactCallbackData extends codinitArticactData {
  messageId: string;
  artifactId?: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: CodinitAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
}

interface ElementFactoryProps {
  messageId: string;
  artifactId?: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  artifactCounter: number;
  currentArtifact?: codinitArticactData;
  currentAction: CodinitActionData;
  actionId: number;
}

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  // console.log('matching', !!match, content);

  if (match) {
    return match[1]; // Remove common leading 4-space indent
  } else {
    return content;
  }
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();
  #artifactCounter = 0;
  #buffer = ''; // Add a buffer to accumulate incoming chunks

  constructor(private _options: StreamingMessageParserOptions = {}) {}

  parse(messageId: string, input: string) {
    let state = this.#messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        artifactCounter: 0,
        currentAction: { content: '' },
        actionId: 0,
      };

      this.#messages.set(messageId, state);
    }

    this.#buffer += input; // Append new input to the buffer

    let parsedOutput = ''; // Use a new variable for the output of this parse call
    let i = 0; // Current position in the buffer
    let lastOutputIndex = 0; // Tracks the last index from which content was appended to parsedOutput

    while (i < this.#buffer.length) {
      // Handle CODINIT_QUICK_ACTIONS_OPEN
      if (this.#buffer.startsWith(CODINIT_QUICK_ACTIONS_OPEN, i)) {
        const actionsBlockEnd = this.#buffer.indexOf(CODINIT_QUICK_ACTIONS_CLOSE, i);

        if (actionsBlockEnd !== -1) {
          parsedOutput += this.#buffer.slice(lastOutputIndex, i); // Add content before the quick actions block

          const actionsBlockContent = this.#buffer.slice(i + CODINIT_QUICK_ACTIONS_OPEN.length, actionsBlockEnd);
          const quickActionRegex = /<codinit-quick-action([^>]*)>([\s\S]*?)<\/codinit-quick-action>/g;
          let match;
          const buttons = [];

          while ((match = quickActionRegex.exec(actionsBlockContent)) !== null) {
            const tagAttrs = match[1];
            const label = match[2];
            const type = this.#extractAttribute(tagAttrs, 'type');
            const message = this.#extractAttribute(tagAttrs, 'message');
            const path = this.#extractAttribute(tagAttrs, 'path');
            const href = this.#extractAttribute(tagAttrs, 'href');
            buttons.push(
              createQuickActionElement(
                { type: type || '', message: message || '', path: path || '', href: href || '' },
                label,
              ),
            );
          }
          parsedOutput += createQuickActionGroup(buttons);
          i = actionsBlockEnd + CODINIT_QUICK_ACTIONS_CLOSE.length;
          lastOutputIndex = i; // Update lastOutputIndex after processing quick actions
          continue;
        } else {
          // Incomplete quick actions block, wait for more data
          break;
        }
      }

      // Handle insideArtifact state
      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (currentArtifact === undefined) {
          unreachable('Artifact not initialized');
        }

        if (state.insideAction) {
          const closeIndex = this.#buffer.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);
          const currentAction = state.currentAction;

          if (closeIndex !== -1) {
            currentAction.content += this.#buffer.slice(i, closeIndex);

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
              actionId: String(state.actionId - 1),
              action: currentAction as CodinitAction,
            });

            state.insideAction = false;
            state.currentAction = { content: '' };

            i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
            lastOutputIndex = i; // Update lastOutputIndex after processing action close
          } else {
            // Incomplete action, stream content and wait for more data
            if ('type' in currentAction && currentAction.type === 'file') {
              let content = this.#buffer.slice(i);

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
          const actionOpenIndex = this.#buffer.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
          const artifactCloseIndex = this.#buffer.indexOf(ARTIFACT_TAG_CLOSE, i);

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = this.#buffer.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              parsedOutput += this.#buffer.slice(lastOutputIndex, actionOpenIndex); // Add content before action open
              state.insideAction = true;
              state.currentAction = this.#parseActionTag(this.#buffer, actionOpenIndex, actionEndIndex);

              this._options.callbacks?.onActionOpen?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId++),
                action: state.currentAction as CodinitAction,
              });

              i = actionEndIndex + 1;
              lastOutputIndex = i; // Update lastOutputIndex after processing action open
            } else {
              // Incomplete action open tag, wait for more data
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            parsedOutput += this.#buffer.slice(lastOutputIndex, artifactCloseIndex); // Add content before artifact close
            this._options.callbacks?.onArtifactClose?.({
              messageId,
              artifactId: currentArtifact.id,
              ...currentArtifact,
            });

            state.insideArtifact = false;
            state.currentArtifact = undefined;

            i = artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
            lastOutputIndex = i; // Update lastOutputIndex after processing artifact close
          } else {
            // Incomplete artifact, wait for more data
            break;
          }
        }
      } else if (this.#buffer[i] === '<' && this.#buffer[i + 1] !== '/') {
        let j = i;
        let potentialTag = '';
        let tagFound = false;

        while (j < this.#buffer.length && potentialTag.length < ARTIFACT_TAG_OPEN.length) {
          potentialTag += this.#buffer[j];

          if (potentialTag === ARTIFACT_TAG_OPEN) {
            const nextChar = this.#buffer[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              // This is not a codinitArtifact tag, treat as normal text
              parsedOutput += this.#buffer.slice(lastOutputIndex, j + 1);
              i = j + 1;
              lastOutputIndex = i;
              tagFound = true;
              break;
            }

            const openTagEnd = this.#buffer.indexOf('>', j);

            if (openTagEnd !== -1) {
              parsedOutput += this.#buffer.slice(lastOutputIndex, i); // Add content before artifact open

              const artifactTag = this.#buffer.slice(i, openTagEnd + 1);

              const artifactTitle = this.#extractAttribute(artifactTag, 'title') as string;
              const type = this.#extractAttribute(artifactTag, 'type') as string;

              const artifactId = `${messageId}-${state.artifactCounter++}`;

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
              } satisfies codinitArticactData;

              state.currentArtifact = currentArtifact;

              this._options.callbacks?.onArtifactOpen?.({
                messageId,
                artifactId: currentArtifact.id,
                ...currentArtifact,
              });

              const artifactFactory = this._options.artifactElement ?? createArtifactElement;

              parsedOutput += artifactFactory({ messageId, artifactId });

              i = openTagEnd + 1;
              lastOutputIndex = i; // Update lastOutputIndex after processing artifact open
              tagFound = true;
            } else {
              // Incomplete artifact open tag, wait for more data
              break;
            }

            break;
          } else if (!ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
            // Not a codinitArtifact tag, treat as normal text
            parsedOutput += this.#buffer.slice(lastOutputIndex, j + 1);
            i = j + 1;
            lastOutputIndex = i;
            tagFound = true;
            break;
          }

          j++;
        }

        if (!tagFound) {
          // If no tag was found or it's an incomplete potential tag, break and wait for more data
          break;
        }
      } else {
        // Normal text character
        i++;
      }
    }

    // Append any remaining non-processed content to the output
    parsedOutput += this.#buffer.slice(lastOutputIndex, i);
    this.#buffer = this.#buffer.slice(i); // Remove processed content from the buffer

    return parsedOutput;
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
    } else if (!['shell', 'start', 'build'].includes(actionType)) {
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

function camelToDashCase(input: string) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function createQuickActionElement(props: Record<string, string>, label: string) {
  const elementProps = [
    'class="__codinitQuickAction__"',
    'data-codinit-quick-action="true"',
    ...Object.entries(props).map(([key, value]) => `data-${camelToDashCase(key)}=${JSON.stringify(value)}`),
  ];

  return `<button ${elementProps.join(' ')}>${label}</button>`;
}

function createQuickActionGroup(buttons: string[]) {
  return `<div class=\"__codinitQuickAction__\" data-codinit-quick-action=\"true\">${buttons.join('')}</div>`;
}
