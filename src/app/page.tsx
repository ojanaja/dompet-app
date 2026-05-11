import { ChatPanel } from '@/components/chat/ChatPanel';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <div className="w-full max-w-md h-full">
        <ChatPanel />
      </div>
    </div>
  );
}
