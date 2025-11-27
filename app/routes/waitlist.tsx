import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Dialog, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';

export default function WaitlistPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to join waitlist:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <RadixDialog.Root open={true} onOpenChange={() => navigate('/')}>
      <Dialog showCloseButton={true} onClose={() => navigate('/')}>
        <div className="p-6 relative z-10">
          {!submitted ? (
            <>
              <DialogTitle>Join the Waitlist</DialogTitle>
              <DialogDescription className="mb-6">
                Be the first to know when we launch new features and updates.
              </DialogDescription>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-codinit-elements-textPrimary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-codinit-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => navigate('/')} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                        Joining...
                      </>
                    ) : (
                      'Join Waitlist'
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="i-ph-check-circle-fill text-green-500 text-5xl mb-4 mx-auto" />
              <DialogTitle>You're on the list!</DialogTitle>
              <DialogDescription className="mt-2">
                We'll notify you when we have updates.
              </DialogDescription>
            </div>
          )}
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
