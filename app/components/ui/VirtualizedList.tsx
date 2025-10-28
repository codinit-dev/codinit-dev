import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { classNames } from '~/utils/classNames';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const itemData = useMemo(
    () => ({
      items,
      renderItem,
    }),
    [items, renderItem],
  );

  const ItemRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const { items: listItems, renderItem: renderFn } = itemData;
      const item = listItems[index];

      return <div style={style}>{renderFn(item, index)}</div>;
    },
    [itemData],
  );

  if (items.length === 0) {
    return (
      <div className={classNames('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        <div className="text-bolt-elements-textTertiary">No items to display</div>
      </div>
    );
  }

  return (
    <List
      height={containerHeight}
      width="100%"
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscanCount}
      className={className}
    >
      {ItemRenderer}
    </List>
  );
}

// Lazy loading hook for components
export function useLazyLoad<T extends HTMLElement>(ref: React.RefObject<T>, callback: () => void, threshold = 0.1) {
  React.useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        });
      },
      { threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, callback, threshold]);
}

// Lazy loaded component wrapper
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ children, fallback, className }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useLazyLoad(ref, () => setIsVisible(true));

  return (
    <div ref={ref} className={className}>
      {isVisible
        ? children
        : fallback || (
            <div className="flex items-center justify-center p-4">
              <div className="i-svg-spinners:3-dots-fade text-bolt-elements-textSecondary" />
            </div>
          )}
    </div>
  );
};
