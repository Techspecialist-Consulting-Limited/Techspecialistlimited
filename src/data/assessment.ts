export type PillarId = 'strategy' | 'data' | 'technology' | 'workforce' | 'governance' | 'change';

export interface Option {
  id: string;
  text: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface Pillar {
  id: PillarId;
  name: string;
  icon: string;
  description: string;
  color: string;
  questions: Question[];
}

export interface Level {
  name: string;
  min: number;
  max: number;
  description: string;
  color: string;
  accent: string;
}

export interface Recommendation {
  text: string;
  cta: string;
  ctaLink: string;
}

export interface PillarScore {
  score: number;
  maxScore: number;
  percentage: number;
}

export interface AssessmentResults {
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: Level;
  pillarScores: Record<PillarId, PillarScore>;
  recommendations: Record<PillarId, Recommendation>;
}

export const pillars: Pillar[] = [
  {
    id: 'strategy',
    name: 'Strategy & Leadership',
    icon: '📊',
    description: 'Strategic alignment, executive sponsorship, and innovation budgeting at the leadership level.',
    color: '#4584ed',
    questions: [
      {
        id: 's1',
        text: 'Does your organization have a digital transformation strategy?',
        options: [
          { id: 's1a', text: 'Yes — we have a documented digital transformation strategy that is actively executed and reviewed.', score: 3 },
          { id: 's1b', text: 'We have a strategy, but implementation is still in progress.', score: 2 },
          { id: 's1c', text: 'No — we do not currently have a formal digital transformation strategy.', score: 1 },
          { id: 's1d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 's2',
        text: 'Is AI included in strategic discussions?',
        options: [
          { id: 's2a', text: 'Yes — AI is regularly discussed as part of business and growth planning.', score: 3 },
          { id: 's2b', text: 'AI is occasionally discussed but is not yet a strategic priority.', score: 2 },
          { id: 's2c', text: 'AI is rarely or never discussed in strategic planning.', score: 1 },
          { id: 's2d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 's3',
        text: 'Is there executive sponsorship for AI initiatives?',
        options: [
          { id: 's3a', text: 'Yes — senior leadership actively champions and supports AI initiatives.', score: 3 },
          { id: 's3b', text: 'Leadership is supportive but not actively involved.', score: 2 },
          { id: 's3c', text: 'There is currently no executive sponsorship for AI.', score: 1 },
          { id: 's3d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 's4',
        text: 'Is a budget allocated for innovation projects?',
        options: [
          { id: 's4a', text: 'Yes — dedicated funding is available for innovation and AI-related initiatives.', score: 3 },
          { id: 's4b', text: 'Funding may be available on a project-by-project basis.', score: 2 },
          { id: 's4c', text: 'No dedicated innovation budget exists.', score: 1 },
          { id: 's4d', text: 'Unsure.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Readiness',
    icon: '🗄️',
    description: 'Data centralization, quality, governance, and cross-department accessibility.',
    color: '#14b8a6',
    questions: [
      {
        id: 'd1',
        text: 'Is organizational data centralized?',
        options: [
          { id: 'd1a', text: 'Yes — most critical business data is centralized and easily accessible.', score: 3 },
          { id: 'd1b', text: 'Some data is centralized, but significant silos remain.', score: 2 },
          { id: 'd1c', text: 'Data is largely fragmented across systems and departments.', score: 1 },
          { id: 'd1d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'd2',
        text: 'Is data accurate and regularly updated?',
        options: [
          { id: 'd2a', text: 'Yes — data quality is actively managed and regularly reviewed.', score: 3 },
          { id: 'd2b', text: 'Data is generally reliable but occasional quality issues occur.', score: 2 },
          { id: 'd2c', text: 'Data quality issues are common and updates are inconsistent.', score: 1 },
          { id: 'd2d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'd3',
        text: 'Do departments share data effectively?',
        options: [
          { id: 'd3a', text: 'Yes — data is shared seamlessly across departments.', score: 3 },
          { id: 'd3b', text: 'Some departments share data effectively while others operate independently.', score: 2 },
          { id: 'd3c', text: 'Data sharing is limited and mostly siloed.', score: 1 },
          { id: 'd3d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'd4',
        text: 'Are data governance policies established?',
        options: [
          { id: 'd4a', text: 'Yes — formal data governance policies are documented and enforced.', score: 3 },
          { id: 'd4b', text: 'Policies exist but are inconsistently applied.', score: 2 },
          { id: 'd4c', text: 'No formal data governance policies exist.', score: 1 },
          { id: 'd4d', text: 'Unsure.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'technology',
    name: 'Technology Infrastructure',
    icon: '🖥️',
    description: 'Digitization of processes, cloud adoption, system integration capability, and cybersecurity maturity.',
    color: '#8b5cf6',
    questions: [
      {
        id: 't1',
        text: 'Are critical processes digitized?',
        options: [
          { id: 't1a', text: 'Yes — most critical business processes are fully digitized.', score: 3 },
          { id: 't1b', text: 'Several critical processes are digitized, but manual processes remain.', score: 2 },
          { id: 't1c', text: 'Most critical processes are still manual.', score: 1 },
          { id: 't1d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 't2',
        text: 'Do you use cloud platforms?',
        options: [
          { id: 't2a', text: 'Yes — cloud platforms are widely used across the organization.', score: 3 },
          { id: 't2b', text: 'Cloud platforms are used in selected functions or departments.', score: 2 },
          { id: 't2c', text: 'Cloud adoption is minimal or nonexistent.', score: 1 },
          { id: 't2d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 't3',
        text: 'Can existing systems integrate with AI solutions?',
        options: [
          { id: 't3a', text: 'Yes — our systems can easily integrate with AI and emerging technologies.', score: 3 },
          { id: 't3b', text: 'Integration is possible but may require moderate upgrades.', score: 2 },
          { id: 't3c', text: 'Significant system limitations would hinder AI integration.', score: 1 },
          { id: 't3d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 't4',
        text: 'Is cybersecurity maturity adequate?',
        options: [
          { id: 't4a', text: 'Yes — cybersecurity measures are mature and regularly reviewed.', score: 3 },
          { id: 't4b', text: 'Security controls are in place but require further improvement.', score: 2 },
          { id: 't4c', text: 'Cybersecurity capabilities are limited or outdated.', score: 1 },
          { id: 't4d', text: 'Unsure.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'workforce',
    name: 'Workforce Readiness',
    icon: '👥',
    description: 'AI literacy, training programs, technology adoption culture, and digital skills development.',
    color: '#ef6526',
    questions: [
      {
        id: 'w1',
        text: 'Are employees familiar with AI tools?',
        options: [
          { id: 'w1a', text: 'Yes — employees have a strong understanding and regularly use AI tools.', score: 3 },
          { id: 'w1b', text: 'Some employees are familiar with AI tools.', score: 2 },
          { id: 'w1c', text: 'Employee awareness and familiarity are generally low.', score: 1 },
          { id: 'w1d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'w2',
        text: 'Have staff received AI training?',
        options: [
          { id: 'w2a', text: 'Yes — structured AI training programs have been delivered.', score: 3 },
          { id: 'w2b', text: 'Some staff have received AI-related training.', score: 2 },
          { id: 'w2c', text: 'No formal AI training has been provided.', score: 1 },
          { id: 'w2d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'w3',
        text: 'Is there openness to adopting new technologies?',
        options: [
          { id: 'w3a', text: 'Yes — employees actively embrace new technologies and innovation.', score: 3 },
          { id: 'w3b', text: 'Employees are generally open but may require support.', score: 2 },
          { id: 'w3c', text: 'Employees often resist new technologies and change.', score: 1 },
          { id: 'w3d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'w4',
        text: 'Are digital skills gaps being addressed?',
        options: [
          { id: 'w4a', text: 'Yes — digital skills gaps are regularly assessed and addressed.', score: 3 },
          { id: 'w4b', text: 'Skills gaps have been identified but improvement plans are limited.', score: 2 },
          { id: 'w4c', text: 'Skills gaps have not been formally assessed or addressed.', score: 1 },
          { id: 'w4d', text: 'Unsure.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'governance',
    name: 'Governance & Risk',
    icon: '🔒',
    description: 'AI usage policies, privacy compliance, risk management, and ethical AI considerations.',
    color: '#ef4444',
    questions: [
      {
        id: 'g1',
        text: 'Does your organization have AI usage policies?',
        options: [
          { id: 'g1a', text: 'Yes — formal AI usage policies are established and communicated.', score: 3 },
          { id: 'g1b', text: 'AI policies are currently being developed.', score: 2 },
          { id: 'g1c', text: 'No AI usage policies exist.', score: 1 },
          { id: 'g1d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'g2',
        text: 'Are privacy and compliance frameworks established?',
        options: [
          { id: 'g2a', text: 'Yes — privacy and compliance frameworks are documented and enforced.', score: 3 },
          { id: 'g2b', text: 'Some frameworks exist but require strengthening.', score: 2 },
          { id: 'g2c', text: 'No formal privacy or compliance framework exists.', score: 1 },
          { id: 'g2d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'g3',
        text: 'Is AI risk management considered?',
        options: [
          { id: 'g3a', text: 'Yes — AI risks are actively identified, assessed, and managed.', score: 3 },
          { id: 'g3b', text: 'AI risks are occasionally considered during projects.', score: 2 },
          { id: 'g3c', text: 'AI risks are not formally considered.', score: 1 },
          { id: 'g3d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'g4',
        text: 'Are ethical AI considerations documented?',
        options: [
          { id: 'g4a', text: 'Yes — ethical AI guidelines are documented and incorporated into decision-making.', score: 3 },
          { id: 'g4b', text: 'Ethical considerations are discussed informally.', score: 2 },
          { id: 'g4c', text: 'Ethical AI considerations are not documented.', score: 1 },
          { id: 'g4d', text: 'Unsure.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'change',
    name: 'Change Management & Adoption',
    icon: '🔄',
    description: 'User adoption history, change infrastructure, stakeholder engagement, training integration, and adoption metrics.',
    color: '#10b981',
    questions: [
      {
        id: 'c1',
        text: 'Have previous technology implementations achieved strong user adoption?',
        options: [
          { id: 'c1a', text: 'Yes — technology initiatives have consistently achieved high adoption rates.', score: 3 },
          { id: 'c1b', text: 'Adoption has been moderate, with some implementation challenges.', score: 2 },
          { id: 'c1c', text: 'Adoption has generally been low or inconsistent.', score: 1 },
          { id: 'c1d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'c2',
        text: 'Are change champions identified?',
        options: [
          { id: 'c2a', text: 'Yes — change champions are formally identified across teams.', score: 3 },
          { id: 'c2b', text: 'Change champions exist informally in some departments.', score: 2 },
          { id: 'c2c', text: 'No change champions have been identified.', score: 1 },
          { id: 'c2d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'c3',
        text: 'Is stakeholder engagement part of project planning?',
        options: [
          { id: 'c3a', text: 'Yes — stakeholders are actively engaged throughout project planning and implementation.', score: 3 },
          { id: 'c3b', text: 'Stakeholders are consulted occasionally during projects.', score: 2 },
          { id: 'c3c', text: 'Stakeholder engagement is limited or reactive.', score: 1 },
          { id: 'c3d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'c4',
        text: 'Is user training integrated into implementation projects?',
        options: [
          { id: 'c4a', text: 'Yes — training is a core component of every implementation project.', score: 3 },
          { id: 'c4b', text: 'Training is provided for some projects.', score: 2 },
          { id: 'c4c', text: 'User training is rarely included in implementation efforts.', score: 1 },
          { id: 'c4d', text: 'Unsure.', score: 0 },
        ],
      },
      {
        id: 'c5',
        text: 'Are adoption metrics tracked?',
        options: [
          { id: 'c5a', text: 'Yes — adoption and usage metrics are consistently measured and reported.', score: 3 },
          { id: 'c5b', text: 'Some adoption metrics are tracked.', score: 2 },
          { id: 'c5c', text: 'Adoption metrics are not formally tracked.', score: 1 },
          { id: 'c5d', text: 'Unsure.', score: 0 },
        ],
      },
    ],
  },
];

export const levels: Level[] = [
  {
    name: 'AI Explorer',
    min: 0,
    max: 30,
    description: 'Beginning to understand AI opportunities but lacking foundational capabilities.',
    color: '#94a3b8',
    accent: 'slate',
  },
  {
    name: 'AI Builder',
    min: 31,
    max: 60,
    description: 'Establishing the strategy, governance, and capabilities required for AI adoption.',
    color: '#f59e0b',
    accent: 'amber',
  },
  {
    name: 'AI Accelerator',
    min: 61,
    max: 85,
    description: 'Ready to implement and scale AI initiatives across key business functions.',
    color: '#4584ed',
    accent: 'blue',
  },
  {
    name: 'AI Leader',
    min: 86,
    max: 100,
    description: 'AI is embedded into strategy, operations, and decision-making, driving competitive advantage.',
    color: '#10b981',
    accent: 'emerald',
  },
];

const recommendationsMap: Record<PillarId, { low: Recommendation; medium: Recommendation; high: Recommendation }> = {
  strategy: {
    low: {
      text: 'Your organization lacks a formal digital strategy and AI leadership. Without executive sponsorship and clear strategic direction, AI initiatives will struggle to gain traction. Start with a structured Digital Transformation Advisory to build a sector-aligned strategic roadmap.',
      cta: 'Book a Strategy Session',
      ctaLink: '/services#discovery',
    },
    medium: {
      text: 'You have foundational strategy elements in place but gaps remain in execution and sponsorship. Our advisory service can help strengthen strategic alignment, build executive buy-in, and accelerate your AI roadmap.',
      cta: 'Strengthen Your Strategy',
      ctaLink: '/services',
    },
    high: {
      text: 'Strong strategic foundation — your leadership is aligned and AI is part of the planning process. We can help accelerate execution with targeted automation, governance frameworks, and measurable outcomes.',
      cta: 'Accelerate Execution',
      ctaLink: '/services#automation',
    },
  },
  data: {
    low: {
      text: 'Your data is fragmented across systems with no centralized governance. AI without quality data is like an engine without fuel. We recommend a Data Unification Assessment to break down silos and establish a single source of truth.',
      cta: 'Fix Your Data Foundation',
      ctaLink: '/services#discovery',
    },
    medium: {
      text: 'Some data centralization exists but silos and quality issues remain. We can help build a unified data layer that connects your systems, enforces governance, and enables reliable reporting across departments.',
      cta: 'Unify Your Data',
      ctaLink: '/services',
    },
    high: {
      text: 'Your data is clean, centralized, and well-governed. You are ideally positioned to deploy AI agents and automated reporting that draw from trusted data. Let us build your first intelligent workflow.',
      cta: 'Deploy AI Agents',
      ctaLink: '/services#automation',
    },
  },
  technology: {
    low: {
      text: 'Critical processes are still manual and your technology stack needs modernization. Without digitized processes and cloud foundations, AI integration will be costly and complex. Start with IT infrastructure assessment and digitization.',
      cta: 'Modernize Your Infrastructure',
      ctaLink: '/services#itsm',
    },
    medium: {
      text: 'Partial digitization is in place but gaps remain. We can help automate remaining manual processes, expand cloud adoption, and strengthen your cybersecurity posture to prepare for AI integration.',
      cta: 'Complete Your Digital Foundation',
      ctaLink: '/services',
    },
    high: {
      text: 'Your technology infrastructure is mature and AI-ready. With digitized processes and solid cloud foundations, you can deploy agentic AI solutions on your existing Microsoft environment immediately.',
      cta: 'Deploy AI Solutions',
      ctaLink: '/services#automation',
    },
  },
  workforce: {
    low: {
      text: 'AI literacy and digital skills are limited across your organization. Technology adoption starts with people. We recommend structured AI training programs and capability building to prepare your teams for the future of work.',
      cta: 'Build Team Capability',
      ctaLink: '/services#security',
    },
    medium: {
      text: 'Some AI familiarity exists but formal training and skills development programs are needed to scale. We can help design and deliver structured AI upskilling tailored to your teams.',
      cta: 'Develop Your Team',
      ctaLink: '/services',
    },
    high: {
      text: 'Your workforce is AI-ready and open to new technology. We can help deploy AI tools that amplify your team capabilities and drive productivity across the organization.',
      cta: 'Empower Your Team',
      ctaLink: '/services#automation',
    },
  },
  governance: {
    low: {
      text: 'No AI governance, privacy policies, or risk management frameworks are in place. This creates significant compliance and ethical exposure. Establishing governance early is critical before scaling any AI initiative.',
      cta: 'Build Your Governance Framework',
      ctaLink: '/services#discovery',
    },
    medium: {
      text: 'Some policies and frameworks exist but need strengthening and consistent enforcement. We can help mature your governance posture to meet regulatory requirements and industry standards.',
      cta: 'Strengthen Governance',
      ctaLink: '/services#security',
    },
    high: {
      text: 'Strong governance and compliance frameworks are already in place. You can confidently scale AI initiatives knowing your risk management and ethical guardrails are solid.',
      cta: 'Scale with Confidence',
      ctaLink: '/services',
    },
  },
  change: {
    low: {
      text: 'Technology adoption has been inconsistent with no change management infrastructure in place. Without addressing adoption, even the best AI tools will fail to deliver value. Start by building change capability.',
      cta: 'Build Adoption Strategy',
      ctaLink: '/services#discovery',
    },
    medium: {
      text: 'Some adoption practices exist but need formalization and consistency. We can help establish change champion networks, stakeholder engagement frameworks, and adoption tracking to ensure ROI on technology investments.',
      cta: 'Strengthen Adoption',
      ctaLink: '/services',
    },
    high: {
      text: 'Strong adoption practices with measurable results are in place. Your organization is well-positioned to scale AI adoption with confidence and capture value quickly.',
      cta: 'Scale Your Impact',
      ctaLink: '/services#automation',
    },
  },
};

export function getQuestionsForPillars(pillarIds: PillarId[]): Question[] {
  return pillarIds.flatMap((id) => {
    const pillar = pillars.find((p) => p.id === id);
    return pillar ? pillar.questions : [];
  });
}

export function getTotalMaxScore(pillarIds: PillarId[]): number {
  return getQuestionsForPillars(pillarIds).reduce((sum, q) => sum + 3, 0);
}

export function calculateLevel(percentage: number): Level {
  for (const level of levels) {
    if (percentage >= level.min && percentage <= level.max) {
      return level;
    }
  }
  return levels[0];
}

export function getRecommendation(pillarId: PillarId, percentage: number): Recommendation {
  const recs = recommendationsMap[pillarId];
  if (percentage >= 70) return recs.high;
  if (percentage >= 40) return recs.medium;
  return recs.low;
}

export function calculateResults(
  answers: Record<string, string>,
  selectedPillars: PillarId[]
): AssessmentResults {
  const pillarScores: Record<PillarId, PillarScore> = {} as Record<PillarId, PillarScore>;;
  let totalScore = 0;
  let maxScore = 0;

  for (const pillarId of selectedPillars) {
    const pillar = pillars.find((p) => p.id === pillarId);
    if (!pillar) continue;

    let pillarScore = 0;
    const pillarMax = pillar.questions.length * 3;

    for (const question of pillar.questions) {
      const selectedOptionId = answers[question.id];
      const option = question.options.find((o) => o.id === selectedOptionId);
      if (option) {
        pillarScore += option.score;
      }
    }

    pillarScores[pillarId] = {
      score: pillarScore,
      maxScore: pillarMax,
      percentage: Math.round((pillarScore / pillarMax) * 100),
    };

    totalScore += pillarScore;
    maxScore += pillarMax;
  }

  const percentage = Math.round((totalScore / maxScore) * 100);
  const level = calculateLevel(percentage);

  const recommendations: Record<PillarId, Recommendation> = {} as Record<PillarId, Recommendation>;
  for (const pillarId of selectedPillars) {
    recommendations[pillarId] = getRecommendation(pillarId, pillarScores[pillarId].percentage);
  }

  return {
    totalScore,
    maxScore,
    percentage,
    level,
    pillarScores,
    recommendations,
  };
}

export const pillarColors: Record<PillarId, string> = {
  strategy: '#4584ed',
  data: '#14b8a6',
  technology: '#8b5cf6',
  workforce: '#ef6526',
  governance: '#ef4444',
  change: '#10b981',
};

export const pillarOrder: PillarId[] = ['strategy', 'data', 'technology', 'workforce', 'governance', 'change'];

export const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
