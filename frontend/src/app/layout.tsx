import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter as FontSans } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/theme-provider';
import { I18nProvider } from '@/contexts/i18n-provider';
import { MainNavigation } from '@/components/shared/main-navigation';
import { Web3Provider } from '@/contexts/web3-provider';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'The Ballot Project',
  description: 'Ballot dApp dashboard',
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
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <Web3Provider cookies={cookieHeader}>
              <MainNavigation>{children}</MainNavigation>
              <Sonner
                toastOptions={{
                  classNames: {
                    info: 'dark:bg-gray-700 dark:text-white bg-gray-200',
                    error: 'dark:bg-red-700 dark:text-white bg-red-500',
                    success: 'dark:bg-green-700 dark:text-white bg-green-400',
                  },
                  duration: 4000,
                }}
              />
              <Toaster />
            </Web3Provider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
