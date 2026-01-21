import { stripIndents } from '../utils/stripIndent.js';
import type { SystemPromptOptions } from '../types.js';

export function openaiProxyGuidelines(options: SystemPromptOptions) {
  if (!options.openaiProxyEnabled) {
    return '';
  }
  return stripIndents`
  <bundled_openai_guidelines>
    Apps in the Codinit environment come with a small amount of gpt-4.1-nano
    and gpt-4o-mini tokens to use for building apps! Prefer using gpt-4.1-nano
    but let the user know that gpt-4o-mini is also available.

    Use this model in creative ways.

    The environment provides the \`codinit_OPENAI_API_KEY\` and
    \`codinit_OPENAI_BASE_URL\` environment variables. Install the
    \`openai\` NPM package, and use them in an action like this:

    \`\`\`ts
    import OpenAI from "openai";
    import { action } from "./_generated/server";

    const openai = new OpenAI({
      baseURL: process.env.codinit_OPENAI_BASE_URL,
      apiKey: process.env.codinit_OPENAI_API_KEY,
    });

    export const exampleAction = action({
      args: {
        prompt: v.string(),
      },
      handler: async (ctx, args) => {
        const resp = await openai.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [{ role: "user", content: args.prompt }],
        });
        return resp.choices[0].message.content;
      },
    });
    \`\`\`

    You can ONLY use the chat completions API, and gpt-4.1-nano and gpt-4o-mini
    are the ONLY supported models. If you need different APIs or models, ask
    the user to set up their own OpenAI API key.

    If the user has already set up their own OpenAI API key, prefer using
    that over the builtin CodinIT one.
  </bundled_openai_guidelines>
  `;
}
