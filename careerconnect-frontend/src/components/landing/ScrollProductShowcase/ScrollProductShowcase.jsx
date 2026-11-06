import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Video,
  ShieldCheck,
  ArrowRight,
  CheckCheck,
  FileCheck2,
  Award
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import './ScrollProductShowcase.css';

const STAGES = [
  {
    id: 'discover',
    number: '01',
    label: 'Discover',
    tagline: 'Semantic Job Discovery',
    description: 'Explore high-caliber engineering and product roles with instant skill matching.'
  },
  {
    id: 'connect',
    number: '02',
    label: 'Connect',
    tagline: 'Institutional Profile & Verification',
    description: 'Cryptographically verified skills, academic credentials, and automated resume parsing.'
  },
  {
    id: 'apply',
    number: '03',
    label: 'Apply',
    tagline: '1-Click Direct Application',
    description: 'Instant candidate profile packet dispatch directly to hiring engineering managers.'
  },
  {
    id: 'progress',
    number: '04',
    label: 'Move Forward',
    tagline: 'Real-Time Pipeline & Interview Sync',
    description: 'Live ATS updates, automated Google Meet rounds, and transparent offer rollouts.'
  }
];

export const ScrollProductShowcase = () => {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const rafIdRef = useRef(null);
  const activeStageRef = useRef(0);

  // Sync reduced motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // High-performance scroll handler using requestAnimationFrame and CSS custom properties
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !stickyRef.current || isReducedMotion) return;

    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const scrollDistance = rect.height - windowHeight;

    if (scrollDistance <= 0) return;

    // Calculate progress (0.0 to 1.0) through the pinned section
    const rawProgress = -rect.top / scrollDistance;
    const progress = Math.max(0, Math.min(1, rawProgress));

    // Calculate 3D transforms based on scroll progress
    // Easing curve: smooth start, progressive flat landing
    const easeOutQuad = (t) => t * (2 - t);
    const eased = easeOutQuad(progress);

    // Initial 3D tilt: 22deg -> 0deg upright
    const rotateX = (1 - eased) * 22;
    // Scale: 0.88 -> 1.01
    const scale = 0.88 + eased * 0.13;
    // TranslateY: 70px -> 0px
    const translateY = (1 - eased) * 70;
    // Ambient glow opacity & hue shift
    const glowOpacity = 0.35 + eased * 0.45;

    // Ambient glow colors across progress:
    // 0.0 - 0.33: Amber/Sunset (Discovery)
    // 0.33 - 0.66: Indigo/Cyber (Verification & Apply)
    // 0.66 - 1.0: Sapphire/Emerald (Hired/Success)
    let glowColor = 'rgba(245, 158, 11, 0.22)';
    if (progress > 0.66) {
      glowColor = 'rgba(16, 185, 129, 0.25)';
    } else if (progress > 0.33) {
      glowColor = 'rgba(99, 102, 241, 0.28)';
    }

    // Directly update CSS properties on DOM node (bypasses React render cycle for 60fps)
    const el = stickyRef.current;
    el.style.setProperty('--sp', progress.toFixed(4));
    el.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
    el.style.setProperty('--scale', scale.toFixed(3));
    el.style.setProperty('--translate-y', `${translateY.toFixed(1)}px`);
    el.style.setProperty('--ambient-glow-color', glowColor);
    el.style.setProperty('--ambient-glow-opacity', glowOpacity.toFixed(2));

    // Determine current milestone stage (0 to 3)
    const stageIndex = Math.min(3, Math.floor(progress * 4));
    if (stageIndex !== activeStageRef.current) {
      activeStageRef.current = stageIndex;
      setActiveStage(stageIndex);
    }
  }, [isReducedMotion]);

  useEffect(() => {
    if (isReducedMotion) return;

    const onScroll = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        handleScroll();
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Trigger initial calculation
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [handleScroll, isReducedMotion]);

  // Click on stage tab to jump or manually toggle
  const handleStageSelect = (idx) => {
    setActiveStage(idx);
    activeStageRef.current = idx;
    if (!isReducedMotion && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = containerRef.current.scrollHeight - window.innerHeight;
      const targetScroll = window.scrollY + rect.top + (idx / 3) * scrollDistance;
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`cc-showcase-container ${isReducedMotion ? 'cc-showcase--reduced' : ''}`}
      aria-label="Interactive Product Motion Showcase"
    >
      <div ref={stickyRef} className="cc-showcase-sticky">
        {/* Ambient Backlight Glow reacting to 3D scroll */}
        <div className="cc-showcase-ambient-glow" aria-hidden="true" />

        <div className="cc-showcase-content">
          {/* Header Narrative */}
          <div className="cc-showcase-header">
            <div className="cc-showcase-pill">
              <Sparkles size={13} className="text-amber-400" />
              <span>CareerConnect 2.0 Motion Showcase</span>
            </div>
            <h2 className="cc-showcase-title">
              From discovery to opportunity.
            </h2>
            <p className="cc-showcase-subtitle">
              Discover verified roles, verify your skill matrix, and advance seamlessly from
              application to interview — all in one unified workspace.
            </p>

            {/* Interactive Stage Scrub Tabs */}
            <nav className="cc-showcase-tabs" aria-label="Showcase Story Stages">
              {STAGES.map((stage, idx) => (
                <button
                  key={stage.id}
                  type="button"
                  className={`cc-showcase-tab ${activeStage === idx ? 'cc-showcase-tab--active' : ''}`}
                  onClick={() => handleStageSelect(idx)}
                >
                  <span className="cc-showcase-tab-num">{stage.number}</span>
                  <span className="cc-showcase-tab-label">{stage.label}</span>
                  {activeStage === idx && (
                    <span className="cc-showcase-tab-indicator" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* 3D Cinematic Screen Showcase */}
          <div className="cc-showcase-perspective-viewport">
            <div className="cc-showcase-device">
              {/* Device Top Chrome / Window Bar */}
              <div className="cc-device-chrome">
                <div className="cc-device-traffic-lights">
                  <span className="cc-light cc-light--red" />
                  <span className="cc-light cc-light--yellow" />
                  <span className="cc-light cc-light--green" />
                </div>
                <div className="cc-device-url-bar">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>careerconnect.app/workspace/{STAGES[activeStage].id}</span>
                </div>
                <div className="cc-device-status">
                  <span className="cc-status-dot" />
                  <span>{STAGES[activeStage].tagline}</span>
                </div>
              </div>

              {/* Device Display Screen Body */}
              <div className="cc-device-screen">
                {/* STAGE 1: DISCOVER */}
                {activeStage === 0 && (
                  <div className="cc-screen-view cc-fade-enter" key="stage-0">
                    {/* Search & Filter Header Bar */}
                    <div className="cc-screen-header-dock">
                      <div className="cc-screen-search-box">
                        <Search size={15} className="text-slate-400" />
                        <span className="text-xs text-slate-300">Staff Software Engineer, Machine Learning, Cloud...</span>
                      </div>
                      <div className="cc-screen-filters">
                        <span className="cc-pill cc-pill--active">All Roles</span>
                        <span className="cc-pill">Full-Time</span>
                        <span className="cc-pill">Remote</span>
                        <span className="cc-pill">₹30L+ LPA</span>
                      </div>
                    </div>

                    {/* Spotlight Job Card */}
                    <div className="cc-screen-card cc-screen-card--spotlight">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="cc-company-avatar cc-company-avatar--neural">
                            <Sparkles size={20} className="text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">Lead Machine Learning Engineer</h3>
                              <span className="cc-verified-tag">
                                <ShieldCheck size={11} /> Verified Employer
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">NeuralSphere AI Labs • Bangalore, India (Hybrid)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-400">₹36 - 54 LPA</span>
                          <div className="text-2xs text-slate-400 mt-0.5">Full-time • Direct Hire</div>
                        </div>
                      </div>

                      <div className="cc-screen-card-skills mt-3">
                        <span className="cc-skill-tag cc-skill-tag--match">
                          <CheckCheck size={12} /> PyTorch (Expert)
                        </span>
                        <span className="cc-skill-tag cc-skill-tag--match">
                          <CheckCheck size={12} /> Distributed Systems
                        </span>
                        <span className="cc-skill-tag cc-skill-tag--match">
                          <CheckCheck size={12} /> LLMs & Transformer Models
                        </span>
                        <span className="cc-skill-tag">CUDA</span>
                        <span className="cc-skill-tag">Kubernetes</span>
                      </div>

                      <div className="cc-screen-card-footer mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="cc-match-gauge">
                            <div className="cc-match-fill" style={{ width: '99%' }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-400">99% Match Score</span>
                        </div>
                        <Link to="/jobs">
                          <Button variant="primary" size="sm" rightIcon={<ArrowRight size={13} />}>
                            View Full Opening
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Secondary Quick Matches */}
                    <div className="cc-screen-subcards">
                      <div className="cc-subcard">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">Senior Backend Architect</span>
                          <span className="text-2xs text-emerald-400 font-mono">96% Match</span>
                        </div>
                        <span className="text-2xs text-slate-400">CloudScale Systems • ₹32 - 48 LPA</span>
                      </div>
                      <div className="cc-subcard">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">Full Stack Staff Engineer</span>
                          <span className="text-2xs text-emerald-400 font-mono">94% Match</span>
                        </div>
                        <span className="text-2xs text-slate-400">Vanguard FinTech • ₹28 - 42 LPA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 2: CONNECT */}
                {activeStage === 1 && (
                  <div className="cc-screen-view cc-fade-enter" key="stage-1">
                    <div className="cc-connect-grid">
                      {/* Left: Verified Candidate Matrix */}
                      <div className="cc-profile-summary-box">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="cc-avatar-circle">AJ</div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-white">Alex Johnson</h4>
                              <CheckCircle2 size={14} className="text-blue-400" />
                            </div>
                            <span className="text-xs text-slate-400">Computer Science & Engineering • CGPA 8.9</span>
                          </div>
                        </div>

                        <div className="cc-status-bar-group">
                          <div className="flex items-center justify-between text-2xs text-slate-400 mb-1">
                            <span>Profile Completeness</span>
                            <span className="text-emerald-400 font-bold font-mono">100% Verified</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-full" />
                          </div>
                        </div>

                        <div className="mt-4">
                          <span className="text-2xs uppercase tracking-wider font-bold text-slate-400 block mb-1.5">
                            Validated Core Competencies
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {['Spring Boot 3', 'React 19', 'MySQL', 'Docker', 'RESTful APIs', 'Kafka'].map((sk) => (
                              <span key={sk} className="cc-skill-badge">
                                <CheckCheck size={11} className="text-emerald-400" />
                                <span>{sk}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Resume Intelligence Engine */}
                      <div className="cc-resume-intelligence-box">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileCheck2 size={16} className="text-indigo-400" />
                            <span className="text-xs font-bold text-white">Resume Intelligence Engine</span>
                          </div>
                          <Badge variant="success" size="sm">Client-Side Parser</Badge>
                        </div>

                        <div className="cc-audit-item">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">B.Tech Academic Verification</span>
                            <span className="text-emerald-400 text-2xs font-mono">Matched</span>
                          </div>
                          <p className="text-2xs text-slate-400 mt-0.5">Automated extraction verified against accredited university records.</p>
                        </div>

                        <div className="cc-audit-item mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">Production Experience Index</span>
                            <span className="text-emerald-400 text-2xs font-mono">Validated</span>
                          </div>
                          <p className="text-2xs text-slate-400 mt-0.5">Full stack microservice telemetry & React frontend architecture.</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800 text-2xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={13} className="text-emerald-400" />
                            Zero third-party data tracking
                          </span>
                          <Link to="/candidate/profile" className="text-indigo-400 hover:text-indigo-300 font-bold">
                            View Profile →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 3: APPLY */}
                {activeStage === 2 && (
                  <div className="cc-screen-view cc-fade-enter" key="stage-2">
                    <div className="cc-apply-modal-preview">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-2xs font-mono text-indigo-400 uppercase tracking-wider font-bold">
                            Direct Application Dispatch
                          </span>
                          <h4 className="text-sm font-bold text-white">Submit to NeuralSphere AI Labs</h4>
                        </div>
                        <Badge variant="primary" size="sm">Ready to Send</Badge>
                      </div>

                      <div className="cc-apply-details-grid my-3">
                        <div className="cc-detail-pill">
                          <span className="text-2xs text-slate-400">Target Role</span>
                          <span className="text-xs font-semibold text-slate-100">Lead Machine Learning Engineer</span>
                        </div>
                        <div className="cc-detail-pill">
                          <span className="text-2xs text-slate-400">Packet Type</span>
                          <span className="text-xs font-semibold text-slate-100">Standardized Profile + Resume</span>
                        </div>
                      </div>

                      <div className="cc-cover-note-box">
                        <div className="text-2xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <Sparkles size={12} className="text-amber-400" />
                          <span>Candidate Dispatch Memo:</span>
                        </div>
                        <p className="text-xs text-slate-300 italic">
                          "Excited to apply. I have designed high-throughput distributed microservices with Spring Boot and trained transformer embeddings for enterprise search."
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
                        <div className="flex items-center gap-1.5 text-2xs text-slate-400">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>Delivered directly to hiring manager inbox</span>
                        </div>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight size={13} />}>
                          1-Click Instant Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 4: MOVE FORWARD */}
                {activeStage === 3 && (
                  <div className="cc-screen-view cc-fade-enter" key="stage-3">
                    <div className="cc-pipeline-dashboard-preview">
                      {/* Milestone Progress Bar */}
                      <div className="cc-milestone-rail mb-4">
                        <div className="cc-milestone cc-milestone--completed">
                          <div className="cc-milestone-icon"><CheckCircle2 size={14} /></div>
                          <span className="cc-milestone-label">Applied</span>
                        </div>
                        <div className="cc-milestone-line cc-milestone-line--completed" />
                        <div className="cc-milestone cc-milestone--completed">
                          <div className="cc-milestone-icon"><CheckCircle2 size={14} /></div>
                          <span className="cc-milestone-label">Under Review</span>
                        </div>
                        <div className="cc-milestone-line cc-milestone-line--completed" />
                        <div className="cc-milestone cc-milestone--active">
                          <div className="cc-milestone-icon"><Video size={14} /></div>
                          <span className="cc-milestone-label">Interview</span>
                        </div>
                        <div className="cc-milestone-line" />
                        <div className="cc-milestone cc-milestone--future">
                          <div className="cc-milestone-icon"><Award size={14} /></div>
                          <span className="cc-milestone-label">Offer</span>
                        </div>
                      </div>

                      {/* Live Interview Card */}
                      <div className="cc-interview-live-box">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="cc-live-beacon" />
                            <span className="text-xs font-bold text-white">Upcoming Video Interview</span>
                          </div>
                          <Badge variant="success" size="sm">Confirmed Session</Badge>
                        </div>

                        <div className="cc-interview-meeting-row">
                          <div className="flex items-center gap-2.5">
                            <div className="cc-video-icon-wrap">
                              <Video size={16} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100">Round 1: System Design & Algorithms</div>
                              <div className="text-2xs text-slate-400">NeuralSphere AI • Lead Architect Panel</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-white">Tomorrow • 11:00 AM IST</div>
                            <span className="text-2xs text-emerald-400 font-semibold">Google Meet Synced</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800 text-2xs">
                          <span className="text-slate-400">Candidate SLA: Feedback guaranteed within 24 hours</span>
                          <Link to="/candidate/interviews">
                            <Button variant="outline" size="xs" rightIcon={<ArrowRight size={12} />}>
                              View Interview Room
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Interactive Stage Progress Footbar */}
              <div className="cc-device-footbar">
                <div className="flex items-center gap-2 text-2xs text-slate-400">
                  <span className="font-mono text-indigo-400 font-bold">
                    STEP {STAGES[activeStage].number} OF 04
                  </span>
                  <span>•</span>
                  <span>{STAGES[activeStage].description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/jobs">
                    <span className="text-2xs text-slate-300 hover:text-white font-semibold transition-colors">
                      Browse All Opportunities →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollProductShowcase;
