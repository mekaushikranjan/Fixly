import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fixly Admin — Campus Civic Operations Console',
  description: 'Super Admin console for Fixly: monitor campus issues, dispatch workers, and manage SLA compliance at LPU.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/fixly-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/fixly-icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
