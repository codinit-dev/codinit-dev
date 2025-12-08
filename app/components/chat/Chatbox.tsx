import React, { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ProviderModelSelector } from '~/components/chat/ProviderModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/chat/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from '~/components/mcp/MCPTools';
import { MCPDialog } from '~/components/mcp/MCPDialog';
import { McpServerSelector } from './MCPServerSelector';
import { useToolMentionAutocomplete } from '~/lib/hooks/useToolMentionAutocomplete';
import { ToolMentionAutocomplete } from './ToolMentionAutocomplete';
import { insertToolMention, insertFileReference } from '~/utils/toolMentionParser';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const [isMcpPanelOpen, setIsMcpPanelOpen] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  const files = useStore(workbenchStore.files);

  const handleToolSelected = (toolName: string) => {
    if (!props.textareaRef?.current) {
      return;
    }

    const textarea = props.textareaRef.current;
    const currentCursor = textarea.selectionStart || 0;
    const { newText, newCursorPos } = insertToolMention(props.input, currentCursor, toolName);

    if (props.handleInputChange) {
      textarea.value = newText;

      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea,
      } as React.ChangeEvent<HTMLTextAreaElement>;

      props.handleInputChange(syntheticEvent);
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleFileSelected = (filePath: string) => {
    if (!props.textareaRef?.current) {
      return;
    }

    const textarea = props.textareaRef.current;
    const currentCursor = textarea.selectionStart || 0;
    const { newText, newCursorPos } = insertFileReference(props.input, currentCursor, filePath);

    if (props.handleInputChange) {
      textarea.value = newText;

      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea,
      } as React.ChangeEvent<HTMLTextAreaElement>;

      props.handleInputChange(syntheticEvent);
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const autocomplete = useToolMentionAutocomplete({
    input: props.input,
    textareaRef: props.textareaRef,
    onToolSelected: handleToolSelected,
    onFileSelected: handleFileSelected,
    files,
  });

  useEffect(() => {
    if (!props.chatStarted && props.input.length === 0 && showPlaceholder) {
      const tipText = 'What would like to build?';
      let i = 0;
      const timer = setInterval(() => {
        if (i < tipText.length) {
          setPlaceholderText(tipText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    }

    return () => {
      /* empty */
    };
  }, [props.chatStarted, props.input.length, showPlaceholder]);

  // Hide placeholder when textarea is focused
  const handleTextareaFocus = () => {
    setShowPlaceholder(false);
  };

  const handleTextareaBlur = () => {
    setShowPlaceholder(true);
  };

  return (
    <>
      <div
        className={classNames(
          'relative bg-codinit-elements-bg-depth-1 backdrop-blur p-2 rounded-lg border border-codinit-elements-borderColor relative w-full max-w-chat mx-auto z-prompt transition-theme',

          /*
           * {
           *   'sticky bottom-2': chatStarted,
           * },
           */
        )}
      >
        <svg className={classNames(styles.PromptEffectContainer)}>
          <defs>
            <linearGradient
              id="line-gradient"
              x1="20%"
              y1="0%"
              x2="-14%"
              y2="10%"
              gradientUnits="userSpaceOnUse"
              gradientTransform="rotate(-45)"
            >
              <stop offset="0%" stopColor="#337bff" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="#337bff" stopOpacity="80%"></stop>
              <stop offset="50%" stopColor="#337bff" stopOpacity="80%"></stop>
              <stop offset="100%" stopColor="#337bff" stopOpacity="0%"></stop>
            </linearGradient>
            <linearGradient id="shine-gradient">
              <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
              <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
              <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
            </linearGradient>
          </defs>
          <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
          <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
        </svg>
        <div>
          <ClientOnly>
            {() => (
              <>
                <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
                  <ProviderModelSelector
                    key={props.provider?.name + ':' + props.modelList.length}
                    model={props.model}
                    setModel={props.setModel}
                    modelList={props.modelList}
                    provider={props.provider}
                    setProvider={props.setProvider}
                    providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                    apiKeys={props.apiKeys}
                    modelLoading={props.isModelLoading}
                    isCollapsed={false}
                  />
                  {(props.providerList || []).length > 0 &&
                    props.provider &&
                    !LOCAL_PROVIDERS.includes(props.provider.name) && (
                      <APIKeyManager
                        provider={props.provider}
                        apiKey={props.apiKeys[props.provider.name] || ''}
                        setApiKey={(key) => {
                          props.onApiKeysChange(props.provider.name, key);
                        }}
                      />
                    )}
                </div>
              </>
            )}
          </ClientOnly>
        </div>
        <FilePreview
          files={props.uploadedFiles}
          imageDataList={props.imageDataList}
          onRemove={(index) => {
            props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
            props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
          }}
        />
        <ClientOnly>
          {() => (
            <ScreenshotStateManager
              setUploadedFiles={props.setUploadedFiles}
              setImageDataList={props.setImageDataList}
              uploadedFiles={props.uploadedFiles}
              imageDataList={props.imageDataList}
            />
          )}
        </ClientOnly>
        {props.selectedElement && (
          <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-codinit-elements-borderColor text-codinit-elements-textPrimary flex py-1 px-2.5 font-medium text-xs transition-theme">
            <div className="flex gap-2 items-center lowercase">
              <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
                {props?.selectedElement?.tagName}
              </code>
              selected for inspection
            </div>
            <button
              className="bg-transparent text-accent-500 pointer-auto"
              onClick={() => props.setSelectedElement?.(null)}
            >
              Clear
            </button>
          </div>
        )}

        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-4 pt-2 pr-0 pb-4 outline-none resize-none text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary bg-transparent text-sm',
            'transition-all duration-200',
            'hover:border-codinit-elements-focus',
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--codinit-elements-borderColor)';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--codinit-elements-borderColor)';

            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (autocomplete.handleKeyDown(event)) {
              return;
            }

            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={props.handleInputChange}
          onFocus={handleTextareaFocus}
          onBlur={handleTextareaBlur}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={!props.chatStarted && props.input.length === 0 && showPlaceholder ? placeholderText : undefined}
          translate="no"
        />
        <ClientOnly>
          {() => (
            <>
              <SendButton
                show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                isStreaming={props.isStreaming}
                disabled={!props.providerList || props.providerList.length === 0}
                onClick={(event) => {
                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                    props.handleSendMessage?.(event);
                  }
                }}
              />
            </>
          )}
        </ClientOnly>
        <div className="flex justify-between items-center text-sm p-4 pt-2">
          <div className="flex gap-1 items-center">
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
            <IconButton title="Upload file" className="transition-all" onClick={() => props.handleFileUpload()}>
              <div className="i-ph:paperclip text-xl"></div>
            </IconButton>
            <IconButton
              title="Enhance prompt"
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames('transition-all', props.enhancingPrompt ? 'opacity-100' : '')}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success('Prompt enhanced!');
              }}
            >
              {props.enhancingPrompt ? (
                <div className="i-svg-spinners:90-ring-with-bg text-codinit-elements-loader-progress text-xl animate-spin"></div>
              ) : (
                <div className="i-codinit:stars text-xl"></div>
              )}
            </IconButton>

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />
            <IconButton
              title="Discuss"
              className={classNames(
                'transition-all flex items-center gap-1 px-1.5',
                props.chatMode === 'discuss'
                  ? '!bg-codinit-elements-item-backgroundAccent !text-codinit-elements-item-contentAccent'
                  : 'bg-codinit-elements-item-backgroundDefault text-codinit-elements-item-contentDefault',
              )}
              onClick={() => {
                props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
              }}
            >
              <div className={`i-ph:chats text-xl`} />
              {props.chatMode === 'discuss' ? <span>Discuss</span> : <span />}
            </IconButton>
            <ClientOnly>
              {() =>
                props.isModelSettingsCollapsed ? (
                  <DropdownMenu.Root open={providerDropdownOpen} onOpenChange={setProviderDropdownOpen}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        title="Model Settings"
                        type="button"
                        className={classNames(
                          'flex items-center justify-center text-codinit-elements-item-contentDefault bg-transparent enabled:hover:text-codinit-elements-item-contentActive rounded-md enabled:hover:bg-codinit-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-500/50 p-1',
                          'transition-all flex items-center gap-1 cursor-pointer',
                          'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent',
                        )}
                        disabled={!props.providerList || props.providerList.length === 0}
                      >
                        <div className="i-ph:caret-right text-lg" />
                        <span className="text-xs">{props.model}</span>
                      </button>
                    </DropdownMenu.Trigger>
                    <ProviderModelSelector
                      key={props.provider?.name + ':' + props.modelList.length + '-collapsed'}
                      model={props.model}
                      setModel={props.setModel}
                      modelList={props.modelList}
                      provider={props.provider}
                      setProvider={props.setProvider}
                      providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                      apiKeys={props.apiKeys}
                      modelLoading={props.isModelLoading}
                      isCollapsed={true}
                      open={providerDropdownOpen}
                      onOpenChange={setProviderDropdownOpen}
                      onApiKeyChange={props.onApiKeysChange}
                    />
                  </DropdownMenu.Root>
                ) : (
                  <IconButton
                    title="Model Settings"
                    className={classNames(
                      'transition-all flex items-center gap-1',
                      'bg-codinit-elements-item-backgroundDefault text-codinit-elements-item-contentDefault',
                    )}
                    onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
                    disabled={!props.providerList || props.providerList.length === 0}
                  >
                    <div className="i-ph:caret-down text-lg" />
                  </IconButton>
                )
              }
            </ClientOnly>
          </div>
          <div className="flex gap-2 items-center">
            <McpTools onOpenPanel={() => setIsMcpPanelOpen(true)} />
            <McpServerSelector />
            <SupabaseConnection />
          </div>
          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>

      {/* MCP Integration Panel */}
      <MCPDialog isOpen={isMcpPanelOpen} onClose={() => setIsMcpPanelOpen(false)} initialTab="marketplace" />

      {/* Tool Mention Autocomplete */}
      <ToolMentionAutocomplete
        isOpen={autocomplete.isOpen}
        tools={autocomplete.filteredTools}
        files={autocomplete.filteredFiles}
        selectedIndex={autocomplete.selectedIndex}
        position={autocomplete.dropdownPosition}
        onSelectTool={autocomplete.handleToolSelect}
        onSelectFile={autocomplete.handleFileSelect}
        onHover={autocomplete.setSelectedIndex}
        onClose={autocomplete.handleClose}
        searchQuery={autocomplete.searchQuery}
        referenceType={autocomplete.referenceType}
      />
    </>
  );
};
