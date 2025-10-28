import { useState, useEffect } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

const useViewport = (threshold = 1024): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const orientation = height > width ? 'portrait' : 'landscape';

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      orientation,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const orientation = height > width ? 'portrait' : 'landscape';

      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        orientation,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [threshold]);

  return viewport;
};

export default useViewport;
