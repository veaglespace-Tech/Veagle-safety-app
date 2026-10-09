import './globals.css';
import { Providers } from './providers.js';

export const metadata = {
  title: 'Sakhi Suraksha SOS | Personal & Women Safety Platform',
  description:
    'Instant 3-Second Emergency SOS Broadcasting, Real-Time GPS Tracking, and 24/7 Command Dispatch Platform for Women & Girls.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#FFF0F3',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-[#FFF0F3] text-tichi-text antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
