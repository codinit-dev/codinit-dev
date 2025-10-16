import { useSearchParams } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { useGit } from '~/lib/hooks/useGit';
import { useChatHistory } from '~/lib/persistence';
import { initFromGitRepo } from '~/lib/services/projectInit';

export function GitUrlImport() {
  const [searchParams] = useSearchParams();
  const { ready: historyReady, importChat } = useChatHistory();
  const { ready: gitReady, gitClone } = useGit();
  const [imported, setImported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const importRepo = async (repoUrl?: string, subdir?: string) => {
    console.group('importRepo');
    console.log('repoUrl:', repoUrl);
    console.log('subdir:', subdir);
    console.log('retryCount:', retryCount);

    if (!gitReady || !historyReady) {
      throw new Error('System not ready. Please wait...');
    }

    if (repoUrl) {
      try {
        setError(null);

        const startTime = performance.now();
        const { workdir, data } = await gitClone(repoUrl, retryCount, subdir);
        const cloneTime = performance.now() - startTime;
        console.log(`Git clone completed in ${cloneTime}ms`);
        console.log('File count:', Object.keys(data).length);

        if (importChat) {
          const { messages } = await initFromGitRepo({
            repoUrl,
            workdir,
            fileData: Object.fromEntries(
              Object.entries(data).map(([path, file]) => [
                path,
                { data: file.data, encoding: file.encoding || 'utf8' },
              ]),
            ),
          });

          await importChat(`Git Project:${repoUrl.split('/').slice(-1)[0]}`, messages, { gitUrl: repoUrl });
          console.log('Import successful');

          /*
           * Show workbench after files are imported and messages are processed
           * Wait for the action runner to process messages and write files to WebContainer
           */
          const { workbenchStore } = await import('~/lib/stores/workbench');

          /*
           * Poll the workbench store to check if files have been written
           * The action runner processes the codinitArtifact actions asynchronously
           * Wait up to 10 seconds for files to appear
           */
          const startTime = Date.now();
          const maxWaitTime = 10000;
          const expectedFileCount = Object.keys(data).length;

          console.log(`Waiting for ${expectedFileCount} files to be written to WebContainer...`);

          let lastCount = 0;

          while (workbenchStore.filesCount < expectedFileCount && Date.now() - startTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, 200));

            const currentCount = workbenchStore.filesCount;

            if (currentCount !== lastCount) {
              console.log(`Files loaded: ${currentCount}/${expectedFileCount}`);
              lastCount = currentCount;
            }
          }

          const finalCount = workbenchStore.filesCount;
          console.log(`Final file count: ${finalCount}/${expectedFileCount} (took ${Date.now() - startTime}ms)`);

          workbenchStore.setShowWorkbench(true);

          setLoading(false); // Success!
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Import failed:', error);
        setError(errorMsg);
        setLoading(false);

        // Don't auto-redirect, show error UI instead
        if (retryCount < 3 && errorMsg.includes('not initialized')) {
          toast.warning(`Retrying import (${retryCount + 1}/3)...`);
          setRetryCount(retryCount + 1);
          setTimeout(() => setImported(false), 1000); // Trigger retry
        } else {
          toast.error(`Failed to import: ${errorMsg}`);
        }
      } finally {
        console.groupEnd();
      }
    }
  };

  useEffect(() => {
    console.group('GitUrlImport Effect');
    console.log('historyReady:', historyReady);
    console.log('gitReady:', gitReady);
    console.log('imported:', imported);
    console.log('searchParams:', Object.fromEntries(searchParams.entries()));
    console.groupEnd();

    if (!historyReady || !gitReady) {
      // Show "Initializing..." message instead of "Cloning..."
      setLoading(true);
      return;
    }

    // Allow re-import if it previously failed
    if (imported) {
      return;
    }

    const url = searchParams.get('url');
    const subdir = searchParams.get('subdir');

    if (!url) {
      window.location.href = '/';
      return;
    }

    // Mark as imported BEFORE attempting to prevent race conditions
    setImported(true);

    importRepo(url, subdir || undefined)
      .then(() => {
        setLoading(false); // CRITICAL: Remove loading overlay on success
      })
      .catch((error) => {
        console.error('Error importing repo:', error);
        setLoading(false);
        setImported(false); // Allow retry

        // Don't auto-redirect if error UI is shown
        if (!error) {
          window.location.href = '/';
        }
      });
  }, [searchParams, historyReady, gitReady]); // Removed 'imported' from deps

  return (
    <ClientOnly fallback={<BaseChat />}>
      {() => (
        <>
          <Chat />
          {loading && (
            <LoadingOverlay
              message={
                !historyReady || !gitReady ? 'Initializing system...' : 'Please wait while we clone the repository...'
              }
            />
          )}
          {error && !loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <h3 className="text-xl font-semibold text-codinit-elements-textPrimary mb-3">Import Failed</h3>
                <p className="text-codinit-elements-textSecondary mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError(null);
                      setImported(false);
                      setRetryCount(0);
                    }}
                    className="flex-1 px-4 py-2 bg-codinit-elements-button-primary-background hover:bg-codinit-elements-button-primary-backgroundHover text-codinit-elements-button-primary-text rounded-md transition-colors"
                  >
                    Retry Import
                  </button>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="flex-1 px-4 py-2 bg-codinit-elements-background-depth-1 hover:bg-codinit-elements-background-depth-2 text-codinit-elements-textSecondary rounded-md transition-colors border border-codinit-elements-borderColor"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ClientOnly>
  );
}
