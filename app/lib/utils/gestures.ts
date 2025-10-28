import { useEffect, useRef } from 'react';
import { detectPlatform } from './platform-detection';

export interface GestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: (x: number, y: number) => void;
  swipeThreshold?: number;
  pinchThreshold?: number;
}

export interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

// Cross-platform gesture recognition hook
export const useGestures = (elementRef: React.RefObject<HTMLElement>, options: GestureOptions = {}) => {
  const platform = detectPlatform();

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
  } = options;

  const touchStartRef = useRef<TouchPoint[]>([]);
  const initialDistanceRef = useRef<number>(0);
  const lastScaleRef = useRef<number>(1);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    let startTime = 0;
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      const touches = Array.from(e.touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
      }));

      touchStartRef.current = touches;
      startTime = Date.now();
      startX = touches[0]?.x || 0;
      startY = touches[0]?.y || 0;

      // Initialize pinch detection
      if (touches.length === 2) {
        const [touch1, touch2] = touches;
        initialDistanceRef.current = Math.sqrt(Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2));
        lastScaleRef.current = 1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      const touches = Array.from(e.touches);

      // Handle pinch gestures
      if (touches.length === 2 && onPinch) {
        const [touch1, touch2] = touches;
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
        );

        if (initialDistanceRef.current > 0) {
          const scale = currentDistance / initialDistanceRef.current;

          if (Math.abs(scale - lastScaleRef.current) > pinchThreshold) {
            onPinch(scale);
            lastScaleRef.current = scale;
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration < 500) {
        // Quick gesture
        const endX = e.changedTouches[0]?.clientX || 0;
        const endY = e.changedTouches[0]?.clientY || 0;

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Determine if it's a swipe or tap
        if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
          // Swipe gesture
          if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (deltaX > 0 && onSwipeRight) {
              onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
              onSwipeLeft();
            }
          } else {
            // Vertical swipe
            if (deltaY > 0 && onSwipeDown) {
              onSwipeDown();
            } else if (deltaY < 0 && onSwipeUp) {
              onSwipeUp();
            }
          }
        } else {
          // Tap gesture
          if (onTap) {
            onTap(endX, endY);
          }
        }
      }

      touchStartRef.current = [];
      initialDistanceRef.current = 0;
      lastScaleRef.current = 1;
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch, onTap, swipeThreshold, pinchThreshold]);

  // Haptic feedback for supported platforms
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (platform.isIOS && 'vibrate' in navigator) {
      // iOS haptic feedback
      switch (type) {
        case 'light':
          navigator.vibrate(50);
          break;
        case 'medium':
          navigator.vibrate(100);
          break;
        case 'heavy':
          navigator.vibrate(200);
          break;
      }
    } else if (platform.isAndroid && 'vibrate' in navigator) {
      // Android vibration
      navigator.vibrate([50, 50, 50]);
    }

    // Return undefined to satisfy eslint
  };

  return {
    triggerHapticFeedback,
    supportsHapticFeedback: platform.isIOS || platform.isAndroid,
  };
};

// Utility function for adding touch-friendly interactions
export const makeTouchFriendly = (element: HTMLElement) => {
  // Prevent zoom on double-tap
  element.style.touchAction = 'pan-x pan-y';

  // Add active state styling
  element.addEventListener('touchstart', () => {
    element.style.transform = 'scale(0.98)';
    element.style.transition = 'transform 0.1s ease';
  });

  element.addEventListener('touchend', () => {
    element.style.transform = 'scale(1)';
  });

  element.addEventListener('touchcancel', () => {
    element.style.transform = 'scale(1)';
  });
};
