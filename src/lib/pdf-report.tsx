import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { pillars, type PillarId } from '@/data/assessment';
import type { AIReportContent } from './ai-report';

interface PDFReportProps {
  companyName: string;
  date: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: string;
  pillarScores: Record<string, { score: number; maxScore: number; percentage: number }>;
  aiReport: AIReportContent;
  selectedPillars: PillarId[];
}

const GREEN = '#059669';
const DARK = '#1f2937';
const BODY = '#4b5563';
const MUTED = '#6b7280';
const LIGHT_BG = '#f9fafb';
const BORDER = '#e5e7eb';
const GREEN_BG = '#f0fdf4';

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: BODY, lineHeight: 1.6 },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 10, color: MUTED, textAlign: 'center', marginBottom: 16 },
  hr: { borderBottom: `1px solid ${BORDER}`, marginVertical: 12 },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 12, backgroundColor: LIGHT_BG, borderRadius: 4 },
  scoreLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK },
  scoreValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GREEN },

  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 8, marginTop: 16, borderBottom: `2px solid ${GREEN}`, paddingBottom: 4 },
  subsectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6, marginTop: 12 },

  para: { marginBottom: 8, lineHeight: 1.7 },

  insightBox: { backgroundColor: GREEN_BG, borderLeft: `3px solid ${GREEN}`, padding: 10, borderRadius: 2, marginBottom: 12 },
  insightLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  insightText: { fontStyle: 'italic', color: DARK, lineHeight: 1.6 },

  gapCard: { backgroundColor: LIGHT_BG, padding: 10, borderRadius: 4, marginBottom: 8, borderLeft: `3px solid ${BORDER}` },
  gapPillar: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 3 },
  gapDesc: { marginBottom: 3 },
  gapImpact: { fontSize: 9, color: MUTED },

  pillarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pillarName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: DARK },
  pillarScore: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: GREEN },

  qBlock: { marginBottom: 10, paddingLeft: 8, borderLeft: `1px solid ${BORDER}` },
  qAssessment: { marginBottom: 4 },
  qRec: { fontSize: 9, color: DARK, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  effortBadge: { fontSize: 8, color: MUTED },

  phaseTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6, marginTop: 10 },
  actionRow: { flexDirection: 'row', marginBottom: 6, gap: 8 },
  actionBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN, marginTop: 4, marginRight: 6 },
  actionContent: { flex: 1 },
  actionText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 },
  actionImpact: { fontSize: 9, color: MUTED },

  tableHeader: { flexDirection: 'row', backgroundColor: DARK, padding: 8, borderRadius: 2 },
  tableHeaderText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff', flex: 1 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: `1px solid ${BORDER}` },
  tableRowAlt: { flexDirection: 'row', padding: 8, backgroundColor: LIGHT_BG, borderBottom: `1px solid ${BORDER}` },
  tableCell: { fontSize: 9, flex: 1, color: BODY },

  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 8 },
  footerText: { fontSize: 7, color: MUTED },

  ctaSection: { marginTop: 20, padding: 16, backgroundColor: LIGHT_BG, borderRadius: 4, borderLeft: `3px solid ${GREEN}` },
  ctaTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  ctaBody: { fontSize: 10, color: BODY, marginBottom: 4 },
  ctaContact: { fontSize: 9, color: MUTED },
});

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>TechSpecialist Ltd</Text>
      <Text style={s.footerText}>techspecialistlimited.com</Text>
      <Text style={s.footerText}>info@techspecialistlimited.com</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function ReportDocument(props: PDFReportProps) {
  const { companyName, date, totalScore, maxScore, percentage, level, pillarScores, aiReport, selectedPillars } = props;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PageFooter />

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.title}>AI Readiness Assessment Report</Text>
          <Text style={s.subtitle}>{companyName}  |  {date}</Text>
        </View>

        {/* SCORE DASHBOARD */}
        <View style={s.scoreRow}>
          <Text style={s.scoreLabel}>Overall Score: {totalScore}/{maxScore} ({percentage}%)</Text>
          <Text style={s.scoreValue}>Level: {level}</Text>
        </View>

        {/* EXECUTIVE SUMMARY */}
        <Text style={s.sectionTitle}>Executive Summary</Text>
        {aiReport.executiveSummary.narrative.split('\n').filter(Boolean).map((p, i) => (
          <Text key={i} style={s.para}>{p.trim()}</Text>
        ))}

        <View style={s.insightBox}>
          <Text style={s.insightLabel}>Key Insight</Text>
          <Text style={s.insightText}>{aiReport.executiveSummary.keyInsight}</Text>
        </View>

        {/* PRIORITY GAPS */}
        <Text style={s.sectionTitle}>Priority Gaps</Text>
        {aiReport.executiveSummary.topGaps.map((gap, i) => (
          <View key={i} style={s.gapCard}>
            <Text style={s.gapPillar}>{gap.pillar}</Text>
            <Text style={s.gapDesc}>{gap.gap}</Text>
            <Text style={s.gapImpact}>Impact: {gap.impact}</Text>
          </View>
        ))}

        <View style={s.hr} />

        {/* PILLAR ANALYSIS */}
        <Text style={s.sectionTitle}>Pillar Analysis</Text>
        {aiReport.pillarAnalyses.map((pa) => {
          const pillar = pillars.find((p) => p.id === pa.pillarId);
          if (!pillar) return null;
          const ps = pillarScores[pa.pillarId];

          return (
            <View key={pa.pillarId} wrap={false} style={{ marginBottom: 16 }}>
              <View style={s.pillarHeader}>
                <Text style={s.pillarName}>{pillar.name}</Text>
                {ps && <Text style={s.pillarScore}>{ps.score}/{ps.maxScore} ({ps.percentage}%)</Text>}
              </View>
              <Text style={s.para}>{pa.overallAssessment}</Text>

              {pa.questionBreakdown.map((qb) => (
                <View key={qb.questionId} style={s.qBlock}>
                  <Text style={s.qAssessment}>{qb.assessment}</Text>
                  <Text style={s.qRec}>Recommendation: {qb.recommendation}</Text>
                  <Text style={s.effortBadge}>Effort: {qb.effort.charAt(0).toUpperCase() + qb.effort.slice(1)}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <View style={s.hr} />

        {/* ACTION PLAN */}
        <Text style={s.sectionTitle}>Action Plan</Text>

        <Text style={s.phaseTitle}>Quick Wins (0-30 days)</Text>
        {aiReport.actionPlan.quickWins.map((item, i) => (
          <View key={i} style={s.actionRow}>
            <View style={s.actionBullet} />
            <View style={s.actionContent}>
              <Text style={s.actionText}>{item.action}</Text>
              <Text style={s.actionImpact}>{item.impact}</Text>
            </View>
          </View>
        ))}

        <Text style={s.phaseTitle}>Medium-Term (30-90 days)</Text>
        {aiReport.actionPlan.mediumTerm.map((item, i) => (
          <View key={i} style={s.actionRow}>
            <View style={s.actionBullet} />
            <View style={s.actionContent}>
              <Text style={s.actionText}>{item.action}</Text>
              <Text style={s.actionImpact}>{item.impact}</Text>
            </View>
          </View>
        ))}

        <Text style={s.phaseTitle}>Strategic Initiatives (90+ days)</Text>
        {aiReport.actionPlan.strategic.map((item, i) => (
          <View key={i} style={s.actionRow}>
            <View style={s.actionBullet} />
            <View style={s.actionContent}>
              <Text style={s.actionText}>{item.action}</Text>
              <Text style={s.actionImpact}>{item.impact}</Text>
            </View>
          </View>
        ))}

        <View style={s.hr} />

        {/* SUCCESS METRICS */}
        <Text style={s.sectionTitle}>Success Metrics</Text>
        <View style={s.tableHeader}>
          <Text style={s.tableHeaderText}>Metric</Text>
          <Text style={s.tableHeaderText}>Target</Text>
          <Text style={s.tableHeaderText}>Timeframe</Text>
        </View>
        {aiReport.successMetrics.map((sm, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={s.tableCell}>{sm.metric}</Text>
            <Text style={s.tableCell}>{sm.target}</Text>
            <Text style={s.tableCell}>{sm.timeframe}</Text>
          </View>
        ))}

        {/* CTA */}
        <View style={s.ctaSection}>
          <Text style={s.ctaTitle}>Ready to act on your results?</Text>
          <Text style={s.ctaBody}>Contact TechSpecialist Ltd for a free strategy session to build your AI roadmap.</Text>
          <Text style={s.ctaContact}>info@techspecialistlimited.com  |  techspecialistlimited.com  |  Abuja, Nigeria</Text>
        </View>
      </Page>
    </Document>
  );
}
