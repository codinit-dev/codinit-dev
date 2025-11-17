import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { ActionAlert } from '~/types/actions';
import { classNames } from '~/utils/classNames';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

const ERROR_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  syntax: { label: 'Syntax Error', color: 'bg-red-500' },
  runtime: { label: 'Runtime Error', color: 'bg-orange-500' },
  build: { label: 'Build Error', color: 'bg-yellow-600' },
  network: { label: 'Network Error', color: 'bg-blue-500' },
  permission: { label: 'Permission Error', color: 'bg-blue-500' },
  dependency: { label: 'Dependency Error', color: 'bg-pink-500' },
  unknown: { label: 'Error', color: 'bg-gray-500' },
};

function extractFilePathsFromError(errorText: string): Array<{ path: string; line?: number; column?: number }> {
  const paths: Array<{ path: string; line?: number; column?: number }> = [];
  const filePathRegex = /(?:at |in |File: ?|from )([\/\w\-_.]+\.[\w]+)(?::(\d+)(?::(\d+))?)?/g;
  let match;

  while ((match = filePathRegex.exec(errorText)) !== null) {
    paths.push({
      path: match[1],
      line: match[2] ? parseInt(match[2]) : undefined,
      column: match[3] ? parseInt(match[3]) : undefined,
    });
  }

  return paths;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error('Failed to copy:', err);
  });
}

export default function ChatAlert({ alert, clearAlert, postMessage }: Props) {
  const { description, content, source, stackTrace, affectedFiles, errorType, timestamp, command, exitCode } = alert;
  const [isExpanded, setIsExpanded] = useState(false);

  const isPreview = source === 'preview';
  const title = isPreview ? 'Preview Error' : 'Terminal Error';
  const message = isPreview
    ? 'We encountered an error while running the preview. Would you like CodinIT to analyze and help resolve this issue?'
    : 'We encountered an error while running terminal commands. Would you like CodinIT to analyze and help resolve this issue?';

  const extractedFiles = affectedFiles || extractFilePathsFromError(content || description);
  const detectedErrorType = errorType || 'unknown';
  const errorTypeInfo = ERROR_TYPE_LABELS[detectedErrorType] || ERROR_TYPE_LABELS.unknown;

  const handleCopyError = () => {
    const errorReport = `
=== ${title} ===
Type: ${errorTypeInfo.label}
Time: ${timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
${command ? `Command: ${command}` : ''}
${exitCode !== undefined ? `Exit Code: ${exitCode}` : ''}

Description:
${description}

${stackTrace ? `Stack Trace:\n${stackTrace}\n\n` : ''}${content ? `Output:\n${content}` : ''}
${extractedFiles.length > 0 ? `\nAffected Files:\n${extractedFiles.map((f) => `- ${f.path}${f.line ? `:${f.line}` : ''}`).join('\n')}` : ''}
`.trim();

    copyToClipboard(errorReport);
  };

  const handleAskAI = () => {
    const aiPrompt = `*Fix this ${detectedErrorType} error in ${isPreview ? 'preview' : 'terminal'}*

**Error Type:** ${errorTypeInfo.label}
${command ? `**Command:** \`${command}\`` : ''}
${exitCode !== undefined ? `**Exit Code:** ${exitCode}` : ''}
${timestamp ? `**Time:** ${new Date(timestamp).toLocaleString()}` : ''}

**Error Description:**
${description}

${extractedFiles.length > 0 ? `**Affected Files:**\n${extractedFiles.map((f) => `- ${f.path}${f.line ? ` (line ${f.line}${f.column ? `, col ${f.column}` : ''})` : ''}`).join('\n')}\n\n` : ''}${stackTrace ? `**Stack Trace:**\n\`\`\`\n${stackTrace}\n\`\`\`\n\n` : ''}\`\`\`${isPreview ? 'js' : 'sh'}
${content}
\`\`\`
`;

    postMessage(aiPrompt);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-codinit-elements-borderColor bg-codinit-elements-background-depth-2 p-4 mb-2"
      >
        <div className="flex items-start">
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="i-ph:warning-duotone text-xl text-codinit-elements-button-danger-text"></div>
          </motion.div>

          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-medium text-codinit-elements-textPrimary"
                >
                  {title}
                </motion.h3>
                <span className={classNames('px-2 py-0.5 rounded text-xs font-medium text-white', errorTypeInfo.color)}>
                  {errorTypeInfo.label}
                </span>
              </div>
              <button
                onClick={handleCopyError}
                className="text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
                title="Copy error details"
              >
                <div className="i-ph:copy text-base"></div>
              </button>
            </div>

            {timestamp && (
              <div className="text-xs text-codinit-elements-textSecondary mb-2">
                {new Date(timestamp).toLocaleString()}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-sm text-codinit-elements-textSecondary"
            >
              <p>{message}</p>

              {description && (
                <div className="text-xs text-codinit-elements-textSecondary p-2 bg-codinit-elements-background-depth-3 rounded mt-3 mb-2">
                  <span className="font-medium">Error:</span> {description}
                </div>
              )}

              {command && (
                <div className="mt-2 mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-codinit-elements-textSecondary">Command:</span>
                  <code className="text-xs bg-codinit-elements-background-depth-3 px-2 py-1 rounded font-mono flex-1">
                    {command}
                  </code>
                  <button
                    onClick={() => copyToClipboard(command)}
                    className="text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary"
                    title="Copy command"
                  >
                    <div className="i-ph:copy text-sm"></div>
                  </button>
                </div>
              )}

              {extractedFiles.length > 0 && (
                <div className="mt-3 mb-2">
                  <div className="text-xs font-medium text-codinit-elements-textPrimary mb-1">Affected Files:</div>
                  <div className="flex flex-wrap gap-1">
                    {extractedFiles.slice(0, 3).map((file, index) => (
                      <span
                        key={index}
                        className="text-xs bg-codinit-elements-background-depth-3 px-2 py-1 rounded font-mono text-codinit-elements-textSecondary"
                      >
                        {file.path}
                        {file.line && (
                          <span className="text-codinit-elements-button-danger-text">
                            :{file.line}
                            {file.column && `:${file.column}`}
                          </span>
                        )}
                      </span>
                    ))}
                    {extractedFiles.length > 3 && (
                      <span className="text-xs text-codinit-elements-textSecondary px-2 py-1">
                        +{extractedFiles.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(stackTrace || (content && content.length > 200)) && (
                <div className="mt-3">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium text-codinit-elements-textPrimary hover:text-accent-500 flex items-center gap-1"
                  >
                    <div
                      className={classNames('i-ph:caret-right transition-transform', isExpanded ? 'rotate-90' : '')}
                    ></div>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2"
                    >
                      {stackTrace && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-codinit-elements-textPrimary mb-1">Stack Trace:</div>
                          <pre className="text-xs bg-codinit-elements-background-depth-3 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto font-mono text-codinit-elements-textSecondary whitespace-pre-wrap">
                            {stackTrace}
                          </pre>
                        </div>
                      )}

                      {content && (
                        <div>
                          <div className="text-xs font-medium text-codinit-elements-textPrimary mb-1">Full Output:</div>
                          <pre className="text-xs bg-codinit-elements-background-depth-3 p-2 rounded overflow-x-auto max-h-60 overflow-y-auto font-mono text-codinit-elements-textSecondary whitespace-pre-wrap">
                            {content}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex gap-2">
                <button
                  onClick={handleAskAI}
                  className={classNames(
                    'px-3 py-1.5 rounded-md text-sm font-medium',
                    'bg-codinit-elements-button-primary-background',
                    'hover:bg-codinit-elements-button-primary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-codinit-elements-button-danger-background',
                    'text-codinit-elements-button-primary-text',
                    'flex items-center gap-1.5',
                  )}
                >
                  <div className="i-ph:chat-circle-duotone text-codinit-elements-textPrimary"></div>
                  Fix
                </button>
                <button
                  onClick={clearAlert}
                  className={classNames(
                    'px-3 py-1.5 rounded-md text-sm font-medium',
                    'bg-codinit-elements-button-secondary-background',
                    'hover:bg-codinit-elements-button-secondary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-codinit-elements-button-secondary-background',
                    'text-codinit-elements-button-secondary-text',
                  )}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
