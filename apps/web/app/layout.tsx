import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SITE_URL } from '@/lib/utils/site-url';
import './globals.css';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

export const metadata: Metadata = {
   title: {
      template: '%s | Circle',
      default: 'Circle — Project Management Platform',
   },
   description: 'Modern project management platform for high-performing engineering teams.',
   openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: 'Circle',
   },
   keywords: ['project-management', 'issues', 'cycles', 'linear-clone', 'agile'],
};

import { ThemeProvider } from '@/components/layout/theme-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
         </head>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
            suppressHydrationWarning
         >
            <NextTopLoader
               color="#5E6AD2"
               initialPosition={0.08}
               crawlSpeed={200}
               height={2.5}
               crawl={true}
               showSpinner={false}
               easing="ease"
               speed={200}
               shadow="0 0 10px #5E6AD2,0 0 5px #5E6AD2"
               zIndex={1600}
            />
            <NuqsAdapter>
               <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                  <QueryProvider>
                     <AuthProvider>
                        {children}
                        <Toaster />
                     </AuthProvider>
                  </QueryProvider>
               </ThemeProvider>
            </NuqsAdapter>
         </body>
      </html>
   );
}
