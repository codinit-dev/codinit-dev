import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface PanelHeaderButtonProps {
  className?: string;
  disabledClassName?: string;
  disabled?: boolean;
  children: string | JSX.Element | Array<JSX.Element | string>;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const PanelHeaderButton = memo(
  ({ className, disabledClassName, disabled = false, children, onClick }: PanelHeaderButtonProps) => {
    return (
      <button
        className={classNames(
          'flex items-center shrink-0 gap-1.5 px-2 py-1 rounded-md text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed',

          // Touch-friendly sizing
          'min-h-[var(--touch-target-min)] touch-manipulation',

          // Better focus indicator
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2',
          {
            [classNames('opacity-30', disabledClassName)]: disabled,
          },
          className,
        )}
        disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            return;
          }

          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  },
);
