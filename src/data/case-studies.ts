export interface CaseStudy {
  id: string
  title: string
  subtitle: string
  category: string
  client: string
  industry: string
  duration: string
  service: string
  summary: string
  heroImage: string
  stats: { label: string; value: string }[]
  challenge: string[]
  solution: string[]
  results: string[]
  testimonial?: { quote: string; name: string; role: string }
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'fmog-cims',
    title: 'Federal Ministry of Justice — CIMS',
    subtitle: 'Case Management System Modernisation',
    category: 'Government & Public Sector',
    client: 'Federal Ministry of Justice (FMOJ)',
    industry: 'Government & Legal',
    duration: '6 Months',
    service: 'Digital Transformation & Process Automation',
    summary:
      'A complete digital overhaul of the Federal Ministry of Justice\'s case management operations — replacing manual, paper-based workflows with an intelligent, automated system that cut processing time by 70% and eliminated case loss.',
    heroImage: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1778489905/min-of-justice_eboxix.jpg',
    stats: [
      { label: 'Processing Time Reduced', value: '70%' },
      { label: 'Case Loss Rate', value: '0%' },
      { label: 'System Uptime', value: '99.9%' },
      { label: 'Users Trained', value: '500+' },
    ],
    challenge: [
      'Paper-based case files were frequently lost or misfiled, causing critical legal delays.',
      'No central repository for case documents — each department maintained isolated records.',
      'Manual assignment and tracking of cases led to uneven workloads and missed deadlines.',
      'Generating periodic reports required days of manual data collation.',
      'Citizens had no visibility into case progress, causing frequent follow-up visits.',
    ],
    solution: [
      'Designed and deployed a web-based Centralised Case Management System (CIMS) with role-based access for judges, clerks, legal officers, and administrators.',
      'Implemented a digital document management module with OCR-based indexing for rapid retrieval.',
      'Built an intelligent case assignment engine that distributes cases based on workload and expertise.',
      'Created real-time dashboards for leadership with case volumes, aging reports, and performance metrics.',
      'Integrated SMS and email notifications for case parties on key milestones.',
      'Delivered hands-on training to 500+ users across 36 states over 4 weeks.',
    ],
    results: [
      'Case processing time reduced from an average of 14 days to 4 days — a 70% improvement.',
      'Zero case loss recorded since deployment, compared to 15+ lost cases per quarter previously.',
      'Report generation time slashed from 3 days to under 30 minutes.',
      'Citizen satisfaction improved significantly with transparent case tracking.',
      'System scaled to handle 10,000+ concurrent cases with 99.9% uptime.',
    ],
    testimonial: {
      quote: 'This system has fundamentally changed how we work. What used to take weeks now takes days. Our officers can focus on legal work instead of chasing paper.',
      name: 'Director of ICT, FMOJ',
      role: 'Federal Ministry of Justice',
    },
  },
  {
    id: 'nmrc-hmip',
    title: 'NMRC — Housing Microfinance Innovation Platform',
    subtitle: 'Digital Lending & Portfolio Management Platform',
    category: 'Financial Services',
    client: 'Nigeria Mortgage Refinance Company (NMRC)',
    industry: 'Financial Services & Housing',
    duration: '8 Months',
    service: 'Platform Development & Data Integration',
    summary:
      'Built a digital housing microfinance platform enabling NMRC to originate, process, and manage microfinance loans end-to-end — bringing formal housing finance to previously unbanked populations across Nigeria.',
    heroImage: 'https://res.cloudinary.com/daqmbfctv/image/upload/t_nmrc/AUHF-blog_featured-image_NMRC-1024x341_lrttwz.jpg',
    stats: [
      { label: 'Loans Processed Monthly', value: '5,000+' },
      { label: 'Portfolio Growth', value: '200%' },
      { label: 'Approval Time', value: '48hrs' },
      { label: 'States Covered', value: '24' },
    ],
    challenge: [
      'NMRC\'s microfinance operations relied on fragmented spreadsheets and manual processes across partner banks.',
      'Loan application to disbursement cycle averaged 3–4 weeks due to manual verification steps.',
      'No unified view of borrower history across the lending ecosystem, increasing default risk.',
      'Partner Primary Mortgage Banks (PMBs) used different systems with no standard data format.',
      'Regulatory reporting required weeks of manual data reconciliation from multiple sources.',
    ],
    solution: [
      'Developed the Housing Microfinance Innovation Platform (HMIP) — a cloud-based loan origination and portfolio management system.',
      'Built a unified borrower onboarding module with biometric verification, credit bureau integration, and automated KYC checks.',
      'Created a rules-based underwriting engine that reduced approval decisions from weeks to hours.',
      'Implemented a partner portal for PMBs to submit, track, and manage loan applications in real time.',
      'Designed an automated regulatory reporting dashboard that generates CBN-compliant reports on demand.',
      'Integrated payment gateway for direct disbursement and repayment collection.',
    ],
    results: [
      'Monthly loan processing capacity increased from 500 to 5,000+ loans.',
      'Loan approval cycle compressed from 3–4 weeks to under 48 hours.',
      'Portfolio grew by 200% within the first 6 months of platform launch.',
      'Default rate decreased by 35% through improved borrower verification and credit checks.',
      'Regulatory reporting effort reduced from 2 weeks to real-time dashboard access.',
      'Expanded reach to 24 states through seamless partner bank onboarding.',
    ],
    testimonial: {
      quote: 'The HMIP platform has been transformative for our microfinance operations. We\'re now processing loans at a scale and speed we never thought possible.',
      name: 'CEO, NMRC',
      role: 'Nigeria Mortgage Refinance Company',
    },
  },
]

export function getCaseStudy(id: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.id === id)
}

export function getRelatedCaseStudies(currentId: string, count: number = 2): CaseStudy[] {
  return caseStudies.filter((cs) => cs.id !== currentId).slice(0, count)
}
