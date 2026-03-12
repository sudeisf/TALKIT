import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppNavbar } from '@/components/learner/AppNavbar';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex h-dvh w-full flex-col overflow-hidden">
          <AppNavbar />
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </main>
      </SidebarProvider>
    </NotificationProvider>
  );
}
