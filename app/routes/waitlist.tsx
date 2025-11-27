import { Waitlist } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Dialog } from '~/components/ui/Dialog';

export default function WaitlistPage() {
  const navigate = useNavigate();

  return (
    <RadixDialog.Root open={true} onOpenChange={() => navigate('/')}>
      <Dialog showCloseButton={true} onClose={() => navigate('/')}>
        <div className="p-6 relative z-10">
          <Waitlist afterJoinWaitlistUrl="/" />
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
