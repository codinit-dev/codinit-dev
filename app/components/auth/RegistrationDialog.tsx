import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogRoot } from '~/components/ui/Dialog';
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
    <DialogRoot open={true} onOpenChange={() => {}}>
      <Dialog showCloseButton={false}>
        <div className="p-6 max-w-md mx-auto">
          <DialogTitle className="text-center mb-2">Welcome to Codinit!</DialogTitle>
          <DialogDescription className="text-center mb-6">
            Registration is required to use the application. Your information will be stored securely for updates and
            support.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="block text-sm font-medium mb-1">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? 'border-red-500' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="emailOptIn"
                checked={emailOptIn}
                onCheckedChange={(checked) => setEmailOptIn(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="emailOptIn" className="text-sm leading-relaxed">
                I agree to receive email updates about new features, improvements, and important announcements.
              </Label>
            </div>

            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-700 dark:text-red-400 text-sm">{submitError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !fullName.trim() || !email.trim()}>
              {isSubmitting ? (
                <>
                  <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
