'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import LegacyAssessmentPortal from './LegacyAssessmentPortal';
import RealtimeAssessmentPortal from './RealtimeAssessmentPortal';

const LOGO_URL = 'https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png';
const API_BASE = '/api/recruitment';

type Engine = 'legacy' | 'realtime' | null;

export default function AssessmentPortalSwitcher() {
  const { token } = useParams();
  const [engine, setEngine] = useState<Engine>(null);

  useEffect(() => {
    fetch(`${API_BASE}/assessment/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEngine(data?.engine === 'realtime' ? 'realtime' : 'legacy'))
      .catch(() => setEngine('legacy'));
  }, [token]);

  if (engine === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Image src={LOGO_URL} alt="TechSpecialist" width={48} height={48} className="mb-6 h-12 w-auto" />
        <p className="text-[14px] text-white/50">Preparing your interview...</p>
      </div>
    );
  }

  return engine === 'realtime' ? <RealtimeAssessmentPortal /> : <LegacyAssessmentPortal />;
}
