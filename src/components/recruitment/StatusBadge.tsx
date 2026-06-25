'use client';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'New', bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--status-new)', dot: 'var(--status-new)' },
  screening: { label: 'Screening', bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--status-screening)', dot: 'var(--status-screening)' },
  approved: { label: 'Approved', bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--status-approved)', dot: 'var(--status-approved)' },
  rejected: { label: 'Rejected', bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--status-rejected)', dot: 'var(--status-rejected)' },
  assessment: { label: 'Assessment', bg: 'rgba(168, 85, 247, 0.1)', text: 'var(--status-assessment)', dot: 'var(--status-assessment)' },
  assessment_completed: { label: 'Assessment Done', bg: 'rgba(168, 85, 247, 0.1)', text: 'var(--status-assessment)', dot: 'var(--status-assessment)' },
  completed: { label: 'Completed', bg: 'rgba(6, 182, 212, 0.1)', text: 'var(--status-completed)', dot: 'var(--status-completed)' },
  active: { label: 'Active', bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--status-approved)', dot: 'var(--status-approved)' },
  closed: { label: 'Closed', bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--status-rejected)', dot: 'var(--status-rejected)' },
  inactive: { label: 'Inactive', bg: 'rgba(107, 114, 128, 0.1)', text: 'var(--body)', dot: 'var(--body)' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const displayLabel = label || config.label;
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: config.bg,
        color: config.text,
        padding: isSmall ? '4px 10px' : '5px 14px',
        borderRadius: '100px',
        fontSize: isSmall ? '10px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          background: config.dot,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
}
