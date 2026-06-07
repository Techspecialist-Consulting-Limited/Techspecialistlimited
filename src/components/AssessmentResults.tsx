'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  PillarId,
  pillars,
  levels,
  calculateResults,
  AssessmentResults as Results,
  EASE_OUT,
} from '@/data/assessment';
import { sendAssessmentLeadEmail } from '@/lib/emailjs';
import styles from '@/app/ai-readiness-assessment/assessment.module.css';

interface Props {
  answers: Record<string, string>;
  selectedPillars: PillarId[];
  onRetake: () => void;
}

function useAnimatedScore(target: number, duration = 1200) {
  const [displayed, setDisplayed] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    const animate = (now: number) => {
      if (startTime.current === null) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return displayed;
}

export default function AssessmentResults({
  answers,
  selectedPillars,
  onRetake,
}: Props) {
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [submitMsg, setSubmitMsg] = useState('');

  const results: Results = calculateResults(answers, selectedPillars);
  const level = levels.find(
    (l) => results.percentage >= l.min && results.percentage <= l.max
  ) ?? levels[levels.length - 1];

  const totalMax = results.maxScore;
  const animatedScore = useAnimatedScore(results.totalScore);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset =
    circumference * (1 - results.totalScore / totalMax);

  const pillarEntries = selectedPillars
    .map((pid) => {
      const p = pillars.find((p) => p.id === pid);
      const ps = results.pillarScores[pid];
      return p && ps ? { ...p, score: ps.score, maxScore: ps.maxScore, pct: ps.percentage } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a!.score / a!.maxScore) - (b!.score / b!.maxScore));

  const priorityPillars = pillarEntries.slice(0, 3);

  const recEntries = selectedPillars
    .map((pid) => {
      const p = pillars.find((p) => p.id === pid);
      const rec = results.recommendations[pid];
      const ps = results.pillarScores[pid];
      return p && rec && ps ? { ...p, rec, pct: ps.percentage } : null;
    })
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || submitState === 'loading') return;
    setSubmitState('loading');
    setSubmitMsg('');

    try {
      await sendAssessmentLeadEmail(email, {
        level: level.name,
        percentage: results.percentage,
        totalScore: results.totalScore,
        maxScore: totalMax,
        pillarScores: results.pillarScores,
      });

      fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          scores: results.pillarScores,
          total_score: results.totalScore,
          max_score: totalMax,
          level: level.name,
        }),
      }).catch(() => {});

      setSubmitState('success');
      setSubmitMsg(
        'Thanks! We received your email. A specialist will follow up.'
      );
    } catch {
      setSubmitState('error');
      setSubmitMsg('Something went wrong. Please try again.');
    }
  }

  const getStatus = (pct: number) => {
    if (pct >= 70) return 'Strong';
    if (pct >= 40) return 'Developing';
    return 'Needs Work';
  };

  return (
    <div className={styles.resultsPhase}>
      <div className={styles.resultsHero}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <div className={styles.resultsTag}>Your Results</div>
          <h1 className={styles.resultsTitle}>
            AI Readiness Assessment Report
          </h1>
          <p className={styles.resultsSub}>
            Based on your responses across {selectedPillars.length} pillars
          </p>

          <div className={styles.resultsCommand}>
            <div className={styles.gaugeCard}>
              <div className={styles.gaugeWrap}>
                <svg className={styles.gaugeSvg} viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#1f2c45"
                    strokeWidth="10"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={level.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: EASE_OUT }}
                  />
                </svg>
                <div className={styles.gaugeCenter}>
                  <div className={styles.gaugeScore} style={{ color: level.color }}>
                    {animatedScore}
                  </div>
                  <div className={styles.gaugeMax}>
                    / {totalMax}
                  </div>
                </div>
              </div>

              <div className={styles.resultsLevelBadge}>
                <span
                  className={styles.resultsLevelDot}
                  style={{ background: level.color }}
                />
                <span className={styles.resultsLevelName}>{level.name}</span>
              </div>
            </div>

            <div className={styles.resultNarrative}>
              <span>Executive interpretation</span>
              <h2>{results.percentage}% AI readiness</h2>
              <p>{level.description}</p>
              <div className={styles.resultMetrics}>
                <div>
                  <span>Answered</span>
                  <strong>{Object.keys(answers).length}</strong>
                </div>
                <div>
                  <span>Pillars tested</span>
                  <strong>{selectedPillars.length}</strong>
                </div>
                <div>
                  <span>Priority areas</span>
                  <strong>{priorityPillars.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className={styles.resultsBody}>
        <div className={styles.priorityStrip}>
          <div>
            <span className={styles.resultsTag}>Priority focus</span>
            <h2 className={styles.resultsSectionTitle}>Start where readiness is thinnest</h2>
          </div>
          <div className={styles.priorityList}>
            {priorityPillars.map((entry) => (
              <div key={entry!.id} className={styles.priorityItem}>
                <span style={{ color: entry!.color }}>{entry!.icon}</span>
                <strong>{entry!.name}</strong>
                <em>{entry!.pct}%</em>
              </div>
            ))}
          </div>
        </div>

        {/* PILLAR BREAKDOWN */}
        <div>
          <h2 className={styles.resultsSectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="18" y="3" width="4" height="18" rx="1" />
              <rect x="10" y="8" width="4" height="13" rx="1" />
              <rect x="2" y="13" width="4" height="8" rx="1" />
            </svg>
            Pillar Breakdown
          </h2>
          <div className={styles.pillarBreakdown}>
            {pillarEntries.map((entry, i) => {
              const barColor = entry!.pct < 40 ? '#ef4444' : entry!.pct < 70 ? '#f59e0b' : '#4584ed';
              return (
                <motion.div
                  key={entry!.id}
                  className={styles.pillarRow}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease: EASE_OUT }}
                >
                  <div className={styles.pillarRowHeader}>
                    <div className={styles.pillarRowLeft}>
                      <span className={styles.pillarRowIcon}>{entry!.icon}</span>
                      <span className={styles.pillarRowName}>{entry!.name}</span>
                    </div>
                    <span className={styles.pillarRowScore} style={{ color: barColor }}>
                      {entry!.score}/{entry!.maxScore}
                    </span>
                  </div>
                  <div className={styles.pillarRowBar}>
                    <motion.div
                      className={styles.pillarRowBarFill}
                      style={{ background: barColor }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${entry!.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: EASE_OUT }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RECOMMENDATIONS */}
        <div className={styles.recsSection}>
          <h2 className={styles.resultsSectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Personalized Recommendations
          </h2>
          {recEntries.map((entry, i) => {
            const recColor = entry!.color;
            const status = getStatus(entry!.pct);
            return (
              <motion.div
                key={entry!.id}
                className={styles.recCard}
                style={{ borderLeftColor: recColor }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: EASE_OUT }}
              >
                <div className={styles.recCardHeader}>
                  <div className={styles.recCardPillar}>
                    <span
                      className={styles.recCardPillarDot}
                      style={{ background: recColor }}
                    />
                    <span className={styles.recCardPillarName}>{entry!.name}</span>
                  </div>
                  <span
                    className={styles.recCardStatus}
                    style={{
                      background: `${recColor}14`,
                      color: recColor,
                    }}
                  >
                    {status}
                  </span>
                </div>
                <p className={styles.recCardText}>{entry!.rec.text}</p>
                <Link
                  href={entry!.rec.ctaLink}
                  className={styles.recCardCta}
                  style={{ background: recColor }}
                >
                  {entry!.rec.cta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* EMAIL CTA */}
      <div className={styles.resultsCtaSection}>
        <div className={styles.resultsCtaInner}>
          <h2 className={styles.resultsCtaTitle}>
            Get a Full Strategy Session
          </h2>
          <p className={styles.resultsCtaSub}>
            Leave your email and a specialist will help you build your AI
            roadmap — at no cost.
          </p>

          <form className={styles.resultsCtaForm} onSubmit={handleSubmit}>
            <input
              className={styles.resultsCtaInput}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitState === 'loading' || submitState === 'success'}
            />
            <button
              className={styles.resultsCtaBtn}
              type="submit"
              disabled={submitState === 'loading' || submitState === 'success'}
            >
              {submitState === 'loading'
                ? 'Sending...'
                : submitState === 'success'
                ? '✓ Sent'
                : 'Send My Report'}
            </button>
          </form>

          <div
            className={`${styles.resultsCtaMsg} ${
              submitState === 'success'
                ? styles.resultsCtaSuccess
                : submitState === 'error'
                ? styles.resultsCtaError
                : ''
            }`}
          >
            {submitMsg}
          </div>

          <div className={styles.resultsActions}>
            <button className={styles.resultsRetakeBtn} onClick={onRetake}>
              ← Retake Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
