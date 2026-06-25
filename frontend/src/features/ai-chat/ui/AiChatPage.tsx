import { useState } from 'react';
import { Outlet } from '@tanstack/react-router';

import { AiChatSidebar } from './AiChatSidebar';

export function AiChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-full min-h-0">
      <AiChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
