import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

const logger = createScopedLogger('api.enhancher');

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, model, provider } = await request.json<{
    message: string;
    model: string;
    provider: ProviderInfo;
    apiKeys?: Record<string, string>;
  }>();

  const { name: providerName } = provider;

  // validate 'model' and 'provider' fields
  if (!model || typeof model !== 'string') {
    throw new Response('Invalid or missing model', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Invalid or missing provider', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content:
            `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n` +
            stripIndents`
            You are an expert prompt engineer specializing in crafting precise, comprehensive, and production-ready prompts.
            Your task is to enhance prompts by making them more specific, actionable, complete, and effective.

            ANALYSIS & ENHANCEMENT RULES:

            1. DESIGN SCHEME DETECTION:
               - If no design system/scheme is mentioned, suggest one based on context:
                 * For web apps: "Use a modern design system (e.g., Material Design 3, Tailwind's default palette, or a custom minimalist approach)"
                 * For component libraries: "Follow component composition patterns with clear prop interfaces"
                 * For full-stack: "Implement a cohesive design language across frontend and backend"
               - Include accessibility requirements if building UI components

            2. COMPONENT RECOGNITION:
               - If specific components are mentioned (buttons, forms, modals, cards, etc.):
                 * Provide fully built, production-ready prompt including:
                   - Complete component specifications
                   - Props and type definitions
                   - Accessibility considerations
                   - Visual styling requirements
                   - Integration patterns with the tech stack
                   - Testing requirements
               - If building a system or feature, include:
                 * Architecture overview
                 * Data models and interfaces
                 * API contract definitions
                 * Error handling and edge cases

            3. PROMPT ENHANCEMENT:
               - Make instructions explicit and unambiguous
               - Add relevant technical context and constraints
               - Include specific deliverables and acceptance criteria
               - Remove redundant information
               - Maintain the core intent
               - Ensure the prompt is self-contained and actionable
               - Use professional, technical language
               - Add quality standards (performance, accessibility, testing)

            4. INCOMPLETE PROMPTS:
               - Identify what's missing or unclear
               - Provide structured guidance on what to specify
               - Suggest a template or framework for revision
               - Maintain a helpful, constructive tone

            IMPORTANT: Your response must ONLY contain the enhanced prompt text.
            Do not include any explanations, metadata, preamble, or wrapper tags.
            The output should be ready to use directly with an AI model.

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      env: context.cloudflare?.env as any,
      apiKeys,
      providerSettings,
      options: {
        system: stripIndents`
            You are a world-class AI prompt engineer and senior software architect with deep expertise in:
            - Crafting precise, actionable, production-ready prompts
            - Detecting missing context and technical requirements
            - Suggesting modern design patterns and architectural approaches
            - Building comprehensive specifications for complex features

            Your role is to transform user requests into professional, comprehensive prompts that:
            1. Are immediately actionable by other AI models or developers
            2. Include all necessary technical context and constraints
            3. Specify design schemes when missing
            4. Provide complete, fully-built specifications for components and features
            5. Address edge cases, accessibility, performance, and testing
            6. Maintain clear structure and professional language

            Output ONLY the enhanced prompt text - no explanations, no metadata, no wrapper tags.
            The output must be ready to use directly as a prompt to an AI model or development team.
          `,

        /*
         * onError: (event) => {
         *   throw new Response(null, {
         *     status: 500,
         *     statusText: 'Internal Server Error',
         *   });
         * }
         */
      },
    });

    // Handle streaming errors in a non-blocking way
    (async () => {
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'error') {
            const error: any = part.error;
            logger.error('Streaming error:', error);
            break;
          }
        }
      } catch (error) {
        logger.error('Error processing stream:', error);
      }
    })();

    // Return the text stream directly since it's already text data
    return new Response(result.textStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.log(error);

    if (error instanceof Error && error.message?.includes('API key')) {
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
