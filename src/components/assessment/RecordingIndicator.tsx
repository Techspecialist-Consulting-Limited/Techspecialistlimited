'use client';

import { useRef, useSyncExternalStore } from 'react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  startTime?: number;
}

function useElapsedSeconds(isRecording: boolean, startTime?: number) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const subscribe = (cb: () => void) => {
    if (isRecording && startTime) {
      intervalRef.current = setInterval(cb, 200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  };
  const getSnapshot = () => {
    if (!isRecording || !startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  };
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

export default function RecordingIndicator({ isRecording, startTime }: RecordingIndicatorProps) {
  const elapsed = useElapsedSeconds(isRecording, startTime);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '2px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: isRecording ? '0 0 60px var(--assess-glow-red)' : 'none',
          transition: 'box-shadow 0.3s',
        }}
      >
        {isRecording && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                animation: 'ringExpand 2s ease-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                animation: 'ringExpand 2s ease-out 0.6s infinite',
              }}
            />
          </>
        )}
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ef4444',
            animation: isRecording ? 'breathe 1.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      <div
        style={{
          fontSize: '40px',
          fontWeight: 700,
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {timeStr}
      </div>
      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
        Recording...
      </div>
    </div>
  );
}
