import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/contexts/i18n-provider';
import { ThemeProvider } from '@/contexts/theme-provider';
import { Web3Provider } from '@/contexts/web3-provider';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import { headers } from 'next/headers';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Onvo',
  description: 'B2B invoicing powered by World ID',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieHeader = (await headers()).get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-dvh overflow-x-hidden bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          enableSystem
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <I18nProvider>
            <Web3Provider cookies={cookieHeader}>
              {children}
              <Sonner duration={4000} />
              <Toaster />
            </Web3Provider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
