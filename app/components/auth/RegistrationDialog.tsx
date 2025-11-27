import React, { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';
import { Label } from '~/components/ui/Label';
import { validateRegistrationForm } from '~/utils/validation';
import { userService } from '~/lib/api/userService';
import { openDatabase, saveUser, type LocalUser } from '~/lib/persistence/db';
import { setUserRegistered, setSyncing } from '~/lib/stores/user';
import { createScopedLogger } from '~/utils/logger';
import { logStore } from '~/lib/stores/logs';

const logger = createScopedLogger('RegistrationDialog');

interface RegistrationDialogProps {
  onRegistrationComplete: () => void;
}

export function RegistrationDialog({ onRegistrationComplete }: RegistrationDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateRegistrationForm(fullName, email);

    if (!validation.isValid) {
      setErrors(validation.errors);

      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSyncing(true);

    try {
      // Generate user ID
      const userId = crypto.randomUUID();

      // Prepare registration data
      const registrationData = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        appVersion: process.env.npm_package_version || '1.0.0',
        platform: navigator.platform,
        emailOptIn,
      };

      // Attempt web registration
      const response = await userService.registerUser(registrationData);

      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      // Handle different response types
      if (response.type === 'signin') {
        // Existing verified user - sign in
        const localUser: LocalUser = {
          id: response.userId!,
          fullName: registrationData.fullName,
          email: registrationData.email,
          registrationDate: new Date().toISOString(),
          isSyncedWithServer: true,
          lastSyncAttempt: new Date().toISOString(),
          appVersion: registrationData.appVersion,
          platform: registrationData.platform,
        };

        // Save to local database
        const db = await openDatabase();

        if (db) {
          await saveUser(db, localUser);
        }

        // Update user store
        setUserRegistered(localUser);
        setSyncing(false);

        logStore.logSystem('User signed in', {
          userId: localUser.id,
          email: localUser.email,
        });

        onRegistrationComplete();

        return;
      }

      if (response.type === 'verification_resent') {
        // Existing unverified user - verification resent
        setSubmitError(
          'A verification email has been sent to your email address. Please check your inbox and click the verification link.',
        );
        setSyncing(false);

        return;
      }

      // New registration - verification email sent
      setSubmitError(null);
      setSyncing(false);

      // Show success message instead of error
      setSubmitError(response.message || 'Registration successful! Please check your email to verify your account.');

      // Don't call onRegistrationComplete() yet - user needs to verify email first
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setSubmitError(errorMessage);
      setSyncing(false);

      logger.error('Registration failed', { error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: 'fullName' | 'email', value: string) => {
    if (field === 'fullName') {
      setFullName(value);
    } else {
      setEmail(value);
    }

    // Clear field-specific errors on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <RadixDialog.Root open={true} onOpenChange={() => undefined}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="fixed inset-0 z-[9999]"
          style={{ backgroundColor: 'var(--codinit-elements-bg-depth-1)' }}
        />
        <RadixDialog.Content className="fixed inset-0 z-[9999] focus:outline-none">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid h-full min-h-screen lg:grid-cols-2">
              <div className="flex justify-center px-4 py-20">
                <div className="relative flex w-full max-w-[350px] flex-col items-start justify-center">
                  <a className="mb-6 transition-opacity" href="/">
                    <img src="/logo-dark.png" alt="Codinit" className="w-[120px] inline-block dark:hidden" />
                    <img src="/logo-light.png" alt="Codinit" className="w-[120px] inline-block hidden dark:block" />
                  </a>

                  <div className="min-h-[450px] w-full">
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-medium" style={{ color: 'var(--codinit-elements-textPrimary)' }}>
                          Create account
                        </h1>
                      </div>

                      <form onSubmit={handleSubmit} className="grid gap-4">
                        {submitError && (
                          <div
                            className="border rounded-lg p-3"
                            style={{
                              backgroundColor: 'var(--codinit-elements-button-danger-background)',
                              borderColor: 'var(--codinit-elements-button-danger-text)',
                            }}
                          >
                            <p className="text-sm" style={{ color: 'var(--codinit-elements-button-danger-text)' }}>
                              {submitError}
                            </p>
                          </div>
                        )}

                        <div className="grid gap-4">
                          <div className="grid">
                            <p
                              className="mb-1 text-sm font-medium"
                              style={{ color: 'var(--codinit-elements-textPrimary)' }}
                            >
                              Full Name
                            </p>
                            <Input
                              id="fullName"
                              type="text"
                              value={fullName}
                              onChange={(e) => handleInputChange('fullName', e.target.value)}
                              placeholder="Full Name"
                              className={errors.fullName ? 'border-red-500' : ''}
                              disabled={isSubmitting}
                              required
                            />
                            {errors.fullName && (
                              <p className="text-xs mt-1.5" style={{ color: 'var(--codinit-elements-icon-error)' }}>
                                {errors.fullName}
                              </p>
                            )}
                          </div>

                          <div className="grid">
                            <p
                              className="mb-1 text-sm font-medium"
                              style={{ color: 'var(--codinit-elements-textPrimary)' }}
                            >
                              Email
                            </p>
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="Email"
                              autoCapitalize="none"
                              autoComplete="email"
                              autoCorrect="off"
                              className={errors.email ? 'border-red-500' : ''}
                              disabled={isSubmitting}
                              required
                            />
                            {errors.email && (
                              <p className="text-xs mt-1.5" style={{ color: 'var(--codinit-elements-icon-error)' }}>
                                {errors.email}
                              </p>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            <Checkbox
                              id="emailOptIn"
                              checked={emailOptIn}
                              onCheckedChange={(checked) => setEmailOptIn(checked as boolean)}
                              disabled={isSubmitting}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor="emailOptIn"
                              className="text-xs leading-relaxed"
                              style={{ color: 'var(--codinit-elements-textSecondary)' }}
                            >
                              I agree to receive email updates about new features and improvements.
                            </Label>
                          </div>

                          <div className="flex flex-col gap-3">
                            <Button
                              type="submit"
                              className="w-full"
                              style={{
                                backgroundColor: 'var(--codinit-elements-button-primary-background)',
                                color: 'var(--codinit-elements-button-primary-text)',
                              }}
                              disabled={isSubmitting || !fullName.trim() || !email.trim()}
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                                  Creating Account...
                                </>
                              ) : (
                                'Continue'
                              )}
                            </Button>

                            <div className="text-center text-sm">
                              <span style={{ color: 'var(--codinit-elements-textSecondary)' }}>
                                By registering you accept the{' '}
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
                              </span>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky top-0 hidden h-screen p-4 lg:block">
                <div
                  className="relative h-full w-full overflow-hidden rounded-xl"
                  style={{ backgroundColor: 'var(--codinit-elements-bg-depth-2)' }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div
                      className="flex w-full max-w-md items-center gap-4 rounded-2xl px-6 py-6 shadow-xl"
                      style={{
                        backgroundColor: 'var(--codinit-elements-bg-depth-3)',
                        borderColor: 'var(--codinit-elements-borderColor)',
                        borderWidth: '1px',
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-lg font-medium" style={{ color: 'var(--codinit-elements-textPrimary)' }}>
                          Build full-stack apps with AI
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--codinit-elements-textSecondary)' }}>
                          Start creating with Codinit today
                        </p>
                      </div>
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: 'var(--codinit-elements-button-primary-background)',
                          color: 'var(--codinit-elements-button-primary-text)',
                        }}
                      >
                        <div className="i-ph:rocket-launch-bold w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
