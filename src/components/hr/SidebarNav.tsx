'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/hr',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Jobs',
    href: '/hr/jobs',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    label: 'Applicants',
    href: '/hr/applicants',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: 'History',
    href: '/hr/jobs/history',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

interface SidebarNavProps {
  userEmail?: string;
  onSignOut: () => void;
}

export default function SidebarNav({ userEmail, onSignOut }: SidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/hr') return pathname === '/hr';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--blue), var(--orange))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          TS
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--heading)', letterSpacing: '-0.01em' }}>
              TechSpecialist
            </div>
            <div style={{ fontSize: '10px', color: 'var(--body)', fontWeight: 500 }}>
              HR Portal
            </div>
          </div>
        )}
      </div>

      <nav style={{ padding: '12px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '12px' : '10px 14px',
                  borderRadius: '10px',
                  color: active ? 'var(--blue)' : 'var(--body)',
                  background: active ? 'rgba(69, 132, 237, 0.08)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.2s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-soft)'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; } }}
              >
                {item.icon}
                {!collapsed && item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        style={{
          padding: collapsed ? '12px' : '16px 20px',
          borderTop: '1px solid var(--border)',
        }}
      >
        {!collapsed && userEmail && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              padding: '10px 12px',
              background: 'var(--bg-soft)',
              borderRadius: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(69, 132, 237, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue)',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--body)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--body)'; }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="nav:hidden"
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 10001,
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--heading)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="nav:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        className="hidden nav:flex"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: collapsed ? '80px' : '260px',
          height: '100vh',
          background: 'var(--bg)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          zIndex: 10000,
          transition: 'width 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            top: '50%',
            right: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--body)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(180deg)' : 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </aside>

      <aside
        className="nav:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '280px',
          height: '100vh',
          background: 'var(--bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}