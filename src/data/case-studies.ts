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
    subtitle: 'From Paper Trails to Real-Time Justice: Reimagining Criminal Data Management in Nigeria',
    category: 'Government & Public Sector',
    client: 'Federal Ministry of Justice (FMOJ)',
    industry: 'Government & Legal',
    duration: '6 Months',
    service: 'Digital Transformation & Process Automation',
    summary:
      'Nigeria\'s justice system is undergoing a critical shift, one driven not by policy alone, but by the urgent need for structured, reliable, and real-time data. For decades, law enforcement agencies across the country have generated vast amounts of operational data daily. Yet the real challenge was never volume; it was fragmentation.',
    heroImage: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1778489905/min-of-justice_eboxix.jpg',
    stats: [
      { label: 'Agencies Integrated', value: '5' },
      { label: 'Data Flow', value: 'Real-Time' },
      { label: 'Decision-Making', value: 'Data-Driven' },
      { label: 'Cross-Agency Collaboration', value: 'Unified' },
    ],
    challenge: [
      'Fragmented Records: Each agency operates independently, maintaining its own formats and systems. At the national level, this resulted in duplicated efforts and irreconcilable data.',
      'Manual Processes: Paper-based and inconsistent data capture led to incomplete and inaccurate records, undermining analysis.',
      'Delayed Reporting: Information moved periodically rather than continuously, creating a lag between real-world events and institutional awareness.',
      'Agency Silos: Without a shared platform, coordination across institutions broke down, affecting everything from case management to detainee tracking.',
      'No Real-Time Insight: Policy makers lacked a live, unified view of justice system activities, forcing reactive rather than proactive decision-making.',
    ],
    solution: [
      'Standardized Data Capture: Replacing inconsistent, manual formats with structured inputs across all connected agencies.',
      'Unified Dashboard: Providing the Ministry of Justice with a consolidated, real-time view of criminal and detention data.',
      'Agency-Level Onboarding: Training users not just on system functionality, but on how it fits into their operational routines.',
      'Hands-On Implementation: Supporting adoption through real-world usage, ensuring the system becomes embedded, not just installed.',
    ],
    results: [
      'From Fragmented to Unified: Data once scattered across agencies is now centralized within a single, structured system.',
      'From Delayed to Real-Time: Decision-makers can now access up-to-date information as events are recorded.',
      'From Guesswork to Insight: Clear visibility into trends and patterns enables more informed, data-driven actions.',
      'From Silos to Collaboration: Agencies now operate within a shared ecosystem, improving coordination and consistency.',
      'From Delivery to Adoption: Most critically, the system is actively used and embedded into daily operations rather than sitting as unused infrastructure.',
    ],
    testimonial: {
      quote: 'This system has fundamentally changed how we work. What used to take weeks now takes days. Our officers can focus on legal work instead of chasing paper.',
      name: 'Director of ICT, FMOJ',
      role: 'Federal Ministry of Justice',
    },
  },
  {
    id: 'nmrc-hmip',
    title: 'NMRC — Housing Market Information Platform',
    subtitle: 'From Data Silos to Market Intelligence: Rebuilding Nigeria\'s Housing Data Infrastructure',
    category: 'Financial Services',
    client: 'Nigeria Mortgage Refinance Company (NMRC)',
    industry: 'Financial Services & Housing',
    duration: '8 Months',
    service: 'Platform Development & Data Integration',
    summary:
      'Nigeria\'s housing sector is at a turning point—one defined not just by demand, but by the quality of data driving billion-naira decisions. With a national housing deficit exceeding 14 million units, the need for coordinated investment, policy, and reform has never been more urgent. Yet for years, the biggest constraint wasn\'t capital—it was information.',
    heroImage: 'https://res.cloudinary.com/daqmbfctv/image/upload/t_nmrc/AUHF-blog_featured-image_NMRC-1024x341_lrttwz.jpg',
    stats: [
      { label: 'Housing Deficit', value: '14M+ Units' },
      { label: 'Institutions Connected', value: '14' },
      { label: 'Report Generation', value: 'Real-Time' },
      { label: 'Data Ecosystem', value: 'Unified & Verified' },
    ],
    challenge: [
      'Siloed Institutions: Over 14 agencies held housing data with no interoperability, leaving investors and policymakers to work with conflicting or incomplete information.',
      'Undigitized Records: State-level title registrations remained largely paper-based, making it difficult to establish reliable baselines for property valuation and mortgage underwriting.',
      'Slow Reporting Cycles: Data collation required weeks of manual effort, delaying critical decisions.',
      'No Investment-Grade Data: Analysts lack verified, standardized datasets across states, reducing investor confidence and slowing market growth.',
      'Policy Blind Spots: Without real-time visibility into supply, demand, and affordability, policy decisions were built on assumptions rather than evidence.',
    ],
    solution: [
      'Centralized Data Aggregation: Verified housing data from 14 national institutions consolidated into one structured environment.',
      'Interactive Dashboards: Real-time visualization of title registrations, market activity, and state-level trends.',
      'Role-Based Access: Customized access for regulators, investors, agents, and researchers based on their needs.',
      'Automatic Standardization: Data inconsistencies resolved through unified formatting and validation rules.',
      'Audit and Transparency Tools: Full traceability through download tracking, user activity logs, and data archiving.',
      'Scalable Architecture: Designed to expand into rental markets, supply pipelines, price trends, and beyond.',
    ],
    results: [
      'From Fragmented to Centralized: Data across institutions is now unified within a single, accessible platform.',
      'From Weeks to Minutes: Reports that once took weeks to compile are now generated instantly.',
      'From Assumptions to Evidence: Decision-makers now rely on verified, standardized datasets for the first time.',
      'From Silos to Shared Intelligence: Institutions are connected through a common data framework, improving collaboration.',
      'From Opacity to Transparency: Built-in audit trails and access tracking ensure accountability across the ecosystem.',
    ],
  },
]

export function getCaseStudy(id: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.id === id)
}

export function getRelatedCaseStudies(currentId: string, count: number = 2): CaseStudy[] {
  return caseStudies.filter((cs) => cs.id !== currentId).slice(0, count)
}
