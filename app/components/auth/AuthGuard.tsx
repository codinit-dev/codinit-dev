import React from 'react';
import { useAuth, SignInButton, SignUpButton } from '@insforge/react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="i-ph-spinner-gap-bold animate-spin w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
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
            <SignUpButton />
            <SignInButton />
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
    );
  }

  return <>{children}</>;
}
