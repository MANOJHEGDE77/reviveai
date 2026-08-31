import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  AlertOctagon,
  Cpu,
  RefreshCw,
  Loader2,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Filter,
  Inbox,
  X,
  CreditCard,
  Building,
  Smartphone
} from 'lucide-react';
import { apiClient, formatINR, formatDateTime } from '../api/client';
import { Payment } from '../types';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>(searchParams.get('tab') || 'ALL');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [investigatingId, setInvestigatingId] = useState<number | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (filterTab === 'HIGH_RISK') params.risk_level = 'HIGH';
      else if (filterTab === 'CRITICAL') params.risk_level = 'CRITICAL';
      else if (filterTab === 'MEDIUM_RISK') params.risk_level = 'MEDIUM';
      else if (filterTab === 'LOW_RISK') params.risk_level = 'LOW';
      else if (filterTab === 'RECOVERING') params.status = 'IN_RECOVERY';
      else if (filterTab === 'BLOCKED') params.status = 'REQUIRES_APPROVAL';
      else if (filterTab === 'RECOVERED') params.status = 'RECOVERED';
      else if (filterTab === 'AT_RISK') params.status = 'FAILED';

      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await apiClient.getIncidents(params);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filterTab, searchTerm]);

  const handleTabChange = (tab: string) => {
    setFilterTab(tab);
    setSearchParams(tab === 'ALL' ? {} : { tab });
  };

  const handleInvestigate = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      setInvestigatingId(id);
      await apiClient.investigateIncident(id);
      navigate(`/investigations/${id}`);
    } catch (err) {
      console.error(err);
      navigate(`/investigations/${id}`);
    } finally {
      setInvestigatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECOVERED':
        return { label: 'RECOVERED', cls: 'state-tag-recovered' };
      case 'IN_RECOVERY':
        return { label: 'RECOVERING', cls: 'state-tag-investigating' };
      case 'REQUIRES_APPROVAL':
        return { label: 'APPROVAL REQUIRED', cls: 'state-tag-risk' };
      case 'FAILED':
      default:
        return { label: 'AT RISK', cls: 'state-tag-failed' };
    }
  };

  const getMethodIcon = (methodType?: string) => {
    switch (methodType) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'NETBANKING':
        return <Building className="w-3.5 h-3.5 text-[#7C3AED]" />;
      case 'CARD':
      default:
        return <CreditCard className="w-3.5 h-3.5 text-[#059669]" />;
    }
  };

  const tabs = [
    { key: 'ALL', label: 'All Incidents' },
    { key: 'AT_RISK', label: 'At Risk' },
    { key: 'HIGH_RISK', label: 'High Risk' },
    { key: 'RECOVERING', label: 'Recovering' },
    { key: 'BLOCKED', label: 'Blocked / Approvals' },
    { key: 'RECOVERED', label: 'Recovered' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
              02 &bull; FORENSIC INVESTIGATIONS
            </span>
            <span className="text-[#C5C0B3]">&bull;</span>
            <span className="text-xs font-serif-heading italic text-[#475569]">
              Incident Triage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#0F172A] mt-1">
            Revenue Investigations
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {incidents.length} payment failure incidents identified for root-cause diagnosis and autonomous recovery.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium text-[#475569] hover:text-[#0F172A] bg-white hover:bg-[#F1EFEA] border border-[#DDD8CC] transition shadow-fintech-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#059669]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Search & Segmented Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                filterTab === tab.key
                  ? 'bg-[#0F172A] text-white font-bold shadow-fintech-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1EFEA] border border-[#DDD8CC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer, ref, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#DDD8CC] rounded-lg text-xs font-mono text-[#0F172A] focus:outline-hidden focus:border-[#0F172A] placeholder:text-[#94A3B8]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Incidents List & Empty State */}
      {loading ? (
        <div className="editorial-surface rounded-2xl p-12 text-center text-[#64748B] font-mono text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0F172A]" />
          <p>Analyzing telemetry and payment events...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="editorial-surface rounded-2xl p-16 text-center bg-white space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-bold text-[#0F172A]">No at-risk payments</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-sans">
            Your revenue streams are currently healthy with zero unresolved failure incidents matching this filter query.
          </p>
        </div>
      ) : (
        <div className="editorial-surface rounded-2xl bg-white overflow-hidden divide-y divide-[#EAE6DD] shadow-fintech-xs">
          {incidents.map((incident) => {
            const badge = getStatusBadge(incident.status);
            const isInvestigating = investigatingId === incident.id;
            const customer = incident.customer;

            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/investigations/${incident.id}`)}
                className="p-4 sm:p-5 hover:bg-[#FAF8F5] transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
              >
                {/* Left: Customer, Amount, Problem */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center font-mono font-bold text-xs text-[#0F172A] shrink-0 mt-0.5 group-hover:border-[#0F172A] transition">
                    {customer?.name.slice(0, 2).toUpperCase() || 'TX'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base sm:text-lg font-bold font-mono text-[#0F172A]">
                        {formatINR(incident.amount)}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        ● {badge.label}
                      </span>
                      <span className="text-xs font-mono text-[#94A3B8]">
                        {incident.payment_ref}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] font-sans">
                      <span>{customer?.name}</span>
                      <span className="text-[#CBD5E1]">&bull;</span>
                      <span className="text-[11px] font-mono text-[#64748B] flex items-center gap-1 font-normal">
                        {getMethodIcon(customer?.payment_method_type)}
                        {customer?.payment_method_masked}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] font-mono leading-relaxed">
                      {incident.failure_reason || incident.failure_category}
                    </p>
                  </div>
                </div>

                {/* Right: AI Strategy, Confidence & Primary Action */}
                <div className="flex items-center gap-6 border-t lg:border-t-0 border-[#EAE6DD] pt-3 lg:pt-0 shrink-0 font-mono text-xs justify-between lg:justify-end">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Assigned Strategy</span>
                    <strong className="text-xs text-[#1E40AF] block mt-0.5">
                      {incident.ai_recommendation || 'DELAYED_RETRY'}
                    </strong>
                    <span className="text-[10px] text-[#059669] block font-bold">
                      {incident.ai_confidence || 88}% Confidence
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleInvestigate(e, incident.id)}
                    disabled={isInvestigating}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] transition flex items-center gap-1.5 shadow-fintech-sm"
                  >
                    {isInvestigating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#34D399]" />
                    ) : (
                      <>
                        <span>Investigate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
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
