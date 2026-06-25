'use client';

interface BrandedLoaderProps {
  size?: number;
  text?: string;
}

export default function BrandedLoader({ size = 40, text }: BrandedLoaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '40px',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid var(--border)`,
          borderTopColor: 'var(--blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <p style={{ fontSize: '14px', color: 'var(--body)', fontWeight: 500 }}>{text}</p>
      )}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
