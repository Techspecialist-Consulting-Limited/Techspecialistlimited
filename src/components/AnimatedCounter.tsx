'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';
import { EASE_OUT } from '@/data/assessment';

interface Props {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  from = 0,
  to,
  duration = 1.5,
  className,
  suffix = '',
  prefix = '',
  decimals = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [displayValue, setDisplayValue] = useState(from.toFixed(decimals));

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(from, to, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setDisplayValue(v.toFixed(decimals)),
    });
    return controls.stop;
  }, [isInView, from, to, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
