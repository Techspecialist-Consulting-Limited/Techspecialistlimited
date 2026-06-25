'use client';

export default function ListeningOrb() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '2px solid rgba(34, 197, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: 'breathe 3s ease-in-out infinite',
          boxShadow: '0 0 60px var(--assess-glow-green)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            border: '1px solid rgba(34, 197, 94, 0.1)',
            animation: 'ringExpand 3s ease-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            border: '1px solid rgba(34, 197, 94, 0.08)',
            animation: 'ringExpand 3s ease-out 1s infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            border: '1px solid rgba(34, 197, 94, 0.05)',
            animation: 'ringExpand 3s ease-out 2s infinite',
          }}
        />
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>
          Your turn &mdash; speak naturally
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>
          I&apos;ll know when you&apos;re done
        </div>
      </div>
    </div>
  );
}
