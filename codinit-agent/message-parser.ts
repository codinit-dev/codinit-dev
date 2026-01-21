import type { PartId } from './partId.js';
import type { CodinitAction, CodinitArtifactData, ActionType, FileAction } from './types.js';
import { createScopedLogger } from './utils/logger.js';
import { getRelativePath } from './utils/workDir.js';
import { unreachable } from './utils/unreachable.js';

const ARTIFACT_TAG_OPEN_CODINIT = '<codinitArtifact';
const ARTIFACT_TAG_CLOSE_CODINIT = '</codinitArtifact>';
const ARTIFACT_ACTION_TAG_OPEN_CODINIT = '<codinitAction';
const ARTIFACT_ACTION_TAG_CLOSE_CODINIT = '</codinitAction>';

const ARTIFACT_TAGS_OPEN = [ARTIFACT_TAG_OPEN_CODINIT];

const logger = createScopedLogger('MessageParser');

export interface ArtifactCallbackData extends CodinitArtifactData {
  partId: PartId;
}

export interface ActionCallbackData {
  artifactId: string;
  partId: PartId;
  actionId: string;
  action: CodinitAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
}

interface ElementFactoryProps {
  partId: PartId;
}

type ElementFactory = (props: ElementFactoryProps) => string;

interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  currentArtifact?: CodinitArtifactData;
  currentAction: CodinitAction | null;
  actionId: number;
  hasCreatedArtifact: boolean;
  artifactTagName?: string; // 'codinitArtifact'
}

export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();

  constructor(private _options: StreamingMessageParserOptions = {}) { }

  static stripArtifacts(content: string): string {
    // Strip codinit artifacts
    let result = content;
    result = result.replace(/<codinitArtifact[^>]*>[\s\S]*?<\/codinitArtifact>/g, '');
    return result;
  }

  parse(partId: PartId, input: string) {
    let state = this.#messages.get(partId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        currentAction: null,
        actionId: 0,
        hasCreatedArtifact: false,
      };

      this.#messages.set(partId, state);
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

        const closeTag = ARTIFACT_TAG_CLOSE_CODINIT;
        const actionOpenTag = ARTIFACT_ACTION_TAG_OPEN_CODINIT;
        const actionCloseTag = ARTIFACT_ACTION_TAG_CLOSE_CODINIT;

        if (state.insideAction) {
          if (!state.currentAction) {
            unreachable('Action not initialized');
          }

          const closeIndex = input.indexOf(actionCloseTag, i);

          const currentAction = state.currentAction;

          if (closeIndex !== -1) {
            const actionContent = input.slice(i, closeIndex);

            let content = actionContent.trim();

            if (currentAction && currentAction.type === 'file') {
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
              partId,
              actionId: String(state.actionId - 1),
              action: currentAction as CodinitAction,
            });

            state.insideAction = false;
            state.currentAction = null;

            i = closeIndex + actionCloseTag.length;
          } else {
            if (currentAction && currentAction.type === 'file') {
              let content = input.slice(i);

              if (!currentAction.filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              this._options.callbacks?.onActionStream?.({
                artifactId: currentArtifact.id,
                partId,
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
          const actionOpenIndex = input.indexOf(actionOpenTag, i);
          const artifactCloseIndex = input.indexOf(closeTag, i);

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = input.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;

              state.currentAction = this.#parseActionTag(input, actionOpenIndex, actionEndIndex);

              this._options.callbacks?.onActionOpen?.({
                artifactId: currentArtifact.id,
                partId,
                actionId: String(state.actionId++),
                action: state.currentAction as CodinitAction,
              });

              i = actionEndIndex + 1;
            } else {
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            this._options.callbacks?.onArtifactClose?.({ partId, ...currentArtifact });

            state.insideArtifact = false;
            state.currentArtifact = undefined;
            state.artifactTagName = undefined;

            i = artifactCloseIndex + closeTag.length;
          } else {
            break;
          }
        }
      } else if (input[i] === '<' && input[i + 1] !== '/') {
        let j = i;
        let potentialTag = '';
        let processed = false;

        while (j < input.length) {
          potentialTag += input[j];

          // Check if it matches any tag exactly
          const matchedTag = ARTIFACT_TAGS_OPEN.find(t => t === potentialTag);

          if (matchedTag) {
            const nextChar = input[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              output += input.slice(i, j + 1);
              i = j + 1;
              processed = true;
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
              state.artifactTagName = 'codinitArtifact';

              const currentArtifact = {
                id: artifactId,
                title: artifactTitle,
                type,
              } satisfies CodinitArtifactData;

              state.currentArtifact = currentArtifact;

              this._options.callbacks?.onArtifactOpen?.({ partId, ...currentArtifact });

              if (!state.hasCreatedArtifact) {
                const artifactFactory = this._options.artifactElement ?? createArtifactElement;
                output += artifactFactory({ partId });
                state.hasCreatedArtifact = true;
              }

              i = openTagEnd + 1;
              processed = true;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (!ARTIFACT_TAGS_OPEN.some(t => t.startsWith(potentialTag))) {
            // Not a prefix of ANY tag
            output += input.slice(i, j + 1);
            i = j + 1;
            processed = true;
            break;
          }

          j++;
        }

        if (processed) {
          if (earlyBreak) {
            break;
          }
          continue;
        } else {
          // Partial match at end of input - check if it's a potential artifact tag
          const isPartialArtifactTag = ARTIFACT_TAGS_OPEN.some(t => t.startsWith(potentialTag));
          if (isPartialArtifactTag) {
            // Strip partial artifact tags at end of input - don't add to output
            i = input.length; // Skip to end
          } else {
            // Not an artifact tag, include it in output
            output += input.slice(i);
            i = input.length;
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

    if (actionType === 'file') {
      const filePath = this.#extractAttribute(actionTag, 'filePath') as string;

      if (!filePath) {
        logger.debug('File path not specified');
      }

      (actionAttributes as FileAction).filePath = getRelativePath(filePath);
    } else {
      logger.warn(`Unknown action type '${actionType}'`);
    }

    return actionAttributes as FileAction;
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

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  if (match) {
    return match[1]; // Remove common leading 4-space indent
  } else {
    return content;
  }
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}