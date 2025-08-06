import React from 'react';
import type { Metadata } from 'next';
import { inter, satoshi } from '@/styles/fonts';
import './globals.css';
import Navbar from '@/components/navbar';
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';
import { AgentsContextProvider } from '@/context/AgentsContext/AgentsContext';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import { InboxContextProvider } from '@/context/InboxContext/InboxContext';
// const inter = Inter({ subsets: ['latin'] });
import PaymentModal from '@/components/modals/payment-modal';

export const metadata: Metadata = {
  title: 'Bubblez',
  description: 'AI assistants to take your business to next level',
  icons: {
    icon: [{ url: '/logo.png', href: '/logo.png' }],
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="en"
    className={cn(satoshi.variable, inter.variable)}
    suppressHydrationWarning
  >
    <body className={inter.className}>
      {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="jotion-theme"
        > */}
      <div key="1" className="bg-white min-h-screen">
        <ClerkProvider>
          <AgentsContextProvider>
            <InboxContextProvider>
              <Toaster position="bottom-right" />

              {children}
              <PaymentModal />
            </InboxContextProvider>
          </AgentsContextProvider>
        </ClerkProvider>
      </div>
      {/* </ThemeProvider> */}
    </body>
  </html>
);
export default RootLayout;
