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

// ─── Stage data ───────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Smooth ease-out cubic */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp value between lo and hi */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Ambient glow palettes keyed to scroll stage
const GLOW_COLORS = [
  'rgba(245, 158, 11, 0.20)',   // 0 – Discover: amber
  'rgba(99,  102, 241, 0.22)',  // 1 – Connect:  indigo
  'rgba(99,  102, 241, 0.22)',  // 2 – Apply:    indigo-blue
  'rgba(16,  185, 129, 0.22)'   // 3 – Forward:  emerald
];

// ─── Component ────────────────────────────────────────────────────────────────
export const ScrollProductShowcase = () => {
  const containerRef = useRef(null);
  const stickyRef    = useRef(null);
  const rafRef       = useRef(null);

  // Current smoothed progress (0–1) tracked in a ref to avoid re-renders
  const smoothProgressRef = useRef(0);
  const rawProgressRef    = useRef(0);

  const [activeStage, setActiveStage] = useState(0);
  const activeStageRef = useRef(0);

  // Detect reduced-motion on mount (SSR-safe)
  const [isReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // ── Write transforms directly to DOM (zero React re-render on each tick) ──
  const applyTransforms = useCallback((p) => {
    const el = stickyRef.current;
    if (!el) return;

    const eased = easeOutCubic(p);

    // Rotation: 6° → 0°  (subtle — NOT 22°)
    const rotateX   = lerp(6, 0, eased);
    // Scale: 0.96 → 1.0
    const scale     = lerp(0.96, 1.0, eased);
    // Lift: 28px → 0px
    const translateY = lerp(28, 0, eased);
    // Glow opacity: 0.4 → 0.75
    const glowOpacity = lerp(0.4, 0.75, eased);

    el.style.setProperty('--rotate-x',          `${rotateX.toFixed(3)}deg`);
    el.style.setProperty('--scale',              scale.toFixed(4));
    el.style.setProperty('--translate-y',        `${translateY.toFixed(2)}px`);
    el.style.setProperty('--ambient-glow-opacity', glowOpacity.toFixed(3));
    el.style.setProperty('--ambient-glow-color', GLOW_COLORS[activeStageRef.current]);
  }, []);

  // ── Main rAF loop: lerp smoothProgressRef toward rawProgressRef ──
  // All values captured here are refs (stable identity) — no deps needed.
  const startTick = useCallback(() => {
    const tick = () => {
      const LERP_FACTOR = 0.08;
      const diff = rawProgressRef.current - smoothProgressRef.current;

      if (Math.abs(diff) > 0.0002) {
        smoothProgressRef.current += diff * LERP_FACTOR;
        applyTransforms(smoothProgressRef.current);
      }

      // Stage boundary (derived from raw progress for snappier tab switch)
      const stageIndex = clamp(Math.floor(rawProgressRef.current * 4), 0, 3);
      if (stageIndex !== activeStageRef.current) {
        activeStageRef.current = stageIndex;
        setActiveStage(stageIndex);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [applyTransforms]);

  // ── Scroll event: update rawProgressRef only (no DOM writes here) ──
  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect         = container.getBoundingClientRect();
    const scrollDist   = container.scrollHeight - window.innerHeight;
    if (scrollDist <= 0) return;

    const raw = clamp(-rect.top / scrollDist, 0, 1);
    rawProgressRef.current = raw;
  }, []);

  // ── Mount / unmount: start the rAF loop, attach scroll listener ──
  useEffect(() => {
    if (isReducedMotion) return;

    // Kick off rAF loop
    startTick();

    const handleScroll = () => onScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Seed initial transforms
    onScroll();
    applyTransforms(0);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isReducedMotion, startTick, onScroll, applyTransforms]);

  // ── Tab click: scroll to corresponding position in the pinned track ──
  const handleStageSelect = useCallback((idx) => {
    setActiveStage(idx);
    activeStageRef.current = idx;

    if (isReducedMotion || !containerRef.current) return;

    const container   = containerRef.current;
    const scrollDist  = container.scrollHeight - window.innerHeight;
    const targetRatio = idx / 3;                              // 0, 1/3, 2/3, 1
    const targetTop   = container.offsetTop + targetRatio * scrollDist;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [isReducedMotion]);

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`cc-showcase-container${isReducedMotion ? ' cc-showcase--reduced' : ''}`}
      aria-label="Interactive Product Motion Showcase"
    >
      <div ref={stickyRef} className="cc-showcase-sticky">
        {/* Ambient Backlight */}
        <div className="cc-showcase-ambient-glow" aria-hidden="true" />

        <div className="cc-showcase-content">
          {/* ── HEADER ── */}
          <div className="cc-showcase-header">
            <div className="cc-showcase-pill">
              <Sparkles size={12} className="text-amber-400" />
              <span>CareerConnect Platform Overview</span>
            </div>

            <h2 className="cc-showcase-title">From discovery to opportunity.</h2>

            <p className="cc-showcase-subtitle">
              Discover verified roles, build your institutional profile, and advance seamlessly
              from application to interview — all in one workspace.
            </p>

            {/* Stage scrub tabs */}
            <nav className="cc-showcase-tabs" aria-label="Showcase Story Stages">
              {STAGES.map((stage, idx) => (
                <button
                  key={stage.id}
                  type="button"
                  className={`cc-showcase-tab${activeStage === idx ? ' cc-showcase-tab--active' : ''}`}
                  onClick={() => handleStageSelect(idx)}
                  aria-current={activeStage === idx ? 'step' : undefined}
                >
                  <span className="cc-showcase-tab-num">{stage.number}</span>
                  <span className="cc-showcase-tab-label">{stage.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* ── 3D DEVICE ── */}
          <div className="cc-showcase-perspective-viewport">
            <div className="cc-showcase-device">

              {/* Chrome top bar */}
              <div className="cc-device-chrome">
                <div className="cc-device-traffic-lights">
                  <span className="cc-light cc-light--red"    aria-hidden="true" />
                  <span className="cc-light cc-light--yellow" aria-hidden="true" />
                  <span className="cc-light cc-light--green"  aria-hidden="true" />
                </div>
                <div className="cc-device-url-bar">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  <span>careerconnect.app / {STAGES[activeStage].id}</span>
                </div>
                <div className="cc-device-status">
                  <span className="cc-status-dot" aria-hidden="true" />
                  <span>{STAGES[activeStage].tagline}</span>
                </div>
              </div>

              {/* Screen body */}
              <div className="cc-device-screen">

                {/* ── STAGE 1: DISCOVER ── */}
                {activeStage === 0 && (
                  <div className="cc-screen-view cc-fade-enter" key="s0">
                    <div className="cc-screen-header-dock">
                      <div className="cc-screen-search-box">
                        <Search size={13} className="text-slate-400" aria-hidden="true" />
                        <span className="text-xs text-slate-400">Staff Software Engineer, ML, Cloud…</span>
                      </div>
                      <div className="cc-screen-filters">
                        <span className="cc-pill cc-pill--active">All</span>
                        <span className="cc-pill">Full-Time</span>
                        <span className="cc-pill">Remote</span>
                        <span className="cc-pill">₹30L+</span>
                      </div>
                    </div>

                    {/* Spotlight card */}
                    <div className="cc-screen-card cc-screen-card--spotlight">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="cc-company-avatar cc-company-avatar--neural">
                            <Sparkles size={16} className="text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-xs font-bold text-white leading-tight">
                                Lead Machine Learning Engineer
                              </h3>
                              <span className="cc-verified-tag">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            </div>
                            <p className="text-2xs text-slate-400 mt-0.5">
                              NeuralSphere AI Labs · Bangalore (Hybrid)
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400">₹36–54 LPA</span>
                          <div className="text-2xs text-slate-500">Full-time</div>
                        </div>
                      </div>

                      <div className="cc-screen-card-skills mt-2">
                        <span className="cc-skill-tag cc-skill-tag--match"><CheckCheck size={11} /> PyTorch</span>
                        <span className="cc-skill-tag cc-skill-tag--match"><CheckCheck size={11} /> LLMs</span>
                        <span className="cc-skill-tag cc-skill-tag--match"><CheckCheck size={11} /> Distributed Systems</span>
                        <span className="cc-skill-tag">CUDA</span>
                        <span className="cc-skill-tag">K8s</span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <div className="cc-match-gauge">
                            <div className="cc-match-fill" style={{ width: '99%' }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-400">99% Match</span>
                        </div>
                        <Link to="/jobs">
                          <Button variant="primary" size="sm" rightIcon={<ArrowRight size={12} />}>
                            View Role
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Secondary rows */}
                    <div className="cc-screen-subcards">
                      <div className="cc-subcard">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">Senior Backend Architect</span>
                          <span className="text-2xs text-emerald-400 font-mono font-bold">96%</span>
                        </div>
                        <span className="text-2xs text-slate-500">CloudScale · ₹32–48 LPA</span>
                      </div>
                      <div className="cc-subcard">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">Full Stack Staff Engineer</span>
                          <span className="text-2xs text-emerald-400 font-mono font-bold">94%</span>
                        </div>
                        <span className="text-2xs text-slate-500">Vanguard FinTech · ₹28–42 LPA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STAGE 2: CONNECT ── */}
                {activeStage === 1 && (
                  <div className="cc-screen-view cc-fade-enter" key="s1">
                    <div className="cc-connect-grid">
                      {/* Candidate profile panel */}
                      <div className="cc-profile-summary-box">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="cc-avatar-circle">AJ</div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white">Alex Johnson</h4>
                              <CheckCircle2 size={13} className="text-blue-400" />
                            </div>
                            <span className="text-2xs text-slate-400">
                              B.Tech CS · CGPA 8.9
                            </span>
                          </div>
                        </div>

                        <div className="cc-status-bar-group">
                          <div className="flex items-center justify-between text-2xs text-slate-400 mb-1">
                            <span>Profile Completeness</span>
                            <span className="text-emerald-400 font-bold font-mono">100%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-full" />
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="text-2xs uppercase tracking-wider font-bold text-slate-500 block mb-1.5">
                            Validated Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {['Spring Boot', 'React 19', 'MySQL', 'Docker', 'Kafka'].map((sk) => (
                              <span key={sk} className="cc-skill-badge">
                                <CheckCheck size={10} className="text-emerald-400" />
                                <span>{sk}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Resume Intelligence panel */}
                      <div className="cc-resume-intelligence-box">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <FileCheck2 size={14} className="text-indigo-400" />
                            <span className="text-xs font-bold text-white">Resume Intelligence</span>
                          </div>
                          <Badge variant="success" size="sm">Client-Side</Badge>
                        </div>

                        <div className="cc-audit-item">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">Academic Verification</span>
                            <span className="text-emerald-400 text-2xs font-mono">Matched</span>
                          </div>
                          <p className="text-2xs text-slate-500 mt-0.5">
                            Extracted against accredited university records.
                          </p>
                        </div>

                        <div className="cc-audit-item mt-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">Production Experience</span>
                            <span className="text-emerald-400 text-2xs font-mono">Validated</span>
                          </div>
                          <p className="text-2xs text-slate-500 mt-0.5">
                            Full-stack microservice architecture — verified.
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800 text-2xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-400" />
                            Zero third-party tracking
                          </span>
                          <Link to="/candidate/profile" className="text-indigo-400 hover:text-indigo-300 font-bold">
                            Profile →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STAGE 3: APPLY ── */}
                {activeStage === 2 && (
                  <div className="cc-screen-view cc-fade-enter" key="s2">
                    <div className="cc-apply-modal-preview">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
                        <div>
                          <span className="text-2xs font-mono text-indigo-400 uppercase tracking-wider font-bold">
                            Direct Application Dispatch
                          </span>
                          <h4 className="text-xs font-bold text-white mt-0.5">
                            Submit to NeuralSphere AI Labs
                          </h4>
                        </div>
                        <Badge variant="primary" size="sm">Ready</Badge>
                      </div>

                      <div className="cc-apply-details-grid">
                        <div className="cc-detail-pill">
                          <span className="text-2xs text-slate-500">Target Role</span>
                          <span className="text-xs font-semibold text-slate-100">Lead ML Engineer</span>
                        </div>
                        <div className="cc-detail-pill">
                          <span className="text-2xs text-slate-500">Packet Type</span>
                          <span className="text-xs font-semibold text-slate-100">Profile + Resume</span>
                        </div>
                      </div>

                      <div className="cc-cover-note-box mt-2.5">
                        <div className="text-2xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                          <Sparkles size={11} className="text-amber-400" />
                          Candidate Dispatch Memo
                        </div>
                        <p className="text-xs text-slate-300 italic">
                          "Excited to apply — built high-throughput Spring Boot microservices
                           and trained transformer embeddings for enterprise search."
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800">
                        <div className="flex items-center gap-1.5 text-2xs text-slate-400">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          Delivered to hiring manager inbox
                        </div>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight size={12} />}>
                          1-Click Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STAGE 4: MOVE FORWARD ── */}
                {activeStage === 3 && (
                  <div className="cc-screen-view cc-fade-enter" key="s3">
                    <div className="cc-pipeline-dashboard-preview">
                      {/* Milestone track */}
                      <div className="cc-milestone-rail">
                        <div className="cc-milestone cc-milestone--completed">
                          <div className="cc-milestone-icon"><CheckCircle2 size={13} /></div>
                          <span className="cc-milestone-label">Applied</span>
                        </div>
                        <div className="cc-milestone-line cc-milestone-line--completed" />
                        <div className="cc-milestone cc-milestone--completed">
                          <div className="cc-milestone-icon"><CheckCircle2 size={13} /></div>
                          <span className="cc-milestone-label">Reviewed</span>
                        </div>
                        <div className="cc-milestone-line cc-milestone-line--completed" />
                        <div className="cc-milestone cc-milestone--active">
                          <div className="cc-milestone-icon"><Video size={13} /></div>
                          <span className="cc-milestone-label">Interview</span>
                        </div>
                        <div className="cc-milestone-line" />
                        <div className="cc-milestone cc-milestone--future">
                          <div className="cc-milestone-icon"><Award size={13} /></div>
                          <span className="cc-milestone-label">Offer</span>
                        </div>
                      </div>

                      {/* Live interview card */}
                      <div className="cc-interview-live-box">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="cc-live-beacon" aria-hidden="true" />
                            <span className="text-xs font-bold text-white">Upcoming Interview</span>
                          </div>
                          <Badge variant="success" size="sm">Confirmed</Badge>
                        </div>

                        <div className="cc-interview-meeting-row">
                          <div className="flex items-center gap-2">
                            <div className="cc-video-icon-wrap">
                              <Video size={14} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-100">
                                Round 1 · System Design
                              </div>
                              <div className="text-2xs text-slate-400">
                                NeuralSphere AI · Lead Architect Panel
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-mono font-bold text-white">Tomorrow 11:00 AM</div>
                            <span className="text-2xs text-emerald-400 font-semibold">Meet Synced</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-2xs">
                          <span className="text-slate-500">SLA: Feedback within 24 hrs</span>
                          <Link to="/candidate/interviews">
                            <Button variant="outline" size="xs" rightIcon={<ArrowRight size={11} />}>
                              Interview Room
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer bar */}
              <div className="cc-device-footbar">
                <span>
                  <span className="font-mono text-indigo-400 font-bold">
                    STEP {STAGES[activeStage].number} / 04
                  </span>
                  {' · '}
                  <span>{STAGES[activeStage].description}</span>
                </span>
                <Link to="/jobs">
                  <span className="text-slate-300 hover:text-white font-semibold transition-colors">
                    Browse Opportunities →
                  </span>
                </Link>
              </div>

            </div>
          </div>{/* perspective-viewport */}
        </div>{/* content */}
      </div>{/* sticky */}
    </div>  /* container */
  );
};

export default ScrollProductShowcase;
