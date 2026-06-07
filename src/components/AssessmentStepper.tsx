'use client';

import { PillarId, pillars } from '@/data/assessment';
import styles from '@/app/ai-readiness-assessment/assessment.module.css';

interface Props {
  selectedPillars: PillarId[];
  currentPillarId: PillarId;
  completedPillarIds: PillarId[];
}

export default function AssessmentStepper({
  selectedPillars,
  currentPillarId,
  completedPillarIds,
}: Props) {
  return (
    <div className={styles.stepperWrap}>
      <div className={styles.stepperInner}>
        {selectedPillars.map((pid, i) => {
          const pillar = pillars.find((p) => p.id === pid);
          if (!pillar) return null;
          const isActive = pid === currentPillarId;
          const isDone = completedPillarIds.includes(pid);
          const isLast = i === selectedPillars.length - 1;

          return (
            <div key={pid} style={{ display: 'contents' }}>
              <div
                className={`${styles.stepperStep} ${
                  isActive ? styles.stepperStepActive : ''
                } ${isDone ? styles.stepperStepDone : ''}`}
              >
                <span className={styles.stepperDot}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className={styles.stepperLabel}>{pillar.name}</span>
              </div>
              {!isLast && (
                <div
                  className={`${styles.stepperLine} ${
                    isDone ? styles.stepperLineDone : ''
                  } ${isActive ? styles.stepperLineActive : ''}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
