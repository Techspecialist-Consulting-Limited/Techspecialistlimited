import { NextRequest, NextResponse, after } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Resend } from 'resend';
import { type PillarId } from '@/data/assessment';
import { generateAIReport, type AIReportContent } from '@/lib/ai-report';
import { ReportDocument } from '@/lib/pdf-report';

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

const FROM_ADDRESS = 'AI Readiness Report <reports@techspecialistlimited.com>';

async function generatePDF(body: SendReportRequest, ai: AIReportContent): Promise<Buffer> {
  // Call as function — returns <Document> element directly
  const document = ReportDocument({
    companyName: body.company_name,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    totalScore: body.totalScore,
    maxScore: body.maxScore,
    percentage: body.percentage,
    level: body.level,
    pillarScores: body.pillarScores,
    aiReport: ai,
    selectedPillars: body.selectedPillars as PillarId[],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(document as any);
  return Buffer.from(pdfBuffer);
}

async function generateAndSendReport(body: SendReportRequest) {
  const { email, company_name, percentage, level, totalScore, maxScore, answers, selectedPillars, pillarScores } = body;

  try {
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
      console.error(`[send-report] AI report generation failed for ${email} (${company_name})`);
      return;
    }

    const pdfBuffer = await generatePDF(body, aiReport);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: FROM_ADDRESS,
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
    });

    if (sendError) {
      console.error(`[send-report] Failed to send report to ${email} (${company_name}):`, sendError);
      return;
    }

    console.log(`[send-report] Report email sent to ${email} (${company_name})`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send report';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[send-report] Failed to send report to ${email} (${company_name}):`, message, stack);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendReportRequest = await request.json();
    const { email, company_name } = body;

    if (!email || !company_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, company_name' },
        { status: 400 }
      );
    }

    // Generation (LLM call + PDF render) and the SMTP send routinely take
    // 10-20s+ in production, which exceeds the serverless function's
    // request/response window. Ack the client immediately and do the
    // slow work after the response is sent so the request can't be
    // killed mid-flight before the email goes out.
    after(() => generateAndSendReport(body));

    return NextResponse.json({ success: true, message: 'Report is being generated and will be emailed shortly' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send report';
    console.error('Send report error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
