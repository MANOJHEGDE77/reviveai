import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Check,
  Loader2,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sliders,
  Database,
  Lock,
  Layers,
  Search,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { apiClient, formatINR, formatDateTime } from '../api/client';
import { DashboardSummary, Payment, ApprovalRequest, AuditLog, DemoScenarioResult } from '../types';
import { BrandLogo } from '../components/BrandLogo';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Data States
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidents, setIncidents] = useState<Payment[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Interactive Hero Interface State
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [heroRecoveryRunning, setHeroRecoveryRunning] = useState(false);
  const [heroRecoverySuccess, setHeroRecoverySuccess] = useState(false);
  const [heroScenarioResult, setHeroScenarioResult] = useState<DemoScenarioResult | null>(null);
  const [heroTimelineStep, setHeroTimelineStep] = useState(2); // 0 to 5

  // 3. Numbered Project Presentation / Slide Navigator State
  const [currentSlide, setCurrentSlide] = useState(0); // 0 to 4 (01 to 05)

  // 4. Slide 01: Interactive ROI Calculator State
  const [roiMonthlyGmv, setRoiMonthlyGmv] = useState<number>(10000000); // 1 Crore
  const [roiFailureRate, setRoiFailureRate] = useState<number>(12); // 12%

  // 5. Slide 02: Interactive Forensic Diagnosis State
  const [diagName, setDiagName] = useState('Swiggy Cloud Kitchen Partner');
  const [diagAmount, setDiagAmount] = useState<number>(24900);
  const [diagCategory, setDiagCategory] = useState<string>('TEMPORARY_DECLINE');
  const [diagMethod, setDiagMethod] = useState<string>('CARD');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<Payment | null>(null);

  // 6. Slide 04: Human Approval Action State
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // 7. Slide 05: Audit Ledger Filter
  const [auditActorFilter, setAuditActorFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Fetch initial telemetry and live queue
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumData, incData, apprData, logData] = await Promise.all([
        apiClient.getDashboardSummary().catch(() => null),
        apiClient.getIncidents({ limit: 6 } as any).catch(() => []),
        apiClient.getApprovals('PENDING').catch(() => []),
        apiClient.getAuditLogs({ limit: 8 }).catch(() => []),
      ]);

      if (sumData) setSummary(sumData);
      if (incData && incData.length > 0) {
        setIncidents(incData);
        setSelectedTxnId(incData[0].id);
      }
      if (apprData) setApprovals(apprData);
      if (logData) setAuditLogs(logData);
    } catch (err) {
      console.error('Failed to load initial landing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard navigation for project slides (ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev < 4 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Active Transaction in Hero
  const selectedTxn = incidents.find((p) => p.id === selectedTxnId) || incidents[0] || {
    id: 991,
    payment_ref: 'PAY_11610',
    amount: 24900,
    currency: 'INR',
    status: 'IN_RECOVERY' as const,
    failure_category: 'TEMPORARY_DECLINE',
    failure_reason: 'Temporary card switch throttle: Issuer server intermittent drop.',
    ai_recommendation: 'DELAYED_RETRY',
    ai_confidence: 91,
    ai_diagnosis_summary: 'Temporary issuer throttle confirmed by gateway telemetry. Customer has 8 completed historical settlements.',
    customer: {
      name: 'Swiggy Cloud Kitchen Partner',
      lifetime_value: 98400,
      successful_transactions: 8,
      payment_method_masked: '•••• 4821',
      payment_method_type: 'CARD',
    },
    workflow: {
      id: 11,
      workflow_ref: 'RV-10821',
      attempts: 1,
      max_attempts: 2,
      strategy: 'DELAYED_RETRY',
      status: 'ACTIVE' as const,
    }
  };

  // Run 1-Click Simulated Recovery in Hero
  const handleRunHeroRecovery = async () => {
    try {
      setHeroRecoveryRunning(true);
      setHeroRecoverySuccess(false);
      setHeroTimelineStep(3); // Attempting

      const res = await apiClient.runDemoScenario();
      setHeroScenarioResult(res);
      setHeroTimelineStep(5); // Verified & Settled
      setHeroRecoverySuccess(true);

      // Refresh data
      const updatedSummary = await apiClient.getDashboardSummary().catch(() => null);
      if (updatedSummary) setSummary(updatedSummary);
      const updatedIncidents = await apiClient.getIncidents({ limit: 6 } as any).catch(() => []);
      if (updatedIncidents && updatedIncidents.length > 0) setIncidents(updatedIncidents);
      const updatedLogs = await apiClient.getAuditLogs({ limit: 8 }).catch(() => []);
      if (updatedLogs) setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Demo recovery error:', err);
    } finally {
      setHeroRecoveryRunning(false);
    }
  };

  // Run Interactive Forensic Diagnosis (Slide 02)
  const handleRunCustomDiagnosis = async () => {
    try {
      setDiagLoading(true);
      const res = await apiClient.triggerSimulation({
        customer_name: diagName.trim() || 'Merchant Partner',
        amount: Number(diagAmount),
        failure_category: diagCategory,
        payment_method_type: diagMethod,
        auto_execute: true,
      });
      setDiagResult(res);
      // Refresh summary and incidents
      fetchData();
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setDiagLoading(false);
    }
  };

  // Decide Approval in Slide 04
  const handleApprovalDecision = async (id: number, decision: 'APPROVE' | 'REJECT') => {
    try {
      setApprovingId(id);
      await apiClient.decideApproval(id, decision, `Manual sign-off executed via Risk Governance Console (${decision})`);
      setApprovalFeedback(`Request #${id} marked as ${decision}. Audit event committed.`);
      const updatedApprovals = await apiClient.getApprovals('PENDING').catch(() => []);
      setApprovals(updatedApprovals);
      fetchData();
      setTimeout(() => setApprovalFeedback(null), 4000);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setApprovingId(null);
    }
  };

  // Metrics from Live Summary
  const atRisk = summary?.revenue_at_risk ?? 482000;
  const recoverable = summary?.estimated_recoverable ?? 291000;
  const recovered = summary?.successfully_recovered ?? 147500;
  const recoveryRate = summary?.recovery_rate ?? 42.8;
  const activeWfCount = summary?.active_workflows_count ?? 47;
  const failedCount = summary?.failed_incidents_count ?? 12;

  // Slide 01 ROI Calculations
  const calculatedRisk = (roiMonthlyGmv * (roiFailureRate / 100));
  const calculatedRecovered = calculatedRisk * (recoveryRate / 100);
  const calculatedAnnual = calculatedRecovered * 12;

  // Filtered Audit Logs for Slide 05
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActorFilter !== 'ALL' && log.actor !== auditActorFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      const matchText = `${log.event_type} ${log.decision} ${log.reason || ''} ${log.payment_ref || ''}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  // Story Slides Metadata
  const storySlides = [
    {
      num: '01',
      id: 'revenue-recovery',
      tag: 'FINANCIAL ANATOMY',
      title: 'Revenue Recovery',
      subtitle: 'The hidden margin drain in online commerce',
      desc: 'Over 60% of payment declines are not permanent credit failures. They are transient technical throttles, gateway timeouts, and expired sessions that can be autonomously salvaged.',
    },
    {
      num: '02',
      id: 'detect-diagnose',
      tag: 'FORENSIC INTELLIGENCE',
      title: 'Detect & Diagnose',
      subtitle: 'Normalized failure classification and structured reasoning',
      desc: 'Ingests decline payloads from card networks, UPI switches, and recurring mandates. AI models synthesize error codes, customer LTV, and historical settlement cadence into explainable diagnoses.',
    },
    {
      num: '03',
      id: 'recovery-engine',
      tag: 'DETERMINISTIC GUARDRAILS',
      title: 'Recovery Engine',
      subtitle: 'Bounded state machines and financial safety bounds',
      desc: 'Mathematical guardrails strictly cap retries at ≤ 2, enforce 120-minute issuer cooldowns, verify idempotency keys, and auto-terminate workflows upon settlement confirmation.',
    },
    {
      num: '04',
      id: 'human-approval',
      tag: 'GOVERNANCE & TRUST',
      title: 'Human Approval',
      subtitle: 'High-value threshold quarantine and operator sign-off',
      desc: 'Any transaction ≥ ₹50,000 INR is halted by deterministic policy. The recovery strategy is assembled and quarantined in the Human Governance Queue awaiting authenticated authorization.',
    },
    {
      num: '05',
      id: 'verification-audit',
      tag: 'SOVEREIGN TRACEABILITY',
      title: 'Verification & Audit',
      subtitle: 'Authoritative settlement proof and immutable compliance ledger',
      desc: 'Recovery is never declared until confirmed by authoritative bank responses. Every decision, guardrail check, operator note, and balance credit is recorded in an immutable audit ledger.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F1E9] text-[#111216] font-sans selection:bg-[#E2DDD3] selection:text-[#111216]">
      {/* 1. Top Editorial Navigation */}
      <header className="sticky top-0 z-40 bg-[#F4F1E9]/95 backdrop-blur-md border-b border-[#DCD8CF] px-6 sm:px-12 h-16 flex items-center justify-between">
        {/* Brand Wordmark & Insignia */}
        <div className="flex items-center gap-4">
          <BrandLogo size="sm" subtitleText="AUTONOMOUS REVENUE RECOVERY" />
        </div>

        {/* Editorial Story Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-medium text-[#666A6B]">
          <a href="#product" className="hover:text-[#111216] transition">
            Product
          </a>
          <a href="#how-it-works" className="hover:text-[#111216] transition">
            How it works
          </a>
          <a href="#analytics" className="hover:text-[#111216] transition">
            Recovery analytics
          </a>
          <a href="#audit-trust" className="hover:text-[#111216] transition">
            Audit &amp; trust
          </a>
        </nav>

        {/* Console Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/journey')}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#111216] hover:bg-[#23262D] transition flex items-center gap-2 shadow-sm"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section (Two-Column Editorial Showcase) */}
      <section id="product" className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 sm:pt-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Editorial Headline & Narrative */}
          <div className="lg:col-span-6 space-y-6">
            {/* Numbered Category Tag */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white border border-[#DCD8CF] text-xs font-mono">
              <span className="font-bold text-[#111216]">01</span>
              <span className="text-[#A5A096]">&bull;</span>
              <span className="text-[#168F5A] font-bold text-[11px] tracking-wider uppercase">
                AUTONOMOUS REVENUE RECOVERY
              </span>
            </div>

            {/* Oversized Editorial Headline */}
            <h1 className="editorial-headline text-4xl sm:text-5xl lg:text-[62px] text-[#111216] tracking-tight">
              Turn failed payments into{' '}
              <span className="text-[#168F5A]">recovered revenue.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#666A6B] leading-relaxed max-w-xl font-sans">
              An AI recovery agent that detects payment failures, diagnoses the cause, chooses a guarded recovery strategy, and verifies every outcome.
            </p>

            {/* Trust Statement */}
            <div className="p-3.5 rounded-xl bg-white/70 border border-[#DCD8CF] text-xs font-mono text-[#111216] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#168F5A] shrink-0 mt-0.5" />
              <span>
                <strong>Guarded by Design:</strong> AI recommends the action. Deterministic rules enforce the guardrails. Every recovery is traceable.
              </span>
            </div>

            {/* Capability Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                'Intelligent Failure Diagnosis',
                'Guarded Payment Retries',
                'Recovery Verification',
                'Human Approval',
                'Complete Audit Trail',
              ].map((chip) => (
                <span key={chip} className="editorial-chip">
                  {chip}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4 font-mono text-xs">
              <a
                href="#how-it-works"
                className="px-6 py-3 rounded-xl font-semibold text-white bg-[#111216] hover:bg-[#23262D] transition flex items-center gap-2 shadow-sm"
              >
                <span>Explore the system</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => navigate('/journey')}
                className="px-5 py-3 rounded-xl font-semibold text-[#111216] bg-white hover:bg-[#EDE9E0] border border-[#DCD8CF] transition flex items-center gap-2 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-[#168F5A]" />
                <span>Open live console</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-6 border-t border-[#DCD8CF] grid grid-cols-3 gap-4 font-mono text-left">
              <div>
                <span className="text-[10px] text-[#666A6B] uppercase font-bold block">
                  FAILURES DETECTED
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#111216] block mt-0.5 mono-num">
                  {formatINR(atRisk, true)}
                </span>
                <span className="text-[11px] text-[#666A6B] font-sans">Under monitoring</span>
              </div>

              <div>
                <span className="text-[10px] text-[#168F5A] uppercase font-bold block">
                  RECOVERED VALUE
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#168F5A] block mt-0.5 mono-num">
                  {formatINR(recovered, true)}
                </span>
                <span className="text-[11px] text-[#666A6B] font-sans">Settled revenue</span>
              </div>

              <div>
                <span className="text-[10px] text-[#666A6B] uppercase font-bold block">
                  RECOVERY YIELD
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#111216] block mt-0.5 mono-num">
                  {recoveryRate.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#666A6B] font-sans">Autonomous success</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Floating Product Interface Panel */}
          <div className="lg:col-span-6">
            <div className="editorial-panel p-5 sm:p-6 bg-white space-y-4 relative border border-[#DCD8CF]">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE9E0]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#168F5A] animate-pulse" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#111216]">
                    RECONCILIATION ENGINE &bull; LIVE RUNTIME
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EAF5EE] text-[#168F5A] border border-[#B9E2CD]">
                  Guardrails Active (Cap &le; 2)
                </span>
              </div>

              {/* A. Revenue Recovery Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left font-mono">
                <div className="p-2.5 rounded-lg bg-[#F4F1E9] border border-[#DCD8CF]">
                  <span className="text-[9px] uppercase text-[#666A6B] block font-bold">
                    AT RISK
                  </span>
                  <span className="text-sm font-bold text-[#B45309] block mono-num">
                    {formatINR(atRisk, true)}
                  </span>
                  <span className="text-[10px] text-[#666A6B] font-sans">{failedCount} incidents</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F4F1E9] border border-[#DCD8CF]">
                  <span className="text-[9px] uppercase text-[#666A6B] block font-bold">
                    IN FLIGHT
                  </span>
                  <span className="text-sm font-bold text-[#1D4ED8] block mono-num">
                    {activeWfCount} active
                  </span>
                  <span className="text-[10px] text-[#666A6B] font-sans">Bounded loops</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F4F1E9] border border-[#DCD8CF]">
                  <span className="text-[9px] uppercase text-[#168F5A] block font-bold">
                    RECOVERED
                  </span>
                  <span className="text-sm font-bold text-[#168F5A] block mono-num">
                    {formatINR(recovered, true)}
                  </span>
                  <span className="text-[10px] text-[#168F5A] font-sans">Verified</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F4F1E9] border border-[#DCD8CF]">
                  <span className="text-[9px] uppercase text-[#666A6B] block font-bold">
                    SUCCESS
                  </span>
                  <span className="text-sm font-bold text-[#111216] block mono-num">
                    {recoveryRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[#666A6B] font-sans">Yield rate</span>
                </div>
              </div>

              {/* B. Transaction Queue (Interactive Selector) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="editorial-section-tag">
                    TRANSACTION QUEUE ({incidents.length > 0 ? incidents.length : 3})
                  </span>
                  <span className="text-[10px] font-mono text-[#666A6B]">
                    Click row to inspect diagnosis
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(incidents.length > 0 ? incidents.slice(0, 3) : [selectedTxn]).map((txn) => {
                    const isSelected = selectedTxn.id === txn.id;
                    return (
                      <div
                        key={txn.id}
                        onClick={() => setSelectedTxnId(txn.id)}
                        className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-[#168F5A] shadow-xs'
                            : 'bg-[#F4F1E9]/60 border-[#DCD8CF] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              txn.status === 'RECOVERED'
                                ? 'bg-[#168F5A]'
                                : txn.status === 'REQUIRES_APPROVAL'
                                ? 'bg-[#B45309]'
                                : 'bg-[#1D4ED8]'
                            }`}
                          />
                          <div className="truncate">
                            <span className="font-bold text-[#111216]">{txn.payment_ref}</span>
                            <span className="text-[#666A6B] ml-2 text-[11px] truncate">
                              {txn.customer?.name || 'Customer'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-[#111216] mono-num">
                            {formatINR(txn.amount)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              txn.status === 'RECOVERED'
                                ? 'state-tag-recovered'
                                : txn.status === 'REQUIRES_APPROVAL'
                                ? 'state-tag-risk'
                                : 'state-tag-investigating'
                            }`}
                          >
                            {txn.status === 'REQUIRES_APPROVAL' ? 'APPROVAL' : txn.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* C. AI Diagnosis Panel */}
              <div className="p-3.5 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCD8CF]">
                  <div>
                    <span className="text-[10px] uppercase text-[#666A6B] block font-bold">
                      INSPECTING: {selectedTxn.payment_ref}
                    </span>
                    <strong className="text-xs text-[#111216]">
                      {selectedTxn.customer?.name || 'Partner Account'}
                    </strong>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#DCD8CF] text-[10px] font-bold text-[#168F5A]">
                    {selectedTxn.ai_confidence || 91}% AI Confidence
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#666A6B] block">Root Cause Diagnosis:</span>
                    <strong className="text-[#111216] block">
                      {selectedTxn.failure_category === 'TEMPORARY_DECLINE'
                        ? 'Temporary Issuer Switch Throttle'
                        : selectedTxn.failure_category === 'SUBSCRIPTION_DECLINE'
                        ? 'Mandate Authorization Timeout'
                        : selectedTxn.failure_category === 'CHECKOUT_ABANDONED'
                        ? '3DS OTP Verification Drop-off'
                        : 'PSP Network Connection Drop'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#666A6B] block">Guarded Recommendation:</span>
                    <strong className="text-[#168F5A] block">
                      {selectedTxn.ai_recommendation || 'DELAYED_RETRY (120m Cooldown)'}
                    </strong>
                  </div>
                </div>

                <div className="pt-1 text-[10px] text-[#666A6B]">
                  <strong>Evidence Cited:</strong> Customer CLV {formatINR(selectedTxn.customer?.lifetime_value || 98400, true)}, {selectedTxn.customer?.successful_transactions || 8} past successful settlements, zero disputes.
                </div>
              </div>

              {/* D. Recovery Timeline & Interactive Trigger */}
              <div>
                <span className="editorial-section-tag block mb-2">
                  CLOSED-LOOP TIMELINE ({heroTimelineStep + 1}/6 STAGES)
                </span>

                <div className="grid grid-cols-6 gap-1 font-mono text-[9px] text-center mb-3">
                  {[
                    '1. Detected',
                    '2. Diagnosed',
                    '3. Guardrail OK',
                    '4. Retry Sent',
                    '5. 3DS Verified',
                    '6. Ledger Set',
                  ].map((label, idx) => (
                    <div
                      key={label}
                      className={`py-1.5 px-1 rounded transition ${
                        idx <= heroTimelineStep
                          ? 'bg-[#EAF5EE] text-[#168F5A] border border-[#B9E2CD] font-bold'
                          : 'bg-[#EDE9E0] text-[#888B8C]'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* 1-Click Simulated Recovery Flow Action */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={handleRunHeroRecovery}
                    disabled={heroRecoveryRunning}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-white bg-[#168F5A] hover:bg-[#117348] transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {heroRecoveryRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing Bounded Recovery...</span>
                      </>
                    ) : heroRecoverySuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Recovery Verified! (₹24,900 Settled)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run 1-Click Simulated Recovery</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/investigations/${selectedTxn.id}`)}
                    className="w-full sm:w-auto py-2.5 px-3 rounded-lg text-xs font-mono font-medium text-[#111216] bg-[#F4F1E9] hover:bg-[#EDE9E0] border border-[#DCD8CF] transition flex items-center justify-center gap-1.5"
                  >
                    <span>Forensic Dossier</span>
                    <ExternalLink className="w-3 h-3 text-[#666A6B]" />
                  </button>
                </div>

                <div className="mt-2 text-[10px] font-mono text-[#666A6B] text-center">
                  * Sandboxed simulation connecting to real FastAPI recovery engine and database state machine.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Numbered Project Presentation & Interactive Story Navigator */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-[#DCD8CF]">
        {/* Story Controller Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#DCD8CF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-section-tag text-[#168F5A]">
                INTERACTIVE PROJECT PRESENTATION
              </span>
              <span className="text-[#C8C3B7]">&bull;</span>
              <span className="text-xs font-mono text-[#666A6B]">
                Slide {storySlides[currentSlide].num} of 05
              </span>
            </div>
            <h2 className="editorial-headline text-3xl sm:text-4xl text-[#111216] mt-1">
              The Architecture of Autonomous Recovery
            </h2>
          </div>

          {/* Slide Arrow Controls + Keyboard Notice */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] font-mono text-[#666A6B]">
              Use &larr; &rarr; arrow keys
            </span>

            <div className="flex items-center gap-1 bg-white border border-[#DCD8CF] p-1 rounded-xl shadow-xs">
              <button
                onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : 4))}
                className="p-2 rounded-lg text-[#111216] hover:bg-[#F4F1E9] transition"
                title="Previous Slide (ArrowLeft)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold px-2 text-[#111216]">
                {storySlides[currentSlide].num} / 05
              </span>
              <button
                onClick={() => setCurrentSlide((prev) => (prev < 4 ? prev + 1 : 0))}
                className="p-2 rounded-lg text-[#111216] hover:bg-[#F4F1E9] transition"
                title="Next Slide (ArrowRight)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Chapter Selector Pills */}
        <div className="flex flex-wrap gap-2 py-4 font-mono text-xs overflow-x-auto">
          {storySlides.map((slide, index) => (
            <button
              key={slide.num}
              onClick={() => setCurrentSlide(index)}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                currentSlide === index
                  ? 'bg-[#111216] text-white font-bold shadow-xs'
                  : 'bg-white text-[#666A6B] hover:text-[#111216] border border-[#DCD8CF] hover:bg-[#EDE9E0]'
              }`}
            >
              <span className={currentSlide === index ? 'text-[#168F5A]' : 'text-[#888B8C]'}>
                {slide.num}
              </span>
              <span>{slide.title}</span>
            </button>
          ))}
        </div>

        {/* Active Slide Body */}
        <div className="mt-8">
          {/* SLIDE 01: REVENUE RECOVERY */}
          {currentSlide === 0 && (
            <div className="editorial-panel p-6 sm:p-10 bg-white space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="editorial-section-tag text-[#168F5A]">
                  01 &bull; REVENUE RECOVERY &bull; THE HIDDEN DRAIN
                </span>
                <h3 className="editorial-headline text-3xl sm:text-4xl text-[#111216]">
                  A failed payment isn't a lost customer.
                </h3>
                <p className="text-sm sm:text-base text-[#666A6B] leading-relaxed">
                  Traditional payment gateways simply report declines and give up. ReviveAI transforms declines into active recovery playbooks — calculating exact customer lifetime value, issuer cooldown windows, and autonomous retry trajectories.
                </p>
              </div>

              {/* Interactive ROI Calculator */}
              <div className="pt-6 border-t border-[#DCD8CF]">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4 text-[#168F5A]" />
                  <span className="editorial-section-tag text-[#111216]">
                    INTERACTIVE REVENUE SALVAGE CALCULATOR
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F4F1E9] p-6 rounded-2xl border border-[#DCD8CF]">
                  {/* Left Controls */}
                  <div className="lg:col-span-7 space-y-5 font-mono text-xs">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="text-[#666A6B] font-bold">MONTHLY PROCESSED GMV</label>
                        <span className="font-bold text-[#111216]">{formatINR(roiMonthlyGmv)}</span>
                      </div>
                      <input
                        type="range"
                        min={1000000}
                        max={100000000}
                        step={500000}
                        value={roiMonthlyGmv}
                        onChange={(e) => setRoiMonthlyGmv(Number(e.target.value))}
                        className="w-full accent-[#168F5A] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#888B8C] mt-1">
                        <span>₹10 Lakhs</span>
                        <span>₹5 Crores</span>
                        <span>₹10 Crores</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="text-[#666A6B] font-bold">ESTIMATED DECLINE RATE</label>
                        <span className="font-bold text-[#111216]">{roiFailureRate}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={25}
                        step={1}
                        value={roiFailureRate}
                        onChange={(e) => setRoiFailureRate(Number(e.target.value))}
                        className="w-full accent-[#168F5A] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#888B8C] mt-1">
                        <span>5% (Low)</span>
                        <span>12% (Industry Average)</span>
                        <span>25% (High Friction)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Results */}
                  <div className="lg:col-span-5 p-5 bg-white rounded-xl border border-[#DCD8CF] space-y-3 font-mono">
                    <span className="text-[10px] uppercase font-bold text-[#666A6B] block">
                      AUTONOMOUS YIELD ESTIMATE
                    </span>

                    <div className="space-y-1">
                      <span className="text-[11px] text-[#666A6B] block">Monthly Revenue at Risk:</span>
                      <strong className="text-lg font-bold text-[#B45309] block mono-num">
                        {formatINR(calculatedRisk)}
                      </strong>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-[#EDE9E0]">
                      <span className="text-[11px] text-[#168F5A] font-bold block">
                        Monthly Recovered by ReviveAI ({recoveryRate.toFixed(1)}% Yield):
                      </span>
                      <strong className="text-2xl font-bold text-[#168F5A] block mono-num">
                        {formatINR(calculatedRecovered)}
                      </strong>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-[#EDE9E0]">
                      <span className="text-[11px] text-[#666A6B] block">Annual Net Margin Salvaged:</span>
                      <strong className="text-xl font-bold text-[#111216] block mono-num">
                        {formatINR(calculatedAnnual)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 02: DETECT & DIAGNOSE */}
          {currentSlide === 1 && (
            <div className="editorial-panel p-6 sm:p-10 bg-white space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="editorial-section-tag text-[#168F5A]">
                  02 &bull; DETECT &amp; DIAGNOSE &bull; EVIDENCE-BASED AI
                </span>
                <h3 className="editorial-headline text-3xl sm:text-4xl text-[#111216]">
                  Normalized failure classification and structured reasoning.
                </h3>
                <p className="text-sm sm:text-base text-[#666A6B] leading-relaxed">
                  Instead of cryptic bank codes like <code className="font-mono text-xs bg-[#EDE9E0] px-1 py-0.5 rounded">RZR_ERR_04</code>, ReviveAI pulls customer transaction history, card bin logs, and bank switch latency to construct an explainable diagnosis.
                </p>
              </div>

              {/* Interactive Forensic Diagnosis Studio */}
              <div className="p-6 rounded-2xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#168F5A]" />
                  <span className="editorial-section-tag text-[#111216]">
                    LIVE AI FORENSIC DIAGNOSIS BENCH (REAL BACKEND API)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                  <div>
                    <label className="text-[#666A6B] block mb-1 font-bold">Customer / Merchant</label>
                    <input
                      type="text"
                      value={diagName}
                      onChange={(e) => setDiagName(e.target.value)}
                      className="w-full p-2 bg-white border border-[#DCD8CF] rounded-lg text-xs"
                      placeholder="e.g. Swiggy Partner"
                    />
                  </div>

                  <div>
                    <label className="text-[#666A6B] block mb-1 font-bold">Amount in INR</label>
                    <input
                      type="number"
                      value={diagAmount}
                      onChange={(e) => setDiagAmount(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-[#DCD8CF] rounded-lg text-xs"
                      placeholder="24900"
                    />
                  </div>

                  <div>
                    <label className="text-[#666A6B] block mb-1 font-bold">Failure Category</label>
                    <select
                      value={diagCategory}
                      onChange={(e) => setDiagCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-[#DCD8CF] rounded-lg text-xs"
                    >
                      <option value="TEMPORARY_DECLINE">Temporary Card Decline</option>
                      <option value="CHECKOUT_ABANDONED">Checkout Abandoned</option>
                      <option value="SUBSCRIPTION_DECLINE">Subscription Mandate</option>
                      <option value="NETWORK_TIMEOUT">UPI Gateway Timeout</option>
                      <option value="OVERDUE_INVOICE">Overdue B2B Invoice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#666A6B] block mb-1 font-bold">Payment Method</label>
                    <select
                      value={diagMethod}
                      onChange={(e) => setDiagMethod(e.target.value)}
                      className="w-full p-2 bg-white border border-[#DCD8CF] rounded-lg text-xs"
                    >
                      <option value="CARD">Credit / Debit Card</option>
                      <option value="UPI">UPI Intent / Collect</option>
                      <option value="NETBANKING">NetBanking Corporate</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleRunCustomDiagnosis}
                  disabled={diagLoading}
                  className="px-5 py-2.5 rounded-xl font-mono text-xs font-semibold text-white bg-[#111216] hover:bg-[#23262D] transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {diagLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Requesting Gemini Structured Diagnosis...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-[#168F5A]" />
                      <span>Run AI Forensic Diagnosis</span>
                    </>
                  )}
                </button>

                {/* Real Diagnosis Output */}
                {diagResult && (
                  <div className="mt-4 p-4 rounded-xl bg-white border border-[#B9E2CD] space-y-3 font-mono text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EDE9E0]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#168F5A]" />
                        <span className="font-bold text-[#111216]">
                          Diagnosis Complete: {diagResult.payment_ref}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#EAF5EE] text-[#168F5A] text-[10px] font-bold">
                        {diagResult.ai_confidence || 88}% Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[#666A6B] block">AI Rationale:</span>
                        <p className="text-[#111216] font-sans mt-0.5">
                          {diagResult.ai_diagnosis_summary || 'Analyzed historical settlement pattern and temporary gateway throttle.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#666A6B] block">Selected Action:</span>
                        <strong className="text-[#168F5A] block mt-0.5">
                          {diagResult.ai_recommendation || 'DELAYED_RETRY'}
                        </strong>
                        <span className="text-[10px] text-[#666A6B]">
                          Status: {diagResult.status} &bull; Risk: {diagResult.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SLIDE 03: RECOVERY ENGINE */}
          {currentSlide === 2 && (
            <div className="editorial-panel p-6 sm:p-10 bg-white space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="editorial-section-tag text-[#168F5A]">
                  03 &bull; RECOVERY ENGINE &bull; DETERMINISTIC INVARIANTS
                </span>
                <h3 className="editorial-headline text-3xl sm:text-4xl text-[#111216]">
                  AI recommends the playbook. Deterministic rules enforce the bounds.
                </h3>
                <p className="text-sm sm:text-base text-[#666A6B] leading-relaxed">
                  Financial systems require non-negotiable safety. ReviveAI enforces 4 deterministic guardrails in code before any payment attempt is ever dispatched.
                </p>
              </div>

              {/* Guardrails Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#666A6B]">RULE 01</span>
                    <Lock className="w-3.5 h-3.5 text-[#168F5A]" />
                  </div>
                  <strong className="text-sm text-[#111216] block">Retry Limit &le; 2</strong>
                  <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                    Strictly prevents card burning, issuer blacklists, or repeated customer fee debits.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#666A6B]">RULE 02</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#168F5A]" />
                  </div>
                  <strong className="text-sm text-[#111216] block">High-Value &ge; ₹50,000</strong>
                  <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                    Mandates human sign-off via Governance Queue before any action is executed.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#666A6B]">RULE 03</span>
                    <Clock className="w-3.5 h-3.5 text-[#168F5A]" />
                  </div>
                  <strong className="text-sm text-[#111216] block">24-Hour Expiry</strong>
                  <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                    Bounds recovery within standard banking settlement windows to prevent delayed double debits.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#666A6B]">RULE 04</span>
                    <CheckCircle className="w-3.5 h-3.5 text-[#168F5A]" />
                  </div>
                  <strong className="text-sm text-[#111216] block">Instant Auto-Termination</strong>
                  <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                    The moment payment is detected as settled, active workflows lock permanently to avoid double-charging.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 04: HUMAN APPROVAL */}
          {currentSlide === 3 && (
            <div className="editorial-panel p-6 sm:p-10 bg-white space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="editorial-section-tag text-[#168F5A]">
                  04 &bull; HUMAN GOVERNANCE &bull; RISK OPERATIONS
                </span>
                <h3 className="editorial-headline text-3xl sm:text-4xl text-[#111216]">
                  High-stakes decisions keep humans in control.
                </h3>
                <p className="text-sm sm:text-base text-[#666A6B] leading-relaxed">
                  Transactions exceeding ₹50,000 INR are quarantined by deterministic policy. Operators inspect full forensic reasoning, risk evidence, and execute authenticated sign-offs.
                </p>
              </div>

              {/* Feedback toast */}
              {approvalFeedback && (
                <div className="p-3 rounded-lg bg-[#EAF5EE] border border-[#B9E2CD] text-xs font-mono text-[#168F5A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{approvalFeedback}</span>
                </div>
              )}

              {/* Live Approvals Queue */}
              <div className="space-y-3 font-mono text-xs">
                <span className="editorial-section-tag text-[#666A6B]">
                  PENDING HUMAN SIGN-OFF QUEUE ({approvals.length})
                </span>

                {approvals.length === 0 ? (
                  <div className="p-8 text-center bg-[#F4F1E9] rounded-xl border border-[#DCD8CF] text-[#666A6B]">
                    <CheckCircle2 className="w-6 h-6 text-[#168F5A] mx-auto mb-2" />
                    <span>All high-value transactions are approved or within normal bounds.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvals.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111216]">{req.customer_name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold state-tag-risk">
                              {formatINR(req.amount)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#666A6B] font-sans">
                            {req.evidence_reason || 'High-value recurring invoice requires risk approval before 120m retry.'}
                          </p>
                          <span className="text-[10px] text-[#1D4ED8]">
                            AI Recommendation: {req.ai_recommendation} ({req.ai_confidence}% confidence)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApprovalDecision(req.id, 'APPROVE')}
                            disabled={approvingId === req.id}
                            className="px-3.5 py-1.5 rounded-lg font-semibold text-white bg-[#168F5A] hover:bg-[#117348] transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {approvingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => handleApprovalDecision(req.id, 'REJECT')}
                            disabled={approvingId === req.id}
                            className="px-3 py-1.5 rounded-lg font-semibold text-[#B91C1C] bg-white hover:bg-[#FEF2F2] border border-[#FECACA] transition"
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SLIDE 05: VERIFICATION & AUDIT */}
          {currentSlide === 4 && (
            <div className="editorial-panel p-6 sm:p-10 bg-white space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="editorial-section-tag text-[#168F5A]">
                  05 &bull; VERIFICATION &amp; AUDIT &bull; PROVABLE SETTLEMENT
                </span>
                <h3 className="editorial-headline text-3xl sm:text-4xl text-[#111216]">
                  Never claim recovery without authoritative verification.
                </h3>
                <p className="text-sm sm:text-base text-[#666A6B] leading-relaxed">
                  Every transition in ReviveAI leaves a sequential, cryptographically linked record in the compliance ledger. No money movement is marked recovered without provider settlement verification.
                </p>
              </div>

              {/* Live Audit Log Search & Table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[#666A6B] font-bold">Actor:</span>
                    {['ALL', 'AI_AGENT', 'SYSTEM', 'HUMAN_OPERATOR'].map((act) => (
                      <button
                        key={act}
                        onClick={() => setAuditActorFilter(act)}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          auditActorFilter === act
                            ? 'bg-[#111216] text-white font-bold'
                            : 'bg-[#F4F1E9] text-[#666A6B] hover:text-[#111216]'
                        }`}
                      >
                        {act}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#888B8C] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter audit events..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F4F1E9] border border-[#DCD8CF] rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="border border-[#DCD8CF] rounded-xl overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F4F1E9] text-[#666A6B] text-[10px] uppercase border-b border-[#DCD8CF]">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Timestamp</th>
                        <th className="py-2.5 px-4 font-bold">Actor</th>
                        <th className="py-2.5 px-4 font-bold">Event Type</th>
                        <th className="py-2.5 px-4 font-bold">Decision / Outcome</th>
                        <th className="py-2.5 px-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE9E0]">
                      {filteredAuditLogs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="hover:bg-[#F4F1E9]/50 transition">
                          <td className="py-2.5 px-4 text-[#666A6B] text-[11px]">
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#111216]">
                            {log.actor}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDE9E0] text-[#111216]">
                              {log.event_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#111216] max-w-xs truncate">
                            {log.decision} {log.reason ? `(${log.reason})` : ''}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.outcome_status === 'SUCCESS' || log.outcome_status === 'RECOVERED'
                                  ? 'state-tag-recovered'
                                  : 'state-tag-neutral'
                              }`}
                            >
                              {log.outcome_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Meaningful Recovery Analytics Section */}
      <section id="analytics" className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-[#DCD8CF] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="editorial-section-tag text-[#168F5A]">
              MEASURABLE REVENUE RECOVERY TELEMETRY
            </span>
            <h2 className="editorial-headline text-3xl sm:text-4xl text-[#111216]">
              Recovery Analytics
            </h2>
            <p className="text-xs sm:text-sm text-[#666A6B]">
              Calculated from authentic ledger records &bull; Labeled demo baseline
            </p>
          </div>

          <button
            onClick={() => navigate('/journey')}
            className="px-4 py-2 rounded-lg text-xs font-mono font-medium text-[#111216] bg-white hover:bg-[#EDE9E0] border border-[#DCD8CF] transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <span>Full Analytics Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 High-Value Metric Panels */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-left">
          <div className="p-4 bg-white rounded-xl border border-[#DCD8CF] shadow-xs">
            <span className="text-[10px] uppercase text-[#666A6B] block font-bold">TOTAL FAILED VALUE</span>
            <span className="text-2xl font-bold text-[#B45309] block mt-0.5 mono-num">
              {formatINR(atRisk)}
            </span>
            <span className="text-[11px] text-[#666A6B] block font-sans">Exposed failure pool</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#DCD8CF] shadow-xs">
            <span className="text-[10px] uppercase text-[#168F5A] block font-bold">RECOVERED VALUE</span>
            <span className="text-2xl font-bold text-[#168F5A] block mt-0.5 mono-num">
              {formatINR(recovered)}
            </span>
            <span className="text-[11px] text-[#168F5A] block font-sans">Settled revenue</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#DCD8CF] shadow-xs">
            <span className="text-[10px] uppercase text-[#168F5A] block font-bold">RECOVERY RATE</span>
            <span className="text-2xl font-bold text-[#168F5A] block mt-0.5 mono-num">
              {recoveryRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-[#666A6B] block font-sans">Autonomous yield</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#DCD8CF] shadow-xs">
            <span className="text-[10px] uppercase text-[#1D4ED8] block font-bold">EST. RECOVERABLE</span>
            <span className="text-2xl font-bold text-[#1D4ED8] block mt-0.5 mono-num">
              {formatINR(recoverable)}
            </span>
            <span className="text-[11px] text-[#666A6B] block font-sans">Eligible pool</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#DCD8CF] shadow-xs col-span-2 md:col-span-1">
            <span className="text-[10px] uppercase text-[#666A6B] block font-bold">ACTIVE WORKFLOWS</span>
            <span className="text-2xl font-bold text-[#111216] block mt-0.5 mono-num">
              {activeWfCount}
            </span>
            <span className="text-[11px] text-[#666A6B] block font-sans">In guarded execution</span>
          </div>
        </div>

        {/* 2 Restrained Editorial Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 7-Day Revenue Intelligence Chart */}
          <div className="lg:col-span-7 p-6 bg-white rounded-2xl border border-[#DCD8CF] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9E0]">
              <div>
                <span className="editorial-section-tag">
                  REVENUE INTELLIGENCE TRAJECTORY (7-DAY TREND)
                </span>
                <span className="text-[11px] text-[#666A6B] block font-mono">
                  Daily failure volume vs. settled revenue
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#666A6B] px-2 py-0.5 rounded bg-[#F4F1E9] border border-[#DCD8CF]">
                Demo data
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={summary?.revenue_trend || [
                    { date: 'Day 1', at_risk: 180000, recovered: 45000 },
                    { date: 'Day 2', at_risk: 220000, recovered: 68000 },
                    { date: 'Day 3', at_risk: 310000, recovered: 92000 },
                    { date: 'Day 4', at_risk: 390000, recovered: 115000 },
                    { date: 'Day 5', at_risk: 440000, recovered: 128000 },
                    { date: 'Day 6', at_risk: 465000, recovered: 142000 },
                    { date: 'Day 7', at_risk: atRisk, recovered: recovered },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#168F5A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#168F5A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B45309" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#B45309" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#666A6B', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#DCD8CF' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#666A6B', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#DCD8CF' }}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DCD8CF',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="at_risk"
                    name="At Risk"
                    stroke="#B45309"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                  />
                  <Area
                    type="monotone"
                    dataKey="recovered"
                    name="Recovered"
                    stroke="#168F5A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRecovered)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Failure Category Distribution */}
          <div className="lg:col-span-5 p-6 bg-white rounded-2xl border border-[#DCD8CF] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9E0]">
              <div>
                <span className="editorial-section-tag">
                  FAILURE CATEGORY EXPOSURE
                </span>
                <span className="text-[11px] text-[#666A6B] block font-mono">
                  Volume breakdown by decline reason
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    summary?.risk_categories?.map((c) => ({
                      name: c.category_key.split('_')[0],
                      amount: c.amount,
                    })) || [
                      { name: 'TEMP', amount: 145000 },
                      { name: 'CART', amount: 98000 },
                      { name: 'MANDATE', amount: 125000 },
                      { name: 'INVOICE', amount: 62000 },
                      { name: 'TIMEOUT', amount: 52000 },
                    ]
                  }
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#666A6B', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#DCD8CF' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#666A6B', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#DCD8CF' }}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DCD8CF',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [formatINR(Number(val)), 'Volume']}
                  />
                  <Bar dataKey="amount" fill="#111216" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Audit & Trust Statement */}
      <section id="audit-trust" className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-[#DCD8CF]">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111216] text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#168F5A] border border-white/15 text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SOVEREIGN FINANCIAL INTELLIGENCE</span>
          </div>

          <h2 className="editorial-headline text-3xl sm:text-5xl text-white max-w-3xl leading-tight">
            Built for enterprise fintech trust. No blind retries. No double debits.
          </h2>

          <p className="text-sm sm:text-base text-[#A5A096] max-w-2xl leading-relaxed">
            Every recovery strategy is bound by deterministic invariants, authenticated actor signatures, and authoritative settlement responses. Explore the open console to inspect live state.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4 font-mono text-xs">
            <button
              onClick={() => navigate('/journey')}
              className="px-6 py-3 rounded-xl font-semibold text-[#111216] bg-white hover:bg-[#EDE9E0] transition flex items-center gap-2 shadow-xs"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate('/simulation')}
              className="px-5 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-[#168F5A]" />
              <span>Open Simulation Lab</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Editorial Footer */}
      <footer className="border-t border-[#DCD8CF] bg-[#F4F1E9] py-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono text-xs text-[#666A6B]">
          <div className="space-y-1">
            <BrandLogo size="xs" subtitleText="FINANCIAL RECONCILIATION LAYER" />
            <p className="text-[11px] text-[#888B8C]">
              Autonomous revenue-recovery agent for merchant payment streams.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a href="#product" className="hover:text-[#111216]">Product</a>
            <a href="#how-it-works" className="hover:text-[#111216]">How it works</a>
            <a href="#analytics" className="hover:text-[#111216]">Analytics</a>
            <button onClick={() => navigate('/audit')} className="hover:text-[#111216]">Audit Ledger</button>
            <button onClick={() => navigate('/approvals')} className="hover:text-[#111216]">Approvals</button>
          </div>

          <div className="text-[11px] text-[#888B8C]">
            &copy; {new Date().getFullYear()} ReviveAI &bull; MIT License
          </div>
        </div>
      </footer>
    </div>
  );
};
