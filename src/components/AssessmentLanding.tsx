'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PillarId,
  pillars,
  levels,
  pillarOrder,
  EASE_OUT,
} from '@/data/assessment';
import styles from '@/app/ai-readiness-assessment/assessment.module.css';

interface Props {
  onStart: (pillars: PillarId[]) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export default function AssessmentLanding({ onStart }: Props) {
  const [selected, setSelected] = useState<PillarId[]>(pillarOrder);

  const togglePillar = useCallback((id: PillarId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === pillarOrder.length ? [] : [...pillarOrder]
    );
  }, []);

  const allSelected = selected.length === pillarOrder.length;
  const canStart = selected.length > 0;
  const selectedQuestionCount = pillars
    .filter((pillar) => selected.includes(pillar.id))
    .reduce((sum, pillar) => sum + pillar.questions.length, 0);

  return (
    <>
      <section className={styles.heroSection}>
        <motion.div
          className={styles.heroInner}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.heroLeft}>
            <motion.div className={styles.heroTag} variants={itemVariants}>
              AI Readiness Diagnostic
            </motion.div>

            <motion.h1 className={styles.heroTitle} variants={itemVariants}>
              Reveal the real blockers between your business and AI at scale.
            </motion.h1>

            <motion.p className={styles.heroSub} variants={itemVariants}>
              Most AI programmes fail quietly: the technology works, but the
              organisation is not ready to absorb it. This assessment pinpoints
              the strategy, data, systems, people, governance, and adoption gaps
              that decide whether AI becomes value or noise.
            </motion.p>

            <motion.div className={styles.heroStats} variants={itemVariants}>
              <div>
                <strong>5 min</strong>
                <span>guided diagnostic</span>
              </div>
              <div>
                <strong>6</strong>
                <span>readiness pillars</span>
              </div>
              <div>
                <strong>24+</strong>
                <span>executive signals</span>
              </div>
            </motion.div>

            <motion.div className={styles.heroActions} variants={itemVariants}>
              <button
                className={styles.heroCta}
                onClick={() =>
                  document
                    .getElementById('pillarSelection')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Start Your Assessment
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <span className={styles.heroMicrocopy}>Personalized report at the end</span>
            </motion.div>
          </div>

        </motion.div>
      </section>

      <section className={styles.levelsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTag}>Your AI Transformation Journey</div>
            <h2 className={styles.sectionTitle}>
              A clear maturity signal, not a vanity score.
            </h2>
          </div>
          <p className={styles.sectionSub}>
            Your result maps your organisation to one of four readiness stages
            and turns the score into practical next moves.
          </p>
        </div>

        <div className={styles.levelsGrid}>
          {levels.map((level, i) => (
            <motion.div
              key={level.name}
              className={styles.levelCard}
              style={{ borderTopColor: level.color }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: EASE_OUT }}
            >
              <div className={styles.levelIndex}>0{i + 1}</div>
              <div className={styles.levelRange} style={{ color: level.color }}>
                {level.min}–{level.max}
              </div>
              <div className={styles.levelName}>{level.name}</div>
              <div className={styles.levelDesc}>{level.description}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pillarSelection" className={styles.pillarSection}>
        <div className={styles.pillarShell}>
          <div className={styles.pillarIntro}>
            <div className={styles.sectionTag}>Assessment scope</div>
            <h2 className={styles.sectionTitle}>
              Choose the dimensions you want to test.
            </h2>
            <p className={styles.sectionSub}>
              Keep all six selected for the strongest view, or focus the
              diagnostic on the areas that matter most right now.
            </p>
            <div className={styles.scopeSummary}>
              <span>{selected.length} pillars selected</span>
              <strong>{selectedQuestionCount} questions</strong>
            </div>
          </div>

          <div>
            <div className={styles.pillarGrid}>
              {pillars.map((pillar, i) => {
                const isSelected = selected.includes(pillar.id);
                return (
                  <motion.button
                    type="button"
                    key={pillar.id}
                    className={`${styles.pillarCard} ${isSelected ? styles.pillarCardSelected : ''}`}
                    onClick={() => togglePillar(pillar.id)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: EASE_OUT }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ borderTopColor: pillar.color }}
                  >
                    <span className={styles.pillarIcon} style={{ background: `${pillar.color}18`, color: pillar.color }}>
                      {pillar.icon}
                    </span>
                    <span className={styles.pillarInfo}>
                      <span className={styles.pillarName}>{pillar.name}</span>
                      <span className={styles.pillarDesc}>{pillar.description}</span>
                    </span>
                    <span className={styles.pillarCheckbox}>
                      {isSelected && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className={styles.pillarActions}>
              <button
                type="button"
                className={`${styles.selectAllBtn} ${allSelected ? styles.selectAllBtnActive : ''}`}
                onClick={toggleAll}
              >
                {allSelected ? 'Clear selection' : 'Select all pillars'}
              </button>

              <motion.button
                type="button"
                className={`${styles.startBtn} ${canStart ? styles.startBtnEnabled : ''}`}
                onClick={() => canStart && onStart(selected)}
                whileHover={canStart ? { y: -2 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
              >
                Begin Diagnostic
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
