// Platform detection utilities for adaptive UI
export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isElectron: boolean;
  isWeb: boolean;
  userAgent: string;
}

export const detectPlatform = (): PlatformInfo => {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isDesktop: true,
      isElectron: false,
      isWeb: false,
      userAgent: '',
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Detect Electron
  const isElectron = userAgent.includes('electron');

  // Detect mobile devices
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Detect iOS
  const isIOS =
    /ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+

  // Detect Android
  const isAndroid = /android/.test(userAgent);

  // Desktop is anything that's not mobile
  const isDesktop = !isMobile;

  // Web is anything that's not Electron
  const isWeb = !isElectron;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop,
    isElectron,
    isWeb,
    userAgent,
  };
};

// Hook for using platform detection in React components
export const usePlatform = () => {
  return detectPlatform();
};

// Helper functions for platform-specific features
export const getPlatformSpecificFeatures = () => {
  const platform = detectPlatform();

  return {
    supportsHapticFeedback: platform.isIOS || platform.isAndroid,
    supportsSpeechRecognition:
      typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    prefersDarkMode: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
    isTouchDevice: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    platform,
  };
};
