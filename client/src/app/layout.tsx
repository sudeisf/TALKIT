// app/layout.tsx (server component, default layout entrypoint)
import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/providers/ReduxProvider';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from 'sonner';
import GoogleProvider from '@/providers/GoogleProvider';
import PrelineScriptWrapper from '@/components/PrelineScriptWrapper';

export const metadata: Metadata = {
  title: 'TALKIT',
  description: 'A platform to connect learners and helpers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <ReduxProvider>
          <QueryProvider>
            <GoogleProvider>
              {children}
              <PrelineScriptWrapper />
              <Toaster />
            </GoogleProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
