import { useStore } from '@nanostores/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
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
import { ClerkApp } from '@clerk/remix';

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

export const loader = async (args: LoaderFunctionArgs) => {
  const { rootAuthLoader } = await import('@clerk/remix/ssr.server');
  return rootAuthLoader(args);
};

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

function AppLayout({ children }: { children: React.ReactNode }) {
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

export function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { logStore } from './lib/stores/logs';
import { initCookieBridge } from './lib/electronCookieBridge';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/remix';

function App() {
  useEffect(() => {
    initCookieBridge();

    logStore.logSystem('Application initialized', {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <AppLayout>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ backgroundColor: 'var(--codinit-elements-bg-depth-1)' }}
        >
          <div className="max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <img src="/logo-dark.png" alt="Codinit" className="w-32 mx-auto mb-6 dark:hidden" />
              <img src="/logo-light.png" alt="Codinit" className="w-32 mx-auto mb-6 hidden dark:block" />
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--codinit-elements-textPrimary)' }}>
                Welcome to CodinIT
              </h1>
              <p className="text-lg" style={{ color: 'var(--codinit-elements-textSecondary)' }}>
                Build full-stack apps with AI
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <SignUpButton mode="modal">
                <button
                  className="w-full px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: 'var(--codinit-elements-button-primary-background)',
                    color: 'var(--codinit-elements-button-primary-text)',
                  }}
                >
                  Sign Up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button
                  className="w-full px-4 py-2 rounded-lg font-medium border"
                  style={{
                    borderColor: 'var(--codinit-elements-borderColor)',
                    color: 'var(--codinit-elements-textPrimary)',
                  }}
                >
                  Sign In
                </button>
              </SignInButton>
            </div>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--codinit-elements-textSecondary)' }}>
              By signing up, you agree to our{' '}
              <a
                href="https://codinit.dev/terms"
                className="underline hover:no-underline"
                style={{ color: 'var(--codinit-elements-button-primary-background)' }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://codinit.dev/privacy"
                className="underline hover:no-underline"
                style={{ color: 'var(--codinit-elements-button-primary-background)' }}
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </SignedOut>
    </AppLayout>
  );
}

export default ClerkApp(App, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
});
