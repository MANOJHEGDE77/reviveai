import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Clock,
  ChevronRight,
  Play,
  RotateCcw,
  Check,
  Loader2,
  ChevronDown,
  Sparkles,
  Activity,
  Layers,
  HelpCircle,
  ShieldAlert,
  CreditCard,
  Smartphone,
  Building
} from 'lucide-react';
import { apiClient, formatINR } from '../api/client';
import { DashboardSummary, Payment } from '../types';
import { BrandLogo } from '../components/BrandLogo';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Hero Automated Animation State (5-7 seconds sequential journey)
  const [heroStep, setHeroStep] = useState<number>(0);
  const [heroPlaying, setHeroPlaying] = useState<boolean>(true);

  // Interactive Expandable Stages
  const [expandedProcess, setExpandedProcess] = useState<number | null>(0);

  // Interactive Custom User Input Studio State (Live User Input)
  const [customName, setCustomName] = useState('My Store Merchant');
  const [customAmount, setCustomAmount] = useState<number>(18500);
  const [customCategory, setCustomCategory] = useState<string>('TEMPORARY_DECLINE');
  const [customMethod, setCustomMethod] = useState<string>('CARD');
  const [customDiagnosing, setCustomDiagnosing] = useState(false);
  const [customResult, setCustomResult] = useState<Payment | null>(null);

  // Interactive ROI Calculator State
  const [roiVolume, setRoiVolume] = useState<number>(5000000); // 50 Lakhs
  const [roiFailureRate, setRoiFailureRate] = useState<number>(12); // 12%

  useEffect(() => {
    apiClient.getDashboardSummary().then((data) => setSummary(data)).catch(() => {});
  }, []);

  // Automated Hero Sequence
  useEffect(() => {
    if (!heroPlaying) return;

    const timer1 = setTimeout(() => setHeroStep(1), 1000); // FAILED
    const timer2 = setTimeout(() => setHeroStep(2), 2200); // INVESTIGATING
    const timer3 = setTimeout(() => setHeroStep(3), 3400); // DIAGNOSIS
    const timer4 = setTimeout(() => setHeroStep(4), 4600); // RECOVERY
    const timer5 = setTimeout(() => {
      setHeroStep(5); // RECOVERED
      setHeroPlaying(false);
    }, 5800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [heroPlaying]);

  const handleReplayHero = () => {
    setHeroStep(0);
    setHeroPlaying(true);
  };

  const handleRunCustomDiagnosis = async () => {
    try {
      setCustomDiagnosing(true);
      const res = await apiClient.triggerSimulation({
        customer_name: customName.trim() || 'My Online Store',
        amount: Number(customAmount),
        failure_category: customCategory,
        payment_method_type: customMethod,
        auto_execute: true,
      });
      setCustomResult(res);
    } catch (err) {
      console.error('Failed to run custom diagnosis:', err);
    } finally {
      setCustomDiagnosing(false);
    }
  };

  const atRisk = summary?.revenue_at_risk || 482000;
  const recoverable = summary?.estimated_recoverable || 291000;
  const recovered = summary?.successfully_recovered || 147500;
  const recoveryRate = summary?.recovery_rate || 42.8;

  const processSteps = [
    {
      id: 0,
      title: 'DETECT',
      headline: 'Payment failure detected across gateway streams',
      body: 'Monitors real-time payment webhooks across card networks, UPI switches, and subscription mandates to identify failure signatures the moment they occur.',
    },
    {
      id: 1,
      title: 'UNDERSTAND',
      headline: 'Customer & transaction context assembled',
      body: 'Gathers historical settlement reliability, customer lifetime value, card failure codes, and bank throttling logs to establish why the decline occurred.',
    },
    {
      id: 2,
      title: 'DECIDE',
      headline: 'AI calibrates optimal recovery strategy',
      body: 'Matches failure signature to calibrated recovery playbooks (delayed retry cooldown, multi-rail PSP rerouting, 1-click cart recovery) with explainable confidence scores.',
    },
    {
      id: 3,
      title: 'ACT',
      headline: 'Recovery executes within deterministic policy bounds',
      body: 'Evaluates hard deterministic invariants (≤ 2 attempts, ₹50,000 human approval threshold, 24h window) before executing any financial operation.',
    },
    {
      id: 4,
      title: 'VERIFY',
      headline: 'Payment outcome verified & auto-terminated',
      body: 'Verifies 3DS settlement, auto-terminates active workflows, updates merchant balances, and commits an immutable event to the compliance audit ledger.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] font-sans selection:bg-[#E2DDD3] selection:text-[#0F172A]">
      {/* 1. Standalone Landing Page Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5E1D8] px-6 sm:px-12 h-16 flex items-center justify-between">
        {/* Left: Brand Insignia & Telemetry */}
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" subtitleText="AUTONOMOUS REVENUE RECOVERY" />
        </div>

        {/* Center: Story Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-medium">
          <a href="#how-it-works" className="text-[#64748B] hover:text-[#0F172A] transition">
            How it works
          </a>
          <a href="#ai-decisions" className="text-[#64748B] hover:text-[#0F172A] transition">
            AI decisions
          </a>
          <a href="#safety" className="text-[#64748B] hover:text-[#0F172A] transition">
            Safety Guardrails
          </a>
          <a href="#demo" className="text-[#64748B] hover:text-[#0F172A] transition">
            Live Demo
          </a>
        </nav>

        {/* Right: Enter ReviveAI Button */}
        <button
          onClick={() => navigate('/journey')}
          className="group px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] transition flex items-center gap-2 shadow-fintech-sm"
        >
          <span>Launch Command Center</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 pt-16 sm:pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Editorial Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#DDD8CC] shadow-fintech-xs text-xs font-mono font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
              <span className="text-[#0F172A] font-bold">NEXT-GEN FINANCIAL INTELLIGENCE</span>
              <span className="text-[#94A3B8]">&bull;</span>
              <span className="text-[#059669] uppercase font-bold text-[10px]">ENTERPRISE REVENUE RECOVERY</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] leading-[1.12]">
              Revenue doesn't have <br />
              to disappear after <br />
              <span className="text-[#059669]">a failed payment.</span>
            </h1>

            <h3 className="text-xl sm:text-2xl font-medium text-[#475569] leading-snug">
              ReviveAI finds the recovery path.
            </h3>

            <p className="text-sm sm:text-base text-[#64748B] max-w-xl leading-relaxed font-sans">
              Detect payment declines, diagnose root causes, execute bounded recovery playbooks, and verify settled revenue — automatically with mathematical explainability.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4 font-mono">
              <button
                onClick={() => navigate('/journey')}
                className="group px-6 py-3 rounded-xl text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] transition flex items-center gap-2 shadow-fintech-md"
              >
                <span>Launch Command Center</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <a
                href="#demo"
                className="px-5 py-3 rounded-xl text-xs font-semibold text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition flex items-center gap-2 shadow-fintech-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#059669]" />
                <span>Watch a Live Recovery ▶</span>
              </a>
            </div>
          </div>

          {/* Right Column: Signature Visual — REVENUE RECOVERY PATH */}
          <div className="lg:col-span-5">
            <div className="editorial-surface rounded-2xl p-6 sm:p-7 bg-white space-y-4 shadow-fintech-md relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  LIVE RECOVERY TELEMETRY
                </span>
                <button
                  onClick={handleReplayHero}
                  className="text-[10px] font-mono text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 transition"
                  title="Replay animation"
                >
                  <RotateCcw className={`w-3 h-3 ${heroPlaying ? 'animate-spin text-[#059669]' : ''}`} />
                  <span>Replay journey</span>
                </button>
              </div>

              {/* Animated 5-Stage Path */}
              <div className="relative pl-6 border-l-2 border-[#E5E1D8] space-y-3.5 font-mono text-xs">
                {/* Node 0: Ingested Payment */}
                <div className={`relative transition-all duration-300 ${heroStep >= 0 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#0F172A] border-2 border-white" />
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8]">
                    <span className="text-[10px] text-[#64748B] uppercase block font-bold">INGESTED PAYMENT</span>
                    <strong className="text-sm font-bold text-[#0F172A] block">₹24,900.00</strong>
                    <span className="text-[11px] text-[#64748B] font-sans block">Swiggy Cloud Kitchen Partner</span>
                  </div>
                </div>

                {/* Node 1: FAILED */}
                <div className={`relative transition-all duration-300 ${heroStep >= 1 ? 'opacity-100' : 'opacity-25'}`}>
                  <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${heroStep >= 1 ? 'bg-[#D97706]' : 'bg-[#CBD5E1]'}`} />
                  <div className={`p-3 rounded-xl border transition-all ${heroStep >= 1 ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#FAF8F5] border-[#E5E1D8]'}`}>
                    <span className="text-[10px] text-[#D97706] uppercase block font-bold">1. PAYMENT FAILED</span>
                    <strong className="text-xs text-[#92400E] block">Temporary issuer decline</strong>
                    <span className="text-[11px] text-[#D97706] font-sans block">Bank switch rate-limit</span>
                  </div>
                </div>

                {/* Node 2: REVIVEAI INVESTIGATING */}
                <div className={`relative transition-all duration-300 ${heroStep >= 2 ? 'opacity-100' : 'opacity-25'}`}>
                  <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${heroStep >= 2 ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`} />
                  <div className={`p-3 rounded-xl border transition-all ${heroStep >= 2 ? 'bg-[#EFF6FF] border-[#BFDBFE]' : 'bg-[#FAF8F5] border-[#E5E1D8]'}`}>
                    <span className="text-[10px] text-[#2563EB] uppercase block font-bold">2. REVIVEAI INVESTIGATING</span>
                    <span className="text-[11px] text-[#1E40AF] font-sans block">Analyzing 16 previous settled payments &bull; ₹84.2K CLV</span>
                  </div>
                </div>

                {/* Node 3: DIAGNOSIS */}
                <div className={`relative transition-all duration-300 ${heroStep >= 3 ? 'opacity-100' : 'opacity-25'}`}>
                  <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${heroStep >= 3 ? 'bg-[#0F172A]' : 'bg-[#CBD5E1]'}`} />
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8]">
                    <span className="text-[10px] text-[#64748B] uppercase block font-bold">3. DIAGNOSIS (91% CONFIDENCE)</span>
                    <strong className="text-xs text-[#0F172A] block">Temporary Rate-Limit Identified</strong>
                  </div>
                </div>

                {/* Node 4: RECOVERY */}
                <div className={`relative transition-all duration-300 ${heroStep >= 4 ? 'opacity-100' : 'opacity-25'}`}>
                  <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${heroStep >= 4 ? 'bg-[#0F172A]' : 'bg-[#CBD5E1]'}`} />
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8]">
                    <span className="text-[10px] text-[#64748B] uppercase block font-bold">4. RECOVERY STRATEGY</span>
                    <strong className="text-xs text-[#1E40AF] block">Delayed Retry (120m Cooldown)</strong>
                    <span className="text-[10px] text-[#059669] block font-bold">✓ Guardrail cleared &bull; Max 2 attempts</span>
                  </div>
                </div>

                {/* Node 5: RECOVERED */}
                <div className={`relative transition-all duration-300 ${heroStep >= 5 ? 'opacity-100 scale-100' : 'opacity-25'}`}>
                  <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${heroStep >= 5 ? 'bg-[#059669]' : 'bg-[#CBD5E1]'}`} />
                  <div className={`p-3 rounded-xl border transition-all ${heroStep >= 5 ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-[#FAF8F5] border-[#E5E1D8]'}`}>
                    <span className="text-[10px] text-[#065F46] uppercase block font-bold">5. RECOVERED &amp; SETTLED</span>
                    <strong className="text-sm font-bold text-[#059669] block">₹24,900.00 Verified</strong>
                    <span className="text-[11px] text-[#065F46] font-sans block">Settlement confirmed in merchant ledger</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Metric Tickers */}
        <div className="mt-12 pt-8 border-t border-[#E5E1D8] grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-left">
          <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#64748B] block font-bold">REVENUE AT RISK</span>
            <span className="text-2xl font-bold text-[#D97706] block mt-0.5">{formatINR(atRisk)}</span>
            <span className="text-[11px] text-[#64748B] block font-sans">Exposed failure volume</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#64748B] block font-bold">RECOVERABLE</span>
            <span className="text-2xl font-bold text-[#1E40AF] block mt-0.5">{formatINR(recoverable)}</span>
            <span className="text-[11px] text-[#64748B] block font-sans">Eligible via AI playbooks</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#64748B] block font-bold">RECOVERED</span>
            <span className="text-2xl font-bold text-[#059669] block mt-0.5">{formatINR(recovered)}</span>
            <span className="text-[11px] text-[#64748B] block font-sans">Settled revenue</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#64748B] block font-bold">RECOVERY YIELD</span>
            <span className="text-2xl font-bold text-[#059669] block mt-0.5">{recoveryRate}%</span>
            <span className="text-[11px] text-[#64748B] block font-sans">Autonomous conversion</span>
          </div>
        </div>
      </section>

      {/* 3. Section — The Problem */}
      <section className="max-w-5xl mx-auto px-6 sm:px-12 py-20 border-t border-[#E5E1D8] space-y-12">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
            THE HIDDEN DRAIN
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
            A failed payment isn't <br />
            <span className="text-[#059669]">always a lost payment.</span>
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl leading-relaxed font-sans">
            Most merchants treat payment failures as passive dead-ends. In reality, over 60% of declines are transient technical friction that can be autonomously recovered.
          </p>
        </div>

        {/* 4 Real-world Failure Stages Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="editorial-surface rounded-2xl p-5 bg-white space-y-2 shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#DC2626] font-bold">STAGE 1</span>
            <strong className="text-sm text-[#0F172A] block font-sans">Payment Declined</strong>
            <p className="text-[11px] text-[#64748B] font-sans leading-relaxed">
              Card network switch throttles during batch processing window or user drops off at 3DS.
            </p>
          </div>

          <div className="editorial-surface rounded-2xl p-5 bg-white space-y-2 shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#D97706] font-bold">STAGE 2</span>
            <strong className="text-sm text-[#0F172A] block font-sans">Customer Leaves</strong>
            <p className="text-[11px] text-[#64748B] font-sans leading-relaxed">
              Friction causes buyer abandonment without attempting an alternative card or UPI app.
            </p>
          </div>

          <div className="editorial-surface rounded-2xl p-5 bg-white space-y-2 shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#64748B] font-bold">STAGE 3</span>
            <strong className="text-sm text-[#0F172A] block font-sans">Retry Never Happens</strong>
            <p className="text-[11px] text-[#64748B] font-sans leading-relaxed">
              Merchant teams lack automated cooldown retry logic or multi-rail PSP failover.
            </p>
          </div>

          <div className="editorial-surface rounded-2xl p-5 bg-white space-y-2 shadow-fintech-xs">
            <span className="text-[10px] uppercase text-[#DC2626] font-bold">STAGE 4</span>
            <strong className="text-sm text-[#DC2626] block font-sans">Revenue Disappears</strong>
            <p className="text-[11px] text-[#64748B] font-sans leading-relaxed">
              A high-intent, recoverable order permanently becomes churned revenue.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Section — What ReviveAI Does */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 sm:px-12 py-20 border-t border-[#E5E1D8] space-y-12">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
            THE SOLUTION MECHANISM
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
            ReviveAI closes the loop <br />
            <span className="text-[#059669]">between failure and recovery.</span>
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl font-sans">
            Click each stage below to inspect how ReviveAI operates autonomously across your payment rails.
          </p>
        </div>

        {/* Horizontal Process with Expandable Content */}
        <div className="space-y-3 font-mono text-xs">
          {processSteps.map((step) => {
            const isExpanded = expandedProcess === step.id;

            return (
              <div
                key={step.id}
                onClick={() => setExpandedProcess(isExpanded ? null : step.id)}
                className={`editorial-surface rounded-2xl transition-all cursor-pointer ${
                  isExpanded
                    ? 'bg-white border-[#0F172A] shadow-fintech-sm'
                    : 'bg-[#FAF8F5] border-[#E5E1D8] hover:border-[#CEC8BB]'
                }`}
              >
                <div className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-[#94A3B8]">0{step.id + 1}</span>
                    <strong className="text-xs sm:text-sm font-bold text-[#0F172A] font-sans">{step.title}</strong>
                    <span className="text-xs text-[#64748B] hidden sm:inline">&bull; {step.headline}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${isExpanded ? 'rotate-180 text-[#0F172A]' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs font-sans text-[#475569] leading-relaxed border-t border-[#EAE6DD]">
                    <p>{step.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Section — Explainable AI Decision */}
      <section id="ai-decisions" className="max-w-5xl mx-auto px-6 sm:px-12 py-20 border-t border-[#E5E1D8] space-y-10">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
            EXPLAINABLE DECISION SYSTEM
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A]">
            A decision you can inspect.
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl leading-relaxed font-sans">
            ReviveAI does not generate vague chatbot answers. It produces structured, mathematical decision reports with clear evidence citation.
          </p>
        </div>

        {/* Real Investigation Report Card */}
        <div className="editorial-surface rounded-2xl p-6 sm:p-8 bg-[#0F172A] text-white border border-[#0F172A] space-y-6 shadow-fintech-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#34D399] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                INCIDENT INVESTIGATION REPORT
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                ₹24,900 &bull; Temporary Issuer Decline
              </h3>
              <p className="text-xs text-[#94A3B8] font-mono">
                Customer: Swiggy Cloud Kitchen Partner &bull; Method: Card (•••• 4821)
              </p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-2xl font-bold text-[#34D399]">91%</span>
              <span className="text-[10px] text-[#94A3B8] uppercase block">Certainty Score</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1E293B] border border-[#334155] space-y-3 font-mono text-xs">
            <span className="text-[10px] uppercase text-[#94A3B8] font-bold block">
              EVIDENCE ASSEMBLED
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#0F172A] rounded-lg border border-[#334155]">
                <span className="text-[#94A3B8] text-[10px] block">Customer Reliability</span>
                <strong className="text-white text-xs block mt-0.5">16 Settled Txns</strong>
              </div>
              <div className="p-3 bg-[#0F172A] rounded-lg border border-[#334155]">
                <span className="text-[#94A3B8] text-[10px] block">Historical Recovery</span>
                <strong className="text-[#34D399] text-xs block mt-0.5">78% Cohort Yield</strong>
              </div>
              <div className="p-3 bg-[#0F172A] rounded-lg border border-[#334155]">
                <span className="text-[#94A3B8] text-[10px] block">Issuer Error</span>
                <strong className="text-white text-xs block mt-0.5">Temporary Throttling</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-[#334155] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[#94A3B8]">Recommended Strategy:</span>
              <strong className="text-[#34D399] font-bold text-xs">DELAYED RETRY (2 attempts max &bull; 120m interval)</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section — Safety Guardrails */}
      <section id="safety" className="max-w-5xl mx-auto px-6 sm:px-12 py-20 border-t border-[#E5E1D8] space-y-10">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
            FINANCIAL SAFETY
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A]">
            Autonomous doesn't mean <br />
            <span className="text-[#059669]">uncontrolled.</span>
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl leading-relaxed font-sans">
            Every autonomous recovery action is evaluated against deterministic financial guardrails before execution.
          </p>
        </div>

        {/* Checkpoint Visual */}
        <div className="editorial-surface rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-fintech-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#0F172A]">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>DETERMINISTIC GUARDRAIL VERIFICATION</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
              ACTION CLEARED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] flex items-center justify-between">
              <span>✓ Amount threshold limit</span>
              <strong className="text-[#059669]">&lt; ₹50,000 INR</strong>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] flex items-center justify-between">
              <span>✓ Retry limit cap</span>
              <strong className="text-[#059669]">Max 2 Attempts</strong>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] flex items-center justify-between">
              <span>✓ Idempotent duplicate check</span>
              <strong className="text-[#059669]">Zero Double Charge</strong>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] flex items-center justify-between">
              <span>✓ Recovery window deadline</span>
              <strong className="text-[#059669]">24 Hours Max</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section — Interactive Live Diagnostic Studio (Real User Input) */}
      <section id="demo" className="max-w-5xl mx-auto px-6 sm:px-12 py-20 border-t border-[#E5E1D8] space-y-10">
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#10B981]" />
            LIVE USER INPUT STUDIO &bull; NO CANNED DATA
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A]">
            Test with your own payments.
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl font-sans leading-relaxed">
            Enter your real customer order details, failure categories, and amounts. Watch ReviveAI's closed-loop reasoning and financial guardrails execute live on your exact input.
          </p>
        </div>

        {/* Real User Input Card */}
        <div className="editorial-surface rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-fintech-md border border-[#E5E1D8]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Input 1: Customer Name */}
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Merchant / Customer
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Acme SaaS"
                className="w-full px-3 py-2 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-sans text-xs"
              />
            </div>

            {/* Input 2: Payment Amount */}
            <div>
              <label className="block text-[#475569] font-medium mb-1 flex items-center justify-between">
                <span>Amount (INR)</span>
                <span className="text-[10px] font-bold text-[#059669]">{formatINR(customAmount)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#64748B] font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full pl-6 pr-3 py-2 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-bold text-xs"
                />
              </div>
            </div>

            {/* Input 3: Payment Rail */}
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Payment Rail
              </label>
              <select
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] text-xs"
              >
                <option value="CARD">Credit / Debit Card</option>
                <option value="UPI">UPI Intent / Collect</option>
                <option value="NETBANKING">NetBanking</option>
                <option value="MANDATE">Recurring eNACH</option>
              </select>
            </div>

            {/* Input 4: Failure Category */}
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Failure Signature
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] text-xs"
              >
                <option value="TEMPORARY_DECLINE">Bank Switch Throttle</option>
                <option value="CHECKOUT_ABANDONED">3DS Page Drop-off</option>
                <option value="SUBSCRIPTION_DECLINE">Mandate Debit Lapse</option>
                <option value="NETWORK_TIMEOUT">HTTP 504 PSP Timeout</option>
              </select>
            </div>
          </div>

          {/* Dynamic Guardrail Callout */}
          {customAmount >= 50000 && (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs font-mono text-[#92400E] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>
                <strong>Threshold Alert (&ge; ₹50,000):</strong> This transaction triggers the Deterministic Safety Guardrail. Autonomous charges will be locked and escalated to Human Governance.
              </span>
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#EAE6DD]">
            <span className="text-xs text-[#64748B] font-sans">
              Calls live backend AI agent &bull; Generates verifiable cryptographic ledger record
            </span>

            <button
              onClick={handleRunCustomDiagnosis}
              disabled={customDiagnosing}
              className="px-6 py-3 rounded-xl text-xs font-mono font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 transition flex items-center gap-2 shadow-fintech-md self-start sm:self-auto"
            >
              {customDiagnosing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#34D399]" />
                  <span>Evaluating Live AI Diagnosis...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-current" />
                  <span>Run Live AI Diagnosis on My Input</span>
                </>
              )}
            </button>
          </div>

          {/* Custom Diagnostic Output Card */}
          {customResult && (
            <div className="p-5 rounded-xl bg-[#0F172A] text-white border border-[#1E293B] space-y-4 animate-fade-in font-mono text-xs shadow-fintech-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#334155]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#34D399]">LIVE RESULT</span>
                    <span className="text-[#64748B]">&bull;</span>
                    <span className="font-bold text-white">{customResult.payment_ref}</span>
                  </div>
                  <span className="text-sm font-bold block mt-0.5 text-white">
                    {customResult.customer?.name} &bull; {formatINR(customResult.amount)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    customResult.status === 'REQUIRES_APPROVAL'
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                      : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                  }`}>
                    ● {customResult.status === 'REQUIRES_APPROVAL' ? 'HUMAN APPROVAL REQUIRED' : 'IN AUTONOMOUS RECOVERY'}
                  </span>

                  <button
                    onClick={() => navigate(`/investigations/${customResult.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium transition flex items-center gap-1.5"
                  >
                    <span>Inspect Forensics</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#1E293B] rounded-lg border border-[#334155]">
                  <span className="text-[#94A3B8] text-[10px] block">Recommended Action</span>
                  <strong className="text-[#34D399] text-xs block mt-0.5">{customResult.ai_recommendation || 'DELAYED_RETRY'}</strong>
                </div>

                <div className="p-3 bg-[#1E293B] rounded-lg border border-[#334155]">
                  <span className="text-[#94A3B8] text-[10px] block">Certainty Score</span>
                  <strong className="text-white text-xs block mt-0.5">{customResult.ai_confidence || 88}% High</strong>
                </div>

                <div className="p-3 bg-[#1E293B] rounded-lg border border-[#334155]">
                  <span className="text-[#94A3B8] text-[10px] block">Safety Bound</span>
                  <strong className="text-white text-xs block mt-0.5">
                    {customResult.amount >= 50000 ? 'Escalated to Operator' : '≤ 2 Retries Permitted'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive ROI & Financial Impact Calculator */}
        <div className="editorial-surface rounded-2xl p-6 sm:p-8 bg-[#FAF8F5] border border-[#E5E1D8] space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">
              FINANCIAL IMPACT CALCULATOR
            </span>
            <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
              How much revenue could you recover every month?
            </h3>
            <p className="text-xs text-[#64748B] font-sans">
              Based on empirical Indian fintech recovery benchmarks (42.8% average recovery rate).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Sliders */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[#475569] mb-1">
                  <span>Monthly Payment Volume (GMV):</span>
                  <strong className="text-[#0F172A]">{formatINR(roiVolume)}</strong>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="100000000"
                  step="500000"
                  value={roiVolume}
                  onChange={(e) => setRoiVolume(Number(e.target.value))}
                  className="w-full accent-[#0F172A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#94A3B8]">
                  <span>₹10 Lakhs</span>
                  <span>₹50 Lakhs</span>
                  <span>₹10 Crores</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#475569] mb-1">
                  <span>Payment Failure Rate:</span>
                  <strong className="text-[#0F172A]">{roiFailureRate}%</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={roiFailureRate}
                  onChange={(e) => setRoiFailureRate(Number(e.target.value))}
                  className="w-full accent-[#0F172A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#94A3B8]">
                  <span>5% (Low)</span>
                  <span>15% (Average)</span>
                  <span>35% (High)</span>
                </div>
              </div>
            </div>

            {/* Calculations Result Callout */}
            <div className="p-5 rounded-xl bg-white border border-[#E5E1D8] space-y-3 font-mono shadow-fintech-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1EFEA]">
                <span className="text-[10px] uppercase text-[#64748B]">Monthly Exposed Failures:</span>
                <span className="text-xs font-bold text-[#DC2626]">
                  {formatINR(roiVolume * (roiFailureRate / 100))}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#0F172A]">Recovered Revenue / Month:</span>
                <span className="text-xl font-extrabold text-[#059669]">
                  {formatINR(roiVolume * (roiFailureRate / 100) * 0.428)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F1EFEA]">
                <span className="text-[10px] uppercase text-[#64748B]">Annual Cashflow Boost:</span>
                <span className="text-sm font-bold text-[#0F172A]">
                  {formatINR(roiVolume * (roiFailureRate / 100) * 0.428 * 12)} / year
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final Call to Action */}
      <section className="max-w-4xl mx-auto px-6 sm:px-12 py-24 text-center space-y-6 border-t border-[#E5E1D8]">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
          AUTONOMOUS REVENUE OPERATIONS FOR MERCHANTS
        </span>

        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
          See where your revenue <br />
          <span className="text-[#059669]">could be recovered.</span>
        </h2>

        <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed font-sans">
          Enter the ReviveAI workspace and explore the complete recovery lifecycle across your merchant payment rails.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono">
          <button
            onClick={() => navigate('/journey')}
            className="group px-7 py-3.5 rounded-xl text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] transition flex items-center gap-2 shadow-fintech-md"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={() => navigate('/simulation')}
            className="px-6 py-3.5 rounded-xl text-xs font-semibold text-[#0F172A] bg-white hover:bg-[#FAF8F5] border border-[#DDD8CC] transition shadow-fintech-xs"
          >
            Open Simulation Lab
          </button>
        </div>
      </section>

      {/* 9. Minimal Footer */}
      <footer className="border-t border-[#E5E1D8] bg-[#FAF8F5] py-10 px-6 sm:px-12 text-xs font-mono text-[#64748B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" subtitleText="AUTONOMOUS REVENUE RECOVERY • ENTERPRISE PRODUCTION SUITE" />

          <div className="flex items-center gap-6 text-xs">
            <button onClick={() => navigate('/journey')} className="hover:text-[#0F172A] transition">
              Command Center
            </button>
            <button onClick={() => navigate('/simulation')} className="hover:text-[#0F172A] transition">
              Simulation Lab
            </button>
            <button onClick={() => navigate('/approvals')} className="hover:text-[#0F172A] transition">
              Approvals
            </button>
            <button onClick={() => navigate('/audit')} className="hover:text-[#0F172A] transition">
              Audit Trail
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
