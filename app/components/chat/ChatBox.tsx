import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
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
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from './MCPTools';
import { DiscussMode } from './DiscussMode';

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
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  return (
    <div
      className={classNames(
        'relative w-full max-w-chat mx-auto z-prompt',
        'bg-codinit-elements-background-depth-2/80 backdrop-blur-xl',
        'rounded-2xl border border-codinit-elements-borderColor/50',
        'shadow-lg shadow-black/5',
        'transition-all duration-300 ease-in-out',
        'hover:shadow-xl hover:shadow-black/10',
        'hover:border-codinit-elements-borderColor/80',
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
            <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
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
      <div className="p-3 pb-0">
        <ClientOnly>
          {() => (
            <div
              className={classNames(
                'transition-all duration-200 ease-in-out overflow-hidden',
                props.isModelSettingsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100',
              )}
            >
              <div className="mb-2 space-y-2">
                <ModelSelector
                  key={props.provider?.name + ':' + props.modelList.length}
                  model={props.model}
                  setModel={props.setModel}
                  modelList={props.modelList}
                  provider={props.provider}
                  setProvider={props.setProvider}
                  providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                  apiKeys={props.apiKeys}
                  modelLoading={props.isModelLoading}
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
            </div>
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
        <div className="mx-3 mb-2 flex gap-2 items-center justify-between rounded-xl border border-accent-500/30 bg-accent-500/5 backdrop-blur-sm text-codinit-elements-textPrimary py-2 px-3 font-medium text-xs">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-accent-500 rounded-lg px-2 py-1 text-white font-mono text-xs">
              {props?.selectedElement?.tagName}
            </code>
            <span className="text-codinit-elements-textSecondary">selected for inspection</span>
          </div>
          <button
            className="text-accent-500 hover:text-accent-600 transition-colors duration-150 font-medium"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Clear
          </button>
        </div>
      )}
      <div
        className={classNames(
          'relative mx-3 mb-3',
          'bg-codinit-elements-background-depth-1/50 backdrop-blur-sm',
          'rounded-xl border border-codinit-elements-borderColor/30',
          'transition-all duration-200 ease-in-out',
          'focus-within:border-accent-500/50 focus-within:shadow-lg focus-within:shadow-accent-500/5',
          'hover:border-codinit-elements-borderColor/50',
        )}
      >
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full px-4 pt-5 pb-3 pr-16',
            'outline-none resize-none bg-transparent',
            'text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary/60',
            'text-sm leading-relaxed',
            'transition-all duration-200',
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
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              // ignore if using input method engine
              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={(event) => {
            props.handleInputChange?.(event);
          }}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={
            props.chatMode === 'build' ? 'How can codinit help you today?' : 'What would you like to discuss?'
          }
          translate="no"
        />
        <ClientOnly>
          {() => (
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
          )}
        </ClientOnly>
        <div className="flex justify-between items-center px-3 py-2 border-t border-codinit-elements-borderColor/20">
          <div className="flex gap-0.5 items-center">
            <McpTools />
            <IconButton
              title="Upload file"
              className="hover:bg-codinit-elements-item-backgroundAccent/50 transition-all duration-150 rounded-lg"
              onClick={() => props.handleFileUpload()}
            >
              <div className="i-ph:paperclip text-lg"></div>
            </IconButton>
            <IconButton
              title="Enhance prompt"
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames(
                'hover:bg-codinit-elements-item-backgroundAccent/50 transition-all duration-150 rounded-lg',
                props.enhancingPrompt ? 'opacity-100' : '',
              )}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success('Prompt enhanced!');
              }}
            >
              {props.enhancingPrompt ? (
                <div className="i-svg-spinners:90-ring-with-bg text-codinit-elements-loader-progress text-lg animate-spin"></div>
              ) : (
                <div className="i-codinit:stars text-lg"></div>
              )}
            </IconButton>

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />

            <div className="w-px h-5 bg-codinit-elements-borderColor/30 mx-1"></div>

            <DiscussMode chatMode={props.chatMode} setChatMode={props.setChatMode} />
            <IconButton
              title="Model Settings"
              className={classNames('transition-all duration-150 flex items-center gap-1.5 rounded-lg px-2', {
                'bg-accent-500/10 text-accent-500 hover:bg-accent-500/20': props.isModelSettingsCollapsed,
                'hover:bg-codinit-elements-item-backgroundAccent/50 text-codinit-elements-textSecondary':
                  !props.isModelSettingsCollapsed,
              })}
              onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
              disabled={!props.providerList || props.providerList.length === 0}
            >
              <>
                <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'} text-base`} />
                {props.isModelSettingsCollapsed && <span className="text-xs font-medium">{props.model}</span>}
              </>
            </IconButton>
          </div>
          {props.input.length > 3 ? (
            <div className="text-xs text-codinit-elements-textTertiary/80 hidden sm:flex items-center gap-1">
              <span>Press</span>
              <kbd className="px-2 py-0.5 rounded-md bg-codinit-elements-background-depth-2/80 border border-codinit-elements-borderColor/30 text-xs font-medium">
                Shift
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-0.5 rounded-md bg-codinit-elements-background-depth-2/80 border border-codinit-elements-borderColor/30 text-xs font-medium">
                ↵
              </kbd>
              <span>for new line</span>
            </div>
          ) : null}
          <SupabaseConnection />
          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>
    </div>
  );
};
