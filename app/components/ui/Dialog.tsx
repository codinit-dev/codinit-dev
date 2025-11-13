import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, type Variants } from 'framer-motion';
import React, { memo, type ReactNode, useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { FixedSizeList } from 'react-window';
import { Checkbox } from './Checkbox';
import { Label } from './Label';

export { Close as DialogClose, Root as DialogRoot } from '@radix-ui/react-dialog';

interface DialogButtonProps {
  type: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

export const DialogButton = memo(({ type, children, onClick, disabled }: DialogButtonProps) => {
  return (
    <button
      className={classNames(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
        type === 'primary'
          ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600'
          : type === 'secondary'
            ? 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            : 'bg-transparent text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
});

export const DialogTitle = memo(({ className, children, ...props }: RadixDialog.DialogTitleProps) => {
  return (
    <RadixDialog.Title
      className={classNames('text-lg font-medium text-codinit-elements-textPrimary flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </RadixDialog.Title>
  );
});

export const DialogDescription = memo(({ className, children, ...props }: RadixDialog.DialogDescriptionProps) => {
  return (
    <RadixDialog.Description
      className={classNames('text-sm text-codinit-elements-textSecondary mt-1', className)}
      {...props}
    >
      {children}
    </RadixDialog.Description>
  );
});

const transition = {
  duration: 0.15,
  ease: cubicEasingFn,
};

export const dialogBackdropVariants = {
  closed: {
    opacity: 0,
    transition,
  },
  open: {
    opacity: 1,
    transition,
  },
} satisfies Variants;

export const dialogVariants = {
  closed: {
    x: '-50%',
    y: '-40%',
    scale: 0.96,
    opacity: 0,
    transition,
  },
  open: {
    x: '-50%',
    y: '-50%',
    scale: 1,
    opacity: 1,
    transition,
  },
} satisfies Variants;

interface DialogProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  onBackdrop?: () => void;
}

export const Dialog = memo(({ children, className, showCloseButton = true, onClose, onBackdrop }: DialogProps) => {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay asChild>
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
          initial="closed"
          animate="open"
          exit="closed"
          variants={dialogBackdropVariants}
          onClick={onBackdrop}
        />
      </RadixDialog.Overlay>
      <RadixDialog.Content asChild>
        <motion.div
          className={classNames(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-[9999] w-[520px] focus:outline-none',
            className,
          )}
          initial="closed"
          animate="open"
          exit="closed"
          variants={dialogVariants}
        >
          <div className="flex flex-col">
            {children}
            {showCloseButton && (
              <RadixDialog.Close asChild onClick={onClose}>
                <IconButton
                  icon="i-ph:x"
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                />
              </RadixDialog.Close>
            )}
          </div>
        </motion.div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;

  /**
   * Callback when the confirm button is clicked
   */
  onConfirm: () => void;

  /**
   * The title of the dialog
   */
  title: string;

  /**
   * The description of the dialog
   */
  description: string;

  /**
   * The text for the confirm button
   */
  confirmLabel?: string;

  /**
   * The text for the cancel button
   */
  cancelLabel?: string;

  /**
   * The variant of the confirm button
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Whether the confirm button is in a loading state
   */
  isLoading?: boolean;
}

/**
 * A reusable confirmation dialog component that uses the Dialog component
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog showCloseButton={false}>
        <div className="p-6 relative z-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mb-4">{description}</DialogDescription>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={isLoading}
              className={
                variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }
            >
              {isLoading ? (
                <>
                  <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                  {confirmLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}

/**
 * Type for selection item in SelectionDialog
 */
type SelectionItem = {
  id: string;
  label: string;
  description?: string;
};

/**
 * Props for the SelectionDialog component
 */
export interface SelectionDialogProps {
  /**
   * The title of the dialog
   */
  title: string;

  /**
   * The items to select from
   */
  items: SelectionItem[];

  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;

  /**
   * Callback when the confirm button is clicked with selected item IDs
   */
  onConfirm: (selectedIds: string[]) => void;

  /**
   * The text for the confirm button
   */
  confirmLabel?: string;

  /**
   * The maximum height of the selection list
   */
  maxHeight?: string;
}

/**
 * A reusable selection dialog component that uses the Dialog component
 */
export function SelectionDialog({
  title,
  items,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  maxHeight = '60vh',
}: SelectionDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset selected items when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  const handleToggleItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(items.map((item) => item.id));
      setSelectAll(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedItems);
    onClose();
  };

  // Calculate the height for the virtualized list
  const listHeight = Math.min(
    items.length * 60,
    parseInt(maxHeight.replace('vh', '')) * window.innerHeight * 0.01 - 40,
  );

  // Render each item in the virtualized list
  const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    return (
      <div
        key={item.id}
        className={classNames(
          'flex items-start space-x-3 p-2 rounded-md transition-colors',
          selectedItems.includes(item.id) ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
        )}
        style={{
          ...style,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Checkbox
          id={`item-${item.id}`}
          checked={selectedItems.includes(item.id)}
          onCheckedChange={() => handleToggleItem(item.id)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor={`item-${item.id}`} className="text-sm font-medium cursor-pointer">
            {item.label}
          </Label>
          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog showCloseButton={false}>
        <div className="p-6 relative z-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-2 mb-4">
            Select the items you want to include and click{' '}
            <span className="text-primary font-medium">{confirmLabel}</span>.
          </DialogDescription>

          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedItems.length} of {items.length} selected
              </span>
              <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs h-8 px-2">
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div
              className="pr-2 border rounded-md border-border bg-muted/50"
              style={{
                maxHeight,
              }}
            >
              {items.length > 0 ? (
                <FixedSizeList
                  height={listHeight}
                  width="100%"
                  itemCount={items.length}
                  itemSize={60}
                  className="scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/30"
                >
                  {ItemRenderer}
                </FixedSizeList>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">No items to display</div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
