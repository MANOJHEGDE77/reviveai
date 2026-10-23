import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CheckCircle2,
  Play,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  FlaskConical,
  Sparkles,
  CreditCard,
  Building,
  Smartphone
} from 'lucide-react';
import { apiClient, formatINR } from '../api/client';
import { DemoScenarioResult, Payment } from '../types';
import { SimulateFailureIcon } from '../components/ActionIcons';

export const SimulationPage: React.FC = () => {
  const navigate = useNavigate();

  // Selected scenario (Step 1)
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);

  // Configure parameters (Step 2)
  const [customAmount, setCustomAmount] = useState(24900);
  const [customCustomer, setCustomCustomer] = useState('Swiggy Cloud Kitchen Partner');
  const [customCategory, setCustomCategory] = useState('TEMPORARY_DECLINE');
  const [customMethod, setCustomMethod] = useState('CARD');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResult, setCustomResult] = useState<Payment | null>(null);

  // 1-Click Live Narrative Demo
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoScenarioResult | null>(null);

  const scenarios = [
    {
      title: 'Temporary Card Switch Decline',
      subtitle: 'Issuer throttle • ₹24,900',
      customer: 'Swiggy Cloud Kitchen Partner',
      amount: 24900,
      category: 'TEMPORARY_DECLINE',
      method: 'CARD',
      desc: 'Simulates a temporary card switch timeout from HDFC Bank. Triggers AI root-cause diagnosis and autonomous 120m delayed retry.',
    },
    {
      title: 'Subscription Mandate Decline',
      subtitle: 'Enterprise recurring • ₹1,25,000',
      customer: 'FreshDesk Enterprise Hub',
      amount: 125000,
      category: 'SUBSCRIPTION_DECLINE',
      method: 'NETBANKING',
      desc: 'Simulates a corporate recurring mandate failure. Exceeds ₹50,000 threshold, requiring Human Approval sign-off.',
    },
    {
      title: 'Abandoned Checkout Session',
      subtitle: 'High-intent cart drop-off • ₹74,000',
      customer: 'BharatMart D2C Apparel',
      amount: 74000,
      category: 'CHECKOUT_ABANDONED',
      method: 'CARD',
      desc: 'Simulates user drop-off at 3DS OTP verification. Triggers autonomous 1-click personalized checkout recovery session.',
    },
    {
      title: 'UPI Gateway Network Timeout',
      subtitle: 'UPI PSP server lag • ₹12,500',
      customer: 'Zepto DarkStore Logistics',
      amount: 12500,
      category: 'NETWORK_TIMEOUT',
      method: 'UPI',
      desc: 'Simulates a 504 gateway timeout on UPI intent. Triggers intelligent multi-rail secondary PSP routing.',
    },
  ];

  const currentScenario = scenarios[selectedScenarioIndex];

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index);
    const s = scenarios[index];
    setCustomAmount(s.amount);
    setCustomCustomer(s.customer);
    setCustomCategory(s.category);
    setCustomMethod(s.method);
    setCustomResult(null);
  };

  const handleStartSimulation = async () => {
    try {
      setCustomLoading(true);
      const res = await apiClient.triggerSimulation({
        customer_name: customCustomer,
        amount: Number(customAmount),
        failure_category: customCategory,
        payment_method_type: customMethod,
        auto_execute: true,
      });
      setCustomResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCustomLoading(false);
    }
  };

  const handleRunLiveRecoveryDemo = async () => {
    try {
      setDemoLoading(true);
      const res = await apiClient.runDemoScenario();
      setDemoResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="pb-3 border-b border-[#DCD8CF] flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
              DEVELOPER LAB &bull; SCENARIO SIMULATOR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111216] mt-1">
            Simulation Lab
          </h1>
          <p className="text-xs text-[#666A6B] mt-0.5">
            Test and demonstrate autonomous AI revenue recovery workflows with simulated decline payloads.
          </p>
        </div>

        {/* 1-Click Hero Trigger */}
        <button
          onClick={handleRunLiveRecoveryDemo}
          disabled={demoLoading}
          className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold text-white bg-[#111216] hover:bg-[#23262D] disabled:opacity-50 transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          {demoLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#168F5A]" />
              <span>Executing Autonomous Loop...</span>
            </>
          ) : (
            <>
              <SimulateFailureIcon className="w-3.5 h-3.5" />
              <span>1-Click Autonomous Loop Verification</span>
            </>
          )}
        </button>
      </div>

      {/* Demo Scenario Results */}
      {demoResult && (
        <div className="editorial-surface rounded-2xl p-6 sm:p-7 bg-[#EAF5EE] border-[#B9E2CD] space-y-4 shadow-editorial-panel animate-in fade-in duration-300">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#B9E2CD]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#168F5A] text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#168F5A] font-mono">
                  Payment Recovered Successfully — {formatINR(demoResult.amount_recovered)} Settled!
                </h4>
                <p className="text-[11px] font-mono text-[#117348]">
                  Workflow: <strong>{demoResult.workflow_ref}</strong> &bull; Customer: <strong>{demoResult.customer}</strong> &bull; AI Confidence: <strong>{demoResult.ai_confidence}%</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/audit')}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-[#168F5A] hover:bg-[#117348] transition shadow-xs"
            >
              View Audit Proof &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[#117348]">
            {demoResult.steps_completed.map((step, idx) => (
              <div key={idx} className="p-3 bg-white/90 rounded-xl border border-[#B9E2CD] flex items-center gap-2 shadow-xs">
                <span className="font-bold text-[#168F5A]">✓</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Three Simple Steps */}
      <div className="editorial-surface rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-fintech-xs">
        {/* STEP 1: CHOOSE SCENARIO */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase text-[#64748B] block pb-2 border-b border-[#EAE6DD]">
            STEP 1 &bull; CHOOSE PRESET SCENARIO
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {scenarios.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectScenario(idx)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedScenarioIndex === idx
                    ? 'bg-[#FAF8F5] border-[#0F172A] shadow-fintech-sm'
                    : 'bg-[#FAF8F5]/60 border-[#E5E1D8] hover:border-[#CEC8BB] hover:bg-[#FAF8F5]'
                }`}
              >
                <h4 className="text-xs font-bold text-[#0F172A]">{s.title}</h4>
                <p className="text-[11px] font-mono text-[#64748B] mt-1">{s.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: CONFIGURE */}
        <div className="space-y-3 pt-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#64748B] block pb-2 border-b border-[#EAE6DD]">
            STEP 2 &bull; CONFIGURE INGESTION PARAMETERS
          </span>
          <p className="text-xs text-[#64748B] leading-relaxed font-sans">
            {currentScenario.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs font-mono">
            <div>
              <label className="text-[#64748B] uppercase text-[10px] font-bold block mb-1">Customer / Merchant</label>
              <input
                type="text"
                value={customCustomer}
                onChange={(e) => setCustomCustomer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] focus:outline-hidden focus:border-[#0F172A]"
              />
            </div>

            <div>
              <label className="text-[#64748B] uppercase text-[10px] font-bold block mb-1">Transaction Value (INR)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] font-bold focus:outline-hidden focus:border-[#0F172A]"
              />
            </div>

            <div>
              <label className="text-[#64748B] uppercase text-[10px] font-bold block mb-1">Payment Rail</label>
              <select
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] focus:outline-hidden focus:border-[#0F172A]"
              >
                <option value="CARD">Credit/Debit Card (•••• 4821)</option>
                <option value="UPI">UPI Intent (merchant@okhdfc)</option>
                <option value="NETBANKING">Corporate NetBanking</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 3: RUN SCENARIO */}
        <div className="pt-4 border-t border-[#EAE6DD] flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs font-mono text-[#64748B]">
            {customAmount >= 50000 ? (
              <span className="text-[#D97706] font-bold">
                ⚠ &ge; ₹50,000 threshold requires risk lead sign-off in Approvals
              </span>
            ) : (
              <span className="text-[#059669] font-bold">
                ✓ Bounded autonomous recovery cleared (&le; 2 retries)
              </span>
            )}
          </span>

          <button
            onClick={handleStartSimulation}
            disabled={customLoading}
            className="px-6 py-2.5 rounded-xl text-xs font-mono font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 transition flex items-center gap-2 shadow-fintech-sm group"
          >
            {customLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SimulateFailureIcon className="w-3.5 h-3.5" />}
            <span>Run Recovery Scenario</span>
          </button>
        </div>

        {/* Custom Simulation Result Box */}
        {customResult && (
          <div className="p-5 rounded-xl bg-white border border-[#0F172A] space-y-2 animate-in fade-in duration-200 font-mono text-xs shadow-fintech-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-[#0F172A]">
                Payment Ingested: {customResult.payment_ref} ({formatINR(customResult.amount)})
              </span>
              <span className="text-[#1E40AF] font-bold">
                Strategy: {customResult.ai_recommendation || 'DELAYED_RETRY'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-sans">
              {customResult.ai_diagnosis_summary}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => navigate(`/investigations/${customResult.id}`)}
                className="text-xs font-semibold text-[#0F172A] hover:text-[#059669] flex items-center gap-1 transition"
              >
                <span>Inspect in Forensic Investigation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
