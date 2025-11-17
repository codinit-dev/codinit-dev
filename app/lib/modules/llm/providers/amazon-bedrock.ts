import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

interface AWSBedRockConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export default class AmazonBedrockProvider extends BaseProvider {
  name = 'AmazonBedrock';
  getApiKeyLink = 'https://console.aws.amazon.com/iam/home';
  icon = '/thirdparty/logos/bedrock.svg';

  config = {
    apiTokenKey: 'AWS_BEDROCK_CONFIG',
  };

  staticModels: ModelInfo[] = [
    // Anthropic Claude Models
    {
      name: 'anthropic.claude-3-haiku-20240307-v1:0',
      label: 'Claude 3 Haiku (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      label: 'Claude 3.5 Haiku (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
      label: 'Claude 3.7 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      label: 'Claude Haiku 4.5 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-opus-4-1-20250805-v1:0',
      label: 'Claude Opus 4.1 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-opus-4-20250514-v1:0',
      label: 'Claude Opus 4 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
      label: 'Claude Sonnet 4.5 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 1000000,
    },
    {
      name: 'anthropic.claude-sonnet-4-20250514-v1:0',
      label: 'Claude Sonnet 4 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 1000000,
    },

    // Amazon Nova Models
    {
      name: 'amazon.nova-lite-v1:0',
      label: 'Amazon Nova Lite (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 300000,
    },
    {
      name: 'amazon.nova-micro-v1:0',
      label: 'Amazon Nova Micro (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 128000,
    },
    {
      name: 'amazon.nova-premier-v1:0',
      label: 'Amazon Nova Premier (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 1000000,
    },
    {
      name: 'amazon.nova-pro-v1:0',
      label: 'Amazon Nova Pro (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 300000,
    },

    // Meta Llama Models
    {
      name: 'meta.llama3-8b-instruct-v1:0',
      label: 'Llama 3 8B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8000,
    },
    {
      name: 'meta.llama3-70b-instruct-v1:0',
      label: 'Llama 3 70B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8000,
    },
    {
      name: 'meta.llama3-1-8b-instruct-v1:0',
      label: 'Llama 3.1 8B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 128000,
    },
    {
      name: 'meta.llama3-1-70b-instruct-v1:0',
      label: 'Llama 3.1 70B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 128000,
    },
    {
      name: 'meta.llama3-1-405b-instruct-v1:0',
      label: 'Llama 3.1 405B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 128000,
    },
    {
      name: 'meta.llama3-2-1b-instruct-v1:0',
      label: 'Llama 3.2 1B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta.llama3-2-3b-instruct-v1:0',
      label: 'Llama 3.2 3B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta.llama3-2-11b-instruct-v1:0',
      label: 'Llama 3.2 11B Vision Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta.llama3-2-90b-instruct-v1:0',
      label: 'Llama 3.2 90B Vision Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta.llama3-3-70b-instruct-v1:0',
      label: 'Llama 3.3 70B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'meta.llama4-maverick-17b-instruct-v1:0',
      label: 'Llama 4 Maverick 17B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 1048576,
    },
    {
      name: 'meta.llama4-scout-17b-instruct-v1:0',
      label: 'Llama 4 Scout 17B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 327680,
    },

    // Mistral AI Models
    {
      name: 'mistral.mistral-7b-instruct-v0:2',
      label: 'Mistral 7B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral.mistral-large-2402-v1:0',
      label: 'Mistral Large 24.02 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'mistral.mistral-large-2407-v1:0',
      label: 'Mistral Large 24.07 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'mistral.mistral-small-2402-v1:0',
      label: 'Mistral Small 24.02 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral.mixtral-8x7b-instruct-v0:1',
      label: 'Mixtral 8x7B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral.pixtral-large-2502-v1:0',
      label: 'Pixtral Large 25.02 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },

    // Cohere Models
    {
      name: 'cohere.command-r-plus-v1:0',
      label: 'Command R+ (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 128000,
    },
    {
      name: 'cohere.command-r-v1:0',
      label: 'Command R (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 128000,
    },

    // AI21 Labs Models
    {
      name: 'ai21.jamba-1-5-large-v1:0',
      label: 'Jamba 1.5 Large (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 256000,
    },
    {
      name: 'ai21.jamba-1-5-mini-v1:0',
      label: 'Jamba 1.5 Mini (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 256000,
    },

    // DeepSeek Models
    {
      name: 'deepseek.r1-v1:0',
      label: 'DeepSeek-R1 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'deepseek.v3-v1:0',
      label: 'DeepSeek-V3.1 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },

    // OpenAI Models
    {
      name: 'openai.gpt-oss-120b-1:0',
      label: 'GPT OSS 120B (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },
    {
      name: 'openai.gpt-oss-20b-1:0',
      label: 'GPT OSS 20B (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 131072,
    },

    // Qwen Models
    {
      name: 'qwen.qwen3-32b-v1:0',
      label: 'Qwen3 32B (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 40960,
    },
    {
      name: 'qwen.qwen3-235b-a22b-2507-v1:0',
      label: 'Qwen3 235B A22B 2507 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 262144,
    },
    {
      name: 'qwen.qwen3-coder-480b-a35b-v1:0',
      label: 'Qwen3 Coder 480B A35B (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 262144,
    },
    {
      name: 'qwen.qwen3-coder-30b-a3b-v1:0',
      label: 'Qwen3 Coder 30B A3B (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 262144,
    },

    // Writer Models
    {
      name: 'writer.palmyra-x4-v1:0',
      label: 'Palmyra X4 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'writer.palmyra-x5-v1:0',
      label: 'Palmyra X5 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },

    // Amazon Titan Legacy Models (for compatibility)
    {
      name: 'amazon.titan-text-express-v1',
      label: 'Titan Text Express (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8000,
    },
    {
      name: 'amazon.titan-text-lite-v1',
      label: 'Titan Text Lite (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 4000,
    },
    {
      name: 'amazon.titan-tg1-large',
      label: 'Titan Text Large (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8000,
    },
  ];

  private _parseAndValidateConfig(apiKey: string): AWSBedRockConfig {
    let parsedConfig: AWSBedRockConfig;

    try {
      parsedConfig = JSON.parse(apiKey);
    } catch {
      throw new Error(
        'Invalid AWS Bedrock configuration format. Please provide a valid JSON string containing region, accessKeyId, and secretAccessKey.',
      );
    }

    const { region, accessKeyId, secretAccessKey, sessionToken } = parsedConfig;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing required AWS credentials. Configuration must include region, accessKeyId, and secretAccessKey.',
      );
    }

    return {
      region,
      accessKeyId,
      secretAccessKey,
      ...(sessionToken && { sessionToken }),
    };
  }

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'AWS_BEDROCK_CONFIG',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const config = this._parseAndValidateConfig(apiKey);
    const bedrock = createAmazonBedrock(config);

    return bedrock(model);
  }
}
