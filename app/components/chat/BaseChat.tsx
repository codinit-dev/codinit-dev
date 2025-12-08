/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { JSONValue, Message } from 'ai';
import React, { lazy, Suspense, type RefCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';

const Workbench = lazy(() =>
  import('~/components/workbench/Workbench.client').then((module) => ({
    default: module.Workbench,
  })),
);
import { ChatHeader } from '~/components/header/ChatHeader';
import { PreviewHeader } from '~/components/workbench/PreviewHeader';
import { CodeModeHeader } from '~/components/workbench/CodeModeHeader';
import { DiffViewHeader } from '~/components/workbench/DiffViewHeader';
import { workbenchStore } from '~/lib/stores/workbench';
import { TextShimmer } from '~/components/ui/text-shimmer';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Messages } from './Messages.client';
import { getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import * as Tooltip from '@radix-ui/react-tooltip';
import styles from './BaseChat.module.scss';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import GitCloneButton from './GitCloneButton';
import type { ProviderInfo } from '~/types/model';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert, SupabaseAlert, DeployAlert, LlmErrorAlertType } from '~/types/actions';
import DeployChatAlert from '~/components/deploy/DeployAlert';
import ChatAlert from './ChatAlert';
import type { ModelInfo } from '~/lib/modules/llm/types';
import ProgressCompilation from './ProgressCompilation';
import type { ProgressAnnotation } from '~/types/context';
import { SupabaseChatAlert } from '~/components/chat/SupabaseAlert';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { useStore } from '@nanostores/react';
import { StickToBottom, useStickToBottomContext } from '~/lib/hooks';
import { ChatBox } from './Chatbox';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import LlmErrorAlert from './LLMApiAlert';

const TEXTAREA_MIN_HEIGHT = 76;

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  onStreamingChange?: (streaming: boolean) => void;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
  supabaseAlert?: SupabaseAlert;
  clearSupabaseAlert?: () => void;
  deployAlert?: DeployAlert;
  clearDeployAlert?: () => void;
  llmErrorAlert?: LlmErrorAlertType;
  clearLlmErrorAlert?: () => void;
  data?: JSONValue[] | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  append?: (message: Message) => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: (element: ElementInfo | null) => void;
  addToolResult?: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      onStreamingChange,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,

      // promptEnhanced,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      deployAlert,
      clearDeployAlert,
      supabaseAlert,
      clearSupabaseAlert,
      llmErrorAlert,
      clearLlmErrorAlert,
      data,
      chatMode,
      setChatMode,
      append,
      designScheme,
      setDesignScheme,
      selectedElement,
      setSelectedElement,
      addToolResult = () => {
        throw new Error('addToolResult not implemented');
      },
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState<ModelInfo[]>([]);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [progressAnnotations, setProgressAnnotations] = useState<ProgressAnnotation[]>([]);
    const expoUrl = useStore(expoUrlAtom);
    const [qrModalOpen, setQrModalOpen] = useState(false);

    // Workbench header state
    const selectedView = useStore(workbenchStore.currentView);
    const [isSyncing, setIsSyncing] = useState(false);
    const previews = useStore(workbenchStore.previews);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [displayPath, setDisplayPath] = useState('/');

    // Preview header state
    const [isWindowSizeDropdownOpen, setIsWindowSizeDropdownOpen] = useState(false);
    const [selectedWindowSize, setSelectedWindowSize] = useState({
      name: 'Desktop',
      width: 1920,
      height: 1080,
      icon: 'i-ph:monitor',
    });
    const [showDeviceFrame, setShowDeviceFrame] = useState(true);
    const [isLandscape, setIsLandscape] = useState(false);

    // Diff view header state
    const [isDiffFullscreen, setIsDiffFullscreen] = useState(false);
    const selectedFile = useStore(workbenchStore.selectedFile);
    const currentDocument = useStore(workbenchStore.currentDocument);
    const files = useStore(workbenchStore.files);

    const setIsPushDialogOpen = (_open: boolean) => {
      // Push dialog is handled by Workbench component
    };

    useEffect(() => {
      if (expoUrl) {
        setQrModalOpen(true);
      }
    }, [expoUrl]);

    useEffect(() => {
      if (data) {
        const progressList = data.filter(
          (x) => typeof x === 'object' && (x as any).type === 'progress',
        ) as ProgressAnnotation[];
        setProgressAnnotations(progressList);
      }
    }, [data]);
    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);
          Cookies.remove('apiKeys');
        }

        setIsModelLoading('all');
        fetch('/api/models')
          .then((response) => response.json())
          .then((data) => {
            const typedData = data as { modelList: ModelInfo[] };
            setModelList(typedData.modelList);
          })
          .catch((error) => {
            console.error('Error fetching model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      setIsModelLoading(providerName);

      let providerModels: ModelInfo[] = [];

      try {
        const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
        const data = await response.json();
        providerModels = (data as { modelList: ModelInfo[] }).modelList;
      } catch (error) {
        console.error('Error loading dynamic models for:', providerName, error);
      }

      // Only update models for the specific provider
      setModelList((prevModels) => {
        const otherModels = prevModels.filter((model) => model.provider !== providerName);
        return [...otherModels, ...providerModels];
      });
      setIsModelLoading(undefined);
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (!chatStarted && (!messages || messages.length === 0)) {
        toast.error('Please pick a framework to get started');
        return;
      }

      if (sendMessage) {
        sendMessage(event, messageInput);
        setSelectedElement?.(null);

        if (recognition) {
          recognition.abort(); // Stop current recognition
          setTranscript(''); // Clear transcript
          setIsListening(false);

          // Clear the input by triggering handleInputChange with empty value
          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };

    const handleSetIframeUrl = (url: string | undefined) => {
      // Update display path based on URL
      if (url) {
        try {
          const urlObj = new URL(url);
          setDisplayPath(urlObj.pathname || '/');
        } catch {
          setDisplayPath('/');
        }
      } else {
        setDisplayPath('/');
      }
    };

    const handleReloadPreview = () => {
      const activePreview = previews[activePreviewIndex];

      if (activePreview?.baseUrl) {
        // Access the previews store through workbench store
        const previewId = activePreview.baseUrl.match(
          /^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/,
        )?.[1];

        if (previewId) {
          // Trigger preview refresh by updating the preview state
          const updatedPreviews = [...previews];

          if (updatedPreviews[activePreviewIndex]) {
            updatedPreviews[activePreviewIndex] = { ...updatedPreviews[activePreviewIndex], ready: false };

            // Force re-render by setting ready back to true after a brief delay
            setTimeout(() => {
              updatedPreviews[activePreviewIndex] = { ...updatedPreviews[activePreviewIndex], ready: true };
            }, 100);
          }
        }
      }
    };

    const handleOpenInNewTab = () => {
      const activePreview = previews[activePreviewIndex];

      if (activePreview?.baseUrl) {
        window.open(activePreview.baseUrl, '_blank');
      }
    };

    const handleOpenInNewWindow = () => {
      const activePreview = previews[activePreviewIndex];

      if (activePreview?.baseUrl) {
        window.open(activePreview.baseUrl, '_blank', 'width=1200,height=800');
      }
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex flex-col h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>

        {/* Unified Header Container - spans full width */}
        {chatStarted && (
          <div className="flex bg-codinit-elements-background-depth-1">
            {/* Chat Header Section - constrained to chat width */}
            <div className="w-[var(--chat-min-width)]">
              <ChatHeader />
            </div>

            {/* Workbench Header Section - fills remaining space */}
            <div className="flex-1">
              {selectedView === 'code' && (
                <CodeModeHeader
                  onDownloadZip={() => {
                    workbenchStore.downloadZip();
                  }}
                  onSyncFiles={() => setIsSyncing(true)}
                  onPushToGitHub={() => setIsPushDialogOpen(true)}
                  isSyncing={isSyncing}
                  setIsPushDialogOpen={setIsPushDialogOpen}
                />
              )}

              {selectedView === 'preview' && (
                <PreviewHeader
                  previews={previews}
                  activePreviewIndex={activePreviewIndex}
                  setActivePreviewIndex={setActivePreviewIndex}
                  displayPath={displayPath}
                  setDisplayPath={setDisplayPath}
                  setIframeUrl={handleSetIframeUrl}
                  reloadPreview={handleReloadPreview}
                  setIsWindowSizeDropdownOpen={setIsWindowSizeDropdownOpen}
                  isWindowSizeDropdownOpen={isWindowSizeDropdownOpen}
                  openInNewTab={handleOpenInNewTab}
                  openInNewWindow={handleOpenInNewWindow}
                  windowSizes={[]}
                  selectedWindowSize={selectedWindowSize}
                  setSelectedWindowSize={setSelectedWindowSize}
                  showDeviceFrame={showDeviceFrame}
                  setShowDeviceFrame={setShowDeviceFrame}
                  isLandscape={isLandscape}
                  setIsLandscape={setIsLandscape}
                  setIsPushDialogOpen={setIsPushDialogOpen}
                />
              )}

              {selectedView === 'diff' && selectedFile && currentDocument && (
                <DiffViewHeader
                  filename={selectedFile}
                  beforeCode={
                    files[selectedFile] && 'content' in files[selectedFile] ? files[selectedFile].content : ''
                  }
                  afterCode={currentDocument.value || ''}
                  hasChanges={
                    files[selectedFile] && 'content' in files[selectedFile]
                      ? files[selectedFile].content !== currentDocument.value
                      : false
                  }
                  isFullscreen={isDiffFullscreen}
                  onToggleFullscreen={() => setIsDiffFullscreen(!isDiffFullscreen)}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[16vh] max-w-2xl mx-auto text-center px-4 lg:px-0">
                <h1 className="flex flex-wrap items-center gap-2 text-codinit-elements-textPrimary justify-center font-display font-bold text-5xl tracking-tight mb-8">
                  <span className="text-codinit-elements-textPrimary">Prompt </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="135"
                    height="47"
                    fill="none"
                    style={{ transform: 'scale(0.95)' }}
                  >
                    <path
                      className="fill-[url(#a-light)] dark:fill-[url(#a-dark)]"
                      fillRule="evenodd"
                      d="M20.176 41.612c-3.145 0-6.233-1.135-8.006-3.575l-.626 2.878L0 47l1.246-6.085 8.408-37.83h10.293l-2.973 13.334c2.401-2.61 4.632-3.575 7.491-3.575 6.176 0 10.294 4.029 10.294 11.405 0 7.604-4.747 17.363-14.583 17.363Zm3.946-15.207c0 3.518-2.516 6.185-5.776 6.185-1.83 0-3.488-.68-4.575-1.872l1.601-6.98c1.201-1.191 2.574-1.872 4.175-1.872 2.459 0 4.575 1.816 4.575 4.54Z"
                      clipRule="evenodd"
                    ></path>
                    <path
                      className="fill-[url(#b-light)] dark:fill-[url(#b-dark)]"
                      d="M40.855 13.708h10.493l-3.44 15.443c-.116.52-.174.926-.174 1.33 0 1.91 1.69 2.661 3.556 2.661 2.098 0 3.672-1.214 4.78-2.198l3.847-17.236H70.41l-6.237 27.937H53.68l.758-3.181c-2.04 1.85-4.606 3.875-8.861 3.875-5.888 0-9.269-3.181-9.269-7.346 0-.463.175-1.735.291-2.256l4.256-19.029Z"
                    ></path>
                    <path
                      className="fill-[url(#c-light)] dark:fill-[url(#c-dark)]"
                      d="M80.813 11.684c-3.09 0-5.305-2.256-5.305-4.975C75.508 2.371 79.18 0 82.153 0c3.09 0 5.305 2.256 5.305 4.974 0 4.338-3.672 6.71-6.645 6.71Zm-2.04 29.96H68.278l6.238-27.936H85.01l-6.238 27.937Z"
                    ></path>
                    <path
                      className="fill-[url(#d-light)] dark:fill-[url(#d-dark)]"
                      d="M93.362 41.645H82.869l8.57-38.58h10.492l-8.57 38.58Z"
                    ></path>
                    <path
                      className="fill-[url(#e-light)] dark:fill-[url(#e-dark)]"
                      d="M113.314 13.014c3.207 0 6.355 1.157 8.162 3.644l3.031-13.592H135l-8.628 38.579h-10.493l.7-2.95c-2.448 2.66-4.722 3.644-7.637 3.644-6.295 0-10.493-4.107-10.493-11.626 0-7.75 4.839-17.699 14.865-17.699Zm1.866 9.197c-3.323 0-5.888 2.718-5.888 6.304 0 2.776 2.157 4.627 4.664 4.627 1.632 0 3.031-.694 4.255-1.909l1.632-7.114c-1.107-1.214-2.798-1.909-4.663-1.909Z"
                    ></path>
                    <defs>
                      <linearGradient
                        id="a-light"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#1488FC"></stop>
                        <stop offset="1" stopColor="#03305D"></stop>
                      </linearGradient>
                      <linearGradient
                        id="b-light"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#1488FC"></stop>
                        <stop offset="1" stopColor="#03305D"></stop>
                      </linearGradient>
                      <linearGradient
                        id="c-light"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#1488FC"></stop>
                        <stop offset="1" stopColor="#03305D"></stop>
                      </linearGradient>
                      <linearGradient
                        id="d-light"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#1488FC"></stop>
                        <stop offset="1" stopColor="#03305D"></stop>
                      </linearGradient>
                      <linearGradient
                        id="e-light"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#1488FC"></stop>
                        <stop offset="1" stopColor="#03305D"></stop>
                      </linearGradient>
                      <linearGradient
                        id="a-dark"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#fff"></stop>
                        <stop offset="1" stopColor="#1488FC"></stop>
                      </linearGradient>
                      <linearGradient
                        id="b-dark"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#fff"></stop>
                        <stop offset="1" stopColor="#1488FC"></stop>
                      </linearGradient>
                      <linearGradient
                        id="c-dark"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#fff"></stop>
                        <stop offset="1" stopColor="#1488FC"></stop>
                      </linearGradient>
                      <linearGradient
                        id="d-dark"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#fff"></stop>
                        <stop offset="1" stopColor="#1488FC"></stop>
                      </linearGradient>
                      <linearGradient
                        id="e-dark"
                        x1="76.5"
                        x2="75.895"
                        y1="55"
                        y2="-8.494"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#fff"></stop>
                        <stop offset="1" stopColor="#1488FC"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-codinit-elements-textPrimary"> Deploy</span>
                </h1>
                <p className="text-md lg:text-xl mb-8 text-codinit-elements-textSecondary animate-fade-in animation-delay-200">
                  <TextShimmer>Let your imagination build your next startup idea</TextShimmer>
                </p>
              </div>
            )}

            <StickToBottom
              className={classNames('pt-6 px-2 sm:px-6 relative', {
                'h-full flex flex-col modern-scrollbar': chatStarted,
              })}
              resize="smooth"
              initial="smooth"
            >
              <StickToBottom.Content className="flex flex-col gap-4 relative ">
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        className="flex flex-col w-full flex-1 max-w-chat pb-4 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                        append={append}
                        chatMode={chatMode}
                        setChatMode={setChatMode}
                        provider={provider}
                        model={model}
                        addToolResult={addToolResult}
                      />
                    ) : null;
                  }}
                </ClientOnly>
                <ScrollToBottom />
              </StickToBottom.Content>
              <div
                className={classNames('my-auto flex flex-col gap-2 w-full max-w-chat mx-auto z-prompt mb-6', {
                  'sticky bottom-2': chatStarted,
                })}
              >
                <div className="flex flex-col gap-2">
                  {deployAlert && (
                    <DeployChatAlert
                      alert={deployAlert}
                      clearAlert={() => clearDeployAlert?.()}
                      postMessage={(message: string | undefined) => {
                        sendMessage?.({} as any, message);
                        clearSupabaseAlert?.();
                      }}
                    />
                  )}
                  {supabaseAlert && (
                    <SupabaseChatAlert
                      alert={supabaseAlert}
                      clearAlert={() => clearSupabaseAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearSupabaseAlert?.();
                      }}
                    />
                  )}
                  {actionAlert && (
                    <ChatAlert
                      alert={actionAlert}
                      clearAlert={() => clearAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearAlert?.();
                      }}
                    />
                  )}
                  {llmErrorAlert && <LlmErrorAlert alert={llmErrorAlert} clearAlert={() => clearLlmErrorAlert?.()} />}
                </div>
                {progressAnnotations && <ProgressCompilation data={progressAnnotations} />}
                <ChatBox
                  isModelSettingsCollapsed={isModelSettingsCollapsed}
                  setIsModelSettingsCollapsed={setIsModelSettingsCollapsed}
                  provider={provider}
                  setProvider={setProvider}
                  providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                  model={model}
                  setModel={setModel}
                  modelList={modelList}
                  apiKeys={apiKeys}
                  isModelLoading={isModelLoading}
                  onApiKeysChange={onApiKeysChange}
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                  imageDataList={imageDataList}
                  setImageDataList={setImageDataList}
                  textareaRef={textareaRef}
                  input={input}
                  handleInputChange={handleInputChange}
                  handlePaste={handlePaste}
                  TEXTAREA_MIN_HEIGHT={TEXTAREA_MIN_HEIGHT}
                  TEXTAREA_MAX_HEIGHT={TEXTAREA_MAX_HEIGHT}
                  isStreaming={isStreaming}
                  handleStop={handleStop}
                  handleSendMessage={handleSendMessage}
                  enhancingPrompt={enhancingPrompt}
                  enhancePrompt={enhancePrompt}
                  isListening={isListening}
                  startListening={startListening}
                  stopListening={stopListening}
                  chatStarted={chatStarted}
                  exportChat={exportChat}
                  qrModalOpen={qrModalOpen}
                  setQrModalOpen={setQrModalOpen}
                  handleFileUpload={handleFileUpload}
                  chatMode={chatMode}
                  setChatMode={setChatMode}
                  designScheme={designScheme}
                  setDesignScheme={setDesignScheme}
                  selectedElement={selectedElement}
                  setSelectedElement={setSelectedElement}
                />
              </div>
            </StickToBottom>
            <div className="flex flex-col justify-center">
              {!chatStarted && (
                <div className="flex justify-center gap-2">
                  {ImportButtons(importChat)}
                  <GitCloneButton importChat={importChat} />
                </div>
              )}
              <div className="flex flex-col gap-5">{!chatStarted && <StarterTemplates />}</div>
            </div>
          </div>
          <ClientOnly>
            {() => (
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <div className="i-svg-spinners:90-ring-with-bg text-2xl text-codinit-elements-textTertiary"></div>
                  </div>
                }
              >
                <Workbench
                  chatStarted={chatStarted}
                  isStreaming={isStreaming}
                  setSelectedElement={setSelectedElement}
                />
              </Suspense>
            )}
          </ClientOnly>
        </div>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);

function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    !isAtBottom && (
      <>
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-codinit-elements-background-depth-1 to-transparent h-20 z-10" />
        <button
          className="sticky z-50 bottom-0 left-0 right-0 text-4xl rounded-lg px-1.5 py-0.5 flex items-center justify-center mx-auto gap-2 bg-codinit-elements-background-depth-2 border border-codinit-elements-borderColor text-codinit-elements-textPrimary text-sm"
          onClick={() => scrollToBottom()}
        >
          Go to last message
          <span className="i-ph:arrow-down animate-bounce" />
        </button>
      </>
    )
  );
}
