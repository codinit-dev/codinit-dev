import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from '@remix-run/react';
import { Loader2 } from 'lucide-react';
import { userService } from '~/lib/api/userService';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check the link and try again.');

      return;
    }

    const verifyToken = async () => {
      const response = await userService.verifyEmail(token);

      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully! Redirecting...');
        setTimeout(() => navigate('/?message=email_verified'), 3000);
      } else {
        setStatus('error');
        setMessage(response.error || 'Verification failed. Please try again.');
      }
    };

    verifyToken();
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md text-center">
        {status === 'verifying' && (
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="animate-spin mr-3" size={24} />
            <h1 className="text-2xl font-semibold">Verifying Email</h1>
          </div>
        )}
        {status === 'success' && (
          <h1 className="text-2xl font-semibold text-green-600 dark:text-green-400">Success!</h1>
        )}
        {status === 'error' && <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">Error</h1>}
        <p className="mt-4 text-lg">{message}</p>
      </div>
    </div>
  );
}
