'use client';

interface TopicProgressBarProps {
  topics: string[];
  currentIndex: number;
}

export default function TopicProgressBar({ topics, currentIndex }: TopicProgressBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.02em' }}>
        {topics[currentIndex] || ''}
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {topics.map((topic, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div
              key={i}
              title={topic}
              style={{
                height: '4px',
                width: isCurrent ? '32px' : '20px',
                borderRadius: '100px',
                background: isCompleted
                  ? 'var(--blue)'
                  : isCurrent
                    ? 'linear-gradient(90deg, var(--blue), var(--orange))'
                    : 'rgba(255, 255, 255, 0.15)',
                transition: 'all 0.4s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.35)' }}>
        {currentIndex + 1} of {topics.length} topics
      </div>
    </div>
  );
}
