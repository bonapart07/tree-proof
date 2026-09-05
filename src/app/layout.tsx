import type { Metadata, Viewport } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#060a08',
};

export const metadata: Metadata = {
  title: 'GreenProof — A Living Digital Leaf | AI-Powered Tree Verification & Rewards',
  description:
    'Proving tree plantation survival through continuous AI computer vision, satellite telemetry, and environmental rewards.',
  keywords: [
    'Tree plantation verification',
    'AI climate tech',
    'Environmental rewards',
    'Living digital leaf',
    'Carbon credit proof',
    'Smart India Hackathon',
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} dark antialiased`}>
      <body className="min-h-screen bg-[#060a08] text-[#f1f5f2] selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
