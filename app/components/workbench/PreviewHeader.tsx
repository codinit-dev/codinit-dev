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
  setIsPushDialogOpen: (open: boolean) => void;
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

    return (
      <div className="flex relative items-center gap-2 py-2 min-h-[var(--panel-header-height)] pl-0 bg-codinit-elements-background-depth-2">
        {/* Toggle Buttons Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              aria-label="Preview"
              aria-pressed="true"
              className="flex items-center justify-center w-8 h-8 rounded-md text-codinit-elements-item-contentAccent bg-codinit-elements-item-backgroundAccent hover:bg-codinit-elements-item-backgroundActive transition-colors"
              onClick={() => setSelectedView('preview')}
            >
              <span className="i-lucide:eye size-4"></span>
            </button>
            <button
              aria-label="Code"
              aria-pressed="false"
              className="flex items-center justify-center w-8 h-8 rounded-md text-codinit-elements-icon-secondary hover:text-codinit-elements-item-contentActive hover:bg-codinit-elements-item-backgroundActive transition-colors"
              onClick={() => setSelectedView('code')}
            >
              <span className="i-lucide:code size-4"></span>
            </button>
            <button
              aria-label="Database - Connected"
              aria-pressed="false"
              className="flex items-center justify-center w-8 h-8 rounded-md text-codinit-elements-icon-secondary hover:text-codinit-elements-item-contentActive hover:bg-codinit-elements-item-backgroundActive transition-colors"
            >
              <span className="i-lucide:database size-4"></span>
            </button>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              className="bg-transparent p-0"
              aria-label="More Options"
            >
              <div className="flex items-center bg-transparent text-sm px-2 py-1 rounded-full relative text-codinit-elements-item-contentDefault hover:text-codinit-elements-item-contentActive pl-1 pr-1.5 h-5 opacity-90 hover:opacity-100">
                <span className="i-lucide:settings text-current w-4 h-4"></span>
              </div>
            </button>
          </div>
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

            <div className="flex gap-1">
              <IconButton
                icon="i-codinit:stars"
                className="text-codinit-elements-item-contentDefault bg-transparent rounded-md disabled:cursor-not-allowed enabled:hover:text-codinit-elements-item-contentActive enabled:hover:bg-codinit-elements-item-backgroundActive p-1 relative w-8 h-8"
              />
            </div>

            {/* Deployment Buttons */}
            <div className="flex gap-1">
              {/* Vercel Deploy Button */}
              <button
                className={`items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent flex gap-1.7 shrink-0 h-8 text-sm px-2 ${
                  vercelConn.user && !isDeployingVercel
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600'
                    : 'bg-gray-400 text-gray-200 border border-gray-400 cursor-not-allowed'
                }`}
                type="button"
                onClick={handleDeployToVercel}
                disabled={!vercelConn.user || isDeployingVercel}
                title={vercelConn.user ? 'Deploy to Vercel' : 'Connect Vercel account first'}
              >
                {isDeployingVercel ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />
                ) : (
                  <img className="w-4 h-4" src="https://cdn.simpleicons.org/vercel" alt="Vercel" />
                )}
              </button>

              {/* Netlify Deploy Button */}
              <button
                className={`items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent flex gap-1.7 shrink-0 h-8 text-sm px-2 ${
                  netlifyConn.user && !isDeployingNetlify
                    ? 'bg-green-600 hover:bg-green-700 text-white border border-green-600'
                    : 'bg-gray-400 text-gray-200 border border-gray-400 cursor-not-allowed'
                }`}
                type="button"
                onClick={handleDeployToNetlify}
                disabled={!netlifyConn.user || isDeployingNetlify}
                title={netlifyConn.user ? 'Deploy to Netlify' : 'Connect Netlify account first'}
              >
                {isDeployingNetlify ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />
                ) : (
                  <img className="w-4 h-4" src="https://cdn.simpleicons.org/netlify" alt="Netlify" />
                )}
              </button>

              {/* Cloudflare Deploy Button */}
              <button
                className={`items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent flex gap-1.7 shrink-0 h-8 text-sm px-2 ${
                  cloudflareConn.user && !isDeployingCloudflare
                    ? 'bg-orange-600 hover:bg-orange-700 text-white border border-orange-600'
                    : 'bg-gray-400 text-gray-200 border border-gray-400 cursor-not-allowed'
                }`}
                type="button"
                onClick={handleDeployToCloudflare}
                disabled={!cloudflareConn.user || isDeployingCloudflare}
                title={cloudflareConn.user ? 'Deploy to Cloudflare' : 'Connect Cloudflare account first'}
              >
                {isDeployingCloudflare ? (
                  <div className="i-svg-spinners:90-ring-with-bg w-4 h-4" />
                ) : (
                  <img className="w-4 h-4" src="https://cdn.simpleicons.org/cloudflare" alt="Cloudflare" />
                )}
              </button>
            </div>

            {/* Deploy Dialog Button */}
            <button
              className="items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent bg-codinit-elements-item-backgroundActive hover:bg-codinit-elements-item-backgroundAccent text-codinit-elements-textPrimary border border-codinit-elements-borderColor flex gap-1.7 shrink-0 h-8 text-sm px-3"
              type="button"
              onClick={() => setIsDeployDialogOpen(true)}
            >
              More Deploy
            </button>

            <button
              className="items-center justify-center font-medium min-w-0 max-w-full rounded-md focus-visible:outline-2 disabled:opacity-50 relative disabled:cursor-not-allowed focus-visible:outline-codinit-elements-item-contentAccent bg-codinit-elements-textPrimary text-codinit-elements-background-depth-1 flex gap-1.7 shrink-0 h-8 text-sm px-3"
              type="button"
              aria-controls="publish-menu"
              onClick={() => setIsPushDialogOpen(true)}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Window Size Dropdown */}
        {isWindowSizeDropdownOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setIsWindowSizeDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 min-w-[240px] max-h-[400px] overflow-y-auto bg-codinit-elements-background-depth-1 rounded-xl shadow-2xl border border-codinit-elements-borderColor overflow-hidden">
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
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
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
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
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
      </div>
    );
  },
);
