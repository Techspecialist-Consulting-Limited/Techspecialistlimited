import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import nodemailer from 'nodemailer';
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

const EMAIL = 'info@techspecialistlimited.com';

async function generatePDF(body: SendReportRequest, ai: AIReportContent): Promise<Buffer> {
  const element = React.createElement(ReportDocument, {
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

  const pdfBuffer = await renderToBuffer(element);
  return Buffer.from(pdfBuffer);
}

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

    const pdfBuffer = await generatePDF(body, aiReport);

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
  } catch (error: unknown) {
    console.error('Send report error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send report';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
