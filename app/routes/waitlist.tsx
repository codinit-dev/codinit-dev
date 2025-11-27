import { Waitlist } from '@clerk/remix';

export default function WaitlistPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Waitlist afterJoinWaitlistUrl="/" signInUrl="https://accounts.codinit.dev/sign-in" />
    </div>
  );
}
