
import { z } from "zod";

export const envSchema = z.object({
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    OPENAI_PROXY_ENABLED: z.string().optional(),
    RESEND_PROXY_ENABLED: z.string().optional(),
});

export function getEnv(key: string): string | undefined {
    return process.env[key];
}
