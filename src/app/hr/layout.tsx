'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { SidebarNav } from '@/components/hr';
import { getHREmail, isHRAuthenticated, clearHRAuth } from '@/lib/auth';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLoginPage = pathname === '/hr/login';

  useEffect(() => {
    if (!isLoginPage && !isHRAuthenticated()) {
      router.replace('/hr/login');
    }
  }, [pathname, isLoginPage, router]);

  if (!mounted) return null;

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleSignOut = () => {
    clearHRAuth();
    router.replace('/hr/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-soft)' }}>
      <SidebarNav userEmail={getHREmail() || undefined} onSignOut={handleSignOut} />
      <div className="nav:ml-[260px] transition-[margin] duration-200">
        <div className="p-6 pt-16 nav:p-8 nav:pt-8" style={{ maxWidth: '1280px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}