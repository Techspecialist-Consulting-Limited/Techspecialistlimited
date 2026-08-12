'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PillarId,
  Question,
  Option,
  pillars,
  EASE_OUT,
} from '@/data/assessment';
import AssessmentStepper from './AssessmentStepper';
import PillarIcon from './PillarIcon';
import styles from '@/app/(site)/ai-readiness-assessment/assessment.module.css';

function shuffleOptions(options: Option[]): Option[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface Props {
  selectedPillars: PillarId[];
  initialAnswers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -200 : 200,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

export default function AssessmentQuestions({
  selectedPillars,
  initialAnswers,
  onAnswer,
  onComplete,
  onBack,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const allQuestions = useMemo(() => {
    return selectedPillars.flatMap((pid) => {
      const p = pillars.find((p) => p.id === pid);
      return p ? p.questions : [];
    });
  }, [selectedPillars]);

  const pillarForQuestion = useCallback(
    (qId: string): PillarId | undefined => {
      for (const pid of selectedPillars) {
        const p = pillars.find((p) => p.id === pid);
        if (p?.questions.some((q) => q.id === qId)) return pid;
      }
      return undefined;
    },
    [selectedPillars]
  );

  const currentQuestion: Question | undefined = allQuestions[currentIndex];
  const currentPillarId = currentQuestion
    ? pillarForQuestion(currentQuestion.id)
    : undefined;

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return shuffleOptions(currentQuestion.options);
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalQuestions = allQuestions.length;
  const selectedOption = currentQuestion
    ? initialAnswers[currentQuestion.id]
    : undefined;

  const completedPillarIds = useMemo(() => {
    const ids: PillarId[] = [];
    for (let i = 0; i < currentIndex; i++) {
      const q = allQuestions[i];
      const pid = pillarForQuestion(q.id);
      if (pid && !ids.includes(pid)) {
        const nextQ = allQuestions[i + 1];
        const nextPid = nextQ ? pillarForQuestion(nextQ.id) : undefined;
        if (nextPid && nextPid !== pid) {
          ids.push(pid);
        }
      }
    }
    return ids;
  }, [allQuestions, currentIndex, pillarForQuestion]);

  const handleSelect = useCallback(
    (questionId: string, optionId: string) => {
      if (currentIndex >= totalQuestions - 1) {
        onAnswer(questionId, optionId);
        setTimeout(() => onComplete(), 300);
        return;
      }

      const nextIndex = currentIndex + 1;
      const nextQ = allQuestions[nextIndex];
      const currentPillar = pillarForQuestion(questionId);
      const nextPillar = nextQ ? pillarForQuestion(nextQ.id) : undefined;

      onAnswer(questionId, optionId);

      if (currentPillar && nextPillar && currentPillar !== nextPillar) {
        setPendingIndex(nextIndex);
        setShowInterstitial(true);
      } else {
        setDirection(1);
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, totalQuestions, allQuestions, pillarForQuestion, onAnswer, onComplete]
  );

  const goNext = useCallback(() => {
    if (currentIndex >= totalQuestions - 1) {
      onComplete();
      return;
    }
    const nextIndex = currentIndex + 1;
    const nextQ = allQuestions[nextIndex];
    const currentPillar = currentQuestion
      ? pillarForQuestion(currentQuestion.id)
      : undefined;
    const nextPillar = nextQ ? pillarForQuestion(nextQ.id) : undefined;

    if (currentPillar && nextPillar && currentPillar !== nextPillar) {
      setPendingIndex(nextIndex);
      setShowInterstitial(true);
    } else {
      setDirection(1);
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, totalQuestions, allQuestions, currentQuestion, pillarForQuestion, onComplete]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const continueFromInterstitial = useCallback(() => {
    if (pendingIndex !== null) {
      setDirection(1);
      setCurrentIndex(pendingIndex);
      setPendingIndex(null);
    }
    setShowInterstitial(false);
  }, [pendingIndex]);

  // Interstitial screen (pillar complete)
  if (showInterstitial && pendingIndex !== null) {
    const finishedPillarId = currentQuestion
      ? pillarForQuestion(currentQuestion.id)
      : undefined;
    const finishedPillar = finishedPillarId
      ? pillars.find((p) => p.id === finishedPillarId)
      : undefined;

    const nextPillarId = allQuestions[pendingIndex]
      ? pillarForQuestion(allQuestions[pendingIndex].id)
      : undefined;
    const nextPillar = nextPillarId
      ? pillars.find((p) => p.id === nextPillarId)
      : undefined;

    return (
      <div className={styles.questionPhase}>
        <AssessmentStepper
          selectedPillars={selectedPillars}
          currentPillarId={currentPillarId || selectedPillars[0]}
          completedPillarIds={completedPillarIds}
        />
        <motion.div
          className={styles.interstitial}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.interstitialCard}>
            <motion.div
              className={styles.interstitialIcon}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#059669' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
            </motion.div>
            <h2 className={styles.interstitialTitle}>
              {finishedPillar?.name} Complete
            </h2>
            <p className={styles.interstitialSub}>
              Next up: {nextPillar && <PillarIcon pillarId={nextPillar.id} size={18} color={nextPillar.color} />} {nextPillar?.name}
            </p>
            <motion.button
              className={styles.interstitialNextBtn}
              onClick={continueFromInterstitial}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue →
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion || !currentPillarId) {
    return (
      <div className={styles.questionPhase}>
        <AssessmentStepper
          selectedPillars={selectedPillars}
          currentPillarId={selectedPillars[0]}
          completedPillarIds={completedPillarIds}
        />
        <div className={styles.interstitial}>
          <p>No questions available.</p>
        </div>
      </div>
    );
  }

  const currentPillar = pillars.find((p) => p.id === currentPillarId);
  const hasPrev = currentIndex > 0;
  const hasSelection = !!selectedOption;
  const answeredCount = allQuestions.filter((question) => initialAnswers[question.id]).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);
  const currentPillarQuestions = currentPillar?.questions ?? [];
  const currentPillarAnswered = currentPillarQuestions.filter((question) => initialAnswers[question.id]).length;

  return (
    <div className={styles.questionPhase}>
      <AssessmentStepper
        selectedPillars={selectedPillars}
        currentPillarId={currentPillarId}
        completedPillarIds={completedPillarIds}
      />

      <div className={styles.questionMain}>
        <aside className={styles.questionSidebar}>
          <button className={styles.backToScopeBtn} onClick={onBack} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Edit scope
          </button>

          {currentPillar && (
            <div className={styles.currentPillarPanel}>
              <span className={styles.currentPillarIcon} style={{ background: `${currentPillar.color}18`, color: currentPillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PillarIcon pillarId={currentPillar.id} size={20} color={currentPillar.color} />
              </span>
              <div className={styles.currentPillarKicker}>Current pillar</div>
              <h1>{currentPillar.name}</h1>
              <p>{currentPillar.description}</p>
              <div className={styles.pillarMiniProgress}>
                <span>{currentPillarAnswered} of {currentPillarQuestions.length} answered</span>
                <strong style={{ color: currentPillar.color }}>
                  {Math.round((currentPillarAnswered / currentPillarQuestions.length) * 100)}%
                </strong>
              </div>
            </div>
          )}

          <div className={styles.assessmentPulse}>
            <div>
              <span>Overall completion</span>
              <strong>{progressPct}%</strong>
            </div>
            <div className={styles.assessmentPulseTrack}>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
              />
            </div>
          </div>
        </aside>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.id}
            className={styles.questionWorkspace}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className={styles.questionMeta}>
              {currentPillar && (
                <span
                  className={styles.questionPillarTag}
                  style={{
                    background: `${currentPillar.color}12`,
                    color: currentPillar.color,
                  }}
                >
                  <PillarIcon pillarId={currentPillar.id} size={14} color={currentPillar.color} /> {currentPillar.name}
                </span>
              )}
              <span className={styles.questionCounter}>
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>

            <div className={styles.questionCard}>
              <div className={styles.questionNumber}>
                {String(currentIndex + 1).padStart(2, '0')}
              </div>
              <h2 className={styles.questionText}>{currentQuestion.text}</h2>

              <div className={styles.questionOptions}>
                {shuffledOptions.map((option, index) => {
                  const isSelected = selectedOption === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      className={`${styles.optionBtn} ${isSelected ? styles.optionSelected : ''}`}
                      onClick={() => handleSelect(currentQuestion.id, option.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className={styles.optionKey}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className={styles.optionText}>{option.text}</span>
                      <span className={styles.optionRadio}>
                        <span className={styles.optionRadioInner} />
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className={styles.questionNav}>
                {hasPrev ? (
                  <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={goPrev} type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                ) : (
                  <div />
                )}

                <button
                  className={`${styles.navBtn} ${styles.navNext} ${!hasSelection ? styles.navDisabled : ''}`}
                  onClick={goNext}
                  disabled={!hasSelection}
                  type="button"
                >
                  {currentIndex >= totalQuestions - 1
                    ? 'See Results'
                    : 'Continue'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
