import '../globals.css';

export const metadata = {
  title: 'AI Interview — TechSpecialist',
  description: 'Voice-based AI interview for TechSpecialist recruitment',
};

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      {children}
    </div>
  );
}
