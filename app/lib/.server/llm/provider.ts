export type ModelProvider = 'OpenAI' | 'Anthropic' | 'Google' | 'Bedrock';

export function getProvider(
  apiKey: string | undefined,
  provider: ModelProvider,
  modelChoice: string | undefined,
): { model: any; maxTokens: number; options: any } {
  return {
    model: { modelId: modelChoice || 'gpt-4o' },
    maxTokens: 4096,
    options: {},
  };
}
