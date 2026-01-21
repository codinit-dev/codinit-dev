import type { Usage } from './annotations';

export function calculateCodinitTokens(_usage: Usage, _provider: string): { codinitTokens: number } {
  return { codinitTokens: 0 };
}

export function usageFromGeneration(generation: any): Usage {
  return {
    completionTokens: generation.usage.completionTokens || 0,
    promptTokens: generation.usage.promptTokens || 0,
    totalTokens: generation.usage.totalTokens || 0,
    xaiCachedPromptTokens: 0,
    openaiCachedPromptTokens: 0,
    anthropicCacheReadInputTokens: 0,
    anthropicCacheCreationInputTokens: 0,
    googleCachedContentTokenCount: 0,
    googleThoughtsTokenCount: 0,
    bedrockCacheWriteInputTokens: 0,
    bedrockCacheReadInputTokens: 0,
  };
}
