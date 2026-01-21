import type { LanguageModelUsage, LanguageModelV1 } from 'ai';

export type CodinitModel = {
  name: string;
  model_slug: string;
  ai: LanguageModelV1;
  maxTokens: number;
};

export type CodinitResult = {
  success: boolean;
  numDeploys: number;
  usage: LanguageModelUsage;
  files: Record<string, string>;
};
