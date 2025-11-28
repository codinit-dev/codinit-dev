import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';
import { BuiltWithCodinitBadge } from './components/ui/BuiltWithCodinitBadge';
import { ToastContainer } from 'react-toastify';
import { AmplitudeProvider } from './components/AmplitudeProvider';
import { GTMProvider } from './components/GTMProvider';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/icon-light.png',
    type: 'image/png',
    media: '(prefers-color-scheme: light)',
  },
  {
    rel: 'icon',
    href: '/icon-dark.png',
    type: 'image/png',
    media: '(prefers-color-scheme: dark)',
  },
  {
    rel: 'icon',
    href: '/icon-dark.png',
    type: 'image/png',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('codinit_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
    updateFavicon(theme);
  }

  function updateFavicon(theme) {
    const iconLink = document.querySelector('link[rel="icon"]:not([media])');
    if (iconLink) {
      iconLink.href = theme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
    }
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);

    const iconLink = document.querySelector('link[rel="icon"]:not([media])') as HTMLLinkElement;

    if (iconLink) {
      iconLink.href = theme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
    }
  }, [theme]);

  return (
    <>
      <ClientOnly>{() => <AmplitudeProvider />}</ClientOnly>
      <ClientOnly>{() => <GTMProvider />}</ClientOnly>
      <ClientOnly>{() => <DndProvider backend={HTML5Backend}>{children}</DndProvider>}</ClientOnly>
      <ClientOnly>{() => <BuiltWithCodinitBadge />}</ClientOnly>
      <ClientOnly>{() => <ToastContainer />}</ClientOnly>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';
import { initCookieBridge } from './lib/electronCookieBridge';

export default function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    // Initialize Electron cookie bridge if running in Electron
    initCookieBridge();

    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
