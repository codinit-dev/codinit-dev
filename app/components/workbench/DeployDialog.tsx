import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { cloudflareConnection } from '~/lib/stores/cloudflare';
import { streamingState } from '~/lib/stores/streaming';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { useCloudflareDeploy } from '~/components/deploy/CloudflareDeploy.client';
import { classNames } from '~/utils/classNames';

interface DeployDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployDialog({ isOpen, onClose }: DeployDialogProps) {
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const cloudflareConn = useStore(cloudflareConnection);
  const isStreaming = useStore(streamingState);
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | 'cloudflare' | null>(null);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();
  const { handleCloudflareDeploy } = useCloudflareDeploy();

  const onVercelDeploy = async () => {
    setDeployingTo('vercel');

    try {
      await handleVercelDeploy();
      onClose();
    } finally {
      setDeployingTo(null);
    }
  };

  const onNetlifyDeploy = async () => {
    setDeployingTo('netlify');

    try {
      await handleNetlifyDeploy();
      onClose();
    } finally {
      setDeployingTo(null);
    }
  };

  const onCloudflareDeploy = async () => {
    setDeployingTo('cloudflare');

    try {
      await handleCloudflareDeploy();
      onClose();
    } finally {
      setDeployingTo(null);
    }
  };

  const isDeploying = deployingTo !== null;

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-codinit-elements-borderColor">
            <h2 className="text-lg font-semibold text-codinit-elements-textPrimary">Deploy Your Project</h2>
            <p className="text-sm text-codinit-elements-textSecondary mt-1">
              Choose a platform to deploy your application
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-3">
            {/* Netlify */}
            <button
              onClick={onNetlifyDeploy}
              disabled={isDeploying || !netlifyConn.user || isStreaming}
              className={classNames(
                'w-full flex items-center gap-3 p-4 rounded-lg border transition-colors',
                !isDeploying && netlifyConn.user && !isStreaming
                  ? 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-2 hover:bg-codinit-elements-item-backgroundActive'
                  : 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-3 opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex-shrink-0">
                {deployingTo === 'netlify' ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-8 h-8" />
                ) : (
                  <svg
                    className="w-8 h-8 dark:invert"
                    width="800px"
                    height="800px"
                    viewBox="0 0 40 40"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient
                        id="netlify-gradient-dialog"
                        cy="0%"
                        r="100.11%"
                        fx="50%"
                        fy="0%"
                        gradientTransform="matrix(0 .9989 -1.152 0 .5 -.5)"
                      >
                        <stop offset="0%" stopColor="#20C6B7" />
                        <stop offset="100%" stopColor="#4D9ABF" />
                      </radialGradient>
                    </defs>
                    <path
                      fill="url(#netlify-gradient-dialog)"
                      d="M28.589 14.135l-.014-.006c-.008-.003-.016-.006-.023-.013a.11.11 0 0 1-.028-.093l.773-4.726 3.625 3.626-3.77 1.604a.083.083 0 0 1-.033.006h-.015c-.005-.003-.01-.007-.02-.017a1.716 1.716 0 0 0-.495-.381zm5.258-.288l3.876 3.876c.805.806 1.208 1.208 1.355 1.674.022.069.04.138.054.209l-9.263-3.923a.728.728 0 0 0-.015-.006c-.037-.015-.08-.032-.08-.07 0-.038.044-.056.081-.071l.012-.005 3.98-1.684zm5.127 7.003c-.2.376-.59.766-1.25 1.427l-4.37 4.369-5.652-1.177-.03-.006c-.05-.008-.103-.017-.103-.062a1.706 1.706 0 0 0-.655-1.193c-.023-.023-.017-.059-.01-.092 0-.005 0-.01.002-.014l1.063-6.526.004-.022c.006-.05.015-.108.06-.108a1.73 1.73 0 0 0 1.16-.665c.009-.01.015-.021.027-.027.032-.015.07 0 .103.014l9.65 4.082zm-6.625 6.801l-7.186 7.186 1.23-7.56.002-.01c.001-.01.003-.02.006-.029.01-.024.036-.034.061-.044l.012-.005a1.85 1.85 0 0 0 .695-.517c.024-.028.053-.055.09-.06a.09.09 0 0 1 .029 0l5.06 1.04zm-8.707 8.707l-.81.81-8.955-12.942a.424.424 0 0 0-.01-.014c-.014-.019-.029-.038-.026-.06.001-.016.011-.03.022-.042l.01-.013c.027-.04.05-.08.075-.123l.02-.035.003-.003c.014-.024.027-.047.051-.06.021-.01.05-.006.073-.001l9.921 2.046a.164.164 0 0 1 .076.033c.013.013.016.027.019.043a1.757 1.757 0 0 0 1.028 1.175c.028.014.016.045.003.078a.238.238 0 0 0-.015.045c-.125.76-1.197 7.298-1.485 9.063zm-1.692 1.691c-.597.591-.949.904-1.347 1.03a2 2 0 0 1-1.206 0c-.466-.148-.869-.55-1.674-1.356L8.73 28.73l2.349-3.643c.011-.018.022-.034.04-.047.025-.018.061-.01.091 0a2.434 2.434 0 0 0 1.638-.083c.027-.01.054-.017.075.002a.19.19 0 0 1 .028.032L21.95 38.05zM7.863 27.863L5.8 25.8l4.074-1.738a.084.084 0 0 1 .033-.007c.034 0 .054.034.072.065a2.91 2.91 0 0 0 .13.184l.013.016c.012.017.004.034-.008.05l-2.25 3.493zm-2.976-2.976l-2.61-2.61c-.444-.444-.766-.766-.99-1.043l7.936 1.646a.84.84 0 0 0 .03.005c.049.008.103.017.103.063 0 .05-.059.073-.109.092l-.023.01-4.337 1.837zM.831 19.892a2 2 0 0 1 .09-.495c.148-.466.55-.868 1.356-1.674l3.34-3.34a2175.525 2175.525 0 0 0 4.626 6.687c.027...."
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-codinit-elements-textPrimary">
                  {deployingTo === 'netlify' ? 'Deploying...' : 'Deploy to Netlify'}
                </div>
                <div className="text-sm text-codinit-elements-textSecondary">
                  {!netlifyConn.user ? 'Add your Netlify API key first in settings' : 'Fast, global CDN deployment'}
                </div>
              </div>
            </button>

            {/* Vercel */}
            <button
              onClick={onVercelDeploy}
              disabled={isDeploying || !vercelConn.user || isStreaming}
              className={classNames(
                'w-full flex items-center gap-3 p-4 rounded-lg border transition-colors',
                !isDeploying && vercelConn.user && !isStreaming
                  ? 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-2 hover:bg-codinit-elements-item-backgroundActive'
                  : 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-3 opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex-shrink-0">
                {deployingTo === 'vercel' ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-8 h-8" />
                ) : (
                  <svg
                    className="w-8 h-8 dark:invert"
                    width="1155"
                    height="1000"
                    viewBox="0 0 1155 1000"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="black" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-codinit-elements-textPrimary">
                  {deployingTo === 'vercel' ? 'Deploying...' : 'Deploy to Vercel'}
                </div>
                <div className="text-sm text-codinit-elements-textSecondary">
                  {!vercelConn.user ? 'Add your Vercel API key first in settings' : 'Optimized for frontend frameworks'}
                </div>
              </div>
            </button>

            {/* Cloudflare */}
            <button
              onClick={onCloudflareDeploy}
              disabled={isDeploying || !cloudflareConn.user || isStreaming}
              className={classNames(
                'w-full flex items-center gap-3 p-4 rounded-lg border transition-colors',
                !isDeploying && cloudflareConn.user && !isStreaming
                  ? 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-2 hover:bg-codinit-elements-item-backgroundActive'
                  : 'border-codinit-elements-borderColor bg-codinit-elements-background-depth-3 opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex-shrink-0">
                {deployingTo === 'cloudflare' ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-8 h-8" />
                ) : (
                  <svg
                    className="w-8 h-8 dark:invert"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    viewBox="0 0 460 271.2"
                    width="80px"
                    height="47px"
                    aria-hidden="true"
                  >
                    <path
                      fill="#FBAD41"
                      d="M328.6,125.6c-0.8,0-1.5,0.6-1.8,1.4l-4.8,16.7c-2.1,7.2-1.3,13.8,2.2,18.7c3.2,4.5,8.6,7.1,15.1,7.4l26.2,1.6c0.8,0,1.5,0.4,1.9,1c0.4,0.6,0.5,1.5,0.3,2.2c-0.4,1.2-1.6,2.1-2.9,2.2l-27.3,1.6c-14.8,0.7-30.7,12.6-36.3,27.2l-2,5.1c-0.4,1,0.3,2,1.4,2h93.8c1.1,0,2.1-0.7,2.4-1.8c1.6-5.8,2.5-11.9,2.5-18.2c0-37-30.2-67.2-67.3-67.2C330.9,125.5,329.7,125.5,328.6,125.6z"
                    />
                    <path
                      fill="#F6821F"
                      d="M292.8,204.4c2.1-7.2,1.3-13.8-2.2-18.7c-3.2-4.5-8.6-7.1-15.1-7.4l-123.1-1.6c-0.8,0-1.5-0.4-1.9-1s-0.5-1.4-0.3-2.2c0.4-1.2,1.6-2.1,2.9-2.2l124.2-1.6c14.7-0.7,30.7-12.6,36.3-27.2l7.1-18.5c0.3-0.8,0.4-1.6,0.2-2.4c-8-36.2-40.3-63.2-78.9-63.2c-35.6,0-65.8,23-76.6,54.9c-7-5.2-15.9-8-25.5-7.1c-17.1,1.7-30.8,15.4-32.5,32.5c-0.4,4.4-0.1,8.7,0.9,12.7c-27.9,0.8-50.2,23.6-50.2,51.7c0,2.5,0.2,5,0.5,7.5c0.2,1.2,1.2,2.1,2.4,2.1h227.2c1.3,0,2.5-0.9,2.9-2.2L292.8,204.4z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-codinit-elements-textPrimary">
                  {deployingTo === 'cloudflare' ? 'Deploying...' : 'Deploy to Cloudflare'}
                </div>
                <div className="text-sm text-codinit-elements-textSecondary">
                  {!cloudflareConn.user
                    ? 'Add your Clouflare API key first in settings'
                    : 'Global CDN with edge computing'}
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-codinit-elements-borderColor bg-codinit-elements-background-depth-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-codinit-elements-textSecondary hover:text-codinit-elements-textPrimary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
