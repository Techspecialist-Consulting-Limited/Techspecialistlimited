'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmColors = {
    danger: { bg: 'var(--status-rejected)', hover: '#dc2626' },
    success: { bg: 'var(--status-approved)', hover: '#16a34a' },
    default: { bg: 'var(--blue)', hover: 'var(--blue-dark)' },
  };
  const colors = confirmColors[variant];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeUp 0.2s ease',
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.25s ease',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--heading)',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--body)',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          {description}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--heading)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: colors.bg,
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
