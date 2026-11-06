import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ArrowRight,
  Code,
  Cpu,
  Layout,
  Palette,
  Cloud,
  GraduationCap,
  CheckCircle,
  CheckCircle2,
  Users,
  Briefcase,
  ShieldCheck,
  Calendar,
  Star,
  FileText,
  Check,
  Video,
  Building2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Lock,
  Layers,
  Sliders,
  ChevronRight,
  CheckCheck
} from 'lucide-react';
import { Navbar, Footer } from '../../components/layout';
import { Button, Badge } from '../../components/ui';
import { JobCard } from '../../components/jobs';
import { CATEGORIES, getFeaturedJobs } from '../../data/mockJobs';
import { jobService } from '../../api';
import './HomePage.css';

/**
 * Animated number counter component for stats
 */
const AnimatedCounter = ({ target, suffix = '', duration = 1200 }) => {
  const [count, setCount] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let startTime = null;
    let frameId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [target, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const CATEGORY_ICONS = {
  Code: Code,
  Cpu: Cpu,
  Layout: Layout,
  Palette: Palette,
  Cloud: Cloud,
  GraduationCap: GraduationCap
};

// Interactive discovery presets for Section 2
const DISCOVERY_PRESETS = [
  {
    id: 'ai-ml',
    category: 'Data & AI',
    role: 'Lead Machine Learning Engineer',
    company: 'NeuralSphere AI',
    salary: '₹34 - 52 LPA',
    location: 'Bangalore • Hybrid',
    type: 'Full-time',
    matchScore: 99,
    skills: ['PyTorch', 'TensorFlow', 'LLMs', 'Python', 'MLOps'],
    snippet: 'Architect generative AI pipelines, fine-tune open weights, and scale inference serving infrastructure.'
  },
  {
    id: 'cloud-fullstack',
    category: 'Engineering',
    role: 'Principal Cloud Architect',
    company: 'CloudScale Technologies',
    salary: '₹38 - 56 LPA',
    location: 'Hyderabad • Remote',
    type: 'Full-time',
    matchScore: 97,
    skills: ['React', 'Spring Boot', 'AWS', 'Kubernetes', 'Kafka'],
    snippet: 'Design distributed event-driven microservices processing over 100M daily API events with high availability.'
  },
  {
    id: 'product-design',
    category: 'Design',
    role: 'Senior Product Designer',
    company: 'CraftUI Labs',
    salary: '₹22 - 35 LPA',
    location: 'Mumbai • Hybrid',
    type: 'Full-time',
    matchScore: 95,
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    snippet: 'Lead enterprise design systems, conduct usability tests, and craft intuitive developer-first software experiences.'
  },
  {
    id: 'devops-infra',
    category: 'Cloud & DevOps',
    role: 'Site Reliability Engineer',
    company: 'Nexus Infra',
    salary: '₹26 - 40 LPA',
    location: 'Pune • Remote',
    type: 'Full-time',
    matchScore: 96,
    skills: ['Docker', 'Terraform', 'CI/CD', 'Prometheus', 'Linux'],
    snippet: 'Drive zero-downtime blue-green deployments, maintain multi-region observability, and automate infrastructure.'
  }
];

// Interactive Recruiter ATS Simulation items for Section 4
const PIPELINE_DEMO_COLUMNS = [
  {
    id: 'applied',
    title: 'Applied',
    count: 24,
    badgeVariant: 'primary',
    candidates: [
      { name: 'Aarav Patel', role: 'Full Stack Engineer', match: 96, school: 'IIT Bombay', tag: 'Spring + React' },
      { name: 'Sneha Rao', role: 'Cloud SDE Intern', match: 92, school: 'BITS Pilani', tag: 'AWS + Docker' }
    ]
  },
  {
    id: 'under_review',
    title: 'Under Review',
    count: 12,
    badgeVariant: 'warning',
    candidates: [
      { name: 'Kavya Sharma', role: 'Backend Developer', match: 98, school: 'NIT Trichy', tag: 'Java + Microservices' }
    ]
  },
  {
    id: 'shortlisted',
    title: 'Shortlisted',
    count: 5,
    badgeVariant: 'info',
    candidates: [
      { name: 'Rohan Mehta', role: 'DevOps Specialist', match: 95, school: 'IIIT Hyderabad', tag: 'K8s + Terraform' }
    ]
  },
  {
    id: 'interview_scheduled',
    title: 'Interview Scheduled',
    count: 3,
    badgeVariant: 'success',
    candidates: [
      { name: 'Priya Verma', role: 'Senior Architect', match: 99, school: 'DTU Delhi', tag: 'Technical Round 2' }
    ]
  }
];

// Lifecycle steps for Section 5
const LIFECYCLE_STEPS = [
  {
    number: '01',
    title: '1-Click Intelligent Apply',
    subtitle: 'Standardized profiles with verified credentials bypass black-hole portals.',
    detail: 'Your verified education, git portfolio, and skills are delivered directly to the engineering hiring manager with zero third-party recruiter intermediaries.'
  },
  {
    number: '02',
    title: 'Direct Recruiter Review',
    subtitle: 'Track your exact review state in real time without guessing.',
    detail: 'Transparent multi-stage progress (Applied → Under Review → Shortlisted). Recruiter response SLA under 48 hours for verified engineering candidates.'
  },
  {
    number: '03',
    title: 'Integrated Video Interviews',
    subtitle: 'Built-in interview launcher with agenda, calendar sync, and meeting links.',
    detail: 'Receive scheduling requests with confirmed dates, interview round notes (e.g. System Design, DSA), and one-click Google Meet room access.'
  },
  {
    number: '04',
    title: 'Verified Offers & Placement',
    subtitle: 'Transparent compensation evaluation and institutional compliance.',
    detail: 'Structured digital offer letters with role designations, compensation breakdowns (fixed + variables), and institutional placement verification.'
  }
];

const normalizeBackendJobForHome = (raw) => {
  const companyName =
    typeof raw.company === 'object' && raw.company !== null
      ? raw.company.name || 'Company'
      : raw.company || 'Company';

  const skills = Array.isArray(raw.requiredSkills)
    ? raw.requiredSkills.map((s) => (typeof s === 'string' ? s : s.name))
    : typeof raw.requiredSkills === 'string' && raw.requiredSkills.trim().length > 0
    ? raw.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const minSal = raw.minSalary ? `₹${(raw.minSalary / 100000).toFixed(1)}L` : '';
  const maxSal = raw.maxSalary ? ` - ₹${(raw.maxSalary / 100000).toFixed(1)} LPA` : '';

  return {
    id: raw.id,
    title: raw.title,
    company: companyName,
    companyLogoColor: '#2563eb',
    location: raw.location || 'Remote',
    locationType: raw.jobType === 'INTERNSHIP' ? 'Remote' : 'On-site',
    type: raw.jobType === 'INTERNSHIP' ? 'Internship' : 'Full-time',
    salary: raw.minSalary ? `${minSal}${maxSal}` : 'Competitive',
    experience: raw.minExperience !== undefined ? `${raw.minExperience}+ Years` : 'Fresher',
    category: 'Engineering',
    featured: true,
    urgent: true,
    postedDate: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : 'Recently',
    applicantsCount: 0,
    tags: skills.length > 0 ? skills : ['Technology', 'Hiring'],
    description: raw.description,
  };
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [featuredJobs, setFeaturedJobs] = useState(() => getFeaturedJobs());

  // Interactive Section 2 discovery state
  const [activeDiscoveryId, setActiveDiscoveryId] = useState('ai-ml');
  const activeDiscovery = useMemo(
    () => DISCOVERY_PRESETS.find((p) => p.id === activeDiscoveryId) || DISCOVERY_PRESETS[0],
    [activeDiscoveryId]
  );

  // Interactive Section 5 lifecycle active tab
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Fetch real jobs from backend on mount
  useEffect(() => {
    let isCancelled = false;
    const loadRealJobs = async () => {
      try {
        const res = await jobService.getPublicJobs({ page: 0, size: 6, sort: 'createdAt,desc' });
        if (isCancelled) return;
        if (res && res.data && Array.isArray(res.data.content) && res.data.content.length > 0) {
          const backendList = res.data.content.map(normalizeBackendJobForHome);
          const mocks = getFeaturedJobs().filter((m) => !backendList.some((b) => String(b.id) === String(m.id)));
          setFeaturedJobs([...backendList, ...mocks].slice(0, 6));
        }
      } catch {
        // fallback to mock data
      }
    };
    loadRealJobs();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Smooth Intersection Observer for Scroll Reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [featuredJobs]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (category && category !== 'ALL') params.set('category', category);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleQuickTag = (tag) => {
    navigate(`/jobs?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* ==========================================================================
          SECTION 1: HERO EXPERIENCE ("Connect talent with opportunity")
          ========================================================================== */}
      <section className="home-hero" aria-label="Hero Section">
        <div className="home-hero__ambient-glow" aria-hidden="true" />
        <div className="home-hero__ambient-secondary" aria-hidden="true" />
        <div className="home-hero__grid-pattern" aria-hidden="true" />

        <div className="container home-hero__container">
          <div className="home-hero__content-grid">
            {/* Left Content Column */}
            <div className="home-hero__left">
              <div className="home-hero__brand-lead hero-anim-1">
                <span className="home-hero__pill-dot" />
                <span className="home-hero__pill-name">CareerConnect</span>
                <span className="home-hero__pill-separator">/</span>
                <span className="home-hero__pill-tag">Next-Gen Recruitment Platform</span>
              </div>

              <h1 className="home-hero__title hero-anim-2">
                Connect talent with <br />
                <span className="home-hero__title-accent">opportunity.</span>
              </h1>

              <p className="home-hero__subtitle hero-anim-3">
                A modern platform built for candidate clarity and recruiter velocity. Direct applications,
                verified company profiles, and transparent interview pipelines with zero friction.
              </p>

              {/* Action Buttons Row */}
              <div className="home-hero__cta-group hero-anim-4">
                <Link to="/jobs">
                  <Button size="lg" variant="primary" rightIcon={<ArrowRight size={16} />}>
                    Explore Opportunities
                  </Button>
                </Link>
                <Link to="/candidate/dashboard">
                  <Button size="lg" variant="outline">
                    Candidate Portal
                  </Button>
                </Link>
                <Link to="/recruiter/dashboard" className="hidden sm:inline-flex">
                  <Button size="lg" variant="ghost">
                    Recruiter Hub
                  </Button>
                </Link>
              </div>

              {/* Prominent Search UI Dock */}
              <div className="home-hero__search-card hero-anim-5">
                <form onSubmit={handleHeroSearch} className="home-hero__search-form">
                  <div className="home-hero__search-input-wrap">
                    <div className="input-container input-container--has-left-icon">
                      <span className="input-icon input-icon--left">
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Search roles, skills (e.g. React, Spring Boot, AI)..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        aria-label="Search jobs keyword"
                      />
                    </div>
                  </div>

                  <div className="home-hero__search-select-wrap">
                    <div className="select-container">
                      <select
                        className="select-field"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label="Select role category"
                      >
                        <option value="ALL">All Disciplines</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Data & AI">Data & AI</option>
                        <option value="Product">Product</option>
                        <option value="Design">UI/UX Design</option>
                        <option value="Cloud & DevOps">Cloud & DevOps</option>
                        <option value="Internships">Internships</option>
                      </select>
                    </div>
                  </div>

                  <div className="home-hero__search-btn-wrap">
                    <Button type="submit" size="md" variant="primary" rightIcon={<ArrowRight size={16} />}>
                      Find Jobs
                    </Button>
                  </div>
                </form>

                {/* Trending searches */}
                <div className="home-hero__trending">
                  <span className="home-hero__trending-label">Trending Tech:</span>
                  {['Full Stack', 'Spring Boot', 'React', 'AI / ML', 'Cloud SDE', 'Kubernetes'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="home-hero__trending-pill"
                      onClick={() => handleQuickTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Visual Modular Composition (Desktop) */}
            <div className="home-hero__right hero-anim-6">
              <div className="home-hero__composition">
                <div className="home-hero__composition-glow" aria-hidden="true" />

                {/* Main Showcase Card: Verified Job Preview */}
                <div className="hero-floating-card hero-floating-card--main">
                  <div className="hero-floating-card__header">
                    <div className="hero-floating-card__avatar" aria-hidden="true">
                      T
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">TechCorp Solutions</span>
                        <Badge variant="success" size="sm" hasDot>Verified Partner</Badge>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <ShieldCheck size={12} className="text-emerald-500" /> Direct Recruiter Access
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3 mb-1">
                    Senior Full Stack Architect
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">Bangalore • Hybrid</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">₹28 - 42 LPA</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">Full-time</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {['React', 'Spring Boot', 'AWS', 'Microservices'].map((t) => (
                      <span key={t} className="text-2xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} /> Active pipeline
                    </span>
                    <span className="text-slate-400 font-mono text-2xs">Posted 2h ago</span>
                  </div>
                </div>

                {/* Satellite Module 1: 98% Match Score Badge */}
                <div className="hero-floating-card hero-floating-card--badge-top animate-float">
                  <div className="hero-badge-pill">
                    <div className="hero-badge-pill__icon bg-amber-500 text-white">
                      <Star size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">98% Skill Match</div>
                      <div className="text-2xs text-slate-500">Fast-Track Candidate Profile</div>
                    </div>
                  </div>
                </div>

                {/* Satellite Module 2: Live Interview Scheduled */}
                <div className="hero-floating-card hero-floating-card--badge-bottom animate-float-rev">
                  <div className="hero-badge-pill">
                    <div className="hero-badge-pill__icon bg-emerald-500 text-white">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Technical Interview</div>
                      <div className="text-2xs text-emerald-600 font-medium">Tomorrow • 11:00 AM IST (Google Meet)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof & Trust Strip */}
          <div className="home-hero__trust-strip hero-anim-7">
            <span className="home-hero__trust-title">Trusted By Leading Tech Employers & Universities:</span>
            <div className="home-hero__trust-logos">
              {['TechCorp', 'InnoWave', 'CloudScale', 'NextGen Systems', 'Apex Dynamics', 'CyberPulse'].map((org) => (
                <div key={org} className="home-hero__trust-badge">
                  <span className="home-hero__trust-dot" />
                  {org}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          STATS METRICS STRIP (Live Platform Telemetry)
          ========================================================================== */}
      <section className="home-stats scroll-reveal" aria-label="Platform Statistics">
        <div className="container">
          <div className="home-stats__grid">
            <div className="home-stats__item">
              <div className="home-stats__value">
                <AnimatedCounter target={12500} suffix="+" />
              </div>
              <div className="home-stats__label">Verified Active Openings</div>
            </div>
            <div className="home-stats__item">
              <div className="home-stats__value">
                <AnimatedCounter target={500} suffix="+" />
              </div>
              <div className="home-stats__label">Verified Enterprise Recruiters</div>
            </div>
            <div className="home-stats__item">
              <div className="home-stats__value">
                <AnimatedCounter target={96} suffix="%" />
              </div>
              <div className="home-stats__label">Candidate Match Satisfaction</div>
            </div>
            <div className="home-stats__item">
              <div className="home-stats__value">
                &lt; 48 hrs
              </div>
              <div className="home-stats__label">Average Recruiter First Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 2: "Find the opportunity that fits you." (Job Discovery Visualized)
          ========================================================================== */}
      <section className="home-section scroll-reveal" aria-label="Job Discovery Showcase">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="primary" hasDot>Discovery Engine</Badge>
            <h2 className="home-section__title mt-2">Find the opportunity that fits you.</h2>
            <p className="home-section__desc">
              Search without algorithmic noise. Transparent compensation bands, remote flexibility,
              and direct recruiter pipelines.
            </p>
          </div>

          {/* Interactive Discovery Dock */}
          <div className="discovery-showcase">
            <div className="discovery-showcase__sidebar">
              <div className="discovery-showcase__sidebar-title">Select Discipline</div>
              <div className="discovery-showcase__pills">
                {DISCOVERY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`discovery-pill ${activeDiscoveryId === preset.id ? 'discovery-pill--active' : ''}`}
                    onClick={() => setActiveDiscoveryId(preset.id)}
                  >
                    <div className="discovery-pill__left">
                      <span className="discovery-pill__role">{preset.role}</span>
                      <span className="discovery-pill__meta">{preset.company} • {preset.salary}</span>
                    </div>
                    <ChevronRight size={16} className="discovery-pill__arrow" />
                  </button>
                ))}
              </div>
            </div>

            <div className="discovery-showcase__stage">
              <div className="discovery-card">
                <div className="discovery-card__header">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary">{activeDiscovery.category}</Badge>
                      <Badge variant="success" size="sm" hasDot>Actively Interviewing</Badge>
                    </div>
                    <h3 className="discovery-card__role">{activeDiscovery.role}</h3>
                    <p className="discovery-card__company">{activeDiscovery.company}</p>
                  </div>
                  <div className="discovery-card__match-pill">
                    <span className="discovery-card__match-score">{activeDiscovery.matchScore}%</span>
                    <span className="discovery-card__match-label">Match</span>
                  </div>
                </div>

                <div className="discovery-card__details-row">
                  <span className="discovery-card__chip">
                    <Building2 size={13} /> {activeDiscovery.location}
                  </span>
                  <span className="discovery-card__chip discovery-card__chip--highlight">
                    <TrendingUp size={13} /> {activeDiscovery.salary}
                  </span>
                  <span className="discovery-card__chip">
                    <Clock size={13} /> {activeDiscovery.type}
                  </span>
                </div>

                <p className="discovery-card__snippet">{activeDiscovery.snippet}</p>

                <div className="discovery-card__skills">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Verified Skill Requirements:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeDiscovery.skills.map((s) => (
                      <span key={s} className="discovery-card__skill-tag">
                        <Check size={11} className="text-emerald-500" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="discovery-card__footer">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Direct recruiter application • No agency spam</span>
                  </div>
                  <Link to="/jobs">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight size={15} />}>
                      Explore Matching Roles
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Live Jobs Grid */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Featured Openings from Active Recruiters</h3>
                <p className="text-xs text-slate-500">Live positions updated within the last 24 hours</p>
              </div>
              <Link to="/jobs">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  View All Openings
                </Button>
              </Link>
            </div>

            <div className="home-featured-grid">
              {featuredJobs.map((job, idx) => (
                <JobCard key={job.id} job={job} index={idx} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 3: "Build your professional profile." (Candidate Resume & Profile Intelligence)
          ========================================================================== */}
      <section className="home-section home-section--alt scroll-reveal" aria-label="Resume & Profile Experience">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="neutral">Profile Architecture</Badge>
            <h2 className="home-section__title mt-2">Build your professional profile.</h2>
            <p className="home-section__desc">
              Effortless resume intelligence with candidate-first privacy. Extract your education,
              verified skills, and experience with zero data leakage.
            </p>
          </div>

          <div className="profile-storytelling-grid">
            {/* Left: Interactive Simulated Resume Parsing Window */}
            <div className="resume-story-card">
              <div className="resume-story-card__top">
                <div className="flex items-center gap-2">
                  <span className="window-dot window-dot--red" />
                  <span className="window-dot window-dot--yellow" />
                  <span className="window-dot window-dot--green" />
                  <span className="text-xs font-mono text-slate-400 ml-2">resume-extraction-engine.pdf</span>
                </div>
                <Badge variant="success" size="sm" hasDot>Parsed in 0.8s</Badge>
              </div>

              <div className="resume-story-card__body">
                <div className="resume-story-card__banner">
                  <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" />
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Client-Controlled Extraction:</span> You inspect and selectively approve all extracted data before it updates your public profile.
                  </div>
                </div>

                <div className="resume-story-card__extracted-group">
                  <div className="resume-story-card__item">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Candidate Identity</span>
                      <span className="text-2xs text-emerald-400 font-mono">100% Confirmed</span>
                    </div>
                    <div className="text-sm font-semibold text-white">Alex Johnson</div>
                    <div className="text-xs text-slate-400">B.Tech Computer Science • CGPA 8.9</div>
                  </div>

                  <div className="resume-story-card__item">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Extracted Skills</span>
                      <span className="text-2xs text-emerald-400 font-mono">5 Verified</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['Spring Boot', 'React', 'PostgreSQL', 'Docker', 'AWS'].map((skill) => (
                        <span key={skill} className="resume-tag">
                          <CheckCheck size={11} className="text-emerald-400" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="resume-story-card__item">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Recent Experience</span>
                      <span className="text-2xs text-emerald-400 font-mono">Verified Record</span>
                    </div>
                    <div className="text-sm font-medium text-slate-100">Full Stack Engineering Intern</div>
                    <div className="text-xs text-slate-400">Built scalable REST APIs and responsive dashboards</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Candidate Value Proposition & Features */}
            <div className="profile-storytelling__content">
              <div className="feature-block">
                <div className="feature-block__icon">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="feature-block__title">Standardized ATS Profile</h3>
                  <p className="feature-block__desc">
                    No more manual form re-entry on every application. Upload your resume once and generate a verified, recruiter-ready profile in seconds.
                  </p>
                </div>
              </div>

              <div className="feature-block">
                <div className="feature-block__icon">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="feature-block__title">Zero Data Leakage</h3>
                  <p className="feature-block__desc">
                    Your resume data is strictly confidential. No unauthorized AI training on personal details without explicit affirmative consent.
                  </p>
                </div>
              </div>

              <div className="feature-block">
                <div className="feature-block__icon">
                  <Star size={20} />
                </div>
                <div>
                  <h3 className="feature-block__title">Automatic Skill Match Scoring</h3>
                  <p className="feature-block__desc">
                    Instantly see how well your coursework and stack match open engineering roles before submitting.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/candidate/resume">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                    Try Resume Import
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 4: "Recruit better talent." (Recruiter ATS Workflow Visualized)
          ========================================================================== */}
      <section className="home-section scroll-reveal" aria-label="Recruiter Workflow">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="primary">Recruitment Hub</Badge>
            <h2 className="home-section__title mt-2">Recruit better talent.</h2>
            <p className="home-section__desc">
              From candidate screening to offer rollout. Manage high-volume applicant pipelines
              with institutional clarity.
            </p>
          </div>

          {/* Interactive ATS Kanban Pipeline Visual */}
          <div className="ats-showcase-board">
            <div className="ats-showcase-board__header">
              <div className="flex items-center gap-3">
                <div className="ats-showcase-board__icon">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Senior Full Stack Engineer (Req #402)</h3>
                  <span className="text-xs text-slate-500">Active Pipeline • 44 Total Applicants</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/recruiter/dashboard">
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
                    Enter Recruiter Hub
                  </Button>
                </Link>
              </div>
            </div>

            <div className="ats-showcase-board__grid">
              {PIPELINE_DEMO_COLUMNS.map((col) => (
                <div key={col.id} className="ats-column">
                  <div className="ats-column__header">
                    <span className="ats-column__title">{col.title}</span>
                    <span className="ats-column__count">{col.count}</span>
                  </div>

                  <div className="ats-column__cards">
                    {col.candidates.map((cand, idx) => (
                      <div key={idx} className="ats-card">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900">{cand.name}</span>
                          <span className="text-2xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {cand.match}% Match
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">{cand.role}</div>
                        <div className="text-2xs text-slate-400 mb-2">{cand.school}</div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-2xs text-slate-500">
                          <span>{cand.tag}</span>
                          <ChevronRight size={12} className="text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 5: "From application to interview." (Application Lifecycle Visualized)
          ========================================================================== */}
      <section className="home-section home-section--alt scroll-reveal" aria-label="Application Lifecycle">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="neutral">Transparent Lifecycle</Badge>
            <h2 className="home-section__title mt-2">From application to interview.</h2>
            <p className="home-section__desc">
              Every step illuminated. No ghosting, no ambiguous portal statuses, just direct communication.
            </p>
          </div>

          {/* Interactive Progressive Lifecycle Stepper */}
          <div className="lifecycle-stepper">
            <div className="lifecycle-stepper__tabs">
              {LIFECYCLE_STEPS.map((step, idx) => (
                <button
                  key={step.number}
                  type="button"
                  className={`lifecycle-tab ${activeStepIndex === idx ? 'lifecycle-tab--active' : ''}`}
                  onClick={() => setActiveStepIndex(idx)}
                >
                  <span className="lifecycle-tab__number">{step.number}</span>
                  <div className="lifecycle-tab__content">
                    <span className="lifecycle-tab__title">{step.title}</span>
                    <span className="lifecycle-tab__subtitle">{step.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="lifecycle-stepper__stage">
              <div className="lifecycle-card">
                <div className="lifecycle-card__badge">
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    STAGE {LIFECYCLE_STEPS[activeStepIndex].number} / 04
                  </span>
                </div>
                <h3 className="lifecycle-card__title">
                  {LIFECYCLE_STEPS[activeStepIndex].title}
                </h3>
                <p className="lifecycle-card__desc">
                  {LIFECYCLE_STEPS[activeStepIndex].detail}
                </p>

                {/* Simulated Live Viewport Card based on current stage */}
                <div className="lifecycle-card__preview">
                  {activeStepIndex === 0 && (
                    <div className="preview-apply">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">1-Click Application Submission</span>
                        <Badge variant="primary" size="sm">Ready to Send</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Attaching standardized candidate profile and cover letter note.</p>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-700 italic">
                        "Excited to apply for this engineering role through CareerConnect."
                      </div>
                    </div>
                  )}

                  {activeStepIndex === 1 && (
                    <div className="preview-review">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Recruiter Pipeline Tracker</span>
                        <Badge variant="warning" size="sm" hasDot>Under Review</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Lead Engineering Recruiter is reviewing your academic milestones and GitHub repository.</p>
                      <div className="text-2xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} /> SLA active • Estimated review within 24 hours
                      </div>
                    </div>
                  )}

                  {activeStepIndex === 2 && (
                    <div className="preview-interview">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Interview Session Ready</span>
                        <Badge variant="success" size="sm" hasDot>Confirmed</Badge>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video size={16} className="text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900">Technical Round 1 • Google Meet</span>
                        </div>
                        <span className="text-2xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">11:00 AM</span>
                      </div>
                      <p className="text-2xs text-slate-500">Agenda: Data structures, system fundamentals, and architectural tradeoffs.</p>
                    </div>
                  )}

                  {activeStepIndex === 3 && (
                    <div className="preview-offer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Verified Placement Offer</span>
                        <Badge variant="success" size="sm">Selected</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">Official offer letter extended by TechCorp Solutions. Compensation: ₹28 LPA (Fixed) + Performance Variables.</p>
                      <div className="flex items-center gap-2 text-2xs text-emerald-700 font-medium">
                        <CheckCircle2 size={13} /> Institutional placement records synced
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 6: "One platform. Every career journey." (Final SaaS Gateway)
          ========================================================================== */}
      <section className="home-section scroll-reveal" aria-label="Get Started Gateways">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="primary">Get Started</Badge>
            <h2 className="home-section__title mt-2">One platform. Every career journey.</h2>
            <p className="home-section__desc">
              Whether you are graduating into engineering or scaling an enterprise product team,
              CareerConnect delivers the tools you need.
            </p>
          </div>

          <div className="home-cta-grid">
            {/* Candidate Gateway */}
            <div className="home-cta-card home-cta-card--candidate">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2">
                  <Users size={16} /> For Job Seekers & Students
                </div>
                <h3 className="home-cta-card__title">Ready to launch your engineering career?</h3>
                <p className="home-cta-card__desc">
                  Browse hundreds of curated full-time positions, paid internships, and developer fellowships.
                  Zero spam, direct recruiter review.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/jobs">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                    Browse Open Positions
                  </Button>
                </Link>
                <Link to="/candidate/dashboard">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                    Candidate Portal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recruiter Gateway */}
            <div className="home-cta-card home-cta-card--recruiter">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  <Briefcase size={16} /> For Employers & Recruiters
                </div>
                <h3 className="home-cta-card__title">Hiring exceptional tech talent?</h3>
                <p className="home-cta-card__desc">
                  Publish openings, review pre-qualified candidates, manage interview rounds, and build high-performance product teams faster.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/recruiter/dashboard">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                    Enter Recruiter Hub
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span>Enterprise grade ATS governance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
