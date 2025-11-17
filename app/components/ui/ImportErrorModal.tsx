import * as RadixDialog from '@radix-ui/react-dialog';
import { memo, useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogDescription } from './Dialog';
import { Button } from './Button';
import { classNames } from '~/utils/classNames';

export interface FailedFileWithError {
  path: string;
  error: string;
  errorType?: 'network' | 'rate_limit' | 'auth' | 'size' | 'format' | 'unknown';
}

interface ImportErrorModalProps {
  isOpen: boolean;
  type: 'warning' | 'error';
  title: string;
  message: string;
  failedFiles?: string[];
  failedFilesWithErrors?: FailedFileWithError[];
  successCount?: number;
  totalCount?: number;
  onRetry?: () => void;
  onRetryWithExclusions?: (excludedFiles: string[]) => void;
  onContinue?: () => void;
  onClose?: () => void;
  onAskAI?: (errorContext: string) => void;
  postMessage?: (message: string) => void;
}

const ERROR_TYPE_INFO: Record<string, { label: string; color: string; icon: string; bgColor: string }> = {
  network: {
    label: 'Network',
    color: 'text-blue-600 dark:text-blue-400',
    icon: 'i-ph:wifi-x',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
  },
  rate_limit: {
    label: 'Rate Limit',
    color: 'text-orange-600 dark:text-orange-400',
    icon: 'i-ph:clock',
    bgColor: 'bg-orange-100 dark:bg-orange-500/20',
  },
  auth: {
    label: 'Auth',
    color: 'text-blue-600 dark:text-blue-400',
    icon: 'i-ph:lock',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
  },
  size: {
    label: 'File Size',
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: 'i-ph:file-x',
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
  },
  format: {
    label: 'Format',
    color: 'text-pink-600 dark:text-pink-400',
    icon: 'i-ph:warning',
    bgColor: 'bg-pink-100 dark:bg-pink-500/20',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-600 dark:text-gray-400',
    icon: 'i-ph:question',
    bgColor: 'bg-gray-100 dark:bg-gray-500/20',
  },
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error('Failed to copy:', err);
  });
}

export const ImportErrorModal = memo(
  ({
    isOpen,
    type,
    title,
    message,
    failedFiles,
    failedFilesWithErrors,
    successCount,
    totalCount,
    onRetry,
    onRetryWithExclusions,
    onContinue,
    onClose,
    onAskAI,
    postMessage,
  }: ImportErrorModalProps) => {
    const [selectedForExclusion, setSelectedForExclusion] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);

    const failedFilesList = useMemo(() => {
      if (failedFilesWithErrors) {
        return failedFilesWithErrors;
      }

      if (failedFiles) {
        return failedFiles.map((path) => ({
          path,
          error: 'Import failed',
          errorType: 'unknown' as const,
        }));
      }

      return [];
    }, [failedFiles, failedFilesWithErrors]);

    const groupedErrors = useMemo(() => {
      const groups: Record<string, FailedFileWithError[]> = {};

      failedFilesList.forEach((file) => {
        const errorType = file.errorType || 'unknown';

        if (!groups[errorType]) {
          groups[errorType] = [];
        }

        groups[errorType].push(file);
      });

      return groups;
    }, [failedFilesList]);

    const handleToggleExclusion = (filePath: string) => {
      const newSet = new Set(selectedForExclusion);

      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }

      setSelectedForExclusion(newSet);
    };

    const handleRetryWithExclusions = () => {
      if (onRetryWithExclusions) {
        onRetryWithExclusions(Array.from(selectedForExclusion));
      }
    };

    const handleCopyErrorReport = () => {
      const report = `
=== Import Error Report ===
Title: ${title}
${totalCount !== undefined ? `Total Files: ${totalCount}` : ''}
${successCount !== undefined ? `Successful: ${successCount}` : ''}
Failed: ${failedFilesList.length}

${message}

Failed Files by Type:
${Object.entries(groupedErrors)
  .map(
    ([errorType, files]) => `
${ERROR_TYPE_INFO[errorType]?.label || errorType} (${files.length}):
${files.map((f) => `  - ${f.path}: ${f.error}`).join('\n')}`,
  )
  .join('\n')}
`.trim();

      copyToClipboard(report);
    };

    const handleAskAI = () => {
      const aiPrompt = `*Help fix these import errors*

**Import Source:** ${title}
${totalCount !== undefined ? `**Total Files:** ${totalCount}` : ''}
${successCount !== undefined ? `**Successful:** ${successCount}` : ''}
**Failed:** ${failedFilesList.length}

**Error Summary:**
${message}

**Failed Files by Type:**
${Object.entries(groupedErrors)
  .map(
    ([errorType, files]) =>
      `\n**${ERROR_TYPE_INFO[errorType]?.label || errorType}** (${files.length} files):\n${files.map((f) => `- \`${f.path}\`: ${f.error}`).join('\n')}`,
  )
  .join('\n')}

Please analyze these errors and suggest how to resolve the import issues.
`;

      if (postMessage) {
        postMessage(aiPrompt);
      } else if (onAskAI) {
        onAskAI(aiPrompt);
      }
    };

    const hasAIIntegration = Boolean(postMessage || onAskAI);
    const hasExclusionFeature = Boolean(onRetryWithExclusions);
    const showStats = successCount !== undefined && totalCount !== undefined;

    return (
      <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog showCloseButton={false}>
          <div className="p-6 bg-white dark:bg-gray-950 relative z-10 max-w-2xl">
            <div className="flex items-start gap-3">
              <div
                className={classNames(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-red-100 dark:bg-red-500/20',
                )}
              >
                {type === 'warning' ? (
                  <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <DialogTitle>{title}</DialogTitle>
                  {failedFilesList.length > 0 && (
                    <button
                      onClick={handleCopyErrorReport}
                      className="text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
                      title="Copy error report"
                    >
                      <div className="i-ph:copy text-base"></div>
                    </button>
                  )}
                </div>

                {showStats && (
                  <div className="flex gap-3 mb-3 text-xs">
                    <span className="text-green-600 dark:text-green-400">✓ {successCount} succeeded</span>
                    <span className="text-red-600 dark:text-red-400">✗ {failedFilesList.length} failed</span>
                    <span className="text-codinit-elements-textSecondary">Total: {totalCount}</span>
                  </div>
                )}

                <DialogDescription className="mb-3">{message}</DialogDescription>

                {failedFilesList.length > 0 && (
                  <div className="mt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-codinit-elements-textPrimary">
                        Failed files ({failedFilesList.length}):
                      </p>
                      {failedFilesList.length > 5 && (
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-xs text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary flex items-center gap-1"
                        >
                          <div
                            className={classNames(
                              'i-ph:caret-right transition-transform',
                              isExpanded ? 'rotate-90' : '',
                            )}
                          ></div>
                          {isExpanded ? 'Collapse' : 'Expand All'}
                        </button>
                      )}
                    </div>

                    <div
                      className={classNames(
                        'rounded border border-codinit-elements-borderColor bg-codinit-elements-background-depth-1 p-2',
                        !isExpanded && failedFilesList.length > 5 ? 'max-h-[180px]' : 'max-h-[320px]',
                        'overflow-y-auto',
                      )}
                    >
                      {Object.entries(groupedErrors).map(([errorType, files]) => {
                        const errorInfo = ERROR_TYPE_INFO[errorType] || ERROR_TYPE_INFO.unknown;

                        return (
                          <div key={errorType} className="mb-3 last:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={classNames(
                                  'px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1',
                                  errorInfo.bgColor,
                                  errorInfo.color,
                                )}
                              >
                                <div className={classNames(errorInfo.icon, 'text-sm')}></div>
                                {errorInfo.label} ({files.length})
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {files.map((file, index) => (
                                <li
                                  key={index}
                                  className="text-xs bg-codinit-elements-background-depth-2 rounded p-2 flex items-start gap-2"
                                >
                                  {hasExclusionFeature && (
                                    <input
                                      type="checkbox"
                                      checked={selectedForExclusion.has(file.path)}
                                      onChange={() => handleToggleExclusion(file.path)}
                                      className="mt-0.5 flex-shrink-0"
                                      title="Exclude from retry"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-mono text-codinit-elements-textPrimary break-all">
                                      {file.path}
                                    </div>
                                    <div className="text-codinit-elements-textSecondary mt-0.5">{file.error}</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    {hasExclusionFeature && selectedForExclusion.size > 0 && (
                      <div className="mt-2 text-xs text-codinit-elements-textSecondary">
                        {selectedForExclusion.size} file(s) selected for exclusion
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 flex-wrap">
              {hasAIIntegration && failedFilesList.length > 0 && (
                <Button
                  onClick={handleAskAI}
                  className="bg-codinit-elements-button-primary-background text-codinit-elements-button-primary-text hover:bg-codinit-elements-button-primary-backgroundHover flex items-center gap-1.5"
                >
                  <div className="i-ph:chat-circle-duotone text-codinit-elements-textPrimary"></div>
                  Ask AI to Fix
                </Button>
              )}
              {hasExclusionFeature && selectedForExclusion.size > 0 && (
                <Button
                  variant="outline"
                  onClick={handleRetryWithExclusions}
                  className="border-codinit-elements-borderColor text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive"
                >
                  Exclude & Retry ({selectedForExclusion.size})
                </Button>
              )}
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={onRetry}
                  className="border-codinit-elements-borderColor text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive"
                >
                  Retry Failed Files
                </Button>
              )}
              {onContinue && (
                <Button onClick={onContinue} className="bg-accent-500 text-white hover:bg-accent-600">
                  Continue Anyway
                </Button>
              )}
              {onClose && !onContinue && !onRetry && (
                <Button onClick={onClose} className="bg-accent-500 text-white hover:bg-accent-600">
                  OK
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      </RadixDialog.Root>
    );
  },
);

ImportErrorModal.displayName = 'ImportErrorModal';
