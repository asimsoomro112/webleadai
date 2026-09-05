import type { Metadata } from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/authContext';

export const metadata: Metadata = {
  title: 'WebLead AI — Autonomous Freelance Web-Dev Client Acquisition',
  description: 'AI-powered autonomous client acquisition engine for freelance web developers. Real business discovery, website audits, scoring, multi-channel outreach, and CRM pipeline.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
