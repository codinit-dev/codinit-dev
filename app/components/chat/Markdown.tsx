import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { BundledLanguage } from 'shiki';
import { createScopedLogger } from '~/utils/logger';
import { rehypePlugins, remarkPlugins, allowedHTMLElements } from '~/utils/markdown';
import { Artifact } from './Artifact';
import { CodeBlock } from './CodeBlock';

import styles from './Markdown.module.scss';
import ThoughtBox from './ThoughtBox';

const logger = createScopedLogger('MarkdownComponent');

interface MarkdownProps {
  children: string;
  html?: boolean;
  limitedMarkdown?: boolean;
}

export const Markdown = memo(({ children, html = false, limitedMarkdown = false }: MarkdownProps) => {
  logger.trace('Render');

  const components = useMemo(() => {
    return {
      div: ({ className, children, node, ...props }) => {
        if (className?.includes('__codinitArtifact__')) {
          const messageId = node?.properties.dataMessageId as string;

          if (!messageId) {
            logger.error(`Invalid message id ${messageId}`);
          }

          return <Artifact messageId={messageId} />;
        }

        if (className?.includes('__codinitThought__')) {
          return <ThoughtBox title="Thought process">{children}</ThoughtBox>;
        }

        return (
          <div className={className} {...props}>
            {children}
          </div>
        );
      },
      pre: (props) => {
        const { children, node, ...rest } = props;

        const [firstChild] = node?.children ?? [];

        if (
          firstChild &&
          firstChild.type === 'element' &&
          firstChild.tagName === 'code' &&
          firstChild.children[0].type === 'text'
        ) {
          const { className, ...rest } = firstChild.properties;
          const [, language = 'plaintext'] = /language-(\w+)/.exec(String(className) || '') ?? [];

          return <CodeBlock code={firstChild.children[0].value} language={language as BundledLanguage} {...rest} />;
        }

        return <pre {...rest}>{children}</pre>;
      },
    } satisfies Components;
  }, []);

  return (
    <ReactMarkdown
      allowedElements={allowedHTMLElements}
      className={styles.MarkdownContent}
      components={components}
      remarkPlugins={remarkPlugins(limitedMarkdown)}
      rehypePlugins={rehypePlugins(html)}
    >
      {stripCodeFenceFromArtifact(children)}
    </ReactMarkdown>
  );
});

export const stripCodeFenceFromArtifact = (content: string) => {
  if (!content || !content.includes('__codinitArtifact__')) {
    return content;
  }

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this is a code fence opening
    if (line?.trim().match(/^```\w*$/)) {
      const fenceStart = i;
      let fenceEnd = -1;
      let hasArtifact = false;

      // Find the closing fence and check for artifacts
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j]?.trim() === '```') {
          fenceEnd = j;
          break;
        }

        if (lines[j]?.includes('__codinitArtifact__')) {
          hasArtifact = true;
        }
      }

      // If we found a complete fence block containing an artifact, remove the fence markers
      if (fenceEnd !== -1 && hasArtifact) {
        // Replace the closing fence with empty line to preserve spacing
        lines[fenceEnd] = '';

        // Replace the opening fence with empty line to preserve spacing
        lines[fenceStart] = '';

        // Move past the fence block we just processed
        i = fenceEnd + 1;
        continue;
      }
    }

    i++;
  }

  return lines.join('\n');
};
