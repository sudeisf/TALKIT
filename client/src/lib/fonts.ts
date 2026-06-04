import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const fontVariables = [
  plusJakartaSans.variable,
  geistMono.variable,
].join(' ');

export const fontClassName = {
  sans: plusJakartaSans.className,
  mono: geistMono.className,
};
