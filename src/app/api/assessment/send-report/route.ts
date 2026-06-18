import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';
import { pillars, type PillarId } from '@/data/assessment';
import { generateAIReport, type AIReportContent } from '@/lib/ai-report';

interface SendReportRequest {
  email: string;
  company_name: string;
  answers: Record<string, string>;
  selectedPillars: string[];
  level: string;
  percentage: number;
  totalScore: number;
  maxScore: number;
  pillarScores: Record<string, { score: number; maxScore: number; percentage: number }>;
}

const EMAIL = 'info@techspecialistlimited.com';
const WEBSITE = 'techspecialistlimited.com';
const LOCATION = 'Abuja, Nigeria';
const MARGIN = 20;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const DARK = [31, 41, 55];
const BODY = [75, 85, 99];
const MUTED = [107, 114, 128];

function initDoc(): jsPDF {
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

function splitText(doc: jsPDF, text: string, maxWidth?: number): string[] {
  return doc.splitTextToSize(text, maxWidth ?? CONTENT_W);
}

function hr(doc: jsPDF, y: number) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

function maybePage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN - 5) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
}

function writePara(doc: jsPDF, text: string, y: number, opts: { size?: number; bold?: boolean; color?: number[]; indent?: number; lh?: number } = {}): number {
  const { size = 9.5, bold = false, color = BODY, indent = 0, lh = 4 } = opts;
  const lines = splitText(doc, text.trim());
  const h = lines.length * lh + 2;
  y = maybePage(doc, y, h);
  doc.setFontSize(size);
  doc.setFont('Helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(lines, MARGIN + indent, y);
  return y + h;
}

function writeHeading(doc: jsPDF, text: string, y: number, size: number = 13): number {
  y = maybePage(doc, y, size * 0.7 + 2);
  doc.setFontSize(size);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(text, MARGIN, y);
  return y + size * 0.7 + 2;
}

function writeParagraphs(doc: jsPDF, text: string, y: number): number {
  for (const p of text.split('\n')) {
    if (!p.trim()) continue;
    y = writePara(doc, p.trim(), y, { lh: 4.2 });
  }
  return y + 2;
}

function generatePDF(body: SendReportRequest, ai: AIReportContent): Buffer {
  const doc = initDoc();
  let y = MARGIN + 10;

  // ─── HEADER ──────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text('AI Readiness Assessment Report', PAGE_W / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`${body.company_name}  |  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, PAGE_W / 2, y, { align: 'center' });
  y += 8;

  hr(doc, y);
  y += 8;

  // Score
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`Overall Score: ${body.totalScore}/${body.maxScore} (${body.percentage}%)`, MARGIN, y);
  doc.text(`Level: ${body.level}`, PAGE_W - MARGIN, y, { align: 'right' });
  y += 12;

  // ─── EXECUTIVE SUMMARY ───────────────────────────────────────
  y = writeHeading(doc, 'Executive Summary', y, 14);
  y = writeParagraphs(doc, ai.executiveSummary.narrative, y);

  // Key Insight
  y = writePara(doc, `Key Insight: ${ai.executiveSummary.keyInsight}`, y, { bold: true, lh: 4.2 });
  y += 3;

  // Priority Gaps
  y = writeHeading(doc, 'Priority Gaps', y, 13);
  for (const gap of ai.executiveSummary.topGaps) {
    y = maybePage(doc, y, 20);
    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(gap.pillar, MARGIN, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(BODY[0], BODY[1], BODY[2]);
    doc.text(gap.gap, MARGIN + 4, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Impact: ${gap.impact}`, MARGIN + 4, y);
    y += 7;
  }

  // ─── PILLAR ANALYSIS ─────────────────────────────────────────
  y = maybePage(doc, y, 20);
  hr(doc, y);
  y += 6;
  y = writeHeading(doc, 'Pillar Analysis', y, 14);

  for (const pa of ai.pillarAnalyses) {
    const pillar = pillars.find((p) => p.id === pa.pillarId);
    if (!pillar) continue;

    y = maybePage(doc, y, 10);
    hr(doc, y);
    y += 6;

    y = writeHeading(doc, pillar.name, y, 12);

    const ps = body.pillarScores[pa.pillarId];
    if (ps) {
      y = writePara(doc, `Score: ${ps.score}/${ps.maxScore} (${ps.percentage}%)`, y, { size: 9, color: MUTED, lh: 3.8 });
    }

    y = writePara(doc, pa.overallAssessment, y, { lh: 4.2 });

    for (const qb of pa.questionBreakdown) {
      y = maybePage(doc, y, 12);
      hr(doc, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(BODY[0], BODY[1], BODY[2]);
      const aLines = splitText(doc, qb.assessment);
      doc.text(aLines, MARGIN, y);
      y += aLines.length * 4 + 2;

      doc.setFontSize(8.5);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(`Recommendation: ${qb.recommendation}`, MARGIN, y);
      y += 6;

      doc.setFontSize(8);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(`Effort: ${qb.effort.charAt(0).toUpperCase() + qb.effort.slice(1)}`, MARGIN, y);
      y += 5;
    }
  }

  // ─── ACTION PLAN ─────────────────────────────────────────────
  y = maybePage(doc, y, 10);
  hr(doc, y);
  y += 6;
  y = writeHeading(doc, 'Action Plan', y, 14);

  function writePhase(title: string, items: Array<{ action: string; impact: string }>) {
    y = writeHeading(doc, title, y, 12);
    for (const item of items) {
      y = maybePage(doc, y, 12);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      const actLines = splitText(doc, item.action);
      doc.text(actLines, MARGIN, y);
      y += actLines.length * 4 + 1;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(BODY[0], BODY[1], BODY[2]);
      const impLines = splitText(doc, `Impact: ${item.impact}`);
      doc.text(impLines, MARGIN + 4, y);
      y += Math.max(impLines.length * 3.8, 4) + 3;
    }
  }

  writePhase('Quick Wins (0-30 days)', ai.actionPlan.quickWins);
  writePhase('Medium-Term (30-90 days)', ai.actionPlan.mediumTerm);
  writePhase('Strategic Initiatives (90+ days)', ai.actionPlan.strategic);

  // ─── SUCCESS METRICS ─────────────────────────────────────────
  y = maybePage(doc, y, 15);
  hr(doc, y);
  y += 7;

  y = writeHeading(doc, 'Success Metrics', y, 13);

  const colW = CONTENT_W / 3;
  const col1 = MARGIN;
  const col2 = MARGIN + colW;
  const col3 = MARGIN + colW * 2;

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  y = maybePage(doc, y, 6);
  doc.text('Metric', col1, y);
  doc.text('Target', col2, y);
  doc.text('Timeframe', col3, y);
  y += 5;
  hr(doc, y);
  y += 5;

  for (const sm of ai.successMetrics) {
    const m1 = splitText(doc, sm.metric, colW - 4);
    const m2 = splitText(doc, sm.target, colW - 4);
    const m3 = splitText(doc, sm.timeframe, colW - 4);
    const rowH = Math.max(m1.length, m2.length, m3.length) * 3.8 + 2;
    y = maybePage(doc, y, rowH + 1);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(BODY[0], BODY[1], BODY[2]);
    doc.text(m1, col1, y);
    doc.text(m2, col2, y);
    doc.text(m3, col3, y);
    y += rowH + 2;
  }

  // ─── CTA FOOTER ──────────────────────────────────────────────
  y = Math.max(y, PAGE_H - MARGIN - 30);
  hr(doc, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text('Ready to act on your results?', MARGIN, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(BODY[0], BODY[1], BODY[2]);
  doc.text('Contact TechSpecialist Ltd for a free strategy session.', MARGIN, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(EMAIL, MARGIN, y);
  doc.text(WEBSITE, PAGE_W / 2, y, { align: 'center' });
  doc.text(LOCATION, PAGE_W - MARGIN, y, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

// ─── API Route ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: SendReportRequest = await request.json();
    const { email, company_name, percentage, level, totalScore, maxScore, answers, selectedPillars, pillarScores } = body;

    if (!email || !company_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, company_name' },
        { status: 400 }
      );
    }

    const aiReport = await generateAIReport({
      companyName: company_name,
      totalScore,
      maxScore,
      percentage,
      level,
      selectedPillars: selectedPillars as PillarId[],
      pillarScores,
      answers,
    });

    if (!aiReport) {
      return NextResponse.json(
        { error: 'AI report generation failed. Please try again later.' },
        { status: 503 }
      );
    }

    const pdfBuffer = generatePDF(body, aiReport);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your AI Readiness Assessment Report — ${company_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <p><strong>Hello ${company_name},</strong></p>
          <p>Thank you for completing the <strong>AI Readiness Assessment</strong>.</p>
          <p>Your organisation achieved a readiness score of <strong>${percentage}%</strong>, placing you at the <strong>${level}</strong> level. A comprehensive report with your pillar-by-pillar breakdown, personalised recommendations, and a priority action plan is attached to this email.</p>
          <p style="background: #f0fdf4; border-left: 4px solid #059669; padding: 14px 16px; border-radius: 4px;">
            <strong>What's inside the report:</strong><br/>
            &bull; Executive summary with score dashboard<br/>
            &bull; Detailed breakdown across all assessed pillars<br/>
            &bull; Personalised recommendations for each area<br/>
            &bull; A 90-day priority action plan ranked by impact<br/>
            &bull; Strategic next steps and CTA
          </p>
          <p>Our advisory team is available to walk you through the findings and help build your AI readiness roadmap.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
            TechSpecialist Ltd &bull; techspecialistlimited.com &bull; Abuja, Nigeria
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `AI-Readiness-Report-${company_name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Report sent successfully' });
  } catch (error: any) {
    console.error('Send report error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send report' },
      { status: 500 }
    );
  }
}
