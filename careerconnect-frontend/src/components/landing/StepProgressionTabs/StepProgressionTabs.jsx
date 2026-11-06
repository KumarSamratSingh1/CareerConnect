import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  UserCheck,
  SendHorizontal,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  ShieldCheck
} from 'lucide-react';
import './StepProgressionTabs.css';

// ─── Default Step Data ────────────────────────────────────────────────────────
const DEFAULT_STAGES = [
  {
    id: 'discover',
    number: '01',
    label: 'Discover',
    tagline: 'Semantic Job Discovery',
    title: 'Find high-caliber roles tailored to your exact skillset.',
    description:
      'AI-driven skill matching pairs you with opportunities based on your proven competencies, domain experience, and compensation targets.',
    icon: Compass,
    accentColor: '#f59e0b',
    stats: [
      { label: 'Match Accuracy', val: '98.4%' },
      { label: 'Active Openings', val: '2,400+' }
    ],
    preview: {
      tag: 'Verified Match',
      role: 'Staff Platform Engineer',
      company: 'Datadog • Cloud & Infrastructure',
      salary: '$185,000 – $220,000 / yr',
      skills: ['Go', 'Kubernetes', 'Distributed Systems', 'gRPC'],
      statusText: 'Top 3% Candidate Match'
    }
  },
  {
    id: 'connect',
    number: '02',
    label: 'Connect',
    tagline: 'Institutional Profile & Verification',
    title: 'Stand out with cryptographically verified credentials.',
    description:
      'Eliminate outdated paper resumes. Instant parsing validates your technical projects, certifications, and GitHub portfolio directly for engineering leads.',
    icon: UserCheck,
    accentColor: '#6366f1',
    stats: [
      { label: 'Profile Trust Score', val: '99/100' },
      { label: 'Verified Skills', val: '14 Badges' }
    ],
    preview: {
      tag: 'Identity Verified',
      role: 'Alex Mercer, Senior Full-Stack Engineer',
      company: 'Profile completeness: 100%',
      salary: 'Availability: Immediate • Remote & Hybrid',
      skills: ['React 19', 'Spring Boot 3', 'TypeScript', 'PostgreSQL'],
      statusText: 'Verified by CareerConnect Authority'
    }
  },
  {
    id: 'apply',
    number: '03',
    label: 'Apply',
    tagline: '1-Click Direct Application',
    title: 'Bypass ATS black holes with direct executive routing.',
    description:
      'Deliver rich, formatted application packets straight to decision-makers without filling out repetitive 20-page forms.',
    icon: SendHorizontal,
    accentColor: '#3b82f6',
    stats: [
      { label: 'Avg. Response Time', val: '24 Hours' },
      { label: 'Direct Referrals', val: '87%' }
    ],
    preview: {
      tag: 'Packet Dispatched',
      role: 'Senior Backend Architect',
      company: 'Stripe • Core Financial Ledger',
      salary: 'Application Status: Under Active Review',
      skills: ['Java 21', 'Distributed Consensus', 'Kafka', 'MySQL'],
      statusText: 'Direct to Principal Engineering Manager'
    }
  },
  {
    id: 'move-forward',
    number: '04',
    label: 'Move Forward',
    tagline: 'Real-Time Pipeline & Interview Sync',
    title: 'Track rounds, sync calendar invites, and compare offers.',
    description:
      'Keep full transparency into your pipeline. Get automatic Google Meet interview links, round expectations, and structured compensation breakdowns.',
    icon: TrendingUp,
    accentColor: '#10b981',
    stats: [
      { label: 'Offer Conversion', val: '4.8x higher' },
      { label: 'Transparent Salary', val: '100%' }
    ],
    preview: {
      tag: 'Round Confirmed',
      role: 'System Design & Architecture Deep Dive',
      company: 'Scheduled with VP of Engineering',
      salary: 'Offer Phase: Final Round Review',
      skills: ['Live Code Collaboration', 'Google Meet Integrated', 'CalSync'],
      statusText: 'Calendar Invite Sent • Tomorrow at 2:00 PM EST'
    }
  }
];

/**
 * StepProgressionTabs
 * Supports both:
 * 1. Controlled mode (as a compact tab bar in the ScrollProductShowcase)
 * 2. Standalone mode (full interactive section with its own showcase card)
 */
export const StepProgressionTabs = ({
  activeStage,
  onStageSelect,
  stages = DEFAULT_STAGES,
  compact = false,
  className = ''
}) => {
  const [internalIdx, setInternalIdx] = useState(0);
  const isControlled = typeof activeStage === 'number';
  const activeIdx = isControlled ? activeStage : internalIdx;
  const currentStep = stages[activeIdx] || stages[0];

  const handleSelect = (idx) => {
    if (onStageSelect) {
      onStageSelect(idx);
    }
    if (!isControlled) {
      setInternalIdx(idx);
    }
  };

  // ─── Compact Mode: Render only the animated tab navigation track ─────────
  if (compact) {
    return (
      <div className={`spt-compact-track ${className}`} role="tablist" aria-label="Product Showcase Stages">
        {stages.map((stage, idx) => {
          const isActive = idx === activeIdx;
          const accentColor = stage.accentColor || '#6366f1';

          return (
            <button
              key={stage.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => handleSelect(idx)}
              className={`spt-compact-tab ${isActive ? 'spt-compact-tab--active' : 'spt-compact-tab--inactive'}`}
            >
              {/* Smooth Animated Sliding Highlight Pill */}
              {isActive && (
                <motion.div
                  layoutId="sptCompactPill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="spt-compact-pill-indicator"
                  aria-hidden="true"
                />
              )}

              <span className="spt-compact-content">
                <span
                  className={`spt-compact-num ${isActive ? 'spt-compact-num--active' : ''}`}
                  style={isActive ? { color: accentColor } : undefined}
                >
                  {stage.number}
                </span>
                <span className="spt-compact-label">{stage.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Standalone Mode: Full Section with Header & Showcase Card ────────────
  return (
    <section className={`spt-section ${className}`} aria-label="Interactive Step Progression Tabs">
      {/* ── Section Header ── */}
      <div className="spt-header">
        <div className="spt-pill-badge">
          <Sparkles style={{ width: '0.875rem', height: '0.875rem', color: '#818cf8' }} />
          <span>Streamlined Career Journey</span>
        </div>
        <h2 className="spt-title">
          From discovery to opportunity.
        </h2>
        <p className="spt-subtitle">
          Experience an intentional workflow engineered for high-growth tech talent and hiring teams.
        </p>
      </div>

      {/* ── Interactive Tab Track (Nav) ── */}
      <div className="spt-nav-container">
        <div className="spt-nav-line" aria-hidden="true" />

        <div className="spt-nav-grid" role="tablist">
          {stages.map((step, idx) => {
            const isActive = idx === activeIdx;
            const accentColor = step.accentColor || '#6366f1';

            return (
              <button
                key={step.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleSelect(idx)}
                className={`spt-tab-btn ${isActive ? 'spt-tab-btn--active' : 'spt-tab-btn--inactive'}`}
              >
                {/* Smooth Animated Sliding Highlight Pill */}
                {isActive && (
                  <motion.div
                    layoutId="sptActiveTabPill"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="spt-active-pill"
                    aria-hidden="true"
                  />
                )}

                {/* Tab Label & Number */}
                <div className="spt-tab-content-wrap">
                  <div
                    className={`spt-number-badge ${
                      isActive ? '' : 'spt-number-badge--inactive'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${accentColor}20`,
                            borderColor: `${accentColor}40`,
                            color: accentColor
                          }
                        : undefined
                    }
                  >
                    {step.number}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {step.label}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {step.tagline}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dynamic Content Showcase Window ── */}
      <div className="spt-showcase-card">
        {/* Ambient Top Glow synced to step accent */}
        <div
          className="spt-ambient-glow"
          style={{
            background: `radial-gradient(circle, ${currentStep.accentColor || '#6366f1'}33 0%, transparent 70%)`
          }}
          aria-hidden="true"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="spt-showcase-grid"
          >
            {/* Left Column: Narrative & Stats */}
            <div className="spt-left-col">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  width: 'fit-content'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: currentStep.accentColor || '#6366f1'
                  }}
                />
                <span style={{ color: '#cbd5e1' }}>{currentStep.tagline}</span>
              </div>

              <h3 className="spt-stage-title">
                {currentStep.title}
              </h3>

              <p className="spt-stage-desc">
                {currentStep.description}
              </p>

              {/* Stat Highlights */}
              <div className="spt-stats-grid">
                {currentStep.stats && currentStep.stats.map((stat, i) => (
                  <div key={i} className="spt-stat-box">
                    <div className="spt-stat-value">
                      {stat.val}
                    </div>
                    <div className="spt-stat-label">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelect((activeIdx + 1) % stages.length)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.125rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#ffffff',
                    color: '#020617',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span>Next Step</span>
                  <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                  Step {activeIdx + 1} of {stages.length}
                </span>
              </div>
            </div>

            {/* Right Column: Visual Product Card Mock */}
            {currentStep.preview && (
              <div className="spt-right-col">
                <div className="spt-mock-card">
                  {/* Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid rgba(51, 65, 85, 0.6)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '0.75rem',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#818cf8'
                        }}
                      >
                        <Building2 style={{ width: '1.25rem', height: '1.25rem' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
                          {currentStep.preview.company}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {currentStep.preview.salary}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        border: `1px solid ${currentStep.accentColor || '#6366f1'}40`,
                        backgroundColor: `${currentStep.accentColor || '#6366f1'}15`,
                        color: currentStep.accentColor || '#6366f1'
                      }}
                    >
                      {currentStep.preview.tag}
                    </span>
                  </div>

                  {/* Role / Entity Title */}
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                      {currentStep.preview.role}
                    </h4>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: '#34d399',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        margin: '0.5rem 0 0 0'
                      }}
                    >
                      <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} />
                      <span>{currentStep.preview.statusText}</span>
                    </p>
                  </div>

                  {/* Skills Pill Cluster */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', paddingTop: '0.25rem' }}>
                    {currentStep.preview.skills && currentStep.preview.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          backgroundColor: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(51, 65, 85, 0.5)',
                          color: '#cbd5e1'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Interactive Mock Footer */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      backgroundColor: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid rgba(30, 41, 59, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#94a3b8'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck style={{ width: '1rem', height: '1rem', color: '#34d399' }} />
                      <span>Verified Pipeline Status</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>Live Sync</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default StepProgressionTabs;
