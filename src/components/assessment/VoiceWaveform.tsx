'use client';

interface VoiceWaveformProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
}

export default function VoiceWaveform({ isActive, color = 'var(--blue)', barCount = 5 }: VoiceWaveformProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '40px',
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '4px',
            height: isActive ? undefined : '12px',
            borderRadius: '100px',
            background: color,
            animation: isActive ? `waveBar 1.2s ease-in-out ${i * 0.15}s infinite` : 'none',
            transition: 'height 0.3s ease',
            minHeight: '8px',
            maxHeight: '40px',
          }}
        />
      ))}
    </div>
  );
}
