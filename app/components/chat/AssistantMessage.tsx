import { memo } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';
import { ContextIndicator } from './ContextIndicator';
import WithTooltip from '~/components/ui/Tooltip';

interface AssistantMessageProps {
  content: string;
  annotations?: JSONValue[];
  messageId?: string;
  onRewind?: (messageId: string) => void;
  onFork?: (messageId: string) => void;
}

export const AssistantMessage = memo(({ content, annotations, messageId, onRewind, onFork }: AssistantMessageProps) => {
  const filteredAnnotations = (annotations?.filter(
    (annotation: JSONValue) => annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
  ) || []) as { type: string; value: any } & { [key: string]: any }[];

  let chatSummary: string | undefined = undefined;

  if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
    chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
  }

  let codeContext: string[] | undefined = undefined;

  if (filteredAnnotations.find((annotation) => annotation.type === 'codeContext')) {
    codeContext = filteredAnnotations.find((annotation) => annotation.type === 'codeContext')?.files;
  }

  const usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value;

  return (
    <div className="overflow-hidden w-full">
      {(codeContext || chatSummary || usage) && (
        <ContextIndicator
          files={codeContext}
          summary={chatSummary}
          tokenCount={
            usage
              ? {
                  prompt: usage.promptTokens,
                  completion: usage.completionTokens,
                  total: usage.totalTokens,
                }
              : undefined
          }
        />
      )}
      {(onRewind || onFork) && messageId && (
        <div className="flex gap-2 mb-2 justify-end">
          {onRewind && (
            <WithTooltip tooltip="Revert to this message">
              <button
                onClick={() => onRewind(messageId)}
                className="i-ph:arrow-u-up-left text-lg text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
              />
            </WithTooltip>
          )}
          {onFork && (
            <WithTooltip tooltip="Fork chat from this message">
              <button
                onClick={() => onFork(messageId)}
                className="i-ph:git-fork text-lg text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
              />
            </WithTooltip>
          )}
        </div>
      )}
      <Markdown html>{content}</Markdown>
    </div>
  );
});
