'use client';

import { startTransition, useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

export default function ClientOnly({ children }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setHasMounted(true);
    });
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
