'use client';

import { useCallback, useRef, useState } from 'react';

interface FileUploadZoneProps {
  label: string;
  accept?: string;
  required?: boolean;
  maxSizeMB?: number;
  compact?: boolean;
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export default function FileUploadZone({
  label,
  accept = '.pdf,.doc,.docx,.txt',
  required = false,
  maxSizeMB = 10,
  compact = false,
  file,
  onFileSelect,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(
    (f: File) => {
      setError('');
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`);
        return;
      }
      onFileSelect(f);
    },
    [maxSizeMB, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--body)' }}>
            {label}
            {required && <span style={{ color: 'var(--status-rejected)', marginLeft: '4px' }}>*</span>}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'rgba(34, 197, 94, 0.04)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--score-high)',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--body)' }}>{formatSize(file.size)}</div>
          </div>
          <button
            onClick={() => onFileSelect(null)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--body)',
              flexShrink: 0,
              transition: 'border-color 0.2s, color 0.2s',
            }}
            aria-label="Remove file"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--body)' }}>
          {label}
          {required && <span style={{ color: 'var(--status-rejected)', marginLeft: '4px' }}>*</span>}
        </span>
        {!required && (
          <span style={{ fontSize: '11px', color: 'var(--body)', fontWeight: 500 }}>Optional</span>
        )}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          height: compact ? '120px' : '160px',
          border: `2px dashed ${isDragging ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          background: isDragging ? 'rgba(69, 132, 237, 0.04)' : 'transparent',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <div style={{ color: isDragging ? 'var(--blue)' : 'var(--body)', transition: 'color 0.2s' }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--heading)', fontWeight: 500 }}>
          Drag your file here or <span style={{ color: 'var(--blue)', fontWeight: 600 }}>browse</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--body)' }}>
          {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')} up to {maxSizeMB}MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />
      </div>
      {error && (
        <p style={{ fontSize: '12px', color: 'var(--status-rejected)', marginTop: '6px', fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  );
}
