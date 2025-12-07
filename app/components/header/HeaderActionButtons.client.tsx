import { useStore } from '@nanostores/react';
import useViewport from '~/lib/hooks';
import { chatStore } from '~/lib/stores/chat';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { cloudflareConnection } from '~/lib/stores/cloudflare';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { streamingState } from '~/lib/stores/streaming';
import { NetlifyDeploymentLink } from '~/components/chat/NetlifyDeploymentLink.client';
import { VercelDeploymentLink } from '~/components/chat/VercelDeploymentLink.client';
import { CloudflareDeploymentLink } from '~/components/chat/CloudflareDeploymentLink.client';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { useCloudflareDeploy } from '~/components/deploy/CloudflareDeploy.client';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const cloudflareConn = useStore(cloudflareConnection);
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | 'cloudflare' | null>(null);
  const isSmallViewport = useViewport(1024);
  const canHideChat = showWorkbench || !showChat;
  const isStreaming = useStore(streamingState);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();
  const { handleCloudflareDeploy } = useCloudflareDeploy();

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

  const onCloudflareDeploy = async () => {
    setDeployingTo('cloudflare');

    try {
      await handleCloudflareDeploy();
    } finally {
      setDeployingTo(null);
    }
  };

  const isDeploying = deployingTo !== null;

  return (
    <div className={classNames('flex gap-2', { 'gap-1': showChat })}>
      <div className="flex rounded-md overflow-hidden">
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
        <div className="w-[1px] bg-codinit-elements-borderColor" />
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
              className="w-5 h-5"
              height="20"
              width="20"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/vercel"
              alt="vercel"
            />
          )}
          {vercelConn.user && <VercelDeploymentLink />}
        </IconButton>
        <div className="w-[1px] bg-codinit-elements-borderColor" />
        <IconButton
          title={
            !cloudflareConn.user
              ? 'Connect Cloudflare Account'
              : deployingTo === 'cloudflare'
                ? 'Deploying...'
                : 'Deploy to Cloudflare'
          }
          disabled={isDeploying || !activePreview || !cloudflareConn.user || isStreaming}
          onClick={onCloudflareDeploy}
          active={deployingTo === 'cloudflare'}
        >
          {deployingTo === 'cloudflare' ? (
            <div className="i-svg-spinners:90-ring-with-bg" />
          ) : (
            <img
              className="w-5 h-5"
              height="20"
              width="20"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/cloudflare"
              alt="cloudflare"
            />
          )}
          {cloudflareConn.user && <CloudflareDeploymentLink />}
        </IconButton>
        <div className="w-[1px] bg-codinit-elements-borderColor" />
        <IconButton
          title="View on GitHub"
          onClick={() => window.open('https://github.com/codinit-dev/codinit', '_blank')}
        >
          <img
            className="w-5 h-5"
            height="20"
            width="20"
            crossOrigin="anonymous"
            src="https://cdn.simpleicons.org/github"
            alt="github"
          />
        </IconButton>
      </div>
      <div className="flex rounded-md overflow-hidden">
        <Button
          active={showChat}
          disabled={!canHideChat || isSmallViewport} // expand button is disabled on mobile as it's not needed
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          <div className="i-lucide:message-circle text-sm" />
        </Button>
        <div className="w-[1px] bg-codinit-elements-borderColor" />
        <Button
          active={showWorkbench}
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="i-lucide:code" />
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
  const { showChat } = useStore(chatStore);

  return (
    <button
      className={classNames(
        'flex items-center',
        {
          'p-1.5': !showChat,
          'p-1': showChat,
          'bg-codinit-elements-item-backgroundDefault hover:bg-codinit-elements-item-backgroundActive text-codinit-elements-textTertiary hover:text-codinit-elements-textPrimary':
            !active,
          'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent': active && !disabled,
          'bg-codinit-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
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
  const { showChat } = useStore(chatStore);

  return (
    <button
      title={title}
      className={classNames('flex items-center justify-center relative', {
        'p-1.5': !showChat,
        'p-1': showChat,
        'bg-codinit-elements-item-backgroundDefault hover:bg-codinit-elements-item-backgroundActive text-codinit-elements-textTertiary hover:text-codinit-elements-textPrimary':
          !active,
        'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent': active && !disabled,
        'bg-codinit-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
          disabled,
      })}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
