import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Authentication',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-tr flex flex-col justify-end-safe items-center from-black via-gray-800 to-primary w-[45%] rounded-lg m-2 p-4">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/svg/logo.svg"
              alt="Talkit logo"
              width={44}
              height={44}
              className="rounded-md brightness-0 invert"
            />
            <h2 className="text-primary-foreground text-4xl font-bold">TalkIt</h2>
          </div>
          <p className="text-primary-foreground text-md mt-1 text-wrap font-sans">
            Connect and chat with friends in real-time. <br />
            Share ideas, laugh together, and stay close —
            <span className="bg-gradient-to-r from-accent to-white rounded-md  bg-clip-text text-transparent">
              wherever you are.
            </span>
          </p>
        </div>
      </div>
      <div className="w-[55%] m-2 bg-card text-card-foreground border border-border rounded-md flex flex-col justify-between">
        <div>{children}</div>
        <div className="flex justify-between py-2 px-4 font-sans font-medium text-md text-muted-foreground">
          <p>2025</p>
          <p>Support</p>
        </div>
      </div>
    </div>
  );
}
