import { createAnthropic } from '@ai-sdk/anthropic'
import { createFireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
  isBeta?: boolean
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model
  const { apiKey, baseURL } = config

  const providerConfigs = {
    anthropic: () => createAnthropic({ apiKey, baseURL })(modelNameString),
    openai: () => createOpenAI({ apiKey, baseURL })(modelNameString),
    google: () =>
      createGoogleGenerativeAI({ apiKey, baseURL })(modelNameString),
    mistral: () => createMistral({ apiKey, baseURL })(modelNameString),
    groq: () =>
      createOpenAI({
        apiKey: apiKey || process.env.GROQ_API_KEY,
        baseURL: baseURL || 'https://api.groq.com/openai/v1',
      })(modelNameString),
    togetherai: () =>
      createOpenAI({
        apiKey: apiKey || process.env.TOGETHER_API_KEY,
        baseURL: baseURL || 'https://api.together.xyz/v1',
      })(modelNameString),
    ollama: () => createOllama({ baseURL })(modelNameString),
    fireworks: () =>
      createFireworks({
        apiKey: apiKey || process.env.FIREWORKS_API_KEY,
        baseURL: baseURL || 'https://api.fireworks.ai/inference/v1',
      })(modelNameString),
    vertex: () => {
      const vertexCredentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
      
      // Handle both API key and JSON credentials
      if (!vertexCredentials) {
        // Fallback to Google AI SDK if no Vertex credentials
        return createGoogleGenerativeAI({ 
          apiKey: apiKey || process.env.GOOGLE_AI_API_KEY 
        })(modelNameString);
      }
      
      // Try to parse as JSON first (service account credentials)
      try {
        const credentials = JSON.parse(vertexCredentials);
        return createVertex({
          googleAuthOptions: { credentials },
        })(modelNameString);
      } catch {
        // If not JSON, treat as API key and use Google AI SDK instead
        return createGoogleGenerativeAI({ 
          apiKey: vertexCredentials || apiKey || process.env.GOOGLE_AI_API_KEY 
        })(modelNameString);
      }
    },
    xai: () =>
      createOpenAI({
        apiKey: apiKey || process.env.XAI_API_KEY,
        baseURL: baseURL || 'https://api.x.ai/v1',
      })(modelNameString),
    deepseek: () =>
      createOpenAI({
        apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
        baseURL: baseURL || 'https://api.deepseek.com/v1',
      })(modelNameString),
    openrouter: () =>
      createOpenRouter({
        apiKey: apiKey || process.env.OPENROUTER_API_KEY,
        baseURL: baseURL || 'https://openrouter.ai/api/v1',
      })(modelNameString),
  }

  const createClient =
    providerConfigs[providerId as keyof typeof providerConfigs]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  return createClient()
}

export function getDefaultModelParams(model: LLMModel) {
  // Return default parameters for the model
  // This can be customized per provider/model if needed
  return {
    temperature: 0.7,
    maxTokens: 4096,
  }
}