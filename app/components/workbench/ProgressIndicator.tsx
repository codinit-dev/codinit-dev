import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useState } from 'react';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

let shellHighlighterPromise: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> | null = null;

const getShellHighlighter = async () => {
  if (!shellHighlighterPromise) {
    shellHighlighterPromise = (async () => {
      const { createHighlighter } = await import('shiki');
      return import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));
    })();

    if (import.meta.hot) {
      shellHighlighterPromise.then((highlighter) => {
        import.meta.hot!.data.shellHighlighter = highlighter;
      });
    }
  }

  return shellHighlighterPromise;
};

export const ProgressIndicator = memo(() => {
  const currentArtifactMessageId = useStore(workbenchStore.currentArtifactMessageId);
  const artifacts = useStore(workbenchStore.artifacts);

  const artifact = currentArtifactMessageId ? artifacts[currentArtifactMessageId] : null;

  const actionsComputed = artifact
    ? computed(artifact.runner.actions, (actions) => {
        return Object.values(actions).filter((action) => {
          return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
        });
      })
    : computed([], () => []);

  const actions = useStore(actionsComputed);

  if (!currentArtifactMessageId || !artifact) {
    return null;
  }

  return (
    <div className="p-5 bg-codinit-elements-actions-background">
      <ActionList actions={actions} />
    </div>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    getShellHighlighter().then((highlighter) => {
      setHtml(
        highlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      );
    });
  }, [code]);

  return <div className={classNames('text-xs', classsName)} dangerouslySetInnerHTML={{ __html: html }}></div>;
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <>
                      {type !== 'start' ? (
                        <div className="i-svg-spinners:90-ring-with-bg"></div>
                      ) : (
                        <div className="i-ph:terminal-window-duotone text-codinit-elements-textPrimary"></div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <div className="i-ph:circle-duotone text-codinit-elements-textPrimary"></div>
                  ) : status === 'complete' ? (
                    <div className="i-ph:check"></div>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <div className="i-ph:x"></div>
                  ) : null}
                </div>
                {type === 'file' ? (
                  <div>
                    Create{' '}
                    <code
                      className="bg-codinit-elements-artifacts-inlineCode-background text-codinit-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-codinit-elements-item-contentAccent hover:underline cursor-pointer"
                      onClick={() => openArtifactInWorkbench(action.filePath)}
                    >
                      {action.filePath}
                    </code>
                  </div>
                ) : type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">Run command</span>
                  </div>
                ) : type === 'start' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('preview');
                    }}
                    className="flex items-center w-full min-h-[28px]"
                  >
                    <span className="flex-1">Start Application</span>
                  </a>
                ) : null}
              </div>
              {(type === 'shell' || type === 'start') && (
                <ShellCodeBlock
                  classsName={classNames('mt-1', {
                    'mb-3.5': !isLast,
                  })}
                  code={content}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-codinit-elements-textTertiary';
    }
    case 'running': {
      return 'text-codinit-elements-loader-progress';
    }
    case 'complete': {
      return 'text-codinit-elements-icon-success';
    }
    case 'aborted': {
      return 'text-codinit-elements-textSecondary';
    }
    case 'failed': {
      return 'text-codinit-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
