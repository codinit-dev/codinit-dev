import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { ActionRunner } from '~/lib/runtime/action-runner';
import type { FileHistory } from '~/types/actions';
import { DiffView } from './DiffView';
import type {
  OnChangeCallback as OnEditorChange,
  OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import { ProgressIndicator } from './ProgressIndicator';
import useViewport from '~/lib/hooks';
import { PushToGitHubDialog } from '~/components/@settings/tabs/connections/components/PushToGitHubDialog';
import { usePreviewStore } from '~/lib/stores/previews';
import type { ElementInfo } from './Inspector';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
  actionRunner?: ActionRunner;
  metadata?: {
    gitUrl?: string;
  };
  updateChatMestaData?: (metadata: any) => void;
  setSelectedElement?: (element: ElementInfo | null) => void;
  renderHeader?: (headerProps: any) => React.ReactNode;
}

const viewTransition = { ease: cubicEasingFn };

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const Workbench = memo(
  ({
    chatStarted,
    isStreaming,
    actionRunner,
    metadata,
    updateChatMestaData,
    renderHeader: _renderHeader,
  }: WorkspaceProps) => {
    renderLogger.trace('Workbench');

    const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);
    const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});

    // Terminal state

    // const modifiedFiles = Array.from(useStore(workbenchStore.unsavedFiles).keys());

    const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
    const showWorkbench = useStore(workbenchStore.showWorkbench);
    const selectedFile = useStore(workbenchStore.selectedFile);
    const currentDocument = useStore(workbenchStore.currentDocument);
    const unsavedFiles = useStore(workbenchStore.unsavedFiles);
    const files = useStore(workbenchStore.files);
    const selectedView = useStore(workbenchStore.currentView);

    const isSmallViewport = useViewport(1024);

    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    useEffect(() => {
      if (hasPreview) {
        setSelectedView('preview');
      }
    }, [hasPreview]);

    useEffect(() => {
      workbenchStore.setDocuments(files);
    }, [files]);

    const onEditorChange = useCallback<OnEditorChange>((update) => {
      workbenchStore.setCurrentDocumentContent(update.content);
    }, []);

    const onEditorScroll = useCallback<OnEditorScroll>((position) => {
      workbenchStore.setCurrentDocumentScrollPosition(position);
    }, []);

    const onFileSelect = useCallback((filePath: string | undefined) => {
      workbenchStore.setSelectedFile(filePath);
    }, []);

    const onFileSave = useCallback(() => {
      workbenchStore
        .saveCurrentDocument()
        .then(() => {
          // Explicitly refresh all previews after a file save
          const previewStore = usePreviewStore();
          previewStore.refreshAllPreviews();
        })
        .catch(() => {
          toast.error('Failed to update file content');
        });
    }, []);

    const onFileReset = useCallback(() => {
      workbenchStore.resetCurrentDocument();
    }, []);

    return (
      chatStarted && (
        <motion.div
          initial="closed"
          animate={showWorkbench ? 'open' : 'closed'}
          variants={workbenchVariants}
          className="z-workbench"
        >
          <div
            className={classNames(
              'fixed top-[calc(var(--header-height)+0.1rem)] bottom-6 w-[var(--workbench-inner-width)] z-0 transition-[left,width] duration-200 codinit-ease-cubic-bezier',
              {
                'w-full': isSmallViewport,
                'left-0': showWorkbench && isSmallViewport,
                'left-[var(--workbench-left)]': showWorkbench,
                'left-[100%]': !showWorkbench,
              },
            )}
          >
            <div className="absolute inset-0 px-2 lg:px-6">
              <div className="h-full flex flex-col bg-codinit-elements-background-depth-1 overflow-hidden">
                <div className="relative flex-1 overflow-hidden">
                  <View initial={{ x: '0%' }} animate={{ x: selectedView === 'code' ? '0%' : '-100%' }}>
                    <EditorPanel
                      editorDocument={currentDocument}
                      isStreaming={isStreaming}
                      selectedFile={selectedFile}
                      files={files}
                      unsavedFiles={unsavedFiles}
                      fileHistory={fileHistory}
                      onFileSelect={onFileSelect}
                      onEditorScroll={onEditorScroll}
                      onEditorChange={onEditorChange}
                      onFileSave={onFileSave}
                      onFileReset={onFileReset}
                    />
                  </View>
                  <View
                    initial={{ x: '100%' }}
                    animate={{ x: selectedView === 'diff' ? '0%' : selectedView === 'code' ? '100%' : '-100%' }}
                  >
                    <DiffView fileHistory={fileHistory} setFileHistory={setFileHistory} actionRunner={actionRunner} />
                  </View>
                  <View initial={{ x: '100%' }} animate={{ x: selectedView === 'preview' ? '0%' : '100%' }}>
                    <Preview />
                  </View>
                  <View initial={{ x: '100%' }} animate={{ x: selectedView === 'progress' ? '0%' : '100%' }}>
                    <ProgressIndicator />
                  </View>
                </div>
              </div>
            </div>
          </div>
          <PushToGitHubDialog
            isOpen={isPushDialogOpen}
            onClose={() => setIsPushDialogOpen(false)}
            onPush={async (repoName, username, token, isPrivate) => {
              try {
                console.log('Dialog onPush called with isPrivate =', isPrivate);

                const commitMessage = prompt('Please enter a commit message:', 'Initial commit') || 'Initial commit';
                const repoUrl = await workbenchStore.pushToGitHub(repoName, commitMessage, username, token, isPrivate);

                if (updateChatMestaData && !metadata?.gitUrl) {
                  updateChatMestaData({
                    ...(metadata || {}),
                    gitUrl: repoUrl,
                  });
                }

                return repoUrl;
              } catch (error) {
                console.error('Error pushing to GitHub:', error);
                throw error;
              }
            }}
          />
        </motion.div>
      )
    );
  },
);

// View component for rendering content with motion transitions
interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
