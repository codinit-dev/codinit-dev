import { useSearchParams } from '@remix-run/react';
import { generateId, type Message } from 'ai';
import ignore from 'ignore';
import { useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { useGit } from '~/lib/hooks/useGit';
import { useChatHistory } from '~/lib/persistence';
import { createCommandsMessage, detectProjectCommands, escapeCodinitTags } from '~/utils/projectCommands';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { ImportErrorModal } from '~/components/ui/ImportErrorModal';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // Include this so npm install runs much faster '**/*lock.json',
  '**/*lock.yaml',
];

export function GitUrlImport() {
  const [searchParams] = useSearchParams();
  const { ready: historyReady, importChat } = useChatHistory();
  const { ready: gitReady, gitClone } = useGit();
  const [imported, setImported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>('Import Failed');

  const importRepo = async (repoUrl?: string) => {
    if (!gitReady && !historyReady) {
      return;
    }

    if (repoUrl) {
      const ig = ignore().add(IGNORE_PATTERNS);

      try {
        const { workdir, data } = await gitClone(repoUrl);

        if (importChat) {
          const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
          const textDecoder = new TextDecoder('utf-8');

          const fileContents = filePaths
            .map((filePath) => {
              const { data: content, encoding } = data[filePath];
              return {
                path: filePath,
                content:
                  encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
              };
            })
            .filter((f) => f.content);

          const commands = await detectProjectCommands(fileContents);
          const commandsMessage = createCommandsMessage(commands);

          const filesMessage: Message = {
            role: 'assistant',
            content: `Cloning the repo ${repoUrl} into ${workdir}
<codinitArtifact id="imported-files" title="Git Cloned Files"  type="bundled">
${fileContents
  .map(
    (file) =>
      `<codinitAction type="file" filePath="${file.path}">
${escapeCodinitTags(file.content)}
</codinitAction>`,
  )
  .join('\n')}
</codinitArtifact>`,
            id: generateId(),
            createdAt: new Date(),
          };

          const messages = [filesMessage];

          if (commandsMessage) {
            messages.push({
              role: 'user',
              id: generateId(),
              content: 'Setup the codebase and Start the application',
              createdAt: new Date(),
            });
            messages.push(commandsMessage);
          }

          await importChat(`Git Project:${repoUrl.split('/').slice(-1)[0]}`, messages, { gitUrl: repoUrl });
        }
      } catch (error) {
        console.error('Error during import:', error);
        setLoading(false);

        // Determine error type and set appropriate message
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
          setErrorTitle('Network Error');
          setErrorMessage('Failed to clone repository. Check your internet connection.');
        } else if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('404')) {
          setErrorTitle('Repository Not Found');
          setErrorMessage('Repository not found or is private.');
        } else if (errorMsg.toLowerCase().includes('cors') || errorMsg.toLowerCase().includes('proxy')) {
          setErrorTitle('Access Error');
          setErrorMessage('Unable to access repository. It may be private or have restricted access.');
        } else if (!repoUrl || !repoUrl.includes('github.com')) {
          setErrorTitle('Invalid URL');
          setErrorMessage('Invalid GitHub URL. Please use format: https://github.com/user/repo');
        } else {
          setErrorTitle('Import Failed');
          setErrorMessage('Failed to clone repository. Please try again.');
        }

        return;
      }
    }
  };

  useEffect(() => {
    if (!historyReady || !gitReady || imported) {
      return;
    }

    const url = searchParams.get('url');

    if (!url) {
      window.location.href = '/';
      return;
    }

    importRepo(url).catch((error) => {
      console.error('Error importing repo:', error);
      setLoading(false);

      // Set error state instead of immediate redirect
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        setErrorTitle('Network Error');
        setErrorMessage('Failed to clone repository. Check your internet connection.');
      } else if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('404')) {
        setErrorTitle('Repository Not Found');
        setErrorMessage('Repository not found or is private.');
      } else if (errorMsg.toLowerCase().includes('cors') || errorMsg.toLowerCase().includes('proxy')) {
        setErrorTitle('Access Error');
        setErrorMessage('Unable to access repository. It may be private or have restricted access.');
      } else {
        setErrorTitle('Import Failed');
        setErrorMessage('Failed to import repository. Please try again.');
      }
    });
    setImported(true);
  }, [searchParams, historyReady, gitReady, imported]);

  const handleRetry = () => {
    setErrorMessage(null);
    setImported(false);
    setLoading(true);
  };

  const handleGoBack = () => {
    window.location.href = '/';
  };

  return (
    <ClientOnly fallback={<BaseChat />}>
      {() => (
        <>
          <Chat />
          {loading && <LoadingOverlay message="Please wait while we clone the repository..." />}
          {errorMessage && (
            <ImportErrorModal
              isOpen={true}
              type="error"
              title={errorTitle}
              message={errorMessage}
              onRetry={handleRetry}
              onClose={handleGoBack}
            />
          )}
        </>
      )}
    </ClientOnly>
  );
}
