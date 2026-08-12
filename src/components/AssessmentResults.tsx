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
import PillarIcon from './PillarIcon';
import styles from '@/app/(site)/ai-readiness-assessment/assessment.module.css';

const UNLOCK_STORAGE_KEY = 'ts-ai-assessment-unlocked';
const EMAIL_STORAGE_KEY = 'ts-ai-assessment-email';
const COMPANY_STORAGE_KEY = 'ts-ai-assessment-company';

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
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(EMAIL_STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [companyName, setCompanyName] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(COMPANY_STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [submitState, setSubmitState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [submitMsg, setSubmitMsg] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reportMsg, setReportMsg] = useState('');
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true') return true;
      if (localStorage.getItem(EMAIL_STORAGE_KEY) && localStorage.getItem(COMPANY_STORAGE_KEY)) return true;
      return false;
    } catch {
      return false;
    }
  });

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
    if (!email || !companyName || submitState === 'loading') return;
    setSubmitState('loading');
    setSubmitMsg('');

    try {
      const response = await fetch('/api/assessment/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          company_name: companyName,
          answers,
          selectedPillars,
          level: level.name,
          percentage: results.percentage,
          totalScore: results.totalScore,
          maxScore: totalMax,
          pillarScores: results.pillarScores,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Failed to send report (${response.status})`);
      }

      fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          company_name: companyName,
          scores: results.pillarScores,
          total_score: results.totalScore,
          max_score: totalMax,
          level: level.name,
        }),
      }).catch(() => {});

      setSubmitState('success');
      setSubmitMsg(
        'Report sent! Check your email for your AI Readiness Assessment.'
      );
      setUnlocked(true);
      try {
        localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
        localStorage.setItem(EMAIL_STORAGE_KEY, email);
        localStorage.setItem(COMPANY_STORAGE_KEY, companyName);
      } catch {}
    } catch (err) {
      setSubmitState('error');
      setSubmitMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const getStatus = (pct: number) => {
    if (pct >= 70) return 'Strong';
    if (pct >= 40) return 'Developing';
    return 'Needs Work';
  };

  async function sendNewReport() {
    if (!email || !companyName || reportState === 'loading') return;
    setReportState('loading');
    setReportMsg('');
    try {
      const response = await fetch('/api/assessment/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          company_name: companyName,
          answers,
          selectedPillars,
          level: level.name,
          percentage: results.percentage,
          totalScore: results.totalScore,
          maxScore: totalMax,
          pillarScores: results.pillarScores,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Failed (${response.status})`);
      }
      setReportState('success');
      setReportMsg('Report sent! Check your email.');
    } catch (err) {
      setReportState('error');
      setReportMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const handleRetake = () => {
    try { localStorage.removeItem(UNLOCK_STORAGE_KEY); } catch {}
    onRetake();
  };

  return (
    <div className={styles.resultsPhase}>
      {/* SECTION A: UNLOCKED ZONE — always visible */}
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

          {!unlocked && (
            <div className={styles.reportTeaser}>
              <h3 className={styles.reportTeaserTitle}>What&apos;s in your full report</h3>
              <ul className={styles.reportTeaserList}>
                <li>Detailed pillar-by-pillar analysis with scores</li>
                <li>Executive narrative and strategic insights</li>
                <li>Personalised action plan with prioritised next steps</li>
                <li>PDF report delivered to your inbox</li>
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {/* SECTION B: LOCKED ZONE — blurred when !unlocked */}
      <div className={styles.lockedSection}>
        <div className={`${styles.resultsBody} ${!unlocked ? styles.lockedBlur : styles.unlockTransition}`}>
          <div className={styles.priorityStrip}>
            <div>
              <span className={styles.resultsTag}>Priority focus</span>
              <h2 className={styles.resultsSectionTitle}>Start where readiness is thinnest</h2>
            </div>
            <div className={styles.priorityList}>
              {priorityPillars.map((entry) => (
                <div key={entry!.id} className={styles.priorityItem}>
                  <span style={{ color: entry!.color, display: 'flex', alignItems: 'center' }}><PillarIcon pillarId={entry!.id} size={18} color={entry!.color} /></span>
                  <strong>{entry!.name}</strong>
                  <em>{entry!.pct}%</em>
                </div>
              ))}
            </div>
          </div>

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
                        <span className={styles.pillarRowIcon}><PillarIcon pillarId={entry!.id} size={18} color={barColor} /></span>
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

          {/* POST-UNLOCK: Executive Briefing, Next Steps, Priority Areas */}
          {unlocked && (
            <>
              <div className={styles.executiveBriefing}>
                <h2 className={styles.resultsSectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  Executive Briefing
                </h2>
                <div className={styles.executiveNarrative}>
                  <p>{level.narrative}</p>
                </div>
                <div className={styles.executiveInsight}>
                  <span>Key Insight</span>
                  <p>{level.insight}</p>
                </div>
              </div>

              <div className={styles.nextStepsSection}>
                <h2 className={styles.resultsSectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Recommended Next Steps
                </h2>
                <ol className={styles.nextStepsList}>
                  {level.nextSteps.map((step, i) => (
                    <li key={i} className={styles.nextStepItem}>
                      <span className={styles.nextStepNumber}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className={styles.priorityAreasSection}>
                <h2 className={styles.resultsSectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Your Priority Areas
                </h2>
                <div className={styles.priorityAreasTags}>
                  {level.priorityAreas.map((area, i) => (
                    <span key={i} className={styles.priorityAreaTag} style={{ borderColor: level.color, color: level.color }}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Email gate overlay — only when locked */}
        {!unlocked && (
          <div className={styles.lockedOverlay}>
            <div className={styles.emailGate}>
              <div className={styles.emailGateLock}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className={styles.emailGateTitle}>Unlock Your Complete AI Readiness Report</h2>
              <p className={styles.emailGateSubtitle}>
                Your detailed breakdown is ready. Enter your email to reveal your full results and receive an executive PDF report.
              </p>
              <ul className={styles.emailGateBullets}>
                <li>Detailed pillar-by-pillar analysis</li>
                <li>Executive narrative and strategic insights</li>
                <li>Personalised action plan with prioritised next steps</li>
                <li>PDF report delivered to your inbox</li>
              </ul>
              <form className={styles.emailGateForm} onSubmit={handleSubmit}>
                <input
                  className={styles.emailGateInput}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitState === 'loading'}
                />
                <input
                  className={styles.emailGateInput}
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  disabled={submitState === 'loading'}
                />
                <button
                  className={styles.emailGateBtn}
                  type="submit"
                  disabled={submitState === 'loading'}
                >
                  {submitState === 'loading' ? 'Unlocking...' : 'Unlock My Results'}
                </button>
              </form>
              {submitState === 'error' && (
                <div className={styles.emailGateError}>{submitMsg}</div>
              )}
              <p className={styles.emailGatePrivacy}>
                We&apos;ll also share how TechSpecialist can help you act on these insights.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION C: POST-UNLOCK CTA */}
      {unlocked && (
        <div className={styles.resultsCtaSection}>
          <div className={styles.resultsCtaInner}>
            {submitMsg && (
              <div className={`${styles.resultsCtaMsg} ${styles.resultsCtaSuccess}`} style={{ marginBottom: 16 }}>
                {submitMsg}
              </div>
            )}

            {email && companyName && submitState !== 'success' && (
              <div style={{ marginBottom: 24, padding: '16px 20px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #d1fae5' }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  Get your full report for this assessment
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#4b5563' }}>
                  We&apos;ll send a detailed PDF report to <strong>{email}</strong>
                </p>
                <button
                  className={styles.resultsCtaBtn}
                  onClick={sendNewReport}
                  disabled={reportState === 'loading' || reportState === 'success'}
                  style={{ width: 'auto', padding: '10px 20px', fontSize: 13 }}
                >
                  {reportState === 'loading' ? 'Sending...' : reportState === 'success' ? 'Sent!' : 'Send My Report'}
                </button>
                {reportMsg && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: reportState === 'error' ? '#dc2626' : '#059669' }}>
                    {reportMsg}
                  </p>
                )}
              </div>
            )}

            <h2 className={styles.resultsCtaTitle}>Ready to Accelerate?</h2>
            <p className={styles.resultsCtaSub}>
              Our AI consultants can help you build and execute a roadmap tailored to your assessment results. Book a free discovery call to get started.
            </p>
            <Link
              href="/consultation"
              className={styles.resultsCtaBtn}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', width: 'auto', padding: '14px 28px' }}
            >
              Book a Discovery Call
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <div className={styles.resultsActions}>
              <button className={styles.resultsRetakeBtn} onClick={handleRetake}>
                &larr; Retake Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retake option when locked */}
      {!unlocked && (
        <div className={styles.lockedRetakeWrap}>
          <button className={styles.resultsRetakeBtn} onClick={handleRetake}>
            &larr; Retake Assessment
          </button>
        </div>
      )}
    </div>
  );
}
