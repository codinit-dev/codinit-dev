import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { streamingState } from '~/lib/stores/streaming';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { classNames } from '~/utils/classNames';

interface DeployDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployDialog({ isOpen, onClose }: DeployDialogProps) {
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const isStreaming = useStore(streamingState);
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | null>(null);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();

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
                  <div className="i-svg-spinners:90-ring-with-bg w-6 h-6" />
                ) : (
                  <img className="w-6 h-6" src="https://cdn.simpleicons.org/netlify" alt="Netlify" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-codinit-elements-textPrimary">
                  {deployingTo === 'netlify' ? 'Deploying...' : 'Deploy to Netlify'}
                </div>
                <div className="text-sm text-codinit-elements-textSecondary">
                  {!netlifyConn.user ? 'Connect your Netlify account first' : 'Fast, global CDN deployment'}
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
                  <div className="i-svg-spinners:90-ring-with-bg w-6 h-6" />
                ) : (
                  <img className="w-6 h-6" src="https://cdn.simpleicons.org/vercel" alt="Vercel" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-codinit-elements-textPrimary">
                  {deployingTo === 'vercel' ? 'Deploying...' : 'Deploy to Vercel'}
                </div>
                <div className="text-sm text-codinit-elements-textSecondary">
                  {!vercelConn.user ? 'Connect your Vercel account first' : 'Optimized for frontend frameworks'}
                </div>
              </div>
            </button>

            {/* Cloudflare - Coming Soon */}
            <div className="w-full flex items-center gap-3 p-4 rounded-lg border border-codinit-elements-borderColor bg-codinit-elements-background-depth-3 opacity-50">
              <div className="flex-shrink-0">
                <img className="w-6 h-6 opacity-50" src="https://cdn.simpleicons.org/cloudflare" alt="Cloudflare" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-codinit-elements-textSecondary">Deploy to Cloudflare</div>
                <div className="text-sm text-codinit-elements-textTertiary">Coming Soon</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-codinit-elements-borderColor flex justify-end">
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
