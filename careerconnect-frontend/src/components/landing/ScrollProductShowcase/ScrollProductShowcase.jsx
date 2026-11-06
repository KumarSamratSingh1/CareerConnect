import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
  AnimatePresence
} from 'framer-motion';
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
import { StepProgressionTabs } from '../StepProgressionTabs';
import './ScrollProductShowcase.css';

// ─── Stage Data ───────────────────────────────────────────────────────────────
const STAGES = [
  {
    id: 'discover',
    number: '01',
    label: 'Discover',
    tagline: 'Semantic Job Discovery',
    description: 'Explore high-caliber engineering and product roles with instant skill matching.',
    accentColor: '#f59e0b'
  },
  {
    id: 'connect',
    number: '02',
    label: 'Connect',
    tagline: 'Institutional Profile & Verification',
    description: 'Cryptographically verified skills, academic credentials, and automated resume parsing.',
    accentColor: '#6366f1'
  },
  {
    id: 'apply',
    number: '03',
    label: 'Apply',
    tagline: '1-Click Direct Application',
    description: 'Instant candidate profile packet dispatch directly to hiring engineering managers.',
    accentColor: '#3b82f6'
  },
  {
    id: 'progress',
    number: '04',
    label: 'Move Forward',
    tagline: 'Real-Time Pipeline & Interview Sync',
    description: 'Live ATS updates, automated Google Meet rounds, and transparent offer rollouts.',
    accentColor: '#10b981'
  }
];

// Ambient glow colors corresponding to each stage
const GLOW_COLORS = [
  'rgba(245, 158, 11, 0.22)',  // 0 – Discover: amber
  'rgba(99, 102, 241, 0.25)',  // 1 – Connect:  indigo
  'rgba(59, 130, 246, 0.25)',  // 2 – Apply:    blue
  'rgba(16, 185, 129, 0.25)'   // 3 – Forward:  emerald
];

export const ScrollProductShowcase = () => {
  const containerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // ── Framer Motion useScroll targeting the tall pinned container ─────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // ── Fluid, weighted spring physics (Umbrel-inspired calm inertia) ────────────
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.22,
    restDelta: 0.001
  });

  // ── Sync Active Stage with Scroll Progress (0.00–0.25, 0.25–0.50, etc.) ────
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const stageIndex = Math.min(3, Math.max(0, Math.floor(latest * 4)));
    setActiveStage((prev) => (prev !== stageIndex ? stageIndex : prev));
  });

  // ── Continuous 3D transforms derived from smooth scroll progress ────────────
  // Stage 0.00: tilted (14° rotateX, -3.5° rotateY, 0.82 scale, 75px Y lift)
  // Stage 0.40: straightening (7° rotateX, -1.8° rotateY, 0.92 scale, 25px Y lift)
  // Stage 0.80: nearly upright (2° rotateX, 0° rotateY, 0.98 scale, 5px Y lift)
  // Stage 1.00: fully settled frontal (0° rotateX, 0° rotateY, 1.00 scale, 0px Y)
  const rawRotateX = useTransform(smoothProgress, [0, 0.4, 0.8, 1], [14, 7, 2, 0]);
  const rawRotateY = useTransform(smoothProgress, [0, 0.4, 0.8, 1], [-3.5, -1.8, 0, 0]);
  const rawScale   = useTransform(smoothProgress, [0, 0.5, 1], [0.82, 0.93, 1.0]);
  const rawY       = useTransform(smoothProgress, [0, 0.5, 1], [75, 20, 0]);
  const rawGlow    = useTransform(smoothProgress, [0, 0.5, 1], [0.35, 0.65, 0.8]);

  // Respect user's accessibility reduced motion setting
  const rotateX = shouldReduceMotion ? 0 : rawRotateX;
  const rotateY = shouldReduceMotion ? 0 : rawRotateY;
  const scale   = shouldReduceMotion ? 1 : rawScale;
  const y       = shouldReduceMotion ? 0 : rawY;

  // ── Tab click handler: smoothly scrolls page to target stage in pinned track ──
  const handleStageSelect = (idx) => {
    setActiveStage(idx);

    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const currentScroll = window.scrollY || window.pageYOffset;
    const containerTop = currentScroll + rect.top;
    const scrollDist = container.scrollHeight - window.innerHeight;

    if (scrollDist <= 0) return;
    // Scroll to the midpoint of the selected stage bucket
    const targetRatio = (idx * 2 + 1) / 8;
    const targetTop = containerTop + (targetRatio * scrollDist);

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  return (
    <section
      ref={containerRef}
      className={`cc-showcase-container${shouldReduceMotion ? ' cc-showcase--reduced' : ''}`}
      aria-label="CareerConnect Interactive Motion Showcase"
    >
      <div className="cc-showcase-sticky">
        {/* Dynamic Ambient Backlight */}
        <motion.div
          className="cc-showcase-ambient-glow"
          style={{
            opacity: rawGlow,
            backgroundColor: GLOW_COLORS[activeStage]
          }}
          aria-hidden="true"
        />

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
              from application to interview — all in one unified workspace.
            </p>

            {/* StepProgressionTabs component rendered directly on the landing page */}
            <StepProgressionTabs
              activeStage={activeStage}
              onStageSelect={handleStageSelect}
              stages={STAGES}
              compact={true}
              className="mt-1"
            />
          </div>

          {/* ── 3D PERSPECTIVE VIEWPORT ── */}
          <div className="cc-showcase-perspective-viewport">
            {/* The main product visual receiving continuous scroll-driven motion */}
            <motion.div
              className="cc-showcase-device"
              style={{
                rotateX,
                rotateY,
                scale,
                y,
                transformPerspective: 1600,
                transformOrigin: 'center top'
              }}
            >
              {/* Chrome Top Bar */}
              <div className="cc-device-chrome">
                <div className="cc-device-traffic-lights" aria-hidden="true">
                  <span className="cc-light cc-light--red" />
                  <span className="cc-light cc-light--yellow" />
                  <span className="cc-light cc-light--green" />
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

              {/* Screen Body with Fluid Stage Transitions */}
              <div className="cc-device-screen">
                <AnimatePresence mode="wait">
                  {/* ── STAGE 1: DISCOVER ── */}
                  {activeStage === 0 && (
                    <motion.div
                      key="stage-discover"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="cc-screen-view"
                    >
                      <div className="cc-screen-header-dock">
                        <div className="cc-screen-search-box">
                          <Search size={13} className="text-slate-400" aria-hidden="true" />
                          <span className="text-xs text-slate-400 truncate">
                            Staff Software Engineer, ML, Cloud Systems…
                          </span>
                        </div>
                        <div className="cc-screen-filters">
                          <span className="cc-pill cc-pill--active">All</span>
                          <span className="cc-pill">Full-Time</span>
                          <span className="cc-pill">Remote</span>
                          <span className="cc-pill">₹30L+</span>
                        </div>
                      </div>

                      {/* Spotlight Job Card */}
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

                      {/* Secondary Quick-Picks */}
                      <div className="cc-screen-subcards">
                        <div className="cc-subcard">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 truncate">Senior Backend Architect</span>
                            <span className="text-2xs text-emerald-400 font-mono font-bold ml-2">96%</span>
                          </div>
                          <span className="text-2xs text-slate-500">CloudScale · ₹32–48 LPA</span>
                        </div>
                        <div className="cc-subcard">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 truncate">Full Stack Staff Engineer</span>
                            <span className="text-2xs text-emerald-400 font-mono font-bold ml-2">94%</span>
                          </div>
                          <span className="text-2xs text-slate-500">Vanguard FinTech · ₹28–42 LPA</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STAGE 2: CONNECT ── */}
                  {activeStage === 1 && (
                    <motion.div
                      key="stage-connect"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="cc-screen-view"
                    >
                      <div className="cc-connect-grid">
                        {/* Candidate Profile Box */}
                        <div className="cc-profile-summary-box">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="cc-avatar-circle">AJ</div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-white">Alex Johnson</h4>
                                <CheckCircle2 size={13} className="text-blue-400" />
                              </div>
                              <span className="text-2xs text-slate-400">
                                B.Tech CS · CGPA 8.9 · Senior Engineer
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

                        {/* Resume Intelligence Box */}
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
                    </motion.div>
                  )}

                  {/* ── STAGE 3: APPLY ── */}
                  {activeStage === 2 && (
                    <motion.div
                      key="stage-apply"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="cc-screen-view"
                    >
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
                            &quot;Excited to apply — built high-throughput Spring Boot microservices
                            and trained transformer embeddings for enterprise search.&quot;
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800">
                          <div className="flex items-center gap-1.5 text-2xs text-slate-400">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            Delivered directly to hiring manager inbox
                          </div>
                          <Button variant="primary" size="sm" rightIcon={<ArrowRight size={12} />}>
                            1-Click Apply
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STAGE 4: MOVE FORWARD ── */}
                  {activeStage === 3 && (
                    <motion.div
                      key="stage-forward"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="cc-screen-view"
                    >
                      <div className="cc-pipeline-dashboard-preview">
                        {/* Milestone Rail */}
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

                        {/* Live Interview Confirmation Card */}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Bar */}
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
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollProductShowcase;
