import { memo, useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';
import WithTooltip from '~/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextIndicatorProps {
  files?: string[];
  summary?: string;
  tokenCount?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

function normalizedFilePath(path: string) {
  let normalizedPath = path;

  if (normalizedPath.startsWith(WORK_DIR)) {
    normalizedPath = path.replace(WORK_DIR, '');
  }

  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1);
  }

  return normalizedPath;
}

function openFileInWorkbench(filePath: string) {
  const normalized = normalizedFilePath(filePath);

  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${normalized}`);
}

function getFileIcon(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'i-vscode-icons:file-type-typescript';
    case 'js':
    case 'jsx':
      return 'i-vscode-icons:file-type-js';
    case 'css':
      return 'i-vscode-icons:file-type-css';
    case 'html':
      return 'i-vscode-icons:file-type-html';
    case 'json':
      return 'i-vscode-icons:file-type-json';
    case 'md':
      return 'i-vscode-icons:file-type-markdown';
    case 'sql':
      return 'i-vscode-icons:file-type-sql';
    default:
      return 'i-ph:file';
  }
}

export const ContextIndicator = memo(({ files, summary, tokenCount }: ContextIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!files?.length && !summary) {
    return null;
  }

  const fileCount = files?.length || 0;

  return (
    <div className="context-indicator mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs transition-colors"
        style={{ color: 'var(--codinit-elements-textSecondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--codinit-elements-textPrimary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--codinit-elements-textSecondary)')}
      >
        <span className={`i-ph:caret-${isExpanded ? 'down' : 'right'} text-sm`} style={{ color: 'inherit' }} />
        <span className="i-ph:files text-sm" style={{ color: 'inherit' }} />
        <span>
          {fileCount} file{fileCount !== 1 ? 's' : ''} in context
        </span>
        {summary && (
          <>
            <span className="i-ph:chat-circle-text text-sm" style={{ color: 'inherit' }} />
            <span>Summarized</span>
          </>
        )}
        {tokenCount && (
          <>
            <span style={{ color: 'var(--codinit-elements-borderColor)' }}>•</span>
            <span className="i-ph:coins text-sm" style={{ color: 'inherit' }} />
            <span>{tokenCount.total.toLocaleString()} tokens</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 p-3 rounded-lg border border-codinit-elements-borderColor"
              style={{ backgroundColor: 'var(--codinit-elements-bg-depth-2)' }}
            >
              {files && files.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-codinit-elements-textSecondary mb-2">Files included:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {files.map((file) => {
                      const normalized = normalizedFilePath(file);
                      const fileName = normalized.split('/').pop() || normalized;

                      return (
                        <WithTooltip key={normalized} tooltip={normalized}>
                          <button
                            onClick={() => openFileInWorkbench(file)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-codinit-elements-textPrimary rounded hover:opacity-80 transition-colors"
                            style={{ backgroundColor: 'var(--codinit-elements-bg-depth-3)' }}
                          >
                            <span className={`${getFileIcon(normalized)} text-sm`} />
                            <span className="max-w-32 truncate">{fileName}</span>
                          </button>
                        </WithTooltip>
                      );
                    })}
                  </div>
                </div>
              )}

              {summary && (
                <div>
                  <div className="text-xs font-medium text-codinit-elements-textSecondary mb-2">
                    Conversation summary:
                  </div>
                  <div
                    className="text-xs text-codinit-elements-textPrimary p-2 rounded max-h-32 overflow-y-auto"
                    style={{ backgroundColor: 'var(--codinit-elements-bg-depth-3)' }}
                  >
                    {summary.length > 300 ? `${summary.substring(0, 300)}...` : summary}
                  </div>
                </div>
              )}

              {tokenCount && (
                <div className="mt-3 pt-3 border-t border-codinit-elements-borderColor">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-codinit-elements-textSecondary">
                    <span>Prompt: {tokenCount.prompt.toLocaleString()}</span>
                    <span>Completion: {tokenCount.completion.toLocaleString()}</span>
                    <span className="font-medium text-codinit-elements-textPrimary">
                      Total: {tokenCount.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
