'use client';

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PillarId } from '@/data/assessment';
import AssessmentLanding from '@/components/AssessmentLanding';
import AssessmentQuestions from '@/components/AssessmentQuestions';
import AssessmentResults from '@/components/AssessmentResults';
import styles from './assessment.module.css';

type Phase = 'landing' | 'questions' | 'results';

const STORAGE_KEY = 'ts-ai-assessment';

interface SavedState {
  selectedPillars: PillarId[];
  answers: Record<string, string>;
}

function getInitialSavedState(): SavedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function AIReadinessPage() {
  const isClient = useIsClient();
  const [saved] = useState(getInitialSavedState);
  const hydrated = saved && saved.selectedPillars.length > 0;

  const [phase, setPhase] = useState<Phase>(hydrated ? 'questions' : 'landing');
  const [selectedPillars, setSelectedPillars] = useState<PillarId[]>(
    hydrated ? saved.selectedPillars : []
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    hydrated ? saved.answers : {}
  );

  const persist = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedPillars, answers } as SavedState)
      );
    } catch {}
  }, [selectedPillars, answers]);

  useEffect(() => {
    if (isClient && phase === 'questions') persist();
  }, [isClient, phase, persist]);

  useEffect(() => {
    if (!isClient) return;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [isClient, phase]);

  const handleStart = useCallback((pillars: PillarId[]) => {
    setSelectedPillars(pillars);
    setAnswers({});
    setPhase('questions');
  }, []);

  const handleAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  const handleComplete = useCallback(() => {
    setPhase('results');
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const handleBackToLanding = useCallback(() => {
    setPhase('landing');
    setAnswers({});
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('landing');
    setSelectedPillars([]);
    setAnswers({});
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  if (!isClient) {
    return <div className={styles.wrapper} />;
  }

  return (
    <div className={styles.wrapper}>
      <AnimatePresence mode="wait">
        {phase === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AssessmentLanding onStart={handleStart} />
          </motion.div>
        )}

        {phase === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AssessmentQuestions
              selectedPillars={selectedPillars}
              initialAnswers={answers}
              onAnswer={handleAnswer}
              onComplete={handleComplete}
              onBack={handleBackToLanding}
            />
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AssessmentResults
              answers={answers}
              selectedPillars={selectedPillars}
              onRetake={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
