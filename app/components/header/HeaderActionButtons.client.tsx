import { useStore } from '@nanostores/react';
import useViewport from '~/lib/hooks';
import { chatStore } from '~/lib/stores/chat';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { streamingState } from '~/lib/stores/streaming';
import { NetlifyDeploymentLink } from '~/components/chat/NetlifyDeploymentLink.client';
import { VercelDeploymentLink } from '~/components/chat/VercelDeploymentLink.client';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | null>(null);
  const isSmallViewport = useViewport(1024);
  const canHideChat = showWorkbench || !showChat;
  const isStreaming = useStore(streamingState);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();

  const onVercelDeploy = async () => {
    setDeployingTo('vercel');

    try {
      await handleVercelDeploy();
    } finally {
      setDeployingTo(null);
    }
  };

  const onNetlifyDeploy = async () => {
    setDeployingTo('netlify');

    try {
      await handleNetlifyDeploy();
    } finally {
      setDeployingTo(null);
    }
  };

  const isDeploying = deployingTo !== null;

  return (
    <div className="flex gap-2">
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden">
        <IconButton
          title={
            !netlifyConn.user
              ? 'Connect Netlify Account'
              : deployingTo === 'netlify'
                ? 'Deploying...'
                : 'Deploy to Netlify'
          }
          disabled={isDeploying || !activePreview || !netlifyConn.user || isStreaming}
          onClick={onNetlifyDeploy}
          active={deployingTo === 'netlify'}
        >
          {deployingTo === 'netlify' ? (
            <div className="i-svg-spinners:90-ring-with-bg" />
          ) : (
            <img
              className="w-5 h-5"
              height="20"
              width="20"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/netlify"
              alt="netlify"
            />
          )}
          {netlifyConn.user && <NetlifyDeploymentLink />}
        </IconButton>
        <div className="w-[1px] bg-bolt-elements-borderColor" />
        <IconButton
          title={
            !vercelConn.user ? 'Connect Vercel Account' : deployingTo === 'vercel' ? 'Deploying...' : 'Deploy to Vercel'
          }
          disabled={isDeploying || !activePreview || !vercelConn.user || isStreaming}
          onClick={onVercelDeploy}
          active={deployingTo === 'vercel'}
        >
          {deployingTo === 'vercel' ? (
            <div className="i-svg-spinners:90-ring-with-bg" />
          ) : (
            <img
              className="w-5 h-5 bg-black p-1 rounded"
              height="20"
              width="20"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/vercel/white"
              alt="vercel"
            />
          )}
          {vercelConn.user && <VercelDeploymentLink />}
        </IconButton>
        <div className="w-[1px] bg-bolt-elements-borderColor" />
        <IconButton title="Deploy to Cloudflare (Coming Soon)" disabled>
          <img
            className="w-5 h-5"
            height="20"
            width="20"
            crossOrigin="anonymous"
            src="https://cdn.simpleicons.org/cloudflare"
            alt="cloudflare"
          />
        </IconButton>
      </div>
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden">
        <Button
          active={showChat}
          disabled={!canHideChat || isSmallViewport} // expand button is disabled on mobile as it's not needed
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          <div className="i-bolt:chat text-sm" />
        </Button>
        <div className="w-[1px] bg-bolt-elements-borderColor" />
        <Button
          active={showWorkbench}
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="i-ph:code-bold" />
        </Button>
      </div>
    </div>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  className?: string;
}

function Button({ active = false, disabled = false, children, onClick, className }: ButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center p-1.5',
        {
          'bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary':
            !active,
          'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': active && !disabled,
          'bg-bolt-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
            disabled,
        },
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface IconButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  title?: string;
}

function IconButton({ active = false, disabled = false, children, onClick, title }: IconButtonProps) {
  return (
    <button
      title={title}
      className={classNames('flex items-center justify-center p-1.5 relative', {
        'bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary':
          !active,
        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': active && !disabled,
        'bg-bolt-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
          disabled,
      })}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
