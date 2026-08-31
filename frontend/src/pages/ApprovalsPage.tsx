import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  UserCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { apiClient, formatINR, formatDateTime } from '../api/client';
import { ApprovalRequest } from '../types';

export const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getApprovals(statusFilter !== 'ALL' ? statusFilter : undefined);
      setApprovals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleDecision = async (id: number, decision: 'APPROVE' | 'REJECT') => {
    try {
      setActionInProgress(id);
      await apiClient.decideApproval(id, decision, `Manual authorization executed by Risk Lead (${decision})`);
      await fetchApprovals();
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const displayList = statusFilter === 'PENDING' ? pendingApprovals : approvals;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
              04 &bull; HUMAN GOVERNANCE QUEUE
            </span>
            <span className="text-[#C5C0B3]">&bull;</span>
            <span className="text-xs font-serif-heading italic text-[#475569]">
              Approvals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#0F172A] mt-1">
            Human Approvals
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Authorize high-value financial actions and risk policy escalations (&ge; ₹50,000 threshold).
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium text-[#475569] hover:text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition shadow-fintech-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#059669]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-1 text-xs font-mono">
        {[
          { key: 'ALL', label: `All Decisions (${approvals.length})` },
          { key: 'PENDING', label: `Pending Action (${pendingApprovals.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              statusFilter === tab.key
                ? 'bg-[#0F172A] text-white font-bold shadow-fintech-xs'
                : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#DDD8CC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Approvals List / Empty State */}
      {loading ? (
        <div className="editorial-surface rounded-2xl p-12 text-center text-[#64748B] font-mono text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0F172A]" />
          <p>Checking pending approval queue...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="editorial-surface rounded-2xl p-16 text-center bg-white space-y-3">
          <ShieldCheck className="w-10 h-10 mx-auto text-[#059669]" />
          <h3 className="text-sm font-bold text-[#0F172A]">You're all clear.</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-sans">
            No recovery actions currently require human operator sign-off. All autonomous recovery actions are operating safely within configured limits.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((appr) => {
            const isProcessing = actionInProgress === appr.id;

            return (
              <div
                key={appr.id}
                className="editorial-surface rounded-2xl p-6 sm:p-7 bg-white space-y-5 shadow-fintech-xs hover:border-[#CEC8BB] transition"
              >
                {/* Top Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EAE6DD]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D97706] font-bold bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                      HUMAN SIGN-OFF MANDATED (&ge; ₹50,000 THRESHOLD)
                    </span>
                    <h3 className="text-xl font-bold font-mono text-[#0F172A] mt-1.5">
                      {formatINR(appr.amount)} Enterprise Recovery Action
                    </h3>
                    <p className="text-xs text-[#64748B] font-mono">
                      Customer: <strong className="text-[#0F172A]">{appr.customer_name}</strong> &bull; Ref: {appr.approval_ref}
                    </p>
                  </div>

                  <div className="text-left sm:text-right font-mono text-xs">
                    <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">AI Confidence</span>
                    <span className="text-sm font-bold text-[#059669] block">{appr.ai_confidence}%</span>
                    <span className="text-[11px] text-[#94A3B8] block">{formatDateTime(appr.created_at)}</span>
                  </div>
                </div>

                {/* Evidence & Decision Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-1">
                    <span className="text-[#64748B] text-[10px] uppercase block font-bold">Recommended Action</span>
                    <strong className="text-[#1E40AF] block text-xs">{appr.ai_recommendation}</strong>
                    <p className="text-[11px] text-[#475569] font-sans pt-1 leading-relaxed">
                      Reason: {appr.evidence_reason || 'High customer lifetime value with temporary mandate authorization lapse.'}
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-1">
                    <span className="text-[#64748B] text-[10px] uppercase block font-bold">Guardrail Policy Trigger</span>
                    <strong className="text-[#D97706] block text-xs">Escalated: High-Value Threshold</strong>
                    <p className="text-[11px] text-[#475569] font-sans pt-1 leading-relaxed">
                      Transaction value {formatINR(appr.amount)} exceeds autonomous ₹50,000 threshold.
                    </p>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#EAE6DD]">
                  <button
                    onClick={() => navigate(`/investigations/${appr.payment_id}`)}
                    className="text-xs font-mono font-semibold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 transition order-2 sm:order-1"
                  >
                    <span>View Forensic Investigation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {appr.status === 'PENDING' ? (
                    <div className="flex items-center gap-3 order-1 sm:order-2">
                      <button
                        onClick={() => handleDecision(appr.id, 'REJECT')}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition"
                      >
                        Reject Action
                      </button>

                      <button
                        onClick={() => handleDecision(appr.id, 'APPROVE')}
                        disabled={isProcessing}
                        className="px-5 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#059669] hover:bg-[#047857] shadow-fintech-sm transition flex items-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Approve Recovery Action</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-[#64748B] order-1 sm:order-2">
                      Status: {appr.status} ({appr.decision_by})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
