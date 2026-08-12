import { ThemeProvider } from '../context/ThemeContext';
import Script from 'next/script';
import { Roboto_Slab } from 'next/font/google';
import './globals.css';

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://techspecialistlimited.com'),
  title: 'TechSpecialist — Executive Intelligence',
  description: 'Transform your organization with AI-powered executive intelligence. Built on Microsoft tools you already own.',
  keywords: ['Microsoft solutions', 'executive intelligence', 'business automation', 'Power BI', 'Copilot', 'Azure'],
  authors: [{ name: 'TechSpecialist Limited' }],
  openGraph: {
    title: 'TechSpecialist — Executive Intelligence',
    description: 'Transform your organization with AI-powered executive intelligence.',
    type: 'website',
    locale: 'en_US',
    url: 'https://techspecialistlimited.com',
    siteName: 'TechSpecialist',
  },
  verification: {
    google: 'sKH1h9aFGy8UWSmNwVado73ahBrMrTVZ_ivB1gWOdqM',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={robotoSlab.className} suppressHydrationWarning={true}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          {children}
          <Script
            src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js"
            strategy="lazyOnload"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
