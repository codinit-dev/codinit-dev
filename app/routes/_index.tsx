import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { ElectronTitleBar } from '~/components/ui/ElectronTitleBar';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { LiveActionAlert } from '~/components/chat/LiveActionAlert';
import { DiffApprovalDialog } from '~/components/workbench/DiffApprovalDialog';

export const meta: MetaFunction = () => {
  return [
    { title: 'CodinIT.dev' },
    { name: 'description', content: 'Talk with CodinIT, an AI assistant from CodinIT.dev' },
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-codinit-elements-background-depth-2">
      <ClientOnly>{() => <ElectronTitleBar />}</ClientOnly>
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      <ClientOnly>{() => <LiveActionAlert />}</ClientOnly>
      <ClientOnly>{() => <DiffApprovalDialog />}</ClientOnly>
    </div>
  );
}
