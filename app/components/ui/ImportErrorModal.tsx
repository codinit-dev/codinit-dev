import * as RadixDialog from '@radix-ui/react-dialog';
import { memo } from 'react';
import { Dialog, DialogTitle, DialogDescription } from './Dialog';
import { Button } from './Button';
import { classNames } from '~/utils/classNames';

interface ImportErrorModalProps {
  isOpen: boolean;
  type: 'warning' | 'error';
  title: string;
  message: string;
  failedFiles?: string[];
  onRetry?: () => void;
  onContinue?: () => void;
  onClose?: () => void;
}

export const ImportErrorModal = memo(
  ({ isOpen, type, title, message, failedFiles, onRetry, onContinue, onClose }: ImportErrorModalProps) => {
    return (
      <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog showCloseButton={false}>
          <div className="p-6 bg-white dark:bg-gray-950 relative z-10">
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
                <DialogTitle className="mb-1">{title}</DialogTitle>
                <DialogDescription className="mb-3">{message}</DialogDescription>

                {failedFiles && failedFiles.length > 0 && (
                  <div className="mt-4 mb-4">
                    <p className="text-sm font-medium text-bolt-elements-textPrimary mb-2">
                      Failed files ({failedFiles.length}):
                    </p>
                    <div className="max-h-[120px] overflow-y-auto rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2">
                      <ul className="space-y-1">
                        {failedFiles.map((file, index) => (
                          <li key={index} className="text-xs text-bolt-elements-textSecondary font-mono break-all">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={onRetry}
                  className="border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive"
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
