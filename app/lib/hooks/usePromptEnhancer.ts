import { useState } from 'react';
import type { ProviderInfo } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('usePromptEnhancement');

export function usePromptEnhancer() {
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [promptEnhanced, setPromptEnhanced] = useState(false);

  const resetEnhancer = () => {
    setEnhancingPrompt(false);
    setPromptEnhanced(false);
  };

  const enhancePrompt = async (
    input: string,
    setInput: (value: string) => void,
    model: string,
    provider: ProviderInfo,
    apiKeys?: Record<string, string>,
  ) => {
    setEnhancingPrompt(true);
    setPromptEnhanced(false);

    const requestBody: any = {
      message: input,
      model,
      provider,
    };

    if (apiKeys) {
      requestBody.apiKeys = apiKeys;
    }

    const response = await fetch('/api/enhancer', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const reader = response.body?.getReader();

    const originalInput = input;

    if (reader) {
      const decoder = new TextDecoder();

      let _input = '';
      let _error;

      try {
        setInput('');

        let rafId: number | null = null;
        let pendingUpdate = false;

        const updateInput = () => {
          setInput(_input);
          pendingUpdate = false;
          rafId = null;
        };

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            if (rafId) {
              cancelAnimationFrame(rafId);
            }

            setInput(_input);
            break;
          }

          _input += decoder.decode(value);

          logger.trace('Set input', _input);

          if (!pendingUpdate) {
            pendingUpdate = true;
            rafId = requestAnimationFrame(updateInput);
          }
        }
      } catch (error) {
        _error = error;
        setInput(originalInput);
      } finally {
        if (_error) {
          logger.error(_error);
        }

        setEnhancingPrompt(false);
        setPromptEnhanced(true);

        setTimeout(() => {
          setInput(_input);
        });
      }
    }
  };

  return { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer };
}
