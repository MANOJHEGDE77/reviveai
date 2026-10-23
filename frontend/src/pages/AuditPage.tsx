import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  ListFilter,
  Inbox,
  X,
  Copy,
  Check
} from 'lucide-react';
import { apiClient, formatINR, formatDateTime } from '../api/client';
import { AuditLog } from '../types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'details'>('timeline');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (actorFilter !== 'ALL') params.actor = actorFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await apiClient.getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actorFilter, searchTerm]);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#DCD8CF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666A6B]">
              05 &bull; IMMUTABLE AUDIT TRAIL
            </span>
            <span className="text-[#C8C3B7]">&bull;</span>
            <span className="text-xs font-mono font-medium text-[#666A6B]">
              Compliance Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111216] mt-1">
            Compliance Audit Ledger
          </h1>
          <p className="text-xs text-[#666A6B] mt-0.5">
            Immutable chronological record of every AI reasoning step, guardrail validation, and recovery outcome.
          </p>
        </div>

        {/* View Switcher (Timeline vs Details Table) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-lg bg-[#F4F1E9] border border-[#DCD8CF] p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md transition font-medium ${
                viewMode === 'timeline'
                  ? 'bg-[#111216] text-white font-bold shadow-xs'
                  : 'text-[#666A6B] hover:text-[#111216]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-3 py-1.5 rounded-md transition font-medium ${
                viewMode === 'details'
                  ? 'bg-[#111216] text-white font-bold shadow-xs'
                  : 'text-[#666A6B] hover:text-[#111216]'
              }`}
            >
              Technical Table
            </button>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-white hover:bg-[#EDE9E0] border border-[#DCD8CF] text-[#666A6B] hover:text-[#111216] transition"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#168F5A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Actor Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All Actors' },
            { key: 'REVIVE_AI_AGENT', label: 'AI Reasoner' },
            { key: 'SYSTEM', label: 'Guardrails Engine' },
            { key: 'HUMAN_OPERATOR', label: 'Human Operator' },
            { key: 'RAZORPAY_GATEWAY', label: 'Gateway Settlement' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActorFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                actorFilter === tab.key
                  ? 'bg-[#111216] text-white font-bold shadow-xs'
                  : 'bg-white text-[#666A6B] hover:text-[#111216] border border-[#DCD8CF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#DDD8CC] rounded-lg text-xs font-mono text-[#0F172A] focus:outline-hidden focus:border-[#0F172A] placeholder:text-[#94A3B8]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-[#94A3B8]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Views: Timeline vs Details */}
      {loading ? (
        <div className="editorial-surface rounded-2xl p-12 text-center text-[#64748B] font-mono text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0F172A]" />
          <p>Verifying cryptographic ledger integrity...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="editorial-surface rounded-2xl p-16 text-center bg-white space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-bold text-[#0F172A]">No audit logs</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-sans">
            No chronological entries match the selected filter query.
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* View 1: Timeline (Readable) */
        <div className="editorial-surface rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-fintech-xs">
          <div className="relative pl-6 border-l-2 border-[#E5E1D8] space-y-7">
            {logs.map((log) => (
              <div key={log.id} className="relative space-y-1.5">
                {/* Node dot */}
                <div
                  className={`absolute -left-[32px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                    log.outcome_status === 'SUCCESS' || log.outcome_status === 'TERMINATED'
                      ? 'bg-[#059669]'
                      : log.outcome_status === 'SCHEDULED'
                      ? 'bg-[#2563EB]'
                      : 'bg-[#D97706]'
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#0F172A]">
                      {log.decision}
                    </span>
                    {log.amount && (
                      <span className="font-mono text-xs font-bold text-[#059669]">
                        ({formatINR(log.amount)})
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-[#475569] font-mono leading-relaxed">
                  {log.reason || `Event: ${log.event_type}`}
                </p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B] pt-0.5 flex-wrap">
                  <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5E1D8]">
                    Actor: <strong className="text-[#0F172A]">{log.actor}</strong>
                  </span>
                  {log.payment_ref && (
                    <button
                      onClick={() => handleCopy(log.payment_ref!)}
                      className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5E1D8] hover:border-[#0F172A] transition flex items-center gap-1"
                    >
                      <span>Ref: <strong>{log.payment_ref}</strong></span>
                      {copiedRef === log.payment_ref ? <Check className="w-2.5 h-2.5 text-[#059669]" /> : <Copy className="w-2.5 h-2.5 text-[#94A3B8]" />}
                    </button>
                  )}
                  <span className="text-[#059669] font-bold">
                    ✓ Guardrail: {log.guardrail_result || 'PASSED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* View 2: Technical Details Table */
        <div className="editorial-surface rounded-2xl bg-white overflow-x-auto shadow-fintech-xs">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DD] bg-[#FAF8F5] text-[10px] uppercase text-[#64748B]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Reference</th>
                <th className="p-3.5">Decision / Result</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DD]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF8F5] transition">
                  <td className="p-3.5 text-[#94A3B8] whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="p-3.5 font-bold text-[#0F172A]">{log.actor}</td>
                  <td className="p-3.5 text-[#1E40AF]">{log.event_type}</td>
                  <td className="p-3.5 text-[#475569]">{log.payment_ref || 'SYSTEM'}</td>
                  <td className="p-3.5 text-[#0F172A]">{log.decision}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold state-tag-recovered">
                      {log.outcome_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
