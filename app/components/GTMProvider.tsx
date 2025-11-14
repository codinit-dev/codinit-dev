import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function GTMProvider() {
  useEffect(() => {
    // Load GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=GTM-5M9R7HFN`;
    document.head.appendChild(script);

    // Load Google Analytics script
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=G-8NNCCEN53X`;
    document.head.appendChild(gaScript);

    // Initialize GTM data layer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });

    // Initialize Google Analytics
    window.gtag =
      window.gtag ||
      function (...args: any[]) {
        window.dataLayer.push(args);
      };

    window.gtag('js', new Date());

    window.gtag('config', 'G-8NNCCEN53X');

    // Cleanup function
    return () => {
      const gtmScript = document.querySelector('script[src*="googletagmanager.com/gtm.js?id=GTM-5M9R7HFN"]');

      if (gtmScript) {
        document.head.removeChild(gtmScript);
      }

      const gaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-8NNCCEN53X"]');

      if (gaScript) {
        document.head.removeChild(gaScript);
      }
    };
  }, []);

  return null;
}
