import { ThemeProvider } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import Script from 'next/script';
import ClientOnly from '../components/ClientOnly';
import './globals.css';

export const metadata = {
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
      </head>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased" suppressHydrationWarning={true}>
        <ClientOnly>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <ChatBot />
            </div>
            <Script
              src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js"
              strategy="lazyOnload"
            />
          </ThemeProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
