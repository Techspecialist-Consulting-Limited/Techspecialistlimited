export type PillarId = 'strategy' | 'data' | 'technology' | 'workforce' | 'governance' | 'change' | 'security';

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
  narrative: string;
  insight: string;
  nextSteps: string[];
  priorityAreas: string[];
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
    description: 'Strategic alignment, executive sponsorship, and innovation budgeting at the leadership level.',
    color: '#4584ed',
    questions: [
      {
        id: 's1',
        text: 'Does your organization have a digital transformation strategy?',
        options: [
          { id: 's1a', text: 'We have a documented digital transformation strategy that is actively executed, monitored, and reviewed.', score: 3 },
          { id: 's1b', text: 'We have a documented strategy, but execution is still ongoing or inconsistent.', score: 2 },
          { id: 's1c', text: 'We are discussing or drafting a strategy, but it is not yet formalized.', score: 1 },
          { id: 's1d', text: 'We do not currently have a digital transformation strategy.', score: 0 },
        ],
      },
      {
        id: 's2',
        text: 'Is AI included in strategic discussions?',
        options: [
          { id: 's2a', text: 'AI is regularly discussed and incorporated into strategic planning and decision-making.', score: 3 },
          { id: 's2b', text: 'AI is discussed occasionally and is gaining leadership attention.', score: 2 },
          { id: 's2c', text: 'AI discussions are informal and not yet linked to strategic priorities.', score: 1 },
          { id: 's2d', text: 'AI is not currently part of strategic discussions.', score: 0 },
        ],
      },
      {
        id: 's3',
        text: 'Is there executive sponsorship for AI initiatives?',
        options: [
          { id: 's3a', text: 'Senior leaders actively champion, fund, and drive AI initiatives.', score: 3 },
          { id: 's3b', text: 'Leadership supports AI initiatives, but involvement is limited.', score: 2 },
          { id: 's3c', text: 'A few leaders have expressed interest, but no clear sponsorship exists.', score: 1 },
          { id: 's3d', text: 'There is no executive sponsorship for AI initiatives.', score: 0 },
        ],
      },
      {
        id: 's4',
        text: 'Is a budget allocated for innovation projects?',
        options: [
          { id: 's4a', text: 'Dedicated funding exists for innovation, digital transformation, and AI initiatives.', score: 3 },
          { id: 's4b', text: 'Funding is available for selected projects when approved.', score: 2 },
          { id: 's4c', text: 'Innovation initiatives compete for funding, but no dedicated budget exists.', score: 1 },
          { id: 's4d', text: 'No budget has been allocated for innovation initiatives.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Readiness',
    description: 'Data centralization, quality, governance, and cross-department accessibility.',
    color: '#14b8a6',
    questions: [
      {
        id: 'd1',
        text: 'Is organizational data centralized?',
        options: [
          { id: 'd1a', text: 'Critical business data is centralized, accessible, and integrated across systems.', score: 3 },
          { id: 'd1b', text: 'Most data are centralized, though some silos remain.', score: 2 },
          { id: 'd1c', text: 'Data is partially centralized but remains fragmented across departments.', score: 1 },
          { id: 'd1d', text: 'Data is largely siloed and difficult to access.', score: 0 },
        ],
      },
      {
        id: 'd2',
        text: 'Is data accurate and regularly updated?',
        options: [
          { id: 'd2a', text: 'Data quality is actively managed through defined processes and governance.', score: 3 },
          { id: 'd2b', text: 'Data is generally reliable with occasional quality issues.', score: 2 },
          { id: 'd2c', text: 'Data quality problems occur frequently and are handled reactively.', score: 1 },
          { id: 'd2d', text: 'Data quality is not actively managed.', score: 0 },
        ],
      },
      {
        id: 'd3',
        text: 'Do departments share data effectively?',
        options: [
          { id: 'd3a', text: 'Departments share data seamlessly and collaborate using common information sources.', score: 3 },
          { id: 'd3b', text: 'Most departments share data, though inconsistencies exist.', score: 2 },
          { id: 'd3c', text: 'Data sharing occurs occasionally but remains limited.', score: 1 },
          { id: 'd3d', text: 'Departments largely operate in data silos.', score: 0 },
        ],
      },
      {
        id: 'd4',
        text: 'Are data governance policies established?',
        options: [
          { id: 'd4a', text: 'Formal governance policies are documented, enforced, and regularly reviewed.', score: 3 },
          { id: 'd4b', text: 'Governance policies exist but are inconsistently applied.', score: 2 },
          { id: 'd4c', text: 'Basic governance practices exist but are largely informal.', score: 1 },
          { id: 'd4d', text: 'No formal data governance framework exists.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'technology',
    name: 'Technology Infrastructure',
    description: 'Digitization of processes, cloud adoption, system integration capability, and cybersecurity maturity.',
    color: '#8b5cf6',
    questions: [
      {
        id: 't1',
        text: 'Are critical processes digitized?',
        options: [
          { id: 't1a', text: 'Most critical business processes are fully digitized and optimized.', score: 3 },
          { id: 't1b', text: 'Several critical processes are digitized, though manual work remains.', score: 2 },
          { id: 't1c', text: 'Limited digitization exists across key processes.', score: 1 },
          { id: 't1d', text: 'Most critical processes remain manual.', score: 0 },
        ],
      },
      {
        id: 't2',
        text: 'Do you use cloud platforms?',
        options: [
          { id: 't2a', text: 'Cloud platforms are widely used across the organization.', score: 3 },
          { id: 't2b', text: 'Cloud technologies are used in multiple departments.', score: 2 },
          { id: 't2c', text: 'Cloud adoption is limited to a few applications.', score: 1 },
          { id: 't2d', text: 'Cloud platforms are not actively used.', score: 0 },
        ],
      },
      {
        id: 't3',
        text: 'Can existing systems integrate with AI solutions?',
        options: [
          { id: 't3a', text: 'Our systems are modern and integration-ready.', score: 3 },
          { id: 't3b', text: 'Most systems can integrate with moderate upgrades.', score: 2 },
          { id: 't3c', text: 'Significant integration work would be required.', score: 1 },
          { id: 't3d', text: 'Current systems would require major replacement before AI adoption.', score: 0 },
        ],
      },
      {
        id: 't4',
        text: 'Is cybersecurity maturity adequate?',
        options: [
          { id: 't4a', text: 'Cybersecurity practices are mature, monitored, and regularly improved.', score: 3 },
          { id: 't4b', text: 'Strong controls exist but improvement opportunities remain.', score: 2 },
          { id: 't4c', text: 'Basic security measures exist but are not comprehensive.', score: 1 },
          { id: 't4d', text: 'Cybersecurity capabilities are limited or outdated.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'workforce',
    name: 'Workforce Readiness',
    description: 'AI literacy, training programs, technology adoption culture, and digital skills development.',
    color: '#ef6526',
    questions: [
      {
        id: 'w1',
        text: 'Are employees familiar with AI tools?',
        options: [
          { id: 'w1a', text: 'Employees have strong awareness and regularly use AI-enabled tools.', score: 3 },
          { id: 'w1b', text: 'Many employees understand AI concepts and some use AI tools.', score: 2 },
          { id: 'w1c', text: 'Awareness exists, but practical usage is limited.', score: 1 },
          { id: 'w1d', text: 'Most employees have little or no exposure to AI tools.', score: 0 },
        ],
      },
      {
        id: 'w2',
        text: 'Have staff received AI training?',
        options: [
          { id: 'w2a', text: 'Structured AI training programs are available and widely adopted.', score: 3 },
          { id: 'w2b', text: 'Selected teams or employees have received AI training.', score: 2 },
          { id: 'w2c', text: 'Limited awareness sessions or introductory training have been conducted.', score: 1 },
          { id: 'w2d', text: 'No AI training has been provided.', score: 0 },
        ],
      },
      {
        id: 'w3',
        text: 'Is there openness to adopting new technologies?',
        options: [
          { id: 'w3a', text: 'Employees actively embrace innovation and technology adoption.', score: 3 },
          { id: 'w3b', text: 'Most employees are receptive but may require support.', score: 2 },
          { id: 'w3c', text: 'Adoption varies significantly across teams.', score: 1 },
          { id: 'w3d', text: 'Resistance to new technologies is common.', score: 0 },
        ],
      },
      {
        id: 'w4',
        text: 'Are digital skills gaps being addressed?',
        options: [
          { id: 'w4a', text: 'Skills gaps are regularly assessed and addressed through development programs.', score: 3 },
          { id: 'w4b', text: 'Skills gaps have been identified and some initiatives are underway.', score: 2 },
          { id: 'w4c', text: 'Skills gaps are recognized but no formal plan exists.', score: 1 },
          { id: 'w4d', text: 'Skills gaps have not been assessed.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'governance',
    name: 'Governance & Risk',
    description: 'AI usage policies, privacy compliance, risk management, and ethical AI considerations.',
    color: '#ef4444',
    questions: [
      {
        id: 'g1',
        text: 'Does your organization have AI usage policies?',
        options: [
          { id: 'g1a', text: 'Formal AI policies exist and are communicated across the organization.', score: 3 },
          { id: 'g1b', text: 'Policies are being developed or piloted.', score: 2 },
          { id: 'g1c', text: 'Discussions have started, but no formal policy exists.', score: 1 },
          { id: 'g1d', text: 'No AI usage policies exist.', score: 0 },
        ],
      },
      {
        id: 'g2',
        text: 'Are privacy and compliance frameworks established?',
        options: [
          { id: 'g2a', text: 'Privacy and compliance requirements are documented, monitored, and enforced.', score: 3 },
          { id: 'g2b', text: 'Frameworks exist but require strengthening.', score: 2 },
          { id: 'g2c', text: 'Compliance is addressed on a case-by-case basis.', score: 1 },
          { id: 'g2d', text: 'No formal privacy or compliance framework exists.', score: 0 },
        ],
      },
      {
        id: 'g3',
        text: 'Is AI risk management considered?',
        options: [
          { id: 'g3a', text: 'AI risks are proactively identified, assessed, and managed.', score: 3 },
          { id: 'g3b', text: 'AI risks are considered during major projects.', score: 2 },
          { id: 'g3c', text: 'Risk discussions occur occasionally but lack structure.', score: 1 },
          { id: 'g3d', text: 'AI risks are not formally considered.', score: 0 },
        ],
      },
      {
        id: 'g4',
        text: 'Are ethical AI considerations documented?',
        options: [
          { id: 'g4a', text: 'Ethical AI principles are documented and embedded into decision-making.', score: 3 },
          { id: 'g4b', text: 'Ethical considerations are discussed and partially documented.', score: 2 },
          { id: 'g4c', text: 'Ethics are considered informally.', score: 1 },
          { id: 'g4d', text: 'Ethical AI considerations are not addressed.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'change',
    name: 'Change Management & Adoption',
    description: 'User adoption history, change infrastructure, stakeholder engagement, training integration, and adoption metrics.',
    color: '#10b981',
    questions: [
      {
        id: 'c1',
        text: 'Have previous technology implementations achieved strong user adoption?',
        options: [
          { id: 'c1a', text: 'Technology initiatives consistently achieve strong user adoption and measurable outcomes.', score: 3 },
          { id: 'c1b', text: 'Most implementations achieve acceptable adoption levels.', score: 2 },
          { id: 'c1c', text: 'Adoption outcomes vary significantly between projects.', score: 1 },
          { id: 'c1d', text: 'Technology initiatives frequently struggle with adoption.', score: 0 },
        ],
      },
      {
        id: 'c2',
        text: 'Are change champions identified?',
        options: [
          { id: 'c2a', text: 'Formal change champions are identified and actively engaged across teams.', score: 3 },
          { id: 'c2b', text: 'Change champions exist in some departments.', score: 2 },
          { id: 'c2c', text: 'Informal advocates support change efforts when needed.', score: 1 },
          { id: 'c2d', text: 'No change champions have been identified.', score: 0 },
        ],
      },
      {
        id: 'c3',
        text: 'Is stakeholder engagement part of project planning?',
        options: [
          { id: 'c3a', text: 'Stakeholders are actively involved throughout planning and implementation.', score: 3 },
          { id: 'c3b', text: 'Stakeholders are engaged at key project milestones.', score: 2 },
          { id: 'c3c', text: 'Stakeholder engagement is limited and reactive.', score: 1 },
          { id: 'c3d', text: 'Projects are typically executed without structured stakeholder engagement.', score: 0 },
        ],
      },
      {
        id: 'c4',
        text: 'Is user training integrated into implementation projects?',
        options: [
          { id: 'c4a', text: 'Training is a standard component of all implementation projects.', score: 3 },
          { id: 'c4b', text: 'Training is provided for most projects.', score: 2 },
          { id: 'c4c', text: 'Training is offered occasionally.', score: 1 },
          { id: 'c4d', text: 'Training is rarely included.', score: 0 },
        ],
      },
      {
        id: 'c5',
        text: 'Are adoption metrics tracked?',
        options: [
          { id: 'c5a', text: 'Adoption, engagement, and business impact metrics are consistently measured.', score: 3 },
          { id: 'c5b', text: 'Key adoption metrics are tracked for major projects.', score: 2 },
          { id: 'c5c', text: 'Some adoption data is collected informally.', score: 1 },
          { id: 'c5d', text: 'Adoption metrics are not measured.', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'security',
    name: 'AI Security',
    description: 'AI usage policies, staff awareness, vendor data handling, and incident readiness specific to AI tools.',
    color: '#6366f1',
    questions: [
      {
        id: 'sec1',
        text: 'Do you have a written AI acceptable use policy?',
        options: [
          { id: 'sec1a', text: 'A documented policy exists, is enforced, and is communicated organisation-wide.', score: 3 },
          { id: 'sec1b', text: 'A policy has been drafted but enforcement is inconsistent.', score: 2 },
          { id: 'sec1c', text: 'Only informal guidance exists.', score: 1 },
          { id: 'sec1d', text: 'No AI acceptable use policy exists.', score: 0 },
        ],
      },
      {
        id: 'sec2',
        text: 'Is there a named owner responsible for AI governance and security?',
        options: [
          { id: 'sec2a', text: 'A named person holds clear accountability for AI governance and security.', score: 3 },
          { id: 'sec2b', text: 'Responsibility is shared across teams without a single owner.', score: 2 },
          { id: 'sec2c', text: 'IT handles this informally alongside other duties.', score: 1 },
          { id: 'sec2d', text: 'Nobody is responsible for AI governance or security.', score: 0 },
        ],
      },
      {
        id: 'sec3',
        text: 'Do staff know which categories of data cannot be entered into AI tools?',
        options: [
          { id: 'sec3a', text: 'Clear rules exist and are well understood across the organisation.', score: 3 },
          { id: 'sec3b', text: 'General guidance exists but is not consistently followed.', score: 2 },
          { id: 'sec3c', text: 'Staff are expected to use judgement, with no formal communication.', score: 1 },
          { id: 'sec3d', text: 'No restrictions have been communicated to staff.', score: 0 },
        ],
      },
      {
        id: 'sec4',
        text: 'Have staff been trained on AI-related security threats, such as AI-generated phishing or impersonation?',
        options: [
          { id: 'sec4a', text: 'Training is delivered regularly and updated as threats evolve.', score: 3 },
          { id: 'sec4b', text: 'A one-time training session has been delivered.', score: 2 },
          { id: 'sec4c', text: 'Only general security awareness training has been given, without AI-specific content.', score: 1 },
          { id: 'sec4d', text: 'No relevant training has been provided.', score: 0 },
        ],
      },
      {
        id: 'sec5',
        text: 'Do your vendor agreements address how vendors use AI and handle data?',
        options: [
          { id: 'sec5a', text: 'Data processing agreements cover all vendors handling sensitive data through AI tools.', score: 3 },
          { id: 'sec5b', text: 'Agreements exist for some, but not all, relevant vendors.', score: 2 },
          { id: 'sec5c', text: 'Standard contracts are used, with no AI-specific clauses.', score: 1 },
          { id: 'sec5d', text: 'No formal agreements address vendor AI or data handling.', score: 0 },
        ],
      },
      {
        id: 'sec6',
        text: 'Do you have an incident response plan that has been tested and covers AI-related scenarios?',
        options: [
          { id: 'sec6a', text: 'The plan has been tested in the past 12 months and explicitly covers AI-related breaches or fraud.', score: 3 },
          { id: 'sec6b', text: 'A plan exists but has not been tested or does not address AI scenarios.', score: 2 },
          { id: 'sec6c', text: 'Incident response is handled informally, without a documented plan.', score: 1 },
          { id: 'sec6d', text: 'No incident response plan exists.', score: 0 },
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
    narrative: 'Your organization recognizes that AI is important, but the foundations required for successful adoption are still largely undeveloped. At this stage, AI conversations may be happening informally, but key elements such as strategy, governance, workforce readiness, and data maturity are either missing or not yet coordinated. This doesn\'t mean you\'re behind; it simply means you\'re at the beginning of the journey.',
    insight: 'The biggest risk is not failing to adopt AI. It\'s investing in AI tools before your organization is ready to support them. Without clear direction, AI initiatives often become isolated experiments that struggle to deliver meaningful business value.',
    nextSteps: [
      'Establish leadership alignment and a clear AI vision',
      'Conduct a data readiness assessment and build infrastructure plans',
      'Launch workforce AI awareness and literacy programmes',
      'Develop foundational governance and risk frameworks',
    ],
    priorityAreas: [
      'Leadership alignment',
      'AI strategy development',
      'Data readiness',
      'Workforce awareness',
      'Governance and risk frameworks',
    ],
  },
  {
    name: 'AI Builder',
    min: 31,
    max: 60,
    description: 'Establishing the strategy, governance, and capabilities required for AI adoption.',
    color: '#f59e0b',
    accent: 'amber',
    narrative: 'Your organization has moved beyond awareness and has started laying the groundwork for AI adoption. There is evidence of progress, whether through leadership interest, technology investments, pilot projects, or emerging governance structures. However, readiness is uneven across the organization, and several critical capabilities are still developing.',
    insight: 'The intent is there, but the structure is still catching up. Many organizations at this stage underestimate the importance of change management, governance, and workforce readiness. As a result, AI initiatives may generate excitement but struggle to achieve sustained adoption or measurable outcomes. The opportunity now is to move from experimentation to preparation.',
    nextSteps: [
      'Strengthen governance frameworks and AI usage policies',
      'Build workforce capability through structured training programmes',
      'Standardise and digitise critical business processes',
      'Prioritise high-impact AI use cases with clear business cases',
      'Assign executive sponsorship and accountability for AI initiatives',
    ],
    priorityAreas: [
      'Governance and policy development',
      'Workforce capability building',
      'Process standardisation',
      'AI use case prioritisation',
      'Executive sponsorship and accountability',
    ],
  },
  {
    name: 'AI Accelerator',
    min: 61,
    max: 85,
    description: 'Ready to implement and scale AI initiatives across key business functions.',
    color: '#4584ed',
    accent: 'blue',
    narrative: 'Your organization has established many of the capabilities required for successful AI adoption. Leadership is engaged, foundational systems are in place, and there is growing readiness across people, processes, and technology. You are no longer asking whether AI matters \u2014 you are determining how to generate value from it.',
    insight: 'The challenge at this stage is not readiness \u2014 it\u2019s scale. Many organizations in this category successfully launch pilots but struggle to expand adoption across teams, departments, and business functions. Without a coordinated approach, momentum can stall, and early gains may never translate into enterprise-wide impact. Your organization is well-positioned to move beyond experimentation and begin embedding AI into day-to-day operations.',
    nextSteps: [
      'Develop an enterprise-wide AI adoption and rollout plan',
      'Launch change management and communications programmes',
      'Mature governance frameworks to meet compliance requirements',
      'Integrate AI across cross-functional workflows and systems',
      'Define and track business outcome metrics for AI initiatives',
    ],
    priorityAreas: [
      'Enterprise-wide adoption planning',
      'Change management programmes',
      'Governance maturity',
      'Cross-functional integration',
      'Measurement of business outcomes',
    ],
  },
  {
    name: 'AI Leader',
    min: 86,
    max: 100,
    description: 'AI is embedded into strategy, operations, and decision-making, driving competitive advantage.',
    color: '#10b981',
    accent: 'emerald',
    narrative: 'Your organization demonstrates a high level of AI readiness and maturity. AI is not viewed as a standalone initiative; it is becoming part of how decisions are made, processes are optimised, and opportunities are identified across the business. You have established strong foundations across leadership, governance, technology, workforce readiness, and operational execution.',
    insight: 'The question is no longer \u201cAre we ready for AI?\u201d \u2014 it\u2019s \u201cHow do we maximise the value AI can create across the organisation?\u201d Organizations at this stage are often focused on scaling innovation, improving governance, identifying new opportunities, and maintaining a competitive edge as AI capabilities evolve.',
    nextSteps: [
      'Implement advanced AI governance and responsible AI frameworks',
      'Optimise AI across the entire organisation, not just isolated functions',
      'Build continuous workforce upskilling and talent development programmes',
      'Drive innovation programmes that create competitive differentiation',
      'Establish thought leadership and ecosystem partnerships',
    ],
    priorityAreas: [
      'Advanced AI governance',
      'Organisation-wide AI optimisation',
      'Continuous workforce upskilling',
      'Responsible AI leadership',
      'Innovation and competitive differentiation',
    ],
  },
];

export const recommendationsMap: Record<PillarId, { low: Recommendation; medium: Recommendation; high: Recommendation }> = {
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
  security: {
    low: {
      text: 'Your organization has no formal AI security policy, named governance owner, or tested incident response plan. This creates real exposure to data leakage, AI-generated fraud, and compliance failures. We recommend an AI Security Audit to establish baseline protections immediately.',
      cta: 'Secure Your AI Usage',
      ctaLink: '/services#security',
    },
    medium: {
      text: 'Some AI security foundations exist, but gaps remain in staff training, vendor oversight, or incident readiness. We can help close these gaps with a structured security hardening plan tailored to how your teams actually use AI.',
      cta: 'Strengthen Your Security Posture',
      ctaLink: '/services#security',
    },
    high: {
      text: 'Strong AI security governance, staff training, and incident readiness are already in place. You are well-positioned to scale AI adoption without compounding your risk exposure.',
      cta: 'Maintain Your Edge',
      ctaLink: '/services',
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
  security: '#6366f1',
};

export const pillarOrder: PillarId[] = ['strategy', 'data', 'technology', 'workforce', 'governance', 'change', 'security'];

export const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
