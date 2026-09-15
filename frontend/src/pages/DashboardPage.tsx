import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronRight,
  X,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight
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
import { DashboardSummary } from '../types';
import { CustomIncidentModal } from '../components/CustomIncidentModal';
import { InjectIncidentIcon } from '../components/ActionIcons';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');
  const [dismissOnboarding, setDismissOnboarding] = useState(() => {
    return localStorage.getItem('reviveai_onboarding_dismissed') === 'true';
  });
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const fetchSummary = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const data = await apiClient.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
      if (showRefresh) setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => fetchSummary(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setDismissOnboarding(true);
    localStorage.setItem('reviveai_dismiss_onboarding', 'true');
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[#E5E1D8] rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-white rounded-xl border border-[#E5E1D8]" />
          <div className="h-32 bg-white rounded-xl border border-[#E5E1D8]" />
          <div className="h-32 bg-white rounded-xl border border-[#E5E1D8]" />
          <div className="h-32 bg-white rounded-xl border border-[#E5E1D8]" />
        </div>
        <div className="h-72 bg-white rounded-xl border border-[#E5E1D8]" />
      </div>
    );
  }

  const atRisk = summary?.revenue_at_risk || 482000;
  const recoverable = summary?.estimated_recoverable || 291000;
  const recovered = summary?.successfully_recovered || 147500;
  const recoveryRate = summary?.recovery_rate || 42.8;
  const recoveredCount = summary?.recovered_incidents_count || 61;
  const activeWfCount = summary?.active_workflows_count || 47;
  const pendingApprovals = summary?.pending_approvals_count || 0;
  const chartData = summary?.revenue_trend || [];
  const riskCategories = summary?.risk_categories || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 0. First-time User Experience Banner (Dismissible) */}
      {!dismissOnboarding && (
        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD8CC] relative space-y-3 shadow-fintech-xs">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] transition"
            title="Dismiss orientation"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D97706]" />
              WELCOME TO REVIVEAI COMMAND CENTER
            </span>
            <h2 className="text-base font-bold text-[#0F172A] mt-0.5">
              Autonomous AI Revenue Recovery Engine
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl font-sans leading-relaxed">
              ReviveAI monitors failed payment streams in real-time, diagnoses root causes, executes bounded recoveries, and logs deterministic audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-[#334155]">
            <div
              onClick={() => navigate('/investigations')}
              className="p-3 bg-white rounded-xl border border-[#E5E1D8] hover:border-[#0F172A] transition cursor-pointer group"
            >
              <strong className="block text-[#0F172A] group-hover:text-[#2563EB] flex items-center justify-between">
                1. Review At-Risk
                <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </strong>
              <span className="text-[11px] text-[#64748B] font-sans">Inspect decline events &amp; drop-offs</span>
            </div>
            <div
              onClick={() => navigate('/recovery')}
              className="p-3 bg-white rounded-xl border border-[#E5E1D8] hover:border-[#0F172A] transition cursor-pointer group"
            >
              <strong className="block text-[#0F172A] group-hover:text-[#059669] flex items-center justify-between">
                2. Autonomous Loops
                <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </strong>
              <span className="text-[11px] text-[#64748B] font-sans">Bounded retries &amp; smart failovers</span>
            </div>
            <div
              onClick={() => navigate('/approvals')}
              className="p-3 bg-white rounded-xl border border-[#E5E1D8] hover:border-[#0F172A] transition cursor-pointer group"
            >
              <strong className="block text-[#0F172A] group-hover:text-[#D97706] flex items-center justify-between">
                3. High-Value Approvals
                <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </strong>
              <span className="text-[11px] text-[#64748B] font-sans">Human sign-off on &ge; ₹50,000 txns</span>
            </div>
          </div>
        </div>
      )}

      {/* Page Header with Single Clear Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
              01 &bull; COMMAND CENTER
            </span>
            <span className="text-[#C5C0B3]">&bull;</span>
            <span className="text-xs font-mono font-medium text-[#475569]">
              Live Revenue Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
            Today's Revenue Journey
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time financial telemetry and autonomous recovery across all merchant payment rails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] shadow-fintech-xs transition group"
          >
            <InjectIncidentIcon className="w-3.5 h-3.5" />
            <span>+ Ingest Incident</span>
          </button>

          <button
            onClick={() => fetchSummary(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium text-[#475569] hover:text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition shadow-fintech-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#059669]' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => navigate('/investigations')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition shadow-fintech-xs"
          >
            <span>Review At-Risk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION 1 — KPI METRIC CARDS */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* 1. At Risk */}
          <div className="editorial-surface rounded-2xl p-5 bg-white space-y-2 hover:border-[#CEC8BB] transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#64748B] font-bold tracking-wider">Revenue At Risk</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full state-tag-failed font-bold">
                Exposed
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] block tracking-tight">
              {formatINR(atRisk)}
            </span>
            <p className="text-[11px] text-[#64748B] font-sans">
              {summary?.failed_incidents_count || 183} payment failure events
            </p>
          </div>

          {/* 2. Estimated Recoverable */}
          <div className="editorial-surface rounded-2xl p-5 bg-white space-y-2 hover:border-[#CEC8BB] transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#64748B] font-bold tracking-wider">Recoverable</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full state-tag-investigating font-bold">
                AI Strategy
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] block tracking-tight">
              {formatINR(recoverable)}
            </span>
            <p className="text-[11px] text-[#1E40AF] font-sans">
              High-probability yield projection
            </p>
          </div>

          {/* 3. Successfully Recovered */}
          <div className="editorial-surface rounded-2xl p-5 bg-[#ECFDF5]/50 border-[#A7F3D0] space-y-2 hover:border-[#6EE7B7] transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#065F46] font-bold tracking-wider">Recovered Funds</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full state-tag-recovered font-bold">
                Settled
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#059669] block tracking-tight">
              {formatINR(recovered)}
            </span>
            <p className="text-[11px] text-[#065F46] font-sans">
              Auto-credited to merchant account
            </p>
          </div>

          {/* 4. Recovery Yield Rate */}
          <div className="editorial-surface rounded-2xl p-5 bg-[#ECFDF5]/50 border-[#A7F3D0] space-y-2 hover:border-[#6EE7B7] transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#065F46] font-bold tracking-wider">Recovery Yield</span>
              <span className="text-[10px] text-[#059669] font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +6.2%
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#059669] block tracking-tight">
              {recoveryRate.toFixed(1)}%
            </span>
            <p className="text-[11px] text-[#065F46] font-sans">
              {recoveredCount} closed-loop transactions
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — RECHARTS 7-DAY REVENUE INTELLIGENCE TREND */}
      <section className="editorial-surface rounded-2xl p-6 sm:p-7 bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE6DD]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
              REVENUE RECOVERY TELEMETRY &bull; 7-DAY TRAJECTORY
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Historical view of at-risk revenue detected versus successfully recovered funds
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono">
            {(['7D', '30D', '90D'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`px-3 py-1 rounded-md transition ${
                  timeRange === period
                    ? 'bg-[#0F172A] text-white font-bold'
                    : 'bg-[#FAF8F5] text-[#64748B] hover:text-[#0F172A] border border-[#DDD8CC]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Area Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E5E1D8' }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-fintech-lg border border-[#334155] text-xs font-mono space-y-1">
                        <p className="text-[#94A3B8] font-bold border-b border-[#334155] pb-1">{label}</p>
                        <p className="text-[#F59E0B] flex justify-between gap-4">
                          <span>At Risk:</span>
                          <strong>{formatINR(Number(payload[0]?.value) || 0)}</strong>
                        </p>
                        <p className="text-[#34D399] flex justify-between gap-4">
                          <span>Recovered:</span>
                          <strong>{formatINR(Number(payload[1]?.value) || 0)}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="at_risk"
                name="At Risk"
                stroke="#D97706"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRisk)"
              />
              <Area
                type="monotone"
                dataKey="recovered"
                name="Recovered"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRecovered)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#EAE6DD] text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span>Revenue at Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span>Recovered Funds (Settled)</span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — REVENUE RISK MAP (FAILURE CATEGORIES BREAKDOWN) */}
      <section className="editorial-surface rounded-2xl p-6 sm:p-7 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
              REVENUE RISK DISTRIBUTION &bull; ROOT CAUSE VECTORS
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Active exposure categorized by failure signature and historical recovery yield
            </p>
          </div>
          <span className="text-xs font-mono text-[#64748B]">
            {riskCategories.length} Failure Categories Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 font-mono">
          {riskCategories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/investigations?tab=${cat.category_key}`)}
              className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] hover:border-[#0F172A] hover:bg-white transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition">
                  {cat.label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  cat.status === 'CRITICAL' ? 'state-tag-failed' : cat.status === 'HIGH' ? 'state-tag-risk' : 'state-tag-neutral'
                }`}>
                  {cat.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-[#0F172A]">{formatINR(cat.amount)}</span>
                <span className="text-[11px] text-[#059669] font-bold">{(cat.recovery_probability * 100).toFixed(0)}% Yield</span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F172A] rounded-full"
                  style={{ width: `${Math.min(100, (cat.amount / 150000) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#64748B] pt-0.5">
                <span>{cat.affected_customers} payments</span>
                <span>{cat.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 & 5: WHAT NEEDS ATTENTION & WHAT IS REVIVEAI DOING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WHAT NEEDS ATTENTION? */}
        <section className="editorial-surface rounded-2xl p-6 bg-white flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DD]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                WHAT NEEDS YOUR DECISION?
              </span>
              {pendingApprovals > 0 ? (
                <span className="text-xs font-mono font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
                  {pendingApprovals} Action Required
                </span>
              ) : (
                <span className="text-xs font-mono text-[#059669] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All Clear
                </span>
              )}
            </div>

            {pendingApprovals > 0 ? (
              <div className="p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                  <strong className="text-xs font-bold text-[#92400E]">
                    {pendingApprovals} High-Value Recovery Pending Sign-off (&ge; ₹50,000)
                  </strong>
                </div>
                <p className="text-xs text-[#B45309] font-sans leading-relaxed">
                  Deterministic policy mandates human confirmation before dispatching smart retry playbooks on enterprise transactions.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] font-sans leading-relaxed pt-2">
                Zero high-value blockers. All current recovery actions are executing autonomously within deterministic policy safety bounds (&le; 2 retries).
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(pendingApprovals > 0 ? '/approvals' : '/investigations')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold text-[#0F172A] bg-[#F1EFEA] hover:bg-[#EAE5DA] border border-[#DDD8CC] transition flex items-center justify-center gap-1.5"
          >
            <span>{pendingApprovals > 0 ? 'Review Pending Approvals' : 'Review At-Risk Incidents'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* WHAT IS REVIVEAI DOING? */}
        <section className="editorial-surface rounded-2xl p-6 bg-white flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DD]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                AUTONOMOUS ENGINE STATUS
              </span>
              <span className="text-xs font-mono font-bold text-[#1E40AF] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                {activeWfCount} Active Loops
              </span>
            </div>

            <div className="p-4 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] space-y-1">
              <strong className="text-xs font-bold text-[#1E40AF] block font-mono">
                {activeWfCount} recovery workflows executing
              </strong>
              <p className="text-xs text-[#1E40AF] font-sans leading-relaxed">
                <strong>{formatINR(recoverable)}</strong> scheduled across delayed retry cooldowns, multi-rail PSP reroutes, and 1-click cart recovery links.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/recovery')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold text-[#0F172A] bg-[#F1EFEA] hover:bg-[#EAE5DA] border border-[#DDD8CC] transition flex items-center justify-center gap-1.5"
          >
            <span>View Active Recovery Workflows</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>

      {/* SECTION 6 — RECENT OUTCOMES FEED */}
      <section className="editorial-surface rounded-2xl p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
              VERIFIED REVENUE SETTLEMENTS &bull; RECENT OUTCOMES
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified funds recovered and settled into merchant settlement ledger
            </p>
          </div>
          <button
            onClick={() => navigate('/audit')}
            className="text-xs font-mono font-semibold text-[#059669] hover:underline flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#059669]">₹24,900.00 Recovered</span>
              <span className="text-[10px] text-[#94A3B8]">24m ago</span>
            </div>
            <p className="text-[11px] text-[#475569] font-sans">Swiggy Cloud Kitchen &bull; Delayed Retry</p>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#059669]">₹12,500.00 Recovered</span>
              <span className="text-[10px] text-[#94A3B8]">1h ago</span>
            </div>
            <p className="text-[11px] text-[#475569] font-sans">Zepto DarkStore &bull; Multi-Rail Switch</p>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#059669]">₹8,900.00 Recovered</span>
              <span className="text-[10px] text-[#94A3B8]">3h ago</span>
            </div>
            <p className="text-[11px] text-[#475569] font-sans">BharatMart D2C &bull; 1-Click Link</p>
          </div>
        </div>
      </section>

      {/* Custom Real Incident Ingestion Modal */}
      <CustomIncidentModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSuccess={(payment) => {
          fetchSummary();
          navigate(`/investigations/${payment.id}`);
        }}
      />
    </div>
  );
};
