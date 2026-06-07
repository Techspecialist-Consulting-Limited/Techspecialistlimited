import emailjs from '@emailjs/browser';

export const EMAILJS_PUBLIC_KEY = "c3dGcTMwnlYoZt1QQ";
export const EMAILJS_SERVICE_ID = "service_fmpndgn";
export const EMAILJS_TEMPLATE_ID = "template_z47v9aq";

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

export const sendDiscoveryCallEmail = async (email: string) => {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    user_email: email,
    subject: 'New Discovery Call Request — TechSpecialist',
    message: `Email: ${email}\nTimestamp: ${new Date().toUTCString()}`,
  });
};

interface AssessmentLeadPayload {
  level: string;
  percentage: number;
  totalScore: number;
  maxScore: number;
  pillarScores: Record<string, { score: number; maxScore: number; percentage: number }>;
}

export const sendAssessmentLeadEmail = async (
  email: string,
  payload: AssessmentLeadPayload
) => {
  const pillarSummary = Object.entries(payload.pillarScores)
    .map(([pillar, score]) => {
      return `${pillar}: ${score.score}/${score.maxScore} (${score.percentage}%)`;
    })
    .join('\n');

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    user_email: email,
    subject: 'New AI Readiness Assessment Lead — TechSpecialist',
    message: [
      `Email: ${email}`,
      `Level: ${payload.level}`,
      `Readiness: ${payload.percentage}%`,
      `Score: ${payload.totalScore}/${payload.maxScore}`,
      '',
      'Pillar Scores:',
      pillarSummary,
      '',
      `Timestamp: ${new Date().toUTCString()}`,
    ].join('\n'),
  });
};

export default emailjs;
