import { SignIn } from '@clerk/remix';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-codinit-elements-background-depth-1">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-white dark:bg-gray-900 shadow-xl',
          },
        }}
      />
    </div>
  );
}
