'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export default function DefaultInterfaceForChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        <div className="p-6 rounded-full shadow-none">
          <MessageCircle className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-primary">
          Welcome to your chat space
        </h1>

        <p className="text-gray-500 text-md">
          Choose a conversation from the sidebar to start chatting. If you don’t
          see any, create a new one and start connecting
        </p>

        <Button
          variant={'outline'}
          className="px-4 py-2 mt-2 rounded-sm text-primary border-1 shadow-2xs  transition-all "
        >
          Ask and Start Session
        </Button>
      </div>
    </div>
  );
}
