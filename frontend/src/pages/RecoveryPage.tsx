import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ChevronRight,
  Loader2,
  Inbox,
  ShieldAlert,
  ArrowRight,
  Layers,
  Activity
} from 'lucide-react';
import { apiClient, formatINR, formatDateTime } from '../api/client';
import { RecoveryWorkflow } from '../types';

export const RecoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<RecoveryWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [executingId, setExecutingId] = useState<number | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      let queryStatus: string | undefined = undefined;
      if (statusFilter === 'ACTIVE') queryStatus = 'ACTIVE';
      else if (statusFilter === 'WAITING') queryStatus = 'WAITING';
      else if (statusFilter === 'APPROVAL') queryStatus = 'PENDING_APPROVAL';
      else if (statusFilter === 'RECOVERED') queryStatus = 'RESOLVED';
      else if (statusFilter === 'CLOSED') queryStatus = 'EXPIRED';

      const data = await apiClient.getRecoveryWorkflows(queryStatus);
      setWorkflows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [statusFilter]);

  const handleExecute = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      setExecutingId(id);
      await apiClient.executeWorkflowAction(id);
      await fetchWorkflows();
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingId(null);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'All Workflows' },
    { key: 'ACTIVE', label: 'Active Loops' },
    { key: 'WAITING', label: 'Waiting Cooldown' },
    { key: 'APPROVAL', label: 'Approval Mandate' },
    { key: 'RECOVERED', label: 'Settled & Closed' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return { label: 'RECOVERED', cls: 'state-tag-recovered' };
      case 'ACTIVE':
        return { label: 'RECOVERING', cls: 'state-tag-investigating' };
      case 'PENDING_APPROVAL':
        return { label: 'APPROVAL REQUIRED', cls: 'state-tag-risk' };
      case 'WAITING':
        return { label: 'WAITING COOLDOWN', cls: 'state-tag-neutral' };
      default:
        return { label: 'CLOSED', cls: 'state-tag-failed' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
              03 &bull; RECOVERY OPERATIONS ENGINE
            </span>
            <span className="text-[#C5C0B3]">&bull;</span>
            <span className="text-xs font-serif-heading italic text-[#475569]">
              State Machine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#0F172A] mt-1">
            Recovery Operations
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Active and resolved autonomous recovery workflows operating within deterministic safety bounds.
          </p>
        </div>

        <button
          onClick={fetchWorkflows}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium text-[#475569] hover:text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition shadow-fintech-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#059669]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-[#0F172A] text-white font-bold shadow-fintech-xs'
                : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1EFEA] border border-[#DDD8CC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Workflows List & Empty State */}
      {loading ? (
        <div className="editorial-surface rounded-2xl p-12 text-center text-[#64748B] font-mono text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0F172A]" />
          <p>Querying recovery state machine...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="editorial-surface rounded-2xl p-16 text-center bg-white space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-bold text-[#0F172A]">No active recovery workflows</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-sans">
            ReviveAI is currently monitoring incoming revenue telemetry. No workflows match this filter.
          </p>
        </div>
      ) : (
        <div className="editorial-surface rounded-2xl bg-white overflow-hidden divide-y divide-[#EAE6DD] shadow-fintech-xs">
          {workflows.map((wf) => {
            const badge = getStatusBadge(wf.status);
            const isExecuting = executingId === wf.id;

            return (
              <div
                key={wf.id}
                onClick={() => navigate(`/investigations/${wf.payment_id}`)}
                className="p-4 sm:p-5 hover:bg-[#FAF8F5] transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
              >
                {/* Left: Workflow Ref, Strategy, Status */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold font-mono text-[#0F172A]">
                      {wf.workflow_ref}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                      ● {badge.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1E40AF]">
                      {wf.strategy}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] font-mono leading-relaxed">
                    Trigger: {wf.trigger_reason}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-[#64748B] pt-0.5 flex-wrap">
                    <span>
                      Attempt Budget: <strong className="text-[#0F172A]">{wf.attempts} / {wf.max_attempts}</strong>
                      <span className="ml-1 text-[#94A3B8]">
                        ({Array.from({ length: wf.max_attempts }).map((_, i) => i < wf.attempts ? '■' : '□').join(' ')})
                      </span>
                    </span>
                    <span>Next Action: <strong className="text-[#0F172A]">{wf.next_action}</strong></span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 border-t lg:border-t-0 border-[#EAE6DD] pt-3 lg:pt-0 shrink-0 font-mono text-xs justify-end">
                  {wf.status === 'ACTIVE' && (
                    <button
                      onClick={(e) => handleExecute(e, wf.id)}
                      disabled={isExecuting}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] transition flex items-center gap-1.5 shadow-fintech-sm"
                    >
                      {isExecuting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-[#34D399]" />
                          <span>Execute Step</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/investigations/${wf.payment_id}`)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition flex items-center gap-1"
                  >
                    <span>Review Workflow</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
