import { useStore } from '@nanostores/react';
import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { workbenchStore } from '~/lib/stores/workbench';
import { InlineDiffComparison } from './DiffView';
import { Dialog, DialogTitle } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';

export function DiffApprovalDialog() {
  const pending = useStore(workbenchStore.pendingApproval);
  const [isApproving, setIsApproving] = useState(false);

  if (!pending) {
    return null;
  }

  const { filePath, beforeContent, afterContent } = pending;

  const getLanguageFromPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'tsx',
      js: 'javascript',
      jsx: 'jsx',
      json: 'json',
      html: 'html',
      css: 'css',
      py: 'python',
      php: 'php',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rb: 'ruby',
      rs: 'rust',
    };

    return langMap[ext] || 'plaintext';
  };

  const handleApprove = async () => {
    setIsApproving(true);

    try {
      await workbenchStore.approveFileChange();
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    await workbenchStore.rejectFileChange();
  };

  const language = getLanguageFromPath(filePath);

  return (
    <RadixDialog.Root open={true}>
      <Dialog showCloseButton={false}>
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="p-6 border-b border-codinit-elements-borderColor">
            <DialogTitle>Approve File Change</DialogTitle>
            <div className="mt-2 text-sm text-codinit-elements-textSecondary font-mono">{filePath}</div>
          </div>

          <div className="flex-1 overflow-hidden">
            <InlineDiffComparison
              beforeCode={beforeContent}
              afterCode={afterContent}
              language={language}
              filename={filePath}
              lightTheme="github-light"
              darkTheme="github-dark"
            />
          </div>

          <div className="p-6 border-t border-codinit-elements-borderColor bg-codinit-elements-background-depth-2 flex justify-end gap-3">
            <Button variant="outline" onClick={handleReject} disabled={isApproving}>
              Reject
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isApproving ? (
                <>
                  <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
