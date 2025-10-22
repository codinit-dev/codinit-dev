import type { Message } from 'ai';
import { useCallback, useState } from 'react';
import { EnhancedStreamingMessageParser } from '~/lib/runtime/enhanced-message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useMessageParser');

const messageParser = new EnhancedStreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      logger.trace('onArtifactOpen', data);

      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);
    },
    onArtifactClose: (data) => {
      logger.trace('onArtifactClose');

      workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      logger.trace('onActionOpen', data.action);

      /*
       * File actions are streamed, so we add them immediately to show progress
       * Shell actions are complete when created by enhanced parser, so we wait for close
       */
      if (data.action.type === 'file') {
        workbenchStore.addAction(data);
      }
    },
    onActionClose: (data) => {
      logger.trace('onActionClose', data.action);

      /*
       * Add non-file actions (shell, build, start, etc.) when they close
       * Enhanced parser creates complete shell actions, so they're ready to execute
       */
      if (data.action.type !== 'file') {
        workbenchStore.addAction(data);
      }

      workbenchStore.runAction(data);
    },
    onActionStream: (data) => {
      logger.trace('onActionStream', data.action);
      workbenchStore.runAction(data, true);
    },
  },
});
const extractTextContent = (message: Message) =>
  Array.isArray(message.content)
    ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
    : message.content;

export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<{ [key: number]: string }>({});
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const parseMessages = useCallback(
    (messages: Message[], isLoading: boolean) => {
      // Reset only if message count decreased (indicates new chat session)
      if (messages.length < lastMessageCount) {
        messageParser.reset();
        setParsedMessages({});
        setProcessedMessageIds(new Set());
        setLastMessageCount(messages.length);
      } else {
        setLastMessageCount(messages.length);
      }

      for (const [index, message] of messages.entries()) {
        if (message.role === 'assistant' || message.role === 'user') {
          const textContent = extractTextContent(message);

          // Check if this is a new message or streaming update
          const isNewMessage = !processedMessageIds.has(message.id);
          const isStreamingUpdate = isLoading && index === messages.length - 1;

          if (isNewMessage || isStreamingUpdate) {
            const newParsedContent = messageParser.parse(message.id, textContent);

            setParsedMessages((prevParsed) => ({
              ...prevParsed,
              [index]: isNewMessage ? newParsedContent : (prevParsed[index] || '') + newParsedContent,
            }));

            // Mark as processed if it's a complete message (not streaming)
            if (!isLoading && isNewMessage) {
              setProcessedMessageIds((prev) => new Set(prev).add(message.id));
            }
          }
        }
      }
    },
    [lastMessageCount, processedMessageIds],
  );

  return { parsedMessages, parseMessages };
}
