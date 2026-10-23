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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getApprovals(statusFilter !== 'ALL' ? statusFilter : undefined);
      setApprovals(data);
    } catch (err: any) {
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
      setErrorMessage(null);
      setActionInProgress(id);
      await apiClient.decideApproval(id, decision, `Manual sign-off (${decision})`);
      await fetchApprovals();
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail || 'Approval operation failed.';
      setErrorMessage(detail);
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const displayList = statusFilter === 'PENDING' ? pendingApprovals : approvals;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {errorMessage && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#B91C1C] font-mono flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">&#9888; ACCESS CONTROL DENIED:</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#B91C1C] hover:text-[#7F1D1D] font-bold">
            &times;
          </button>
        </div>
      )}
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#DCD8CF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666A6B]">
              04 &bull; HUMAN GOVERNANCE QUEUE
            </span>
            <span className="text-[#C8C3B7]">&bull;</span>
            <span className="text-xs font-mono font-medium text-[#666A6B]">
              Approvals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111216] mt-1">
            Human Approvals
          </h1>
          <p className="text-xs text-[#666A6B] mt-0.5">
            Authorize high-value financial actions and risk policy escalations (&ge; ₹50,000 threshold).
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium text-[#666A6B] hover:text-[#111216] bg-white hover:bg-[#EDE9E0] border border-[#DCD8CF] transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#168F5A]' : ''}`} />
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
                ? 'bg-[#111216] text-white font-bold shadow-xs'
                : 'bg-white text-[#666A6B] hover:text-[#111216] border border-[#DCD8CF]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Approvals List / Empty State */}
      {loading ? (
        <div className="editorial-surface rounded-2xl p-12 text-center text-[#666A6B] font-mono text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#111216]" />
          <p>Checking pending approval queue...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="editorial-surface rounded-2xl p-16 text-center bg-white space-y-3">
          <ShieldCheck className="w-10 h-10 mx-auto text-[#168F5A]" />
          <h3 className="text-sm font-bold text-[#111216]">You're all clear.</h3>
          <p className="text-xs text-[#666A6B] max-w-md mx-auto font-sans">
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
                className="editorial-surface rounded-2xl p-6 sm:p-7 bg-white space-y-5 shadow-xs hover:border-[#C8C3B7] transition"
              >
                {/* Top Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EDE9E0]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#B45309] font-bold bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                      HUMAN SIGN-OFF MANDATED (&ge; ₹50,000 THRESHOLD)
                    </span>
                    <h3 className="text-xl font-bold font-mono text-[#111216] mt-1.5">
                      {formatINR(appr.amount)} Enterprise Recovery Action
                    </h3>
                    <p className="text-xs text-[#666A6B] font-mono">
                      Customer: <strong className="text-[#111216]">{appr.customer_name}</strong> &bull; Ref: {appr.approval_ref}
                    </p>
                  </div>

                  <div className="text-left sm:text-right font-mono text-xs">
                    <span className="text-[10px] text-[#888B8C] uppercase block font-bold">AI Confidence</span>
                    <span className="text-sm font-bold text-[#168F5A] block">{appr.ai_confidence}%</span>
                    <span className="text-[11px] text-[#888B8C] block">{formatDateTime(appr.created_at)}</span>
                  </div>
                </div>

                {/* Evidence & Decision Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 bg-[#F4F1E9] rounded-xl border border-[#DCD8CF] space-y-1">
                    <span className="text-[#666A6B] text-[10px] uppercase block font-bold">Recommended Action</span>
                    <strong className="text-[#1D4ED8] block text-xs">{appr.ai_recommendation}</strong>
                    <p className="text-[11px] text-[#666A6B] font-sans pt-1 leading-relaxed">
                      Reason: {appr.evidence_reason || 'High customer lifetime value with temporary mandate authorization lapse.'}
                    </p>
                  </div>

                  <div className="p-4 bg-[#F4F1E9] rounded-xl border border-[#DCD8CF] space-y-1">
                    <span className="text-[#666A6B] text-[10px] uppercase block font-bold">Guardrail Policy Trigger</span>
                    <strong className="text-[#B45309] block text-xs">Escalated: High-Value Threshold</strong>
                    <p className="text-[11px] text-[#666A6B] font-sans pt-1 leading-relaxed">
                      Transaction value {formatINR(appr.amount)} exceeds autonomous ₹50,000 threshold.
                    </p>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#EDE9E0]">
                  <button
                    onClick={() => navigate(`/investigations/${appr.payment_id}`)}
                    className="text-xs font-mono font-semibold text-[#666A6B] hover:text-[#111216] flex items-center gap-1 transition order-2 sm:order-1"
                  >
                    <span>View Forensic Investigation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {appr.status === 'PENDING' ? (
                    <div className="flex items-center gap-3 order-1 sm:order-2">
                      <button
                        onClick={() => handleDecision(appr.id, 'REJECT')}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-[#B91C1C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition"
                      >
                        Reject Action
                      </button>

                      <button
                        onClick={() => handleDecision(appr.id, 'APPROVE')}
                        disabled={isProcessing}
                        className="px-5 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#168F5A] hover:bg-[#117348] shadow-xs transition flex items-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Approve Recovery Action</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-[#666A6B] order-1 sm:order-2">
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
