import { memo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { IconButton } from '~/components/ui/IconButton';
import { PortDropdown } from './PortDropdown';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import { DeployDialog } from './DeployDialog';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { useCloudflareDeploy } from '~/components/deploy/CloudflareDeploy.client';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { cloudflareConnection } from '~/lib/stores/cloudflare';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PushToGitHubDialog } from '~/components/@settings/tabs/connections/components/PushToGitHubDialog';

interface PreviewHeaderProps {
  previews: any[];
  activePreviewIndex: number;
  setActivePreviewIndex: (index: number) => void;
  displayPath: string;
  setDisplayPath: (path: string) => void;
  setIframeUrl: (url: string | undefined) => void;
  reloadPreview: () => void;
  setIsWindowSizeDropdownOpen: (open: boolean) => void;
  isWindowSizeDropdownOpen: boolean;
  openInNewTab: () => void;
  openInNewWindow: (size: any) => void;
  windowSizes: any[];
  selectedWindowSize: any;
  setSelectedWindowSize: (size: any) => void;
  showDeviceFrame: boolean;
  setShowDeviceFrame: (show: boolean) => void;
  isLandscape: boolean;
  setIsLandscape: (landscape: boolean) => void;
  setIsPushDialogOpen?: (open: boolean) => void;
}

export const PreviewHeader = memo(
  ({
    previews,
    activePreviewIndex,
    setActivePreviewIndex,
    displayPath,
    setDisplayPath,
    setIframeUrl,
    reloadPreview,
    setIsWindowSizeDropdownOpen,
    isWindowSizeDropdownOpen,
    openInNewTab,
    openInNewWindow,
    windowSizes,
    selectedWindowSize,
    setSelectedWindowSize,
    showDeviceFrame,
    setShowDeviceFrame,
    isLandscape,
    setIsLandscape,
    setIsPushDialogOpen,
  }: PreviewHeaderProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
    const expoUrl = useStore(expoUrlAtom);
    const [isExpoQrModalOpen, setIsExpoQrModalOpen] = useState(false);
    const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
    const [isPushDialogOpen, setIsPushDialogOpenState] = useState(false);

    // Deployment hooks
    const { isDeploying: isDeployingVercel, handleVercelDeploy } = useVercelDeploy();
    const { isDeploying: isDeployingNetlify, handleNetlifyDeploy } = useNetlifyDeploy();
    const { isDeploying: isDeployingCloudflare, handleCloudflareDeploy } = useCloudflareDeploy();

    // Connection states
    const netlifyConn = useStore(netlifyConnection);
    const vercelConn = useStore(vercelConnection);
    const cloudflareConn = useStore(cloudflareConnection);

    const activePreview = previews[activePreviewIndex];
    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    // Deployment handlers
    const handleDeployToVercel = async () => {
      await handleVercelDeploy();
    };

    const handleDeployToNetlify = async () => {
      await handleNetlifyDeploy();
    };

    const handleDeployToCloudflare = async () => {
      await handleCloudflareDeploy();
    };

    const handleOpenPushDialog = () => {
      setIsPushDialogOpenState(true);
      setIsPushDialogOpen?.(true);
    };

    const handleClosePushDialog = () => {
      setIsPushDialogOpenState(false);
      setIsPushDialogOpen?.(false);
    };

    const handlePushToGitHub = async (repoName: string, username?: string, token?: string, isPrivate?: boolean) => {
      const commitMessage = prompt('Please enter a commit message:', 'Initial commit') || 'Initial commit';
      const repoUrl = await workbenchStore.pushToGitHub(repoName, commitMessage, username, token, isPrivate);

      return repoUrl;
    };

    return (
      <div className="flex relative items-center gap-2 py-2 h-12 pl-2 pr-3 z-50">
        {/* Toggle Buttons Section */}
        <div className="flex items-center gap-1 ml-8">
          <IconButton
            icon="i-lucide:eye"
            className="w-8 h-8"
            title="Preview"
            onClick={() => setSelectedView('preview')}
          />
          <IconButton icon="i-lucide:code" className="w-8 h-8" title="Code" onClick={() => setSelectedView('code')} />
          <IconButton
            icon="i-lucide:git-compare-arrows"
            className="w-8 h-8"
            title="Diff"
            onClick={() => setSelectedView('diff')}
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 text-codinit-elements-item-contentDefault bg-transparent hover:text-codinit-elements-item-contentActive rounded-md hover:bg-codinit-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-colors"
                title="More Options"
              >
                <span className="i-lucide:settings size-4"></span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              className="min-w-[240px] z-[999] bg-codinit-elements-background-depth-3 rounded-lg shadow-xl border border-codinit-elements-borderColor animate-in fade-in-0 zoom"
              sideOffset={5}
              align="start"
            >
              <DropdownMenu.Item
                className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive gap-2 rounded-md group relative"
                onSelect={(e) => {
                  e.preventDefault();
                  reloadPreview();
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="i-lucide:rotate-cw text-current" />
                  <span>Reload Preview</span>
                </div>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive gap-2 rounded-md group relative"
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeployDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="i-lucide:rocket text-current" />
                  <span>Deploy Options</span>
                </div>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer flex items-center w-full px-4 py-2 text-sm text-codinit-elements-textPrimary hover:bg-codinit-elements-item-backgroundActive gap-2 rounded-md group relative"
                onSelect={(e) => {
                  e.preventDefault();
                  handleOpenPushDialog();
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="i-lucide:git-branch text-current" />
                  <span>Push to GitHub</span>
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        {/* Address Bar */}
        <div className="absolute w-[calc(100%-390px)] xl:w-full xl:max-w-[400px] left-[calc(50%-40px)] -translate-x-1/2 group flex items-center gap-0 flex-grow bg-codinit-elements-preview-addressBar-background border border-codinit-elements-borderColor text-codinit-elements-preview-addressBar-text rounded-full h-8 py-0.5 pl-1 pr-2 hover:bg-codinit-elements-preview-addressBar-backgroundHover hover:focus-within:bg-codinit-elements-preview-addressBar-backgroundActive focus-within:bg-codinit-elements-preview-addressBar-backgroundActive focus-within-border-codinit-elements-borderColorActive focus-within:text-codinit-elements-preview-addressBar-textActive">
          <div className="flex gap-1.5 w-full pl-3 pr-3 py-1">
            <PortDropdown
              activePreviewIndex={activePreviewIndex}
              setActivePreviewIndex={setActivePreviewIndex}
              isDropdownOpen={isPortDropdownOpen}
              setHasSelectedPreview={() => undefined}
              setIsDropdownOpen={setIsPortDropdownOpen}
              previews={previews}
            />
            <input
              ref={inputRef}
              className="w-full bg-transparent outline-none text-xs"
              type="text"
              value={displayPath}
              onChange={(event) => {
                setDisplayPath(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && activePreview) {
                  let targetPath = displayPath.trim();

                  if (!targetPath.startsWith('/')) {
                    targetPath = '/' + targetPath;
                  }

                  const fullUrl = activePreview.baseUrl + targetPath;
                  setIframeUrl(fullUrl);
                  setDisplayPath(targetPath);

                  if (inputRef.current) {
                    inputRef.current.blur();
                  }
                }
              }}
              disabled={!activePreview}
            />
          </div>
          <button
            type="button"
            className="flex items-center bg-transparent rounded-md disabled:cursor-not-allowed enabled:hover:text-codinit-elements-item-contentActive enabled:hover:bg-codinit-elements-item-backgroundActive p-1 text-codinit-elements-textSecondary"
            onClick={reloadPreview}
          >
            <span className="i-lucide:rotate-cw text-current"></span>
          </button>
          <button
            className="flex items-center bg-transparent rounded-md disabled:cursor-not-allowed enabled:hover:text-codinit-elements-item-contentActive enabled:hover:bg-codinit-elements-item-backgroundActive p-1 text-codinit-elements-textSecondary"
            type="button"
            onClick={() => setIsWindowSizeDropdownOpen(!isWindowSizeDropdownOpen)}
          >
            <span className="i-lucide:more-horizontal text-current"></span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="ml-auto">
          <div className="flex gap-3">
            <div className="flex gap-1 empty:hidden"></div>

            {/* Deployment Buttons */}
            <div className="flex gap-1">
              {/* Vercel Deploy Button */}
              <IconButton
                title={vercelConn.user ? 'Deploy to Vercel' : 'Connect Vercel account first'}
                disabled={!vercelConn.user || isDeployingVercel}
                onClick={handleDeployToVercel}
                className="w-8 h-8"
              >
                {isDeployingVercel ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />
                ) : (
                  <svg
                    className="w-4 h-4 dark:invert"
                    width="1155"
                    height="1000"
                    viewBox="0 0 1155 1000"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="black" />
                  </svg>
                )}
              </IconButton>

              {/* Netlify Deploy Button */}
              <IconButton
                title={netlifyConn.user ? 'Deploy to Netlify' : 'Connect Netlify account first'}
                disabled={!netlifyConn.user || isDeployingNetlify}
                onClick={handleDeployToNetlify}
                className="w-8 h-8"
              >
                {isDeployingNetlify ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />
                ) : (
                  <svg
                    className="w-4 h-4 dark:invert"
                    width="800px"
                    height="800px"
                    viewBox="0 0 40 40"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient
                        id="netlify-gradient"
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
                      fill="url(#netlify-gradient)"
                      d="M28.589 14.135l-.014-.006c-.008-.003-.016-.006-.023-.013a.11.11 0 0 1-.028-.093l.773-4.726 3.625 3.626-3.77 1.604a.083.083 0 0 1-.033.006h-.015c-.005-.003-.01-.007-.02-.017a1.716 1.716 0 0 0-.495-.381zm5.258-.288l3.876 3.876c.805.806 1.208 1.208 1.355 1.674.022.069.04.138.054.209l-9.263-3.923a.728.728 0 0 0-.015-.006c-.037-.015-.08-.032-.08-.07 0-.038.044-.056.081-.071l.012-.005 3.98-1.684zm5.127 7.003c-.2.376-.59.766-1.25 1.427l-4.37 4.369-5.652-1.177-.03-.006c-.05-.008-.103-.017-.103-.062a1.706 1.706 0 0 0-.655-1.193c-.023-.023-.017-.059-.01-.092 0-.005 0-.01.002-.014l1.063-6.526.004-.022c.006-.05.015-.108.06-.108a1.73 1.73 0 0 0 1.16-.665c.009-.01.015-.021.027-.027.032-.015.07 0 .103.014l9.65 4.082zm-6.625 6.801l-7.186 7.186 1.23-7.56.002-.01c.001-.01.003-.02.006-.029.01-.024.036-.034.061-.044l.012-.005a1.85 1.85 0 0 0 .695-.517c.024-.028.053-.055.09-.06a.09.09 0 0 1 .029 0l5.06 1.04zm-8.707 8.707l-.81.81-8.955-12.942a.424.424 0 0 0-.01-.014c-.014-.019-.029-.038-.026-.06.001-.016.011-.03.022-.042l.01-.013c.027-.04.05-.08.075-.123l.02-.035.003-.003c.014-.024.027-.047.051-.06.021-.01.05-.006.073-.001l9.921 2.046a.164.164 0 0 1 .076.033c.013.013.016.027.019.043a1.757 1.757 0 0 0 1.028 1.175c.028.014.016.045.003.078a.238.238 0 0 0-.015.045c-.125.76-1.197 7.298-1.485 9.063zm-1.692 1.691c-.597.591-.949.904-1.347 1.03a2 2 0 0 1-1.206 0c-.466-.148-.869-.55-1.674-1.356L8.73 28.73l2.349-3.643c.011-.018.022-.034.04-.047.025-.018.061-.01.091 0a2.434 2.434 0 0 0 1.638-.083c.027-.01.054-.017.075.002a.19.19 0 0 1 .028.032L21.95 38.05zM7.863 27.863L5.8 25.8l4.074-1.738a.084.084 0 0 1 .033-.007c.034 0 .054.034.072.065a2.91 2.91 0 0 0 .13.184l.013.016c.012.017.004.034-.008.05l-2.25 3.493zm-2.976-2.976l-2.61-2.61c-.444-.444-.766-.766-.99-1.043l7.936 1.646a.84.84 0 0 0 .03.005c.049.008.103.017.103.063 0 .05-.059.073-.109.092l-.023.01-4.337 1.837zM.831 19.892a2 2 0 0 1 .09-.495c.148-.466.55-.868 1.356-1.674l3.34-3.34a2175.525 2175.525 0 0 0 4.626 6.687c.027...."
                    />
                  </svg>
                )}
              </IconButton>

              {/* Cloudflare Deploy Button */}
              <IconButton
                title={cloudflareConn.user ? 'Deploy to Cloudflare' : 'Connect Cloudflare account first'}
                disabled={!cloudflareConn.user || isDeployingCloudflare}
                onClick={handleDeployToCloudflare}
                className="w-8 h-8"
              >
                {isDeployingCloudflare ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />
                ) : (
                  <svg
                    className="w-4 h-4 dark:invert"
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
              </IconButton>
            </div>

            {/* Deploy Dialog Button */}
            <button
              className="items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent bg-codinit-elements-item-backgroundActive hover:bg-codinit-elements-item-backgroundAccent text-codinit-elements-textPrimary border border-codinit-elements-borderColor flex gap-1.7 shrink-0 w-8 h-8 text-sm"
              type="button"
              onClick={() => setIsDeployDialogOpen(true)}
              title="More Deploy Options"
            >
              <span className="i-lucide:cloud size-4"></span>
            </button>

            <button
              className="items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent bg-codinit-elements-textPrimary text-codinit-elements-background-depth-1 flex gap-1.7 shrink-0 w-8 h-8 text-sm"
              type="button"
              aria-controls="publish-menu"
              onClick={handleOpenPushDialog}
              title="Publish"
            >
              <span className="i-lucide:github size-4"></span>
            </button>
          </div>
        </div>

        {/* Window Size Dropdown */}
        {isWindowSizeDropdownOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setIsWindowSizeDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-[999] min-w-[240px] max-h-[400px] overflow-y-auto bg-codinit-elements-background-depth-1 rounded-xl shadow-2xl border border-codinit-elements-borderColor overflow-hidden">
              <div className="p-3 border-b border-codinit-elements-borderColor">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-codinit-elements-textPrimary">Window Options</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="flex w-full justify-between items-center text-start bg-transparent text-xs text-codinit-elements-textTertiary hover:text-codinit-elements-textPrimary"
                    onClick={() => {
                      openInNewTab();
                    }}
                  >
                    <span>Open in new tab</span>
                    <span className="i-lucide:external-link h-5 w-4 text-current"></span>
                  </button>
                  <button
                    className="flex w-full justify-between items-center text-start bg-transparent text-xs text-codinit-elements-textTertiary hover:text-codinit-elements-textPrimary"
                    onClick={() => {
                      if (!activePreview?.baseUrl) {
                        console.warn('[Preview] No active preview available');
                        return;
                      }

                      const match = activePreview.baseUrl.match(
                        /^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/,
                      );

                      if (!match) {
                        console.warn('[Preview] Invalid WebContainer URL:', activePreview.baseUrl);
                        return;
                      }

                      const previewId = match[1];
                      const previewUrl = `/webcontainer/preview/${previewId}`;

                      window.open(
                        previewUrl,
                        `preview-${previewId}`,
                        'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes',
                      );
                    }}
                  >
                    <span>Open in new window</span>
                    <span className="i-lucide:monitor h-5 w-4 text-current"></span>
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-codinit-elements-textTertiary">Show Device Frame</span>
                    <button
                      className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        showDeviceFrame
                          ? 'bg-codinit-elements-item-contentAccent'
                          : 'bg-codinit-elements-background-depth-3'
                      } relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeviceFrame(!showDeviceFrame);
                      }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-codinit-elements-background-depth-1 transition-transform duration-200 ${
                          showDeviceFrame ? 'transform translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-codinit-elements-textTertiary">Landscape Mode</span>
                    <button
                      className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        isLandscape
                          ? 'bg-codinit-elements-item-contentAccent'
                          : 'bg-codinit-elements-background-depth-3'
                      } relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLandscape(!isLandscape);
                      }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-codinit-elements-background-depth-1 transition-transform duration-200 ${
                          isLandscape ? 'transform translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              {windowSizes.map((size) => (
                <button
                  key={size.name}
                  className="w-full px-4 py-3.5 text-left text-codinit-elements-textPrimary text-sm whitespace-nowrap flex items-center gap-3 group hover:bg-codinit-elements-item-backgroundActive bg-codinit-elements-background-depth-1"
                  onClick={() => {
                    setSelectedWindowSize(size);
                    setIsWindowSizeDropdownOpen(false);
                    openInNewWindow(size);
                  }}
                >
                  <div
                    className={`${size.icon} w-5 h-5 text-current group-hover:text-codinit-elements-item-contentAccent transition-colors duration-200`}
                  />
                  <div className="flex-grow flex flex-col">
                    <span className="font-medium group-hover:text-codinit-elements-item-contentAccent transition-colors duration-200">
                      {size.name}
                    </span>
                    <span className="text-xs text-codinit-elements-textTertiary group-hover:text-codinit-elements-item-contentAccent transition-colors duration-200">
                      {isLandscape && (size.frameType === 'mobile' || size.frameType === 'tablet')
                        ? `${size.height} × ${size.width}`
                        : `${size.width} × ${size.height}`}
                      {size.hasFrame && showDeviceFrame ? ' (with frame)' : ''}
                    </span>
                  </div>
                  {selectedWindowSize.name === size.name && (
                    <div className="text-codinit-elements-item-contentAccent">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Expo QR Modal */}
        {expoUrl && <ExpoQrModal open={isExpoQrModalOpen} onClose={() => setIsExpoQrModalOpen(false)} />}

        {/* Deploy Dialog */}
        <DeployDialog isOpen={isDeployDialogOpen} onClose={() => setIsDeployDialogOpen(false)} />

        {/* Push to GitHub Dialog */}
        <PushToGitHubDialog isOpen={isPushDialogOpen} onClose={handleClosePushDialog} onPush={handlePushToGitHub} />
      </div>
    );
  },
);
