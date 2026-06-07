'use client';

import { PillarId, pillars } from '@/data/assessment';
import styles from '@/app/ai-readiness-assessment/assessment.module.css';
import { motion } from 'framer-motion';

interface Props {
  selectedPillars: PillarId[];
  currentIndex: number;
  totalQuestions: number;
  currentPillarId: PillarId;
}

export default function AssessmentProgress({
  selectedPillars,
  currentIndex,
  totalQuestions,
  currentPillarId,
}: Props) {
  const currentPillar = pillars.find((p) => p.id === currentPillarId);
  const answered = currentIndex;
  const progress = totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;

  return (
    <div className={styles.questionProgressWrap}>
      <div className={styles.questionProgressBar}>
        <motion.div
          className={styles.questionProgressFill}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className={styles.questionPillarInfo}>
        <span
          className={styles.questionPillarDot}
          style={{ background: currentPillar?.color }}
        />
        <span>
          {currentPillar?.icon} {currentPillar?.name}
        </span>
      </div>
      <div className={styles.questionProgressLabel}>
        {answered}/{totalQuestions}
      </div>
    </div>
  );
}
