import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createDataStream, generateId } from 'ai';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS, type FileMap } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { getFilePaths, selectContext } from '~/lib/.server/llm/select-context';
import type { ContextAnnotation, ProgressAnnotation } from '~/types/context';
import { WORK_DIR, DEFAULT_TEMPLATE } from '~/utils/constants';
import { createSummary } from '~/lib/.server/llm/create-summary';
import { extractPropertiesFromMessage } from '~/lib/.server/llm/utils';
import { fetchRepoContentsCloudflare } from './api.github-template';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

const logger = createScopedLogger('api.chat');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages, files, promptId, contextOptimization, supabase } = await request.json<{
    messages: Messages;
    files: any;
    promptId?: string;
    contextOptimization: boolean;
    supabase?: {
      isConnected: boolean;
      hasSelectedProject: boolean;
      credentials?: {
        anonKey?: string;
        supabaseUrl?: string;
      };
    };
  }>();

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

  const stream = new SwitchableStream();

  const cumulativeUsage = {
    completionTokens: 0,
    promptTokens: 0,
    totalTokens: 0,
  };
  const encoder: TextEncoder = new TextEncoder();
  let progressCounter: number = 1;

  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    // Check if any user message contains build-related keywords
    const hasBuildPrompt = messages.some(
      (msg) => msg.role === 'user' && /build.*(app|project|react|application)/i.test(msg.content),
    );

    if (hasBuildPrompt) {
      let lastChunk: string | undefined = undefined;
      const repo = 'codinit-dev/vite-react-ts-starter';
      const githubToken =
        (context?.cloudflare?.env as any)?.GITHUB_TOKEN ||
        process.env.GITHUB_TOKEN ||
        process.env.VITE_GITHUB_ACCESS_TOKEN;

      const dataStream = createDataStream({
        async execute(dataStream: any) {
          dataStream.writeData({
            type: 'progress',
            label: 'import',
            status: 'in-progress',
            order: 1,
            message: 'Cloning the repo https://github.com/codinit-dev/vite-react-ts-starter into /home/project',
          } satisfies ProgressAnnotation);

          const fileList = await fetchRepoContentsCloudflare(repo, githubToken);
          const filteredFiles = fileList.files.filter((file: any) => !file.path.startsWith('.git'));

          dataStream.writeData({
            type: 'progress',
            label: 'import',
            status: 'complete',
            order: 2,
            message: 'Project Created',
          } satisfies ProgressAnnotation);

          dataStream.writeMessageAnnotation({
            type: 'codeContext',
            files: filteredFiles.map((file: any) => '/home/project/' + file.path),
          } satisfies ContextAnnotation);

          // Send the files as data
          filteredFiles.forEach((file: any) => {
            dataStream.writeData({
              type: 'file',
              path: '/home/project/' + file.path,
              content: file.content,
            });
          });

          dataStream.writeData({
            type: 'progress',
            label: 'import',
            status: 'complete',
            order: 3,
            message: 'Initial files created',
          } satisfies ProgressAnnotation);

          dataStream.writeData({
            type: 'progress',
            label: 'setup',
            status: 'in-progress',
            order: 4,
            message: 'Setting up the codebase',
          } satisfies ProgressAnnotation);

          // Send setup commands
          dataStream.writeData({
            type: 'command',
            command: 'npm install',
            cwd: '/home/project',
          });

          dataStream.writeData({
            type: 'command',
            command: 'npm run dev',
            cwd: '/home/project',
          });

          dataStream.writeData({
            type: 'progress',
            label: 'setup',
            status: 'complete',
            order: 5,
            message: 'Codebase setup complete. You can now ask for specific features or modifications.',
          } satisfies ProgressAnnotation);
        },
        onError: (error: any) => `Custom error: ${error.message}`,
      });

      return new Response(
        dataStream.pipeThrough(
          new TransformStream({
            transform: (chunk: any, controller: any) => {
              try {
                if (!lastChunk) {
                  lastChunk = ' ';
                }

                if (typeof chunk === 'string') {
                  if (chunk.startsWith('g') && !lastChunk.startsWith('g')) {
                    controller.enqueue(encoder.encode(`0: "<div class=\\"__codinitThought__\\">"\n`));
                  }

                  if (lastChunk.startsWith('g') && !chunk.startsWith('g')) {
                    controller.enqueue(encoder.encode(`0: "</div>\\n"\n`));
                  }
                }

                lastChunk = chunk;

                let transformedChunk = chunk;

                if (typeof chunk === 'string' && chunk.startsWith('g')) {
                  let content = chunk.split(':').slice(1).join(':');

                  if (content.endsWith('\n')) {
                    content = content.slice(0, content.length - 1);
                  }

                  transformedChunk = `0:${content}\n`;
                }

                // Convert the string stream to a byte stream
                const str = typeof transformedChunk === 'string' ? transformedChunk : JSON.stringify(transformedChunk);
                controller.enqueue(encoder.encode(str));
              } catch (error) {
                if (!(error instanceof TypeError && error.message.includes('Controller is already closed'))) {
                  throw error;
                }
              }
            },
          }),
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            'Text-Encoding': 'chunked',
          },
        },
      );
    } else {
      let lastChunk: string | undefined = undefined;
      const filePaths = getFilePaths(files || {});
      return new Response(
        createDataStream({
          async execute(dataStream: any) {


                  dataStream.writeData({
                    type: 'command',
                    command: 'npm run dev',
                    cwd: '/home/project',
                  });

                  dataStream.writeData({
                    type: 'progress',
                    label: 'setup',
                    status: 'complete',
                    order: 5,
                    message: 'Codebase setup complete. You can now ask for specific features or modifications.',
                  } satisfies ProgressAnnotation);
                },
                onError: (error: any) => `Custom error: ${error.message}`,
              });

              return new Response(
                dataStream.pipeThrough(
                  new TransformStream({
                    transform: (chunk: any, controller: any) => {
                      if (!lastChunk) {
                        lastChunk = ' ';
                      }

                      if (typeof chunk === 'string') {
                        if (chunk.startsWith('g') && !lastChunk.startsWith('g')) {
                          controller.enqueue(encoder.encode(`0: "<div class=\\"__codinitThought__\\">"\n`));
                        }

                        if (lastChunk.startsWith('g') && !chunk.startsWith('g')) {
                          controller.enqueue(encoder.encode(`0: "</div>\\n"\n`));
                        }
                      }

                      lastChunk = chunk;

                      let transformedChunk = chunk;

                      if (typeof chunk === 'string' && chunk.startsWith('g')) {
                        let content = chunk.split(':').slice(1).join(':');

                        if (content.endsWith('\n')) {
                          content = content.slice(0, content.length - 1);
                        }

                        transformedChunk = `0:${content}\n`;
                      }

                      // Convert the string stream to a byte stream
                      const str =
                        typeof transformedChunk === 'string' ? transformedChunk : JSON.stringify(transformedChunk);
                      controller.enqueue(encoder.encode(str));
                    },
                  }),
                ),
                {
                  status: 200,
                  headers: {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    Connection: 'keep-alive',
                    'Cache-Control': 'no-cache',
                    'Text-Encoding': 'chunked',
                  },
                },
              );
            }
            const filePaths = getFilePaths(files || {});

            let filteredFiles: FileMap | undefined = undefined;
            let summary: string | undefined = undefined;
            let messageSliceId = 0;

            if (messages.length > 3) {
              messageSliceId = messages.length - 3;
            }

            if (filePaths.length > 0 && contextOptimization) {
              logger.debug('Generating Chat Summary');
              dataStream.writeData({
                type: 'progress',
                label: 'summary',
                status: 'in-progress',
                order: progressCounter++,
                message: 'Analysing Request',
              } satisfies ProgressAnnotation);

              // Create a summary of the chat
              console.log(`Messages count: ${messages.length}`);

              summary = await createSummary({
                messages: [...messages],
                env: context.cloudflare?.env,
                apiKeys,
                providerSettings,
                promptId,
                contextOptimization,
                onFinish(resp) {
                  if (resp.usage) {
                    logger.debug('createSummary token usage', JSON.stringify(resp.usage));
                    cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
                    cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
                    cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
                  }
                },
              });
              dataStream.writeData({
                type: 'progress',
                label: 'summary',
                status: 'complete',
                order: progressCounter++,
                message: 'Analysis Complete',
              } satisfies ProgressAnnotation);

              dataStream.writeMessageAnnotation({
                type: 'chatSummary',
                summary,
                chatId: messages.slice(-1)?.[0]?.id,
              } as ContextAnnotation);

              // Update context buffer
              logger.debug('Updating Context Buffer');
              dataStream.writeData({
                type: 'progress',
                label: 'context',
                status: 'in-progress',
                order: progressCounter++,
                message: 'Determining Files to Read',
              } satisfies ProgressAnnotation);

              // Select context files
              console.log(`Messages count: ${messages.length}`);
              filteredFiles = await selectContext({
                messages: [...messages],
                env: context.cloudflare?.env,
                apiKeys,
                files,
                providerSettings,
                promptId,
                contextOptimization,
                summary,
                onFinish(resp) {
                  if (resp.usage) {
                    logger.debug('selectContext token usage', JSON.stringify(resp.usage));
                    cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
                    cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
                    cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
                  }
                },
              });

              if (filteredFiles) {
                logger.debug(`files in context : ${JSON.stringify(Object.keys(filteredFiles))}`);
              }

              dataStream.writeMessageAnnotation({
                type: 'codeContext',
                files: Object.keys(filteredFiles).map((key) => {
                  let path = key;

                  if (path.startsWith(WORK_DIR)) {
                    path = path.replace(WORK_DIR, '');
                  }

                  return path;
                }),
              } as ContextAnnotation);

              dataStream.writeData({
                type: 'progress',
                label: 'context',
                status: 'complete',
                order: progressCounter++,
                message: 'Code Files Selected',
              } satisfies ProgressAnnotation);

              // logger.debug('Code Files Selected');
            }

            const options: StreamingOptions = {
              supabaseConnection: supabase,
              toolChoice: 'none',
              abortSignal: request.signal,
              onFinish: async ({ text: content, finishReason, usage }) => {
                logger.debug('usage', JSON.stringify(usage));

                if (usage) {
                  cumulativeUsage.completionTokens += usage.completionTokens || 0;
                  cumulativeUsage.promptTokens += usage.promptTokens || 0;
                  cumulativeUsage.totalTokens += usage.totalTokens || 0;
                }

                if (finishReason !== 'length') {
                  dataStream.writeMessageAnnotation({
                    type: 'usage',
                    value: {
                      completionTokens: cumulativeUsage.completionTokens,
                      promptTokens: cumulativeUsage.promptTokens,
                      totalTokens: cumulativeUsage.totalTokens,
                    },
                  });
                  dataStream.writeData({
                    type: 'progress',
                    label: 'response',
                    status: 'complete',
                    order: progressCounter++,
                    message: 'Response Generated',
                  } satisfies ProgressAnnotation);
                  await new Promise((resolve) => setTimeout(resolve, 0));

                  // stream.close();
                  return;
                }

                if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
                  throw Error('Cannot continue message: Maximum segments reached');
                }

                const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

                logger.info(
                  `Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`,
                );

                const lastUserMessage = messages.filter((x) => x.role == 'user').slice(-1)[0];
                const { model, provider } = extractPropertiesFromMessage(lastUserMessage);
                messages.push({ id: generateId(), role: 'assistant', content });
                messages.push({
                  id: generateId(),
                  role: 'user',
                  content: `[Model: ${model}]\n\n[Provider: ${provider}]\n\n${CONTINUE_PROMPT}`,
                });

                const result = await streamText({
                  messages,
                  env: context.cloudflare?.env,
                  options,
                  apiKeys,
                  files,
                  providerSettings,
                  promptId,
                  contextOptimization,
                  contextFiles: filteredFiles,
                  summary,
                  messageSliceId,
                });

                result.mergeIntoDataStream(dataStream);

                (async () => {
                  for await (const part of result.fullStream) {
                    if (part.type === 'error') {
                      const error: any = part.error;
                      logger.error(`${error}`);

                      return;
                    }
                  }
                })();

                return;
              },
            };

            dataStream.writeData({
              type: 'progress',
              label: 'response',
              status: 'in-progress',
              order: progressCounter++,
              message: 'Generating Response',
            } satisfies ProgressAnnotation);

            const result = await streamText({
              messages,
              env: context.cloudflare?.env,
              options,
              apiKeys,
              files,
              providerSettings,
              promptId,
              contextOptimization,
              contextFiles: filteredFiles,
              summary,
              messageSliceId,
            });

            (async () => {
              for await (const part of result.fullStream) {
                if (part.type === 'error') {
                  const error: any = part.error;
                  logger.error(`${error}`);

                  return;
                }
              }
            })();
            result.mergeIntoDataStream(dataStream);
          },
          onError: (error: any) => `Custom error: ${error.message}`,
        }).pipeThrough(
          new TransformStream({
            transform: (chunk: any, controller: any) => {
              if (!lastChunk) {
                lastChunk = ' ';
              }

              if (typeof chunk === 'string') {
                if (chunk.startsWith('g') && !lastChunk.startsWith('g')) {
                  controller.enqueue(encoder.encode(`0: "<div class=\\"__codinitThought__\\">"\n`));
                }

                if (lastChunk.startsWith('g') && !chunk.startsWith('g')) {
                  controller.enqueue(encoder.encode(`0: "</div>\\n"\n`));
                }
              }

              lastChunk = chunk;

              let transformedChunk = chunk;

              if (typeof chunk === 'string' && chunk.startsWith('g')) {
                let content = chunk.split(':').slice(1).join(':');

                if (content.endsWith('\n')) {
                  content = content.slice(0, content.length - 1);
                }

                transformedChunk = `0:${content}\n`;
              }

              // Convert the string stream to a byte stream
              const str = typeof transformedChunk === 'string' ? transformedChunk : JSON.stringify(transformedChunk);
              controller.enqueue(encoder.encode(str));
            },
          }),
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            'Text-Encoding': 'chunked',
          },
        },
      );
    }
  } catch (error: any) {
    logger.error(error);

    if (error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
