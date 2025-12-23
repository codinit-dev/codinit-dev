import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createDataStream } from 'ai';
import { AgentFactory } from '~/lib/agent-sdk';
import { StreamManager } from '~/lib/agent-sdk/streaming/stream-manager';
import { webcontainer } from '~/lib/webcontainer';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';
import { z } from 'zod';

const logger = createScopedLogger('api.agent');

const AGENT_REQUEST_SCHEMA = z.object({
  task: z.string().min(1),
  agentConfig: z
    .object({
      name: z.string().optional(),
      model: z.string().optional(),
      provider: z.string().optional(),
      reasoningPattern: z.enum(['plan-execute', 'react', 'tree-of-thoughts']).optional(),
      maxIterations: z.number().int().positive().optional(),
      tokenBudget: z.number().int().positive().optional(),
      enableSelfCorrection: z.boolean().optional(),
      enableMemory: z.boolean().optional(),
      enableCheckpointing: z.boolean().optional(),
    })
    .optional(),
});

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

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const rawBody = await request.json();
    const validatedRequest = AGENT_REQUEST_SCHEMA.parse(rawBody);

    const { task, agentConfig } = validatedRequest;

    logger.info('Agent execution request received:', { task, config: agentConfig });

    const cookieHeader = request.headers.get('Cookie');
    const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');

    const env = context.cloudflare?.env || {};

    const dataStream = createDataStream({
      async execute(dataStream) {
        try {
          const factory = AgentFactory.getInstance({ env: env as unknown as Record<string, string> });
          const agent = await factory.create(agentConfig || {});

          const streamManager = new StreamManager(dataStream);

          agent.onPlanGenerated((plan) => {
            streamManager.emitPlanGenerated(plan);
          });

          agent.onStepStarted((step) => {
            streamManager.emitStepStarted(step);
          });

          agent.onToolCall((call) => {
            streamManager.emitToolCall(call);
          });

          agent.onObservation((observation) => {
            streamManager.emitObservation(observation);
          });

          agent.onReflection((reflection) => {
            streamManager.emitReflection(reflection);
          });

          agent.onStatusChange((status) => {
            streamManager.emitProgress('agent', status, `Agent status: ${status}`);
          });

          const files = workbenchStore.files.get();
          const container = await webcontainer;

          const agentContext = {
            apiKeys,
            files,
            webcontainer: container,
            workingDirectory: '/home/project',
          };

          logger.info('Starting agent execution');

          const result = await agent.execute(task, agentContext);

          streamManager.emitComplete(result);

          logger.info('Agent execution completed:', {
            success: result.success,
            iterations: result.iterations,
            duration: result.duration,
          });
        } catch (error: any) {
          logger.error('Agent execution error:', error);

          dataStream.writeMessageAnnotation({
            type: 'agent-error',
            error: error.message || 'Unknown error',
            recoverable: false,
            timestamp: Date.now(),
          });

          dataStream.writeData({
            type: 'agent-progress',
            phase: 'error',
            status: 'failed',
            message: error.message || 'Agent execution failed',
          });
        }
      },
    });

    return new Response(dataStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    logger.error('Agent API error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process agent request',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
