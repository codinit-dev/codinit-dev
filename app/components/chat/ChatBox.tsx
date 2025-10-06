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
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from './MCPTools';

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
  return (
    <div
      className={classNames(
        'relative backdrop-blur-xl bg-codinit-elements-background-depth-1/95 p-4 rounded-2xl border border-codinit-elements-borderColor/50 w-full max-w-chat mx-auto z-prompt',
        'shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
        'transition-all duration-300 ease-in-out',
        'hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)]',
        'hover:border-codinit-elements-borderColorActive/70',
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
            <stop offset="0%" stopColor="#8a5fff" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#8a5fff" stopOpacity="90%"></stop>
            <stop offset="50%" stopColor="#8a5fff" stopOpacity="90%"></stop>
            <stop offset="100%" stopColor="#8a5fff" stopOpacity="0%"></stop>
          </linearGradient>
          <linearGradient id="shine-gradient">
            <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#ffffff" stopOpacity="90%"></stop>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="90%"></stop>
            <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
          </linearGradient>
        </defs>
        <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
        <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
      </svg>
      <div className="relative z-10 mb-3 overflow-visible">
        <ClientOnly>
          {() => (
            <div className={classNames(props.isModelSettingsCollapsed ? 'hidden' : '', 'overflow-visible')}>
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
        <div className="flex gap-2 items-center justify-between rounded-xl border border-codinit-elements-borderColor/60 bg-gradient-to-r from-accent-500/10 to-accent-600/10 text-codinit-elements-textPrimary py-2 px-3.5 mb-3 font-medium text-xs backdrop-blur-sm">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-accent-500 rounded-lg px-2 py-1 text-white font-semibold shadow-sm">
              {props?.selectedElement?.tagName}
            </code>
            <span className="text-codinit-elements-textSecondary">selected for inspection</span>
          </div>
          <button
            className="bg-transparent text-accent-500 hover:text-accent-600 transition-colors font-medium"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Clear
          </button>
        </div>
      )}
      <div
        className={classNames(
          'relative shadow-lg border border-codinit-elements-borderColor/60 backdrop-blur-sm rounded-xl',
          'bg-codinit-elements-background-depth-2/50',
          'transition-all duration-300',
          'hover:border-codinit-elements-borderColorActive/50 hover:shadow-xl',
          'focus-within:border-accent-500/50 focus-within:shadow-[0_0_0_3px_rgba(138,95,255,0.1)]',
        )}
      >
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-5 pt-4 pr-16 pb-2 outline-none resize-none text-codinit-elements-textPrimary placeholder-codinit-elements-textTertiary/70 bg-transparent text-sm',
            'transition-all duration-300',
            'leading-relaxed',
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
            props.chatMode === 'build' ? 'How can we help you ship today?' : 'What would you like to discuss?'
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
        <div className="flex justify-between items-center text-sm px-4 pb-3 pt-2 border-t border-codinit-elements-borderColor/30 mt-1">
          <div className="flex gap-1.5 items-center">
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
            <McpTools />
            <IconButton
              title="Upload file"
              className="transition-all hover:scale-110 hover:bg-codinit-elements-item-backgroundAccent/50"
              onClick={() => props.handleFileUpload()}
            >
              <div className="i-ph:paperclip text-xl"></div>
            </IconButton>
            <IconButton
              title="Enhance prompt"
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames(
                'transition-all hover:scale-110',
                props.enhancingPrompt ? 'opacity-100' : 'hover:bg-accent-500/20',
              )}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success('Prompt enhanced!');
              }}
            >
              {props.enhancingPrompt ? (
                <div className="i-svg-spinners:90-ring-with-bg text-codinit-elements-loader-progress text-xl animate-spin"></div>
              ) : (
                <div className="i-codinit:stars text-xl text-accent-500"></div>
              )}
            </IconButton>

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />
            {props.chatStarted && (
              <IconButton
                title="Discuss"
                className={classNames(
                  'transition-all flex items-center gap-1.5 px-2 py-1.5 rounded-lg',
                  props.chatMode === 'discuss'
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 !text-white shadow-md shadow-accent-500/30'
                    : 'bg-codinit-elements-item-backgroundDefault text-codinit-elements-item-contentDefault hover:bg-codinit-elements-item-backgroundAccent/30',
                )}
                onClick={() => {
                  props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                }}
              >
                <div className="i-ph:chats text-lg" />
                {props.chatMode === 'discuss' ? <span className="text-xs font-medium">Discuss</span> : <span />}
              </IconButton>
            )}
            <IconButton
              title="Model Settings"
              className={classNames(
                'transition-all flex items-center gap-1.5 px-2 py-1.5 rounded-lg',
                props.isModelSettingsCollapsed
                  ? 'bg-codinit-elements-item-backgroundAccent text-codinit-elements-item-contentAccent hover:bg-codinit-elements-item-backgroundAccent/80'
                  : 'bg-codinit-elements-item-backgroundDefault text-codinit-elements-item-contentDefault hover:bg-codinit-elements-item-backgroundAccent/30',
              )}
              onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
              disabled={!props.providerList || props.providerList.length === 0}
            >
              <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'} text-base`} />
              {props.isModelSettingsCollapsed ? (
                <span className="text-xs font-medium max-w-[120px] truncate">{props.model}</span>
              ) : (
                <span />
              )}
            </IconButton>
          </div>
          {props.input.length > 3 ? (
            <div className="text-xs text-codinit-elements-textTertiary/80 flex items-center gap-1">
              <kbd className="kdb px-2 py-1 rounded-md bg-codinit-elements-background-depth-3/80 border border-codinit-elements-borderColor/40 font-medium shadow-sm">
                Shift
              </kbd>
              <span>+</span>
              <kbd className="kdb px-2 py-1 rounded-md bg-codinit-elements-background-depth-3/80 border border-codinit-elements-borderColor/40 font-medium shadow-sm">
                Return
              </kbd>
              <span className="ml-1">for new line</span>
            </div>
          ) : null}
          <SupabaseConnection />
          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>
    </div>
  );
};
