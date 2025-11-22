/* eslint-disable @typescript-eslint/naming-convention */
import { useState } from 'react';
import { motion } from 'framer-motion';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { MCPSidebar } from './components/MCPSidebar';
import { MCPContent } from './components/MCPContent';

type TabType = 'integrations' | 'marketplace' | 'history';

interface MCPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType;
}

export function MCPDialog({ isOpen, onClose, initialTab = 'integrations' }: MCPDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        </RadixDialog.Overlay>

        <div className="fixed inset-0 flex items-center justify-center z-[9999] modern-scrollbar">
          <RadixDialog.Content asChild>
            <motion.div
              className={classNames(
                'w-[90vw] h-[700px] max-w-[1500px] max-h-[85vh]',
                'bg-codinit-elements-background-depth-1 border border-codinit-elements-borderColor rounded-xl shadow-2xl',
                'flex overflow-hidden focus:outline-none',
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Close button */}
              <RadixDialog.Close asChild>
                <button
                  className={classNames(
                    'absolute top-2 right-2 z-[10000] flex items-center justify-center',
                    'w-9 h-9 rounded-lg transition-all duration-200',
                    'bg-transparent text-codinit-elements-textTertiary',
                    'hover:bg-codinit-elements-background-depth-2 hover:text-codinit-elements-textPrimary',
                    'focus:outline-none focus:ring-2 focus:ring-codinit-elements-borderColor',
                  )}
                  aria-label="Close MCP settings"
                >
                  <div className="i-lucide:x w-4 h-4" />
                </button>
              </RadixDialog.Close>

              {/* Sidebar */}
              <MCPSidebar activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Main Content */}
              <MCPContent activeTab={activeTab} />
            </motion.div>
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
