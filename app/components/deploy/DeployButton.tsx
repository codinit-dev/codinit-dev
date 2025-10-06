import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { isGitLabConnected } from '~/lib/stores/gitlabConnection';
import { workbenchStore } from '~/lib/stores/workbench';
import { streamingState } from '~/lib/stores/streaming';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { NetlifyDeploymentLink } from '~/components/chat/NetlifyDeploymentLink.client';
import { VercelDeploymentLink } from '~/components/chat/VercelDeploymentLink.client';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { useGitHubDeploy } from '~/components/deploy/GitHubDeploy.client';
import { useGitLabDeploy } from '~/components/deploy/GitLabDeploy.client';
import { GitHubDeploymentDialog } from '~/components/deploy/GitHubDeploymentDialog';
import { GitLabDeploymentDialog } from '~/components/deploy/GitLabDeploymentDialog';

interface DeployButtonProps {
  onVercelDeploy?: () => Promise<void>;
  onNetlifyDeploy?: () => Promise<void>;
  onGitHubDeploy?: () => Promise<void>;
  onGitLabDeploy?: () => Promise<void>;
}

export const DeployButton = ({
  onVercelDeploy,
  onNetlifyDeploy,
  onGitHubDeploy,
  onGitLabDeploy,
}: DeployButtonProps) => {
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const gitlabIsConnected = useStore(isGitLabConnected);
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | 'github' | 'gitlab' | null>(null);
  const isStreaming = useStore(streamingState);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();
  const { handleGitHubDeploy } = useGitHubDeploy();
  const { handleGitLabDeploy } = useGitLabDeploy();
  const [showGitHubDeploymentDialog, setShowGitHubDeploymentDialog] = useState(false);
  const [showGitLabDeploymentDialog, setShowGitLabDeploymentDialog] = useState(false);
  const [githubDeploymentFiles, setGithubDeploymentFiles] = useState<Record<string, string> | null>(null);
  const [gitlabDeploymentFiles, setGitlabDeploymentFiles] = useState<Record<string, string> | null>(null);
  const [githubProjectName, setGithubProjectName] = useState('');
  const [gitlabProjectName, setGitlabProjectName] = useState('');

  const handleVercelDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('vercel');

    try {
      if (onVercelDeploy) {
        await onVercelDeploy();
      } else {
        await handleVercelDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleNetlifyDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('netlify');

    try {
      if (onNetlifyDeploy) {
        await onNetlifyDeploy();
      } else {
        await handleNetlifyDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleGitHubDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('github');

    try {
      if (onGitHubDeploy) {
        await onGitHubDeploy();
      } else {
        const result = await handleGitHubDeploy();

        if (result && result.success && result.files) {
          setGithubDeploymentFiles(result.files);
          setGithubProjectName(result.projectName);
          setShowGitHubDeploymentDialog(true);
        }
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleGitLabDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('gitlab');

    try {
      if (onGitLabDeploy) {
        await onGitLabDeploy();
      } else {
        const result = await handleGitLabDeploy();

        if (result && result.success && result.files) {
          setGitlabDeploymentFiles(result.files);
          setGitlabProjectName(result.projectName);
          setShowGitLabDeploymentDialog(true);
        }
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Netlify */}
        <button
          disabled={isDeploying || !activePreview || isStreaming || !netlifyConn.user}
          onClick={handleNetlifyDeployClick}
          title={!netlifyConn.user ? 'No Netlify Account Connected' : 'Deploy to Netlify'}
          className={classNames(
            'group relative w-9 h-9 rounded-lg border transition-all duration-200',
            'flex items-center justify-center',
            isDeploying && deployingTo === 'netlify'
              ? 'border-teal-500 bg-teal-500/20'
              : netlifyConn.user
                ? 'border-codinit-elements-borderColor hover:border-teal-500 hover:bg-teal-500/10 hover:scale-110'
                : 'border-codinit-elements-borderColor/30 opacity-40 cursor-not-allowed',
          )}
        >
          <img className="w-5 h-5" crossOrigin="anonymous" src="https://cdn.simpleicons.org/netlify" alt="Netlify" />
          {netlifyConn.user && (
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <NetlifyDeploymentLink />
            </div>
          )}
        </button>

        {/* Vercel */}
        <button
          disabled={isDeploying || !activePreview || isStreaming || !vercelConn.user}
          onClick={handleVercelDeployClick}
          title={!vercelConn.user ? 'No Vercel Account Connected' : 'Deploy to Vercel'}
          className={classNames(
            'group relative w-9 h-9 rounded-lg border transition-all duration-200',
            'flex items-center justify-center',
            isDeploying && deployingTo === 'vercel'
              ? 'border-white bg-white/20'
              : vercelConn.user
                ? 'border-codinit-elements-borderColor hover:border-white hover:bg-white/10 hover:scale-110'
                : 'border-codinit-elements-borderColor/30 opacity-40 cursor-not-allowed',
          )}
        >
          <img
            className="w-4 h-4 invert dark:invert-0"
            crossOrigin="anonymous"
            src="https://cdn.simpleicons.org/vercel/white"
            alt="Vercel"
          />
          {vercelConn.user && (
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <VercelDeploymentLink />
            </div>
          )}
        </button>

        {/* GitHub */}
        <button
          disabled={isDeploying || !activePreview || isStreaming}
          onClick={handleGitHubDeployClick}
          title="Deploy to GitHub Pages"
          className={classNames(
            'group relative w-9 h-9 rounded-lg border transition-all duration-200',
            'flex items-center justify-center',
            isDeploying && deployingTo === 'github'
              ? 'border-gray-400 bg-gray-400/20'
              : 'border-codinit-elements-borderColor hover:border-gray-400 hover:bg-gray-400/10 hover:scale-110',
          )}
        >
          <img
            className="w-5 h-5 dark:invert"
            crossOrigin="anonymous"
            src="https://cdn.simpleicons.org/github"
            alt="GitHub"
          />
        </button>

        {/* GitLab */}
        <button
          disabled={isDeploying || !activePreview || isStreaming || !gitlabIsConnected}
          onClick={handleGitLabDeployClick}
          title={!gitlabIsConnected ? 'No GitLab Account Connected' : 'Deploy to GitLab Pages'}
          className={classNames(
            'group relative w-9 h-9 rounded-lg border transition-all duration-200',
            'flex items-center justify-center',
            isDeploying && deployingTo === 'gitlab'
              ? 'border-orange-500 bg-orange-500/20'
              : gitlabIsConnected
                ? 'border-codinit-elements-borderColor hover:border-orange-500 hover:bg-orange-500/10 hover:scale-110'
                : 'border-codinit-elements-borderColor/30 opacity-40 cursor-not-allowed',
          )}
        >
          <img className="w-5 h-5" crossOrigin="anonymous" src="https://cdn.simpleicons.org/gitlab" alt="GitLab" />
        </button>

        {/* Cloudflare (Coming Soon) */}
        <button
          disabled
          title="Deploy to Cloudflare (Coming Soon)"
          className={classNames(
            'w-9 h-9 rounded-lg border border-codinit-elements-borderColor/30',
            'flex items-center justify-center',
            'opacity-30 cursor-not-allowed',
          )}
        >
          <img
            className="w-5 h-5"
            crossOrigin="anonymous"
            src="https://cdn.simpleicons.org/cloudflare"
            alt="Cloudflare"
          />
        </button>
      </div>

      {/* GitHub Deployment Dialog */}
      {showGitHubDeploymentDialog && githubDeploymentFiles && (
        <GitHubDeploymentDialog
          isOpen={showGitHubDeploymentDialog}
          onClose={() => setShowGitHubDeploymentDialog(false)}
          projectName={githubProjectName}
          files={githubDeploymentFiles}
        />
      )}

      {/* GitLab Deployment Dialog */}
      {showGitLabDeploymentDialog && gitlabDeploymentFiles && (
        <GitLabDeploymentDialog
          isOpen={showGitLabDeploymentDialog}
          onClose={() => setShowGitLabDeploymentDialog(false)}
          projectName={gitlabProjectName}
          files={gitlabDeploymentFiles}
        />
      )}
    </>
  );
};
