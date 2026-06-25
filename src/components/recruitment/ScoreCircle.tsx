'use client';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ScoreCircle({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  label,
}: ScoreCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? 'var(--score-high)' : score >= 50 ? 'var(--score-mid)' : 'var(--score-low)';

  const bgColor =
    score >= 75
      ? 'rgba(34, 197, 94, 0.1)'
      : score >= 50
        ? 'rgba(245, 158, 11, 0.1)'
        : 'rgba(239, 68, 68, 0.1)';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease',
              filter: `drop-shadow(0 0 6px ${bgColor})`,
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: size * 0.3,
              fontWeight: 800,
              color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {Math.round(score)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--body)' }}>
          {label || 'AI Score'}
        </span>
      )}
    </div>
  );
}
