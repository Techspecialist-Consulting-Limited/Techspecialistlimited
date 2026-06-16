import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';

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

function generatePDF(data: SendReportRequest): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const colors = {
    primary: [69, 132, 237],
    success: [16, 185, 129],
    warning: [245, 158, 11],
    danger: [239, 68, 68],
    dark: [31, 44, 69],
  };

  const addLine = (height = 5) => {
    yPosition += height;
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  const addText = (text: string, size = 12, isBold = false) => {
    doc.setFontSize(size);
    doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += size / 2.5 * lines.length;
  };

  const addColoredText = (text: string, color: number[], size = 12, isBold = false) => {
    doc.setFontSize(size);
    doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += size / 2.5 * lines.length;
    doc.setTextColor(0, 0, 0);
  };

  doc.setFont('Helvetica');

  addColoredText('AI READINESS ASSESSMENT REPORT', colors.primary, 16, true);
  addLine(2);
  addText(`${data.company_name}`, 12, true);
  addText(`Date: ${new Date().toLocaleDateString()}`, 10);
  addLine(8);

  addText('EXECUTIVE SUMMARY', 14, true);
  addLine(3);
  doc.setFontSize(11);
  doc.text(
    `Your organization achieved a readiness score of ${data.percentage}% across ${data.selectedPillars.length} assessment pillars.`,
    margin,
    yPosition
  );
  yPosition += 8;

  addColoredText(data.level, colors.primary, 12, true);
  addLine(3);
  addText(
    'This assessment identifies your strengths and priority improvement areas across strategy, data, technology, workforce, governance, and change management.',
    10
  );
  addLine(8);

  addText('OVERALL SCORE', 14, true);
  addLine(3);
  addColoredText(`${data.totalScore}/${data.maxScore} Points (${data.percentage}%)`, colors.primary, 20, true);
  addLine(8);

  addText('PILLAR BREAKDOWN', 14, true);
  addLine(3);
  Object.entries(data.pillarScores).forEach(([pillar, score]) => {
    const pillarLabel = pillar.charAt(0).toUpperCase() + pillar.slice(1);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${pillarLabel}:`, margin, yPosition);
    yPosition += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Score: ${score.score}/${score.maxScore} (${score.percentage}%)`, margin + 5, yPosition);
    yPosition += 7;
  });

  addLine(5);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Next Steps: Contact a specialist to discuss your assessment results and create an AI readiness roadmap tailored to your organization.',
    margin,
    yPosition
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export async function POST(request: NextRequest) {
  try {
    const body: SendReportRequest = await request.json();
    const { email, company_name, level, percentage, totalScore, maxScore, pillarScores } = body;

    if (!email || !company_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, company_name' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const pdfBuffer = generatePDF(body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your AI Readiness Assessment Report - ${level}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <p><strong>Hello ${company_name},</strong></p>

          <p>Thank you for taking our <strong>AI Readiness Assessment</strong>. We have received your submission with a baseline score of <strong>${percentage}%</strong>.</p>

          <p>Our experts are reviewing your inputs to prepare customized insights around your primary focus area: <strong>${level}</strong>.</p>

          <p>At TechSpecialist, we believe that AI success starts with human-centered alignment and robust governance safeguards.</p>

          <p>We look forward to discussing how we can help you build on your assessment scores.</p>

          <p><strong>A member of our advisory team will be in touch with you shortly to share our tailored recommendations.</strong></p>

          <p style="margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
            Your detailed assessment report is attached to this email.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `AI-Readiness-Assessment-${company_name}-${new Date().toISOString().split('T')[0]}.pdf`,
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
