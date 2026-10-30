import { useState, useEffect } from 'react';
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
  Users,
  Briefcase,
  ShieldCheck,
  Calendar,
  Star
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

/**
 * Maps category icon names to Lucide icon components.
 */
const CATEGORY_ICONS = {
  Code: Code,
  Cpu: Cpu,
  Layout: Layout,
  Palette: Palette,
  Cloud: Cloud,
  GraduationCap: GraduationCap
};

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

  // Scroll reveal observer
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
      { threshold: 0.1 }
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

      {/* 1. HERO SECTION (UPGRADED COMPOSITION) */}
      <section className="home-hero">
        <div className="home-hero__ambient-glow" aria-hidden="true" />
        <div className="home-hero__grid-pattern" aria-hidden="true" />

        <div className="container home-hero__container">
          <div className="home-hero__content-grid">
            {/* Left Content Column */}
            <div className="home-hero__left">
              <div className="home-hero__pill hero-anim-1">
                <span className="home-hero__pill-dot" />
                <Sparkles size={14} className="text-brand" />
                <span>Next-Gen Recruitment & Campus Placements</span>
              </div>

              <h1 className="home-hero__title hero-anim-2">
                Find The Opportunity That Moves Your <br className="hidden sm:inline" />
                <span className="home-hero__title-accent">Career Forward.</span>
              </h1>

              <p className="home-hero__subtitle hero-anim-3">
                Discover curated engineering positions, internships, and high-impact technology
                roles at verified startups and market leaders. Intelligent matching with zero friction.
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
              </div>

              {/* Prominent Search UI Card */}
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
                        placeholder="Job title, tech stack (e.g. React, Spring Boot, AI)..."
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
                        <option value="ALL">All Categories</option>
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
                  <span className="font-semibold text-slate-700">Trending:</span>
                  {['Full Stack', 'Spring Boot', 'React', 'AI / ML', 'SDE Intern', 'DevOps'].map((tag) => (
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

            {/* Right Visual Composition (Desktop) */}
            <div className="home-hero__right hero-anim-6">
              <div className="home-hero__composition">
                <div className="home-hero__composition-glow" aria-hidden="true" />

                {/* Floating Showcase Card 1: Job Preview */}
                <div className="hero-floating-card hero-floating-card--main">
                  <div className="hero-floating-card__header">
                    <div className="job-card__avatar" aria-hidden="true">
                      T
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">TechCorp Solutions</span>
                        <Badge variant="success" size="sm" hasDot>Verified</Badge>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
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
                </div>

                {/* Floating Showcase Pill 1: Candidate Match */}
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

                {/* Floating Showcase Pill 2: Live Interview Scheduled */}
                <div className="hero-floating-card hero-floating-card--badge-bottom animate-float-rev">
                  <div className="hero-badge-pill">
                    <div className="hero-badge-pill__icon bg-emerald-500 text-white">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Interview Scheduled</div>
                      <div className="text-2xs text-emerald-600 font-medium">Technical Round • Tomorrow 11 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof / Partner Strip */}
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

      {/* 2. STATS STRIP (ANIMATED METRICS) */}
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

      {/* 3. FEATURED OPPORTUNITIES SECTION */}
      <section className="home-section scroll-reveal" aria-label="Featured Opportunities">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="primary" hasDot>
              Editor's Choice
            </Badge>
            <h2 className="home-section__title mt-2">Featured Opportunities</h2>
            <p className="home-section__desc">
              Curated positions with direct interview pipelines from fast-growing engineering teams.
            </p>
          </div>

          <div className="home-featured-grid">
            {featuredJobs.map((job, idx) => (
              <JobCard key={job.id} job={job} index={idx} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/jobs">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight size={16} />}>
                Explore All Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ROLE / CATEGORY EXPLORATION */}
      <section className="home-section home-section--alt scroll-reveal" aria-label="Explore by Category">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="neutral">Explore Disciplines</Badge>
            <h2 className="home-section__title mt-2">Browse By Domain & Specialization</h2>
            <p className="home-section__desc">
              Find positions aligned with your tech stack, academic background, and career trajectory.
            </p>
          </div>

          <div className="home-category-grid">
            {CATEGORIES.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.iconName] || Briefcase;
              return (
                <Link
                  key={cat.id}
                  to={`/jobs?category=${encodeURIComponent(cat.shortName)}`}
                  className="home-category-card"
                >
                  <div>
                    <div className="home-category-card__icon-wrap">
                      <IconComponent size={22} />
                    </div>
                    <h3 className="home-category-card__name">{cat.name}</h3>
                    <p className="home-category-card__desc mt-1">{cat.description}</p>
                  </div>
                  <div className="home-category-card__count">
                    <span>{cat.count} Open Roles</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. HOW CAREERCONNECT WORKS */}
      <section className="home-section scroll-reveal" aria-label="How CareerConnect Works">
        <div className="container">
          <div className="home-section__header">
            <Badge variant="primary">Streamlined Process</Badge>
            <h2 className="home-section__title mt-2">How CareerConnect Accelerates Your Career</h2>
            <p className="home-section__desc">
              Transparent, student-friendly, and enterprise-grade hiring workflows from application to offer.
            </p>
          </div>

          <div className="home-steps-grid">
            <div className="home-step-card">
              <div className="home-step-card__number">1</div>
              <h3 className="home-step-card__title">Create & Verify Profile</h3>
              <p className="home-step-card__desc">
                Build your standardized engineering profile with verified academic milestones, skills, and projects.
              </p>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">2</div>
              <h3 className="home-step-card__title">Discover Curated Matches</h3>
              <p className="home-step-card__desc">
                Filter by tech stack, compensation, work arrangement (Remote/Hybrid), and experience level with zero noise.
              </p>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">3</div>
              <h3 className="home-step-card__title">1-Click Fast Apply</h3>
              <p className="home-step-card__desc">
                Submit applications directly into recruiter pipelines without tedious third-party portal redirects.
              </p>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">4</div>
              <h3 className="home-step-card__title">Direct Interviews & Offers</h3>
              <p className="home-step-card__desc">
                Receive scheduled technical interviews, status tracking updates, and transparent offer evaluations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DUAL CTA SECTION */}
      <section className="home-section home-section--alt scroll-reveal" aria-label="Get Started Gateways">
        <div className="container">
          <div className="home-cta-grid">
            {/* Candidate CTA */}
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
              <div className="flex flex-wrap gap-3">
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

            {/* Recruiter CTA */}
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
              <div className="flex flex-wrap gap-3">
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
