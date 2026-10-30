/**
 * Mock recruitment database and query utilities for Phase F2.
 * Structured to seamlessly map to future Spring Boot REST API endpoints:
 * GET /api/v1/jobs
 * GET /api/v1/jobs/{id}
 * GET /api/v1/categories
 */

export const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    company: 'TechCorp Solutions',
    companyLogoColor: '#2563eb',
    location: 'Bangalore, India',
    locationType: 'Hybrid',
    type: 'Full-time',
    salary: '₹18 - 26 LPA',
    numericSalary: 2200000,
    experience: '4-6 Years',
    experienceLevel: 'Mid',
    category: 'Engineering',
    featured: true,
    urgent: true,
    postedDate: '2 days ago',
    applicantsCount: 48,
    tags: ['React', 'Spring Boot', 'PostgreSQL', 'Docker', 'AWS'],
    description:
      'TechCorp Solutions is searching for a Senior Full Stack Engineer to lead our core product architecture. In this role, you will drive the development of scalable cloud-native microservices, craft responsive modern user interfaces, and collaborate with cross-functional teams to deliver enterprise-grade software.',
    responsibilities: [
      'Architect resilient and scalable RESTful APIs using Spring Boot and Java 21.',
      'Build responsive, highly accessible web interfaces with React, modern CSS, and component design systems.',
      'Participate in code reviews, technical architecture sessions, and automated testing pipelines.',
      'Optimize database queries and schema designs on PostgreSQL for high throughput.',
      'Mentor junior software engineers and champion engineering excellence.'
    ],
    requirements: [
      '4+ years of professional full-stack development experience.',
      'Strong proficiency in modern JavaScript/TypeScript and React ecosystem.',
      'Deep expertise in Java, Spring Boot, Spring Security, and Hibernate/JPA.',
      'Hands-on experience with relational databases (PostgreSQL/MySQL) and caching (Redis).',
      'Familiarity with containerization (Docker) and CI/CD pipelines.'
    ],
    benefits: [
      'Competitive compensation package with annual performance bonus',
      'Comprehensive family medical and dental insurance',
      'Flexible hybrid working model (2 days office / 3 days remote)',
      '₹50,000 annual learning and certification allowance',
      'State-of-the-art developer workstation (MacBook Pro M3)'
    ],
    companyInfo: {
      name: 'TechCorp Solutions',
      about:
        'TechCorp Solutions is a tier-1 enterprise software provider powering mission-critical logistics, fintech, and digital workflow systems for Fortune 500 enterprises across Asia and North America.',
      industry: 'Enterprise Software & Cloud Platforms',
      size: '250 - 500 Employees',
      founded: '2016',
      website: 'https://techcorp.example.com',
      headquarters: 'Bangalore, Karnataka, India'
    }
  },
  {
    id: 'job-2',
    title: 'Frontend UI/UX Developer',
    company: 'InnovateX Labs',
    companyLogoColor: '#7c3aed',
    location: 'Remote',
    locationType: 'Remote',
    type: 'Full-time',
    salary: '₹12 - 18 LPA',
    numericSalary: 1500000,
    experience: '2-4 Years',
    experienceLevel: 'Entry',
    category: 'Design & Engineering',
    featured: true,
    urgent: false,
    postedDate: '3 days ago',
    applicantsCount: 62,
    tags: ['React', 'TypeScript', 'CSS Tokens', 'Figma', 'Accessibility'],
    description:
      'InnovateX Labs is building the future of collaborative workspace analytics. We are seeking a design-centric Frontend Developer who thrives at the intersection of pixel-perfect UI execution, micro-interactions, and accessible web performance.',
    responsibilities: [
      'Implement reusable UI design systems and component libraries in React and modern CSS.',
      'Bridge the gap between Figma designs and production code with precision.',
      'Ensure WCAG 2.1 AA accessibility compliance across all customer-facing workflows.',
      'Optimize bundle size, rendering performance, and Core Web Vitals.'
    ],
    requirements: [
      '2+ years of professional frontend web development experience.',
      'Expert command of semantic HTML5, CSS custom properties, and responsive layout techniques.',
      'Strong JavaScript (ES2022+) and React fundamentals (Hooks, Context, State Management).',
      'Experience translating design mockups from Figma with exact fidelity.'
    ],
    benefits: [
      '100% remote working setup anywhere in India',
      'Generous home office setup stipend (₹40,000 one-time)',
      'Quarterly team offsites and wellness stipends',
      'Unlimited paid time off policy'
    ],
    companyInfo: {
      name: 'InnovateX Labs',
      about:
        'InnovateX Labs is a high-growth Series-A SaaS startup developing AI-assisted productivity and workflow intelligence tools for modern distributed teams.',
      industry: 'SaaS / Productivity Tech',
      size: '50 - 100 Employees',
      founded: '2021',
      website: 'https://innovatex.example.com',
      headquarters: 'Remote / Delaware, USA'
    }
  },
  {
    id: 'job-3',
    title: 'Backend Java & Spring Cloud Engineer',
    company: 'Enterprise FinTech',
    companyLogoColor: '#059669',
    location: 'Mumbai, India',
    locationType: 'On-site',
    type: 'Full-time',
    salary: '₹16 - 22 LPA',
    numericSalary: 1900000,
    experience: '3-5 Years',
    experienceLevel: 'Mid',
    category: 'Engineering',
    featured: true,
    urgent: false,
    postedDate: '5 days ago',
    applicantsCount: 39,
    tags: ['Java 21', 'Spring Boot', 'Kafka', 'Microservices', 'MySQL'],
    description:
      'Enterprise FinTech is expanding its high-frequency transaction settlement team. We need an experienced Backend Java Engineer who understands distributed systems, concurrency, ACID guarantees, and secure transaction workflows.',
    responsibilities: [
      'Design and deploy mission-critical transaction settlement microservices.',
      'Integrate Apache Kafka event streams for asynchronous payments processing.',
      'Implement defensive security standards following PCI-DSS and RBI compliance rules.',
      'Write comprehensive unit, integration, and performance stress tests.'
    ],
    requirements: [
      '3+ years of intensive backend development with Java and Spring Cloud.',
      'Demonstrated experience with event streaming (Kafka, RabbitMQ) and SQL databases.',
      'Thorough understanding of multithreading, memory management, and distributed caching.',
      'Experience building and documenting RESTful APIs with OpenAPI/Swagger.'
    ],
    benefits: [
      'Industry-leading compensation with bi-annual bonus potential',
      'Full corporate medical coverage for spouse, children, and parents',
      'Provident fund match and gratuity scheme',
      'Subsidized on-campus dining and wellness gym membership'
    ],
    companyInfo: {
      name: 'Enterprise FinTech',
      about:
        'Enterprise FinTech processes over ₹15,000 Crores in monthly commercial banking and merchant settlements with ultra-low latency infrastructure.',
      industry: 'Financial Technology & Banking',
      size: '500+ Employees',
      founded: '2014',
      website: 'https://enterprisefintech.example.com',
      headquarters: 'BKC, Mumbai, Maharashtra, India'
    }
  },
  {
    id: 'job-4',
    title: 'AI/ML Research Intern',
    company: 'NeuroLogic AI',
    companyLogoColor: '#d97706',
    location: 'Bangalore, India',
    locationType: 'Hybrid',
    type: 'Internship',
    salary: '₹40,000 / mo',
    numericSalary: 480000,
    experience: 'Fresher',
    experienceLevel: 'Fresher',
    category: 'Data & AI',
    featured: true,
    urgent: true,
    postedDate: '1 day ago',
    applicantsCount: 95,
    tags: ['Python', 'PyTorch', 'Transformers', 'NLP', 'Vector DBs'],
    description:
      'NeuroLogic AI offers a 6-month research internship for passionate pre-final and final year students or recent graduates interested in cutting-edge Large Language Models (LLMs), retrieval-augmented generation (RAG), and agentic pipelines.',
    responsibilities: [
      'Assist senior research scientists in evaluating and fine-tuning open-source LLMs.',
      'Build evaluation benchmark suites for retrieval accuracy and hallucination reduction.',
      'Prototype RAG workflows using LangChain, LlamaIndex, and Milvus/Pinecone.',
      'Document experimentation methodologies and publish findings internally.'
    ],
    requirements: [
      'Bachelor’s or Master’s student/graduate in CS, Data Science, Mathematics, or related discipline.',
      'Solid command of Python, NumPy, Pandas, and PyTorch.',
      'Understanding of transformer architectures, embeddings, and attention mechanisms.',
      'Strong problem-solving instincts and eagerness to learn rapidly.'
    ],
    benefits: [
      'Attractive monthly stipend of ₹40,000 with conversion to full-time SDE role on performance',
      '1-on-1 mentorship by experienced PhD researchers and AI practitioners',
      'Free gourmet meals and daily snacks at the tech hub',
      'Certificate of completion and formal recommendation letters'
    ],
    companyInfo: {
      name: 'NeuroLogic AI',
      about:
        'NeuroLogic AI is an applied artificial intelligence research organization building contextual intelligence engines for enterprise data warehouses.',
      industry: 'Artificial Intelligence & Machine Learning',
      size: '30 - 60 Employees',
      founded: '2022',
      website: 'https://neurologic.example.ai',
      headquarters: 'Koramangala, Bangalore, India'
    }
  },
  {
    id: 'job-5',
    title: 'Associate Product Manager',
    company: 'ScalerWorks',
    companyLogoColor: '#dc2626',
    location: 'Gurgaon, India',
    locationType: 'Hybrid',
    type: 'Full-time',
    salary: '₹14 - 19 LPA',
    numericSalary: 1650000,
    experience: '1-3 Years',
    experienceLevel: 'Entry',
    category: 'Product',
    featured: false,
    urgent: false,
    postedDate: '4 days ago',
    applicantsCount: 41,
    tags: ['Product Strategy', 'User Stories', 'Analytics', 'Agile', 'SQL'],
    description:
      'ScalerWorks is looking for an analytical, user-empathetic Associate Product Manager to own core candidate onboarding and recruiter talent search experiences.',
    responsibilities: [
      'Write clear Product Requirement Documents (PRDs) and actionable user stories.',
      'Analyze product telemetry, conversion funnels, and retention analytics via Mixpanel/SQL.',
      'Conduct qualitative customer discovery interviews with hiring managers and applicants.',
      'Collaborate in 2-week Agile sprints alongside engineering and design leads.'
    ],
    requirements: [
      '1-3 years of product management, product analytics, or management consulting experience.',
      'Strong quantitative reasoning, SQL querying capability, and data-backed storytelling.',
      'Excellent verbal and written communication skills across stakeholder groups.',
      'Experience in B2B or consumer internet platforms is a strong plus.'
    ],
    benefits: [
      'Competitive compensation package with stock options (ESOPs)',
      'Flexible hybrid schedule with modern cyber-park offices',
      'Health insurance with zero co-pay',
      'Monthly book reading and wellness stipend'
    ],
    companyInfo: {
      name: 'ScalerWorks',
      about:
        'ScalerWorks provides end-to-end recruitment lifecycle automation and campus talent discovery systems for educational institutions and corporate recruiters.',
      industry: 'HR Tech & Enterprise SaaS',
      size: '150 - 300 Employees',
      founded: '2019',
      website: 'https://scalerworks.example.com',
      headquarters: 'Cyber City, Gurgaon, Haryana, India'
    }
  },
  {
    id: 'job-6',
    title: 'DevOps & Cloud Infrastructure Engineer',
    company: 'CloudScale Systems',
    companyLogoColor: '#0284c7',
    location: 'Hyderabad, India',
    locationType: 'Remote',
    type: 'Full-time',
    salary: '₹20 - 28 LPA',
    numericSalary: 2400000,
    experience: '4-7 Years',
    experienceLevel: 'Senior',
    category: 'Cloud & DevOps',
    featured: true,
    urgent: false,
    postedDate: '1 week ago',
    applicantsCount: 29,
    tags: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Prometheus'],
    description:
      'CloudScale Systems is hiring an experienced DevOps Engineer to spearhead our multi-region Kubernetes clusters, Infrastructure as Code, and 99.99% availability SLAs.',
    responsibilities: [
      'Maintain production Kubernetes (EKS) clusters with auto-scaling and zero-downtime rolling deploys.',
      'Manage multi-region AWS cloud infrastructure using modular Terraform templates.',
      'Build robust GitHub Actions CI/CD pipelines with integrated static analysis and security gates.',
      'Implement centralized observability with Prometheus, Grafana, and OpenTelemetry.'
    ],
    requirements: [
      '4+ years managing production cloud infrastructure on AWS or GCP.',
      'Deep hands-on experience with Kubernetes, Helm, Docker, and service meshes.',
      'Strong scripting ability in Python, Go, or Bash.',
      'Proven track record implementing automated disaster recovery and SOC 2 security compliance.'
    ],
    benefits: [
      'Generous base salary + performance bonuses + equity',
      '100% remote flexibility with home office ergonomics package',
      'Comprehensive wellness and family health insurance',
      'Annual technology conference sponsorship'
    ],
    companyInfo: {
      name: 'CloudScale Systems',
      about:
        'CloudScale Systems delivers high-availability cloud migration and managed DevOps automation for enterprise clients in banking and healthtech.',
      industry: 'Cloud Infrastructure & Managed Services',
      size: '100 - 250 Employees',
      founded: '2018',
      website: 'https://cloudscale.example.com',
      headquarters: 'Hitec City, Hyderabad, India'
    }
  },
  {
    id: 'job-7',
    title: 'Software Development Engineer Intern (SDE Intern)',
    company: 'NexaByte Technologies',
    companyLogoColor: '#6366f1',
    location: 'Pune, India',
    locationType: 'Hybrid',
    type: 'Internship',
    salary: '₹35,000 / mo',
    numericSalary: 420000,
    experience: 'Fresher',
    experienceLevel: 'Fresher',
    category: 'Engineering',
    featured: true,
    urgent: true,
    postedDate: '3 days ago',
    applicantsCount: 110,
    tags: ['Java', 'React', 'DSA', 'Spring Boot', 'REST APIs'],
    description:
      'NexaByte Technologies invites passionate engineering students to join our 2026 Developer Internship batch. You will work on real client applications, write production code, and experience modern agile software delivery firsthand.',
    responsibilities: [
      'Collaborate with senior developers to build and test API endpoints in Spring Boot.',
      'Develop clean and modular React UI components connected to backend services.',
      'Write comprehensive unit tests with JUnit 5 and Jest.',
      'Participate in sprint planning and daily standup syncs.'
    ],
    requirements: [
      'Pursuing B.Tech/B.E/MCA in Computer Science or related branch (graduating 2026 or 2027).',
      'Solid foundations in Data Structures, Algorithms, and Object-Oriented Programming (OOP).',
      'Familiarity with Java, JavaScript, and Git version control.',
      'Strong enthusiasm to learn modern frameworks on the job.'
    ],
    benefits: [
      'Fixed stipend of ₹35,000 per month for the 6-month duration',
      'Pre-Placement Offer (PPO) opportunity based on internship performance',
      'Hybrid work flexibility and buddy mentorship program',
      'Free lunch and commuter transport support'
    ],
    companyInfo: {
      name: 'NexaByte Technologies',
      about:
        'NexaByte Technologies builds digital transformation and automation solutions for manufacturing, retail, and supply chain enterprises.',
      industry: 'Information Technology & Consulting',
      size: '300 - 600 Employees',
      founded: '2015',
      website: 'https://nexabyte.example.com',
      headquarters: 'Baner, Pune, Maharashtra, India'
    }
  },
  {
    id: 'job-8',
    title: 'Product Designer (Figma / Design Systems)',
    company: 'CraftPixel Studio',
    companyLogoColor: '#ec4899',
    location: 'Bangalore, India',
    locationType: 'Hybrid',
    type: 'Full-time',
    salary: '₹11 - 16 LPA',
    numericSalary: 1350000,
    experience: '2-4 Years',
    experienceLevel: 'Entry',
    category: 'Design & Engineering',
    featured: false,
    urgent: false,
    postedDate: '4 days ago',
    applicantsCount: 31,
    tags: ['Figma', 'Design Systems', 'Wireframing', 'Prototyping', 'UX Research'],
    description:
      'CraftPixel Studio is hiring a creative and methodical Product Designer to craft intuitive, modern user interfaces and unify design tokens across our mobile and web SaaS platforms.',
    responsibilities: [
      'Create high-fidelity interactive prototypes, user journeys, and mockups in Figma.',
      'Maintain and expand our shared design token library and component guidelines.',
      'Conduct usability tests and iterate designs based on customer feedback and analytics.',
      'Collaborate closely with frontend engineers to ensure design fidelity in production.'
    ],
    requirements: [
      '2+ years of UI/UX product design experience with a strong portfolio of shipped work.',
      'Mastery of Figma (auto-layout, components, variables, interactive prototypes).',
      'Deep understanding of accessibility, micro-interactions, and responsive patterns.',
      'Clear, persuasive communication skills when presenting design rationales.'
    ],
    benefits: [
      'Competitive compensation with annual stock appreciation rights',
      'Creative workspace with flexible hybrid arrangement',
      'Latest Apple design hardware setup and creative software subscriptions',
      'Comprehensive family medical coverage'
    ],
    companyInfo: {
      name: 'CraftPixel Studio',
      about:
        'CraftPixel Studio is an award-winning digital product studio partnering with emerging startups and enterprises to design memorable digital experiences.',
      industry: 'Design & Digital Product Strategy',
      size: '25 - 50 Employees',
      founded: '2020',
      website: 'https://craftpixel.example.com',
      headquarters: 'Indiranagar, Bangalore, India'
    }
  },
  {
    id: 'job-9',
    title: 'Data Analyst & BI Specialist',
    company: 'RetailPulse Analytics',
    companyLogoColor: '#0891b2',
    location: 'Chennai, India',
    locationType: 'On-site',
    type: 'Full-time',
    salary: '₹8 - 12 LPA',
    numericSalary: 1000000,
    experience: '1-3 Years',
    experienceLevel: 'Entry',
    category: 'Data & AI',
    featured: false,
    urgent: false,
    postedDate: '6 days ago',
    applicantsCount: 52,
    tags: ['SQL', 'Power BI', 'Python', 'Data Warehousing', 'ETL'],
    description:
      'RetailPulse Analytics provides omnichannel retail intelligence. We are looking for an analytical problem solver to model store datasets, build executive dashboards, and derive consumer growth insights.',
    responsibilities: [
      'Write optimized SQL queries and stored procedures across cloud data warehouses.',
      'Build automated, real-time executive dashboards in Power BI and Tableau.',
      'Perform cohort, basket analysis, and price elasticity modeling in Python/Pandas.',
      'Collaborate with business heads to turn raw data into strategic operational decisions.'
    ],
    requirements: [
      '1-3 years of data analytics or business intelligence experience.',
      'Advanced SQL skills (window functions, CTEs, performance tuning).',
      'Demonstrated expertise building production dashboards in Power BI or Tableau.',
      'Familiarity with Python (Pandas/NumPy) for exploratory data analysis.'
    ],
    benefits: [
      'Competitive salary with annual performance incentives',
      'Medical and accident insurance for employee and dependents',
      'Sponsored certifications in cloud analytics (Azure/AWS Data)',
      'Stable corporate work environment with healthy work-life balance'
    ],
    companyInfo: {
      name: 'RetailPulse Analytics',
      about:
        'RetailPulse Analytics delivers real-time merchandising and inventory demand forecasting solutions for over 2,000 retail storefronts across India.',
      industry: 'Retail Analytics & Data Intelligence',
      size: '100 - 200 Employees',
      founded: '2017',
      website: 'https://retailpulse.example.com',
      headquarters: 'OMR, Chennai, Tamil Nadu, India'
    }
  },
  {
    id: 'job-10',
    title: 'React Native Mobile Developer',
    company: 'SwiftPay Financial',
    companyLogoColor: '#4f46e5',
    location: 'Remote',
    locationType: 'Remote',
    type: 'Full-time',
    salary: '₹15 - 22 LPA',
    numericSalary: 1850000,
    experience: '3-5 Years',
    experienceLevel: 'Mid',
    category: 'Engineering',
    featured: false,
    urgent: false,
    postedDate: '5 days ago',
    applicantsCount: 38,
    tags: ['React Native', 'TypeScript', 'iOS', 'Android', 'Redux Toolkit'],
    description:
      'SwiftPay Financial is seeking a talented React Native Developer to maintain and scale our consumer payments mobile app used by over 500,000 active users.',
    responsibilities: [
      'Develop fluid, native-feeling mobile application features for iOS and Android in React Native.',
      'Integrate secure biometric authentication, payment SDKs, and push notifications.',
      'Debug platform-specific performance bottlenecks and memory leaks.',
      'Collaborate with backend engineers to consume and optimize REST/GraphQL payloads.'
    ],
    requirements: [
      '3+ years building and deploying production cross-platform apps with React Native.',
      'Strong proficiency in TypeScript, Redux Toolkit, and asynchronous JavaScript.',
      'Experience publishing and maintaining apps on Google Play Store and Apple App Store.',
      'Knowledge of native bridge concepts (Swift/Kotlin) is a plus.'
    ],
    benefits: [
      '100% remote working setup across India',
      'Annual equity grants and performance bonuses',
      'Premium health and wellness insurance package',
      'Home office connectivity allowance'
    ],
    companyInfo: {
      name: 'SwiftPay Financial',
      about:
        'SwiftPay Financial offers next-gen mobile micro-lending, instant UPI payments, and digital wealth management to everyday consumers.',
      industry: 'FinTech / Mobile Payments',
      size: '80 - 150 Employees',
      founded: '2020',
      website: 'https://swiftpay.example.com',
      headquarters: 'Remote / Bangalore, India'
    }
  },
  {
    id: 'job-11',
    title: 'Graduate Tech Intern - Backend',
    company: 'FinEdge Technologies',
    companyLogoColor: '#059669',
    location: 'Mumbai, India',
    locationType: 'Hybrid',
    type: 'Internship',
    salary: '₹30,000 / mo',
    numericSalary: 360000,
    experience: 'Fresher',
    experienceLevel: 'Fresher',
    category: 'Engineering',
    featured: false,
    urgent: false,
    postedDate: '1 week ago',
    applicantsCount: 78,
    tags: ['Java', 'Spring', 'MySQL', 'REST APIs', 'Git'],
    description:
      'FinEdge Technologies is hiring ambitious fresher developers for our 2026 Core Engineering Internship. Gain hands-on exposure to scalable financial databases, Spring Boot frameworks, and secure microservices.',
    responsibilities: [
      'Assist the development team in writing clean, well-tested Java code for core APIs.',
      'Write database migration scripts and SQL queries in MySQL.',
      'Participate in code reviews, bug fixes, and documentation updates.',
      'Collaborate with QA engineers to automate regression test suites.'
    ],
    requirements: [
      'Degree in Computer Science, IT, or related engineering discipline (2025/2026 batch).',
      'Good fundamental understanding of Java, Object-Oriented principles, and SQL.',
      'Familiarity with Git version control and basic REST concepts.',
      'Positive problem-solving attitude and strong communication.'
    ],
    benefits: [
      'Monthly stipend of ₹30,000 for 6 months',
      'Structured mentor pairing with senior architects',
      'Full-time PPO opportunities upon successful internship completion',
      'Complimentary corporate lunches and transit assistance'
    ],
    companyInfo: {
      name: 'FinEdge Technologies',
      about:
        'FinEdge Technologies develops algorithmic treasury management systems and enterprise payment gateways for top-tier financial institutions.',
      industry: 'Financial Technology',
      size: '120 - 250 Employees',
      founded: '2016',
      website: 'https://finedge.example.com',
      headquarters: 'Andheri East, Mumbai, India'
    }
  },
  {
    id: 'job-12',
    title: 'Cybersecurity Analyst',
    company: 'SecureGuard Networks',
    companyLogoColor: '#dc2626',
    location: 'Bangalore, India',
    locationType: 'On-site',
    type: 'Full-time',
    salary: '₹14 - 20 LPA',
    numericSalary: 1700000,
    experience: '2-5 Years',
    experienceLevel: 'Mid',
    category: 'Cloud & DevOps',
    featured: false,
    urgent: false,
    postedDate: '2 weeks ago',
    applicantsCount: 24,
    tags: ['SIEM', 'Vulnerability Assessment', 'Network Security', 'OWASP', 'Linux'],
    description:
      'SecureGuard Networks is looking for an analytical Cybersecurity Analyst to monitor threat intelligence feeds, perform vulnerability scans, and safeguard client networks.',
    responsibilities: [
      'Monitor Security Operations Center (SOC) events and triage alerts across SIEM tools.',
      'Perform regular vulnerability assessments and penetration testing (VAPT).',
      'Collaborate with developers to remediate OWASP Top 10 web vulnerabilities.',
      'Develop incident response playbooks and conduct security awareness drills.'
    ],
    requirements: [
      '2+ years of professional cybersecurity or SOC analyst experience.',
      'Proficiency with security tools (Wireshark, Splunk/ELK, Nessus, Burp Suite).',
      'Strong grasp of network protocols (TCP/IP, DNS, TLS) and Linux administration.',
      'Relevant certifications like CEH, CompTIA Security+, or OSCP are advantageous.'
    ],
    benefits: [
      'Competitive salary + annual retention bonus',
      'Full corporate healthcare and accidental life insurance',
      '100% sponsored certification exam fees',
      'On-site gym, cafeteria, and recreation facilities'
    ],
    companyInfo: {
      name: 'SecureGuard Networks',
      about:
        'SecureGuard Networks delivers managed cyber defense, threat intelligence, and zero-trust security infrastructure for cloud-first enterprises.',
      industry: 'Cybersecurity & Defense',
      size: '200 - 400 Employees',
      founded: '2017',
      website: 'https://secureguard.example.com',
      headquarters: 'Outer Ring Road, Bangalore, India'
    }
  }
];

export const CATEGORIES = [
  {
    id: 'engineering',
    name: 'Engineering & Tech',
    shortName: 'Engineering',
    count: 18,
    description: 'Full Stack, Backend, Frontend, Mobile & Systems',
    iconName: 'Code'
  },
  {
    id: 'data-ai',
    name: 'Data Science & AI',
    shortName: 'Data & AI',
    count: 14,
    description: 'Machine Learning, LLMs, Analytics & Business Intelligence',
    iconName: 'Cpu'
  },
  {
    id: 'product',
    name: 'Product Management',
    shortName: 'Product',
    count: 12,
    description: 'Product Strategy, Roadmapping, Agile & Growth',
    iconName: 'Layout'
  },
  {
    id: 'design',
    name: 'UI/UX & Design',
    shortName: 'Design',
    count: 9,
    description: 'User Experience, Figma Design Systems & Prototyping',
    iconName: 'Palette'
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    shortName: 'Cloud & DevOps',
    count: 8,
    description: 'AWS, Kubernetes, CI/CD Pipelines & Security',
    iconName: 'Cloud'
  },
  {
    id: 'internships',
    name: 'Campus Internships',
    shortName: 'Internships',
    count: 15,
    description: 'Curated paid technical & product internships for freshers',
    iconName: 'GraduationCap'
  }
];

/**
 * Query helper to retrieve all mock jobs.
 */
export function getAllJobs() {
  return [...MOCK_JOBS];
}

/**
 * Query helper to retrieve a job by ID.
 */
export function getJobById(jobId) {
  if (!jobId) return null;
  return MOCK_JOBS.find((j) => j.id.toLowerCase() === jobId.toLowerCase()) || null;
}

/**
 * Retrieve curated featured jobs for landing page showcase.
 */
export function getFeaturedJobs() {
  return MOCK_JOBS.filter((j) => j.featured);
}

/**
 * Retrieve related jobs sharing category or tags.
 */
export function getRelatedJobs(currentJobId, category, limit = 3) {
  return MOCK_JOBS.filter(
    (j) => j.id !== currentJobId && (j.category === category || j.type === 'Full-time')
  ).slice(0, limit);
}

/**
 * Query engine with live search, multiple filter criteria, sorting, and pagination.
 */
export function queryJobs({
  keyword = '',
  category = '',
  type = '',
  locationType = '',
  experienceLevel = '',
  sortBy = 'recent',
  page = 1,
  pageSize = 6
} = {}) {
  let filtered = [...MOCK_JOBS];

  // 1. Search filter (title, company, skills/tags, location)
  if (keyword && keyword.trim()) {
    const q = keyword.toLowerCase().trim();
    filtered = filtered.filter((j) => {
      const titleMatch = j.title.toLowerCase().includes(q);
      const companyMatch = j.company.toLowerCase().includes(q);
      const locationMatch = j.location.toLowerCase().includes(q);
      const tagMatch = j.tags.some((t) => t.toLowerCase().includes(q));
      const catMatch = j.category.toLowerCase().includes(q);
      return titleMatch || companyMatch || locationMatch || tagMatch || catMatch;
    });
  }

  // 2. Category filter
  if (category && category !== 'ALL') {
    const catLow = category.toLowerCase();
    filtered = filtered.filter((j) => {
      if (catLow === 'internships') {
        return j.type === 'Internship';
      }
      return j.category.toLowerCase().includes(catLow) || catLow.includes(j.category.toLowerCase());
    });
  }

  // 3. Employment Type filter
  if (type && type !== 'ALL') {
    filtered = filtered.filter((j) => j.type.toLowerCase() === type.toLowerCase());
  }

  // 4. Location Type filter
  if (locationType && locationType !== 'ALL') {
    filtered = filtered.filter(
      (j) => j.locationType.toLowerCase() === locationType.toLowerCase()
    );
  }

  // 5. Experience Level filter
  if (experienceLevel && experienceLevel !== 'ALL') {
    filtered = filtered.filter(
      (j) => j.experienceLevel.toLowerCase() === experienceLevel.toLowerCase()
    );
  }

  // 6. Sorting
  if (sortBy === 'salary_desc') {
    filtered.sort((a, b) => b.numericSalary - a.numericSalary);
  } else if (sortBy === 'salary_asc') {
    filtered.sort((a, b) => a.numericSalary - b.numericSalary);
  } else if (sortBy === 'experience_asc') {
    const rank = { Fresher: 0, Entry: 1, Mid: 2, Senior: 3 };
    filtered.sort((a, b) => (rank[a.experienceLevel] || 0) - (rank[b.experienceLevel] || 0));
  } else {
    // Default: 'recent' (natural order in mock)
  }

  // 7. Pagination
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedJobs = filtered.slice(startIndex, startIndex + pageSize);

  return {
    jobs: paginatedJobs,
    totalCount,
    totalPages,
    currentPage,
    pageSize
  };
}
