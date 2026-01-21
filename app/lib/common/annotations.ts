
export const REPEATED_ERROR_REASON = "repeated-error";

export type Usage = {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
    xaiCachedPromptTokens: number;
    openaiCachedPromptTokens: number;
    anthropicCacheReadInputTokens: number;
    anthropicCacheCreationInputTokens: number;
    googleCachedContentTokenCount: number;
    googleThoughtsTokenCount: number;
    bedrockCacheWriteInputTokens: number;
    bedrockCacheReadInputTokens: number;
    toolCallId?: string;
    providerMetadata?: any;
};
