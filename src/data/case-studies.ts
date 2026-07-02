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
    id: 'fga-m365-adoption',
    title: 'Driving Digital Adoption and Workforce Transformation in a Public Sector Institution',
    subtitle: 'From Technology Deployment to Workforce Readiness: Driving Microsoft 365 Adoption Across a Federal Government Agency',
    category: 'Government & Public Sector',
    client: 'Federal Government Agency',
    industry: 'Government & Public Sector',
    duration: '5 Days',
    service: 'Digital Transformation & User Adoption',
    summary:
      'A major government institution had recently deployed Microsoft 365 as part of its digital transformation agenda. While the technology infrastructure was in place, adoption remained limited, with many employees still relying on traditional communication methods, local file storage, email attachments, and manual document-sharing processes. The organization recognized that without structured user adoption, capacity building, and change management, the expected benefits of the investment would not be realized.',
    heroImage: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1772714010/download_1_vpqob8.jpg',
    stats: [
      { label: 'Workforce Confidence', value: '90%+' },
      { label: 'Practical Adoption', value: '85%+' },
      { label: 'Training Days', value: '5' },
    ],
    challenge: [
      'Inconsistent use of digital collaboration tools across departments.',
      'Limited awareness of cloud-based document management practices.',
      'Reliance on personal storage devices and email attachments for file sharing.',
      'Low confidence among staff in navigating the Microsoft 365 environment.',
      'Need for improved accountability, transparency, and records management.',
    ],
    solution: [
      'Executive and user awareness sessions to communicate the vision and benefits of digital transformation.',
      'Hands-on practical training focused on real government workplace scenarios and daily workflows.',
      'Real-life government workflow demonstrations across Microsoft 365 tools including Outlook, Teams, SharePoint Online, OneDrive, and security features.',
      'Digital collaboration best practices covering communication, meetings, file sharing, and document co-authoring.',
      'Information security and governance awareness including password security, Multi-Factor Authentication (MFA), and records management.',
      'Change management and adoption support to sustain behaviour change beyond the training programme.',
    ],
    results: [
      'Over 90% of participants reported increased confidence in using Microsoft 365 tools.',
      'More than 85% demonstrated successful completion of practical exercises covering communication, collaboration, and document management tasks.',
      'Staff successfully adopted Microsoft Teams for meetings, collaboration, and file sharing, reducing internal email traffic.',
      'Employees gained practical understanding of structured document storage using SharePoint Online, version control, and permissions management.',
      'Reduced dependence on flash drives and locally stored files through adoption of OneDrive for secure file storage and retrieval.',
      'Improved understanding of password security, Multi-Factor Authentication (MFA), and government information security responsibilities.',
    ],
  },
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
  {
    id: 'bpp-napoms',
    title: 'Bureau of Public Procurement — NAPOMS',
    subtitle: 'From Manual Processes to Intelligent Procurement Governance: Reimagining Officer Management in Nigeria',
    category: 'Government & Public Sector',
    client: 'Bureau of Public Procurement (BPP)',
    industry: 'Government & Public Sector',
    duration: '8 Months',
    service: 'Digital Transformation & Process Automation',
    summary:
      'Public procurement sits at the center of national development. It determines how governments allocate resources, execute infrastructure projects, and deliver public services at a large scale. Yet across many emerging economies, procurement systems continue to struggle with inefficiency, fragmentation, and limited transparency. In Nigeria, procurement officer management has historically relied on manual workflows, paper-heavy records, and opaque administrative processes. Posting decisions often lacked visibility. Training and certification records were scattered across systems. Approvals moved slowly. Accountability mechanisms remained difficult to enforce consistently across Ministries, Departments, and Agencies (MDAs). At a national level, the consequences were significant—not just for operational efficiency, but for public trust. More than a technology initiative, NAPOMS represents a structural shift toward transparency, fairness, and data-driven governance.',
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    stats: [
      { label: 'MDAs Connected', value: 'All Federal' },
      { label: 'Posting Process', value: 'Algorithm-Driven' },
      { label: 'Stakeholder Access', value: 'Real-Time' },
      { label: 'Officer Records', value: 'Centralized & Verified' },
    ],
    challenge: [
      'Manual Officer Management: Procurement postings, approvals, and administrative workflows relied heavily on paper-based processes and manual coordination.',
      'Limited Transparency in Postings: Unequal postings and lobbying practices created perceptions of bias and weakened institutional trust.',
      'Scattered Training & Certification Records: Professional development data existed across disconnected systems and physical files, making verification and compliance difficult.',
      'Slow Administrative Cycles: Officers often waited weeks for approvals, postings, or updates to career records.',
      'Lack of Performance Visibility: Evaluations were largely subjective, with limited standardized metrics for assessing procurement performance across MDAs.',
    ],
    solution: [
      'Enhanced Officer Profiling: Biometric identity verification integrated with NIMC, credential validation, and digital career histories replaced fragmented paper-based records with verified, tamper-resistant profiles.',
      'Algorithm-Driven Postings: Automated assignment workflows introduced transparent rotation rules, conflict-of-interest checks, and auditable posting records—reducing opportunities for bias and lobbying.',
      'Professional Development Framework: Continuous Professional Development (CPD) tracking linked to SPESSE certification and LMS integrations enabled structured career growth and ongoing certification management.',
      'Performance Evaluation System: Data-driven assessments incorporating compliance monitoring, project metrics, and 360-degree feedback replaced inconsistent and subjective review processes.',
      'Real-Time Stakeholder Access: Interactive dashboards provide visibility for MDAs, oversight bodies, contractors, and civil society stakeholders, improving accountability and institutional transparency.',
      'Audit & Governance Controls: Immutable audit trails and activity monitoring ensure traceability across postings, approvals, and officer records.',
    ],
    results: [
      'From Paper-Based to Digital: Officer records, postings, and certifications are now centralized within a structured digital platform, eliminating fragmented paper trails.',
      'From Delayed to Streamlined Processes: Administrative workflows that previously took weeks can now be completed significantly faster through automated approvals and real-time updates.',
      'From Subjective to Data-Driven Evaluations: Performance management now incorporates measurable indicators, compliance metrics, and structured feedback mechanisms.',
      'From Opaque to Transparent Postings: Algorithm-driven assignments reduce bias while creating auditable, traceable decision-making processes.',
      'From Scattered Training Records to Structured Professional Development: Officers now have visibility into certifications, training milestones, and career progression within a unified system.',
      'From Institutional Silos to Shared Governance: Stakeholders across MDAs now operate within a common framework that improves coordination, oversight, and accountability.',
    ],
  },
]

export function getCaseStudy(id: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.id === id)
}

export function getRelatedCaseStudies(currentId: string, count: number = 2): CaseStudy[] {
  return caseStudies.filter((cs) => cs.id !== currentId).slice(0, count)
}
