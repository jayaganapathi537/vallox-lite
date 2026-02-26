import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import SiteShell from '@/components/layout/SiteShell';

export const metadata: Metadata = {
  title: 'Vallox - Proof of Work Talent Platform',
  description:
    'A full stack three-panel platform connecting students, organizations, and admins through proof-of-work profiles and skill-first opportunity matching.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
