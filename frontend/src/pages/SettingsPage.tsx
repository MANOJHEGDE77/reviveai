import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Sliders,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  RefreshCw,
  Key,
  Globe,
  Database,
  ArrowRight,
  Sparkles,
  Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'strategies';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#DCD8CF] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-section-tag">
              CONFIGURATION &bull; REVENUE CONTROLS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#111216] mt-1">
            System Configuration
          </h1>
          <p className="text-xs text-[#666A6B] mt-0.5 font-sans">
            Configure recovery strategies, deterministic financial guardrails, and gateway integrations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#DCD8CF] pb-px text-xs font-medium font-mono">
        {[
          { key: 'strategies', label: 'Strategies & Playbooks' },
          { key: 'guardrails', label: 'Deterministic Guardrails' },
          { key: 'integrations', label: 'Gateways & Integrations' },
          { key: 'settings', label: 'Merchant Profile' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 border-b-2 font-semibold transition ${
              activeTab === t.key
                ? 'border-[#111216] text-[#111216]'
                : 'border-transparent text-[#666A6B] hover:text-[#111216]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. STRATEGIES TAB */}
      {activeTab === 'strategies' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 sm:p-7 bg-white border border-[#DCD8CF] space-y-4 shadow-editorial-card">
            <div className="pb-3 border-b border-[#DCD8CF]">
              <h3 className="text-sm font-bold text-[#111216] font-mono">Autonomous Strategy Playbook Registry</h3>
              <p className="text-xs text-[#666A6B] mt-0.5 font-sans">
                ReviveAI dynamically matches payment failure signatures to calibrated recovery playbooks.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2 hover:border-[#111216] transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111216]">DELAYED_RETRY (Smart Exponential Cooldown)</span>
                  <span className="state-tag-recovered text-[10px] px-2.5 py-0.5 rounded-full font-bold">Active Playbook</span>
                </div>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Used for temporary issuer switch drops and bank batch throttling. Applies a 120-minute exponential backoff window.
                </p>
                <div className="flex gap-4 text-[10px] text-[#666A6B] pt-1">
                  <span>Max Attempts: <strong className="text-[#111216]">2</strong></span>
                  <span>Recovery Window: <strong className="text-[#111216]">24 Hours</strong></span>
                  <span>Historical Yield: <strong className="text-[#168F5A]">84%</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2 hover:border-[#111216] transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111216]">SMART_ROUTING (Multi-Rail Gateway Failover)</span>
                  <span className="state-tag-recovered text-[10px] px-2.5 py-0.5 rounded-full font-bold">Active Playbook</span>
                </div>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Instantly reroutes transactions experiencing 504 timeouts to backup Razorpay PSP rails with 99.4% uptime.
                </p>
                <div className="flex gap-4 text-[10px] text-[#666A6B] pt-1">
                  <span>Max Attempts: <strong className="text-[#111216]">2</strong></span>
                  <span>Failover Latency: <strong className="text-[#111216]">&lt; 300ms</strong></span>
                  <span>Historical Yield: <strong className="text-[#168F5A]">93%</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2 hover:border-[#111216] transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111216]">DISCOUNTED_CHECKOUT_REENGAGEMENT</span>
                  <span className="state-tag-recovered text-[10px] px-2.5 py-0.5 rounded-full font-bold">Active Playbook</span>
                </div>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Dispatches a personalized 1-click checkout recovery link via WhatsApp &amp; SMS with a 30-minute validity.
                </p>
                <div className="flex gap-4 text-[10px] text-[#666A6B] pt-1">
                  <span>Max Attempts: <strong className="text-[#111216]">1</strong></span>
                  <span>Link Expiry: <strong className="text-[#111216]">30 Mins</strong></span>
                  <span>Historical Yield: <strong className="text-[#168F5A]">76%</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-2 hover:border-[#111216] transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111216]">CARD_EXPIRY_NOTIFICATION</span>
                  <span className="state-tag-recovered text-[10px] px-2.5 py-0.5 rounded-full font-bold">Active Playbook</span>
                </div>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Sends automated pre-mandate update request and schedules off-peak retry for enterprise subscriptions.
                </p>
                <div className="flex gap-4 text-[10px] text-[#666A6B] pt-1">
                  <span>Max Attempts: <strong className="text-[#111216]">2</strong></span>
                  <span>Recovery Window: <strong className="text-[#111216]">72 Hours</strong></span>
                  <span>Historical Yield: <strong className="text-[#168F5A]">89%</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GUARDRAILS TAB */}
      {activeTab === 'guardrails' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 sm:p-7 bg-white border border-[#DCD8CF] space-y-4 shadow-editorial-card">
            <div className="pb-3 border-b border-[#DCD8CF]">
              <h3 className="text-sm font-bold text-[#111216] font-mono">Autonomous Action Safety Invariants</h3>
              <p className="text-xs text-[#666A6B] mt-0.5 font-sans">
                Deterministic business invariants evaluated prior to executing any financial recovery action.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-1.5">
                <span className="text-[#666A6B] text-[10px] uppercase block font-bold">Maximum Retry Limit</span>
                <strong className="text-xl text-[#111216] block font-serif">2 Attempts</strong>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Attempt 3 is unconditionally blocked to safeguard cardholder trust and prevent merchant dispute fees.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-1.5">
                <span className="text-[#666A6B] text-[10px] uppercase block font-bold">Human Approval Threshold</span>
                <strong className="text-xl text-[#C2410C] block font-serif">₹50,000 INR</strong>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Any transaction equal to or exceeding ₹50,000 is automatically routed to the Risk Lead Approval queue.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-1.5">
                <span className="text-[#666A6B] text-[10px] uppercase block font-bold">Recovery Window Deadline</span>
                <strong className="text-xl text-[#111216] block font-serif">24 Hours</strong>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Workflows older than 24 hours automatically expire to prevent stale bank settlement collisions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] space-y-1.5">
                <span className="text-[#666A6B] text-[10px] uppercase block font-bold">Idempotent Settlement Lock</span>
                <strong className="text-xl text-[#168F5A] block font-serif">Strictly Enforced</strong>
                <p className="text-[11px] text-[#666A6B] font-sans leading-relaxed">
                  Once a payment reaches RECOVERED status, any subsequent recovery attempt is permanently rejected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INTEGRATIONS TAB */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 sm:p-7 bg-white border border-[#DCD8CF] space-y-4 shadow-editorial-card">
            <div className="pb-3 border-b border-[#DCD8CF]">
              <h3 className="text-sm font-bold text-[#111216] font-mono">Connected Gateways &amp; Intelligence Providers</h3>
              <p className="text-xs text-[#666A6B] mt-0.5 font-sans">
                Payment webhooks, PSP settlement connections, and AI reasoning models.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#111216] block font-sans">Razorpay Payment Gateway API</strong>
                  <span className="text-[11px] text-[#666A6B]">Webhook Stream: Live &bull; MID_8849102</span>
                </div>
                <span className="state-tag-recovered text-[10px] px-2.5 py-1 rounded-full font-bold">Connected</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#111216] block font-sans">Gemini 1.5 Flash (AI Reasoning Engine)</strong>
                  <span className="text-[11px] text-[#666A6B]">Autonomous JSON diagnostic generation with deterministic fallback</span>
                </div>
                <span className="state-tag-recovered text-[10px] px-2.5 py-1 rounded-full font-bold">Operational</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E9] border border-[#DCD8CF] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#111216] block font-sans">SQLite Financial Ledger &amp; Audit Log</strong>
                  <span className="text-[11px] text-[#666A6B]">Database: reviveai.db &bull; Strict foreign key constraints</span>
                </div>
                <span className="state-tag-recovered text-[10px] px-2.5 py-1 rounded-full font-bold">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 sm:p-7 bg-white border border-[#DCD8CF] space-y-4 shadow-editorial-card">
            <div className="pb-3 border-b border-[#DCD8CF]">
              <h3 className="text-sm font-bold text-[#111216] font-mono">Merchant Account Profile</h3>
              <p className="text-xs text-[#666A6B] mt-0.5 font-sans">
                ReviveAI Platform profile and notification preferences.
              </p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#666A6B] text-[10px] uppercase font-bold block mb-1">Merchant Organization</label>
                  <input
                    type="text"
                    disabled
                    value="Bharat Commerce Technologies Pvt Ltd"
                    className="w-full px-3 py-2 bg-[#F4F1E9] border border-[#DCD8CF] rounded-lg text-[#111216]"
                  />
                </div>
                <div>
                  <label className="text-[#666A6B] text-[10px] uppercase font-bold block mb-1">Merchant ID</label>
                  <input
                    type="text"
                    disabled
                    value="MID_8849102"
                    className="w-full px-3 py-2 bg-[#F4F1E9] border border-[#DCD8CF] rounded-lg text-[#111216]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#666A6B] text-[10px] uppercase font-bold block mb-1">Settlement &amp; Dispute Notification Contact</label>
                <input
                  type="text"
                  disabled
                  value="finance-ops@bharatcommerce.in"
                  className="w-full px-3 py-2 bg-[#F4F1E9] border border-[#DCD8CF] rounded-lg text-[#111216]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
