'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  accentColor?: string;
  trend?: { value: string; positive: boolean };
}

export default function MetricCard({ icon, value, label, accentColor = 'var(--blue)', trend }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      className="hover:shadow-md"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: trend.positive ? 'var(--score-high)' : 'var(--score-low)',
              background: trend.positive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '3px 8px',
              borderRadius: '100px',
            }}
          >
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 800,
          color: 'var(--heading)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--body)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}
