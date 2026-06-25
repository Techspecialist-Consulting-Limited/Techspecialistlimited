'use client';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export default function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const color =
    score >= 75 ? 'var(--score-high)' : score >= 50 ? 'var(--score-mid)' : 'var(--score-low)';
  const bgColor =
    score >= 75
      ? 'rgba(34, 197, 94, 0.1)'
      : score >= 50
        ? 'rgba(245, 158, 11, 0.1)'
        : 'rgba(239, 68, 68, 0.1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, letterSpacing: '-0.01em' }}>
          {Math.round(score)}/{maxScore}
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '100px',
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            borderRadius: '100px',
            background: color,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}
