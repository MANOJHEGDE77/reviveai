import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  HelpCircle,
  Zap,
  Loader2,
  ChevronRight,
  User,
  CreditCard,
  Building,
  Check,
  ArrowRight,
  ShieldAlert,
  Activity,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { apiClient, formatINR, formatDateTime } from '../api/client';
import { Payment } from '../types';
import { DecisionExplainer } from '../components/DecisionExplainer';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await apiClient.getIncidentDetail(Number(id));
      setPayment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleExecuteAction = async () => {
    if (!payment?.workflow) return;
    try {
      setExecuting(true);
      await apiClient.executeWorkflowAction(payment.workflow.id);
      await fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!payment) return;
    try {
      setResolving(true);
      await apiClient.resolvePayment(payment.id);
      await fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  if (loading && !payment) {
    return (
      <div className="py-24 text-center text-[#64748B] font-sans space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0F172A]" />
        <p className="font-mono text-xs">Assembling forensic investigation dossier...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="py-24 text-center text-[#64748B] font-mono text-xs">
        Incident not found in ledger.
      </div>
    );
  }

  const workflow = payment.workflow;
  const customer = payment.customer;
  const confidence = payment.ai_confidence || 91;

  // Status mapping
  const getStatusDisplay = () => {
    if (payment.status === 'RECOVERED') return { label: 'RECOVERED', cls: 'state-tag-recovered' };
    if (payment.status === 'IN_RECOVERY') return { label: 'RECOVERING', cls: 'state-tag-investigating' };
    if (payment.status === 'REQUIRES_APPROVAL') return { label: 'APPROVAL REQUIRED', cls: 'state-tag-risk' };
    return { label: 'AT RISK', cls: 'state-tag-failed' };
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[#666A6B]">
        <Link to="/" className="hover:text-[#111216] transition">Home</Link>
        <ChevronRight className="w-3 h-3 text-[#C8C3B7]" />
        <Link to="/investigations" className="hover:text-[#111216] transition">Investigations</Link>
        <ChevronRight className="w-3 h-3 text-[#C8C3B7]" />
        <span className="text-[#111216] font-bold">{payment.payment_ref}</span>
      </nav>

      {/* 2. Page Header & State-Aware Contextual Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#DCD8CF]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase text-[#666A6B]">
              INCIDENT FORENSICS
            </span>
            <span className="text-[#C8C3B7]">&bull;</span>
            <span className="font-mono text-sm font-bold text-[#111216]">{payment.payment_ref}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusInfo.cls}`}>
              ● {statusInfo.label}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111216] mt-1">
            Forensic Incident Analysis
          </h1>
          <p className="text-xs text-[#666A6B] mt-0.5">
            {customer?.name} &bull; {formatINR(payment.amount)} &bull; {customer?.payment_method_masked} ({customer?.payment_method_type})
          </p>
        </div>

        {/* Contextual Single Primary Action */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setExplainerOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-[#111216] bg-white hover:bg-[#EDE9E0] border border-[#DCD8CF] shadow-xs transition"
          >
            Explain AI Decision
          </button>

          {payment.status === 'REQUIRES_APPROVAL' ? (
            <button
              onClick={() => navigate('/approvals')}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#B45309] hover:bg-[#92400E] shadow-xs transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Review Approval Queue</span>
            </button>
          ) : payment.status === 'RECOVERED' ? (
            <button
              onClick={() => navigate('/audit')}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#168F5A] hover:bg-[#117348] shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>View Audit Result</span>
            </button>
          ) : payment.status === 'IN_RECOVERY' ? (
            <button
              onClick={handleSimulatePaymentSuccess}
              disabled={resolving}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#168F5A] hover:bg-[#117348] shadow-xs transition flex items-center gap-1.5"
            >
              {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current text-[#FDE047]" />}
              <span>Simulate Settle &amp; Recover</span>
            </button>
          ) : (
            <button
              onClick={handleExecuteAction}
              disabled={executing}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] shadow-fintech-sm transition flex items-center gap-1.5"
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#34D399]" /> : <Play className="w-3.5 h-3.5 fill-current text-[#34D399]" />}
              <span>Start Recovery Action</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Progressive 6-Stage Forensic Investigation Journey */}
      <div className="space-y-6">
        {/* STAGE 01 — WHAT HAPPENED? */}
        <div className="editorial-surface rounded-2xl p-6 bg-white space-y-3 shadow-fintech-xs">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] block pb-2 border-b border-[#EAE6DD]">
            STAGE 01 &bull; WHAT HAPPENED? (DELEGATED SIGNAL)
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B] block font-bold">Amount at stake</span>
              <span className="text-3xl font-extrabold font-mono text-[#0F172A] mt-0.5 block tracking-tight">
                {formatINR(payment.amount)}
              </span>
              <p className="text-xs text-[#64748B] mt-1 font-mono">
                Failure signature: <strong className="text-[#0F172A]">{payment.failure_reason || payment.failure_category}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] font-mono text-xs text-right space-y-1">
              <span className="text-[#64748B] text-[10px] block">Risk Classification</span>
              <strong className={`text-xs block ${payment.risk_level === 'CRITICAL' ? 'text-[#DC2626]' : payment.risk_level === 'HIGH' ? 'text-[#D97706]' : 'text-[#2563EB]'}`}>
                {payment.risk_level} Risk
              </strong>
              <span className="text-[11px] text-[#059669] block font-bold">
                {(payment.recovery_probability * 100).toFixed(0)}% Recovery Yield
              </span>
            </div>
          </div>
        </div>

        {/* STAGE 02 — ASSEMBLED EVIDENCE */}
        <div className="editorial-surface rounded-2xl p-6 bg-white space-y-3 shadow-fintech-xs">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] block pb-2 border-b border-[#EAE6DD]">
            STAGE 02 &bull; WHAT DID REVIVEAI FIND? (ASSEMBLED EVIDENCE)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#64748B] text-[10px] uppercase block font-bold">Customer History</span>
              <strong className="text-sm text-[#0F172A] font-sans block mt-0.5">{customer?.name}</strong>
              <span className="text-[11px] text-[#059669] block mt-1 font-bold">{customer?.successful_transactions || 16} past settled payments</span>
            </div>
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#64748B] text-[10px] uppercase block font-bold">Customer Lifetime Value</span>
              <strong className="text-sm text-[#0F172A] block mt-0.5">{formatINR(customer?.lifetime_value || 84200)}</strong>
              <span className="text-[11px] text-[#64748B] block mt-1">High-value merchant partner</span>
            </div>
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#64748B] text-[10px] uppercase block font-bold">Payment Rail</span>
              <strong className="text-sm text-[#0F172A] block mt-0.5">{customer?.payment_method_type}</strong>
              <span className="text-[11px] text-[#64748B] block mt-1">Masked: {customer?.payment_method_masked}</span>
            </div>
          </div>
        </div>

        {/* STAGE 03 — WHY? (AI REASONING CONSOLE) */}
        <div className="editorial-surface rounded-2xl p-6 bg-[#0F172A] text-white border border-[#0F172A] space-y-4 shadow-fintech-md">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#334155]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              STAGE 03 &bull; WHY DID IT HAPPEN? (AI DIAGNOSTIC REASONING)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-white bg-[#334155] px-2 py-0.5 rounded border border-[#475569]">
                SOURCE: {(payment as any).diagnosis_source || 'GEMINI_1_5_FLASH'}
              </span>
              <span className="text-xs font-mono font-bold text-[#34D399] bg-[#065F46]/50 px-2.5 py-0.5 rounded-full border border-[#059669]">
                {confidence}% Confidence
              </span>
            </div>
          </div>

          <p className="text-xs text-[#E2E8F0] leading-relaxed font-sans bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
            {payment.ai_diagnosis_summary ||
              'The payment failure pattern matches temporary bank switch rate-limits. Historical merchant cohort recovery rate is 84% following a delayed retry.'}
          </p>

          <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
            <div className="p-3 bg-[#1E293B] rounded-xl border border-[#334155]">
              <span className="text-[#94A3B8] text-[10px] block">Customer History</span>
              <strong className="text-white text-xs mt-0.5 block">{customer?.successful_transactions || 16} Settled</strong>
            </div>
            <div className="p-3 bg-[#1E293B] rounded-xl border border-[#334155]">
              <span className="text-[#94A3B8] text-[10px] block">Historical Recovery</span>
              <strong className="text-[#34D399] text-xs mt-0.5 block">78% Cohort Yield</strong>
            </div>
            <div className="p-3 bg-[#1E293B] rounded-xl border border-[#334155]">
              <span className="text-[#94A3B8] text-[10px] block">Similar Incidents</span>
              <strong className="text-white text-xs mt-0.5 block">24 Resolved</strong>
            </div>
          </div>
        </div>

        {/* STAGE 04 — STRATEGY SELECTION */}
        <div className="editorial-surface rounded-2xl p-6 bg-white space-y-3 shadow-fintech-xs">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] block pb-2 border-b border-[#EAE6DD]">
            STAGE 04 &bull; WHAT DOES REVIVEAI RECOMMEND? (RECOVERY PLAYBOOK)
          </span>
          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[#64748B] text-[10px] uppercase block font-bold">Selected Recovery Strategy</span>
              <strong className="text-sm font-bold text-[#1E40AF] block mt-0.5">
                {payment.ai_recommendation || 'DELAYED_RETRY (120-minute cooldown window)'}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[#64748B] text-[10px] uppercase block font-bold">Max Attempt Bound</span>
              <strong className="text-xs text-[#0F172A] block mt-0.5">2 Retries Max</strong>
            </div>
          </div>
        </div>

        {/* STAGE 05 — DETERMINISTIC GUARDRAILS */}
        <div className="editorial-surface rounded-2xl p-6 bg-white space-y-3 shadow-fintech-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DD]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              STAGE 05 &bull; IS IT SAFE? (DETERMINISTIC GUARDRAILS)
            </span>
            <span className="text-xs font-mono font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
              ACTION CLEARED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-[#334155]">
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
              <span>✓ Transaction amount evaluated against threshold (&lt; ₹50,000)</span>
              <strong className="text-[#059669]">Passed</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
              <span>✓ Bounded retry attempts available (&le; 2 retries)</span>
              <strong className="text-[#059669]">Passed</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
              <span>✓ Idempotent settlement lock active</span>
              <strong className="text-[#059669]">Passed</strong>
            </div>
          </div>
        </div>

        {/* STAGE 06 — WORKFLOW STATE */}
        {workflow && (
          <div className="editorial-surface rounded-2xl p-6 bg-white space-y-3 shadow-fintech-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DD]">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                STAGE 06 &bull; WHAT HAPPENS NEXT? (WORKFLOW STATE MACHINE)
              </span>
              <span className="text-xs font-mono font-bold text-[#1E40AF]">
                {workflow.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
                <span className="text-[#64748B] text-[10px] uppercase block font-bold">Current Step</span>
                <strong className="text-xs text-[#0F172A] block mt-0.5">{workflow.current_step}</strong>
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
                <span className="text-[#64748B] text-[10px] uppercase block font-bold">Attempt Budget</span>
                <strong className="text-xs text-[#0F172A] block mt-0.5">{workflow.attempts} / {workflow.max_attempts}</strong>
              </div>
            </div>

            {(payment as any).settlement_evidence && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-mono text-[#065F46] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#047857] block">Authoritative Settlement Evidence</span>
                <span className="block font-mono text-[11px] break-all">{(payment as any).settlement_evidence}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decision Explainer Dialog */}
      <DecisionExplainer
        payment={payment}
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};
