import React, { useState } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';
import { Label } from '~/components/ui/Label';
import { validateRegistrationForm } from '~/utils/validation';
import { databaseService } from '~/IPC/databaseService';
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

      // Attempt database registration
      const response = await databaseService.registerUser(registrationData);

      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      // Create local user record
      const localUser: LocalUser = {
        id: response.userId || crypto.randomUUID(),
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

      logStore.logSystem('Registration completed', {
        userId: localUser.id,
        email: localUser.email,
      });

      onRegistrationComplete();
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
    <DialogRoot open={true} onOpenChange={() => undefined}>
      <Dialog showCloseButton={false} className="max-w-[480px]">
        <div className="flex flex-col min-h-[500px]">
          <main className="flex-1 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-codinit-elements-textPrimary mb-3">Welcome to Codinit</h1>
              <p className="text-sm text-codinit-elements-textSecondary leading-relaxed">
                Registration is required to use the application. Your information will be stored securely for updates
                and support.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{submitError}</p>
                </div>
              )}

              <div>
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
                {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName}</p>}
              </div>

              <div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email Address"
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
              </div>

              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="emailOptIn"
                  checked={emailOptIn}
                  onCheckedChange={(checked) => setEmailOptIn(checked as boolean)}
                  disabled={isSubmitting}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="emailOptIn"
                  className="text-xs text-codinit-elements-textSecondary leading-relaxed cursor-pointer"
                >
                  I agree to receive email updates about new features, improvements, and important announcements.
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                disabled={isSubmitting || !fullName.trim() || !email.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </main>

          <footer className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-center text-codinit-elements-textSecondary leading-relaxed">
              By registering you accept the{' '}
              <a href="https://codinit.dev/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms of Service
              </a>{' '}
              and acknowledge our{' '}
              <a href="https://codinit.dev/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </footer>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
