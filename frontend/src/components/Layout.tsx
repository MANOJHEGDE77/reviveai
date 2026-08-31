import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Zap,
  ShieldCheck,
  Search,
  Sliders,
  Sparkles,
  ChevronDown,
  Layers,
  Settings,
  Flame,
  ArrowRight,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { SimulationModal } from './SimulationModal';
import { Toast, ToastProps } from './Toast';
import { apiClient } from '../api/client';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [configMenuOpen, setConfigMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 5 Primary Navigation Items
  const primaryNav = [
    { to: '/journey', label: 'Revenue Journey' },
    { to: '/investigations', label: 'Investigations' },
    { to: '/recovery', label: 'Recovery' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/audit', label: 'Audit Trail' },
  ];

  const handleReset = async () => {
    try {
      setResetting(true);
      await apiClient.resetDatabase();
      setToast({
        type: 'success',
        message: 'Platform State Reset',
        subMessage: 'Restored realistic baseline merchant revenue risk dataset.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Reset Failed',
        subMessage: 'Could not reset database state.',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/investigations?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#FAF8F5] text-[#0F172A] font-sans selection:bg-[#E2DDD3] selection:text-[#0F172A]">
      {/* 1. Header with 5 Primary Nav Items + Secondary Tools & Config */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Primary 5 Items */}
        <div className="flex items-center gap-6 lg:gap-8">
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-mono font-black text-sm shadow-fintech-xs group-hover:bg-[#1E293B] transition">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-extrabold tracking-tight text-[#0F172A] leading-none">
                REVIVEAI
              </span>
              <span className="text-[9px] font-mono text-[#059669] tracking-wide mt-0.5 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                AUTONOMOUS V2.0
              </span>
            </div>
          </NavLink>

          {/* 5 Primary Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium font-mono">
            {primaryNav.map((item) => {
              const isActive =
                item.to === '/journey'
                  ? location.pathname === '/journey' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to) || (item.to === '/investigations' && location.pathname.startsWith('/incidents'));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
                    isActive
                      ? 'bg-[#EAE5DA] text-[#0F172A] font-bold shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1EFEA]'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Center: Global Search */}
        <form onSubmit={handleGlobalSearch} className="hidden lg:flex items-center flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payments, customers, reasons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#DDD8CC] hover:border-[#CEC8BB] focus:border-[#0F172A] focus:outline-hidden rounded-lg text-xs font-mono text-[#0F172A] transition placeholder:text-[#94A3B8]"
          />
          <span className="absolute right-2.5 text-[9px] font-mono text-[#94A3B8] border border-[#E2E8F0] px-1 py-0.5 rounded bg-[#FAF8F5]">
            /
          </span>
        </form>

        {/* Right: Secondary Tools, Config & Simulation */}
        <div className="flex items-center gap-2.5">
          {/* Tools: Simulation Lab */}
          <NavLink
            to="/simulation"
            className={({ isActive }) =>
              `hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                isActive
                  ? 'bg-[#EAE5DA] text-[#0F172A] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1EFEA]'
              }`
            }
          >
            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Simulation Lab</span>
          </NavLink>

          {/* Configuration Dropdown */}
          <div className="relative">
            <button
              onClick={() => setConfigMenuOpen(!configMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1EFEA] border border-[#DDD8CC] transition"
            >
              <Sliders className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">Config</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>

            {configMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white border border-[#E5E1D8] rounded-xl shadow-fintech-lg py-1.5 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setConfigMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase text-[#94A3B8] font-bold border-b border-[#F1EFEA]">
                  System Controls
                </div>
                <NavLink
                  to="/settings?tab=strategies"
                  className="block px-3 py-2 text-[#334155] hover:bg-[#FAF8F5] hover:text-[#0F172A]"
                >
                  Strategies &amp; Playbooks
                </NavLink>
                <NavLink
                  to="/settings?tab=guardrails"
                  className="block px-3 py-2 text-[#334155] hover:bg-[#FAF8F5] hover:text-[#0F172A]"
                >
                  Deterministic Guardrails
                </NavLink>
                <NavLink
                  to="/settings?tab=integrations"
                  className="block px-3 py-2 text-[#334155] hover:bg-[#FAF8F5] hover:text-[#0F172A]"
                >
                  Gateway &amp; Webhooks
                </NavLink>
                <NavLink
                  to="/settings?tab=settings"
                  className="block px-3 py-2 text-[#334155] hover:bg-[#FAF8F5] hover:text-[#0F172A]"
                >
                  Merchant Organization
                </NavLink>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1EFEA] border border-[#DDD8CC] transition"
            title="Reset to clean baseline dataset"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-[#059669]' : ''}`} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setSimModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] shadow-fintech-sm transition active:scale-95 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-current" />
            <span>Simulate Failure</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-[#DDD8CC] text-[#64748B] hover:text-[#0F172A]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E1D8] px-4 py-3 space-y-2 font-mono text-xs shadow-fintech-md animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleGlobalSearch} className="mb-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD8CC] rounded-lg text-xs"
            />
          </form>
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-[#334155] hover:bg-[#FAF8F5] font-medium"
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/simulation"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-[#D97706] hover:bg-[#FAF8F5] font-medium"
          >
            ⚡ Simulation Lab
          </NavLink>
        </div>
      )}

      {/* 2. Main Canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E1D8] bg-[#FAF8F5] py-6 px-6 text-center text-xs text-[#64748B] font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-serif-heading italic text-sm text-[#475569]">
            "Every failed payment creates a decision. ReviveAI makes that decision before the revenue disappears."
          </span>
          <span className="text-[11px] text-[#94A3B8]">
            Razorpay AI Buildathon &bull; Track 3: AI Revenue Recovery
          </span>
        </div>
      </footer>

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        onSuccess={(payment) => {
          setToast({
            type: 'success',
            message: `Payment Incident ${payment.payment_ref} Ingested`,
            subMessage: `Autonomous workflow initiated (${payment.ai_recommendation || 'DELAYED_RETRY'}).`,
          });
          navigate(`/investigations/${payment.id}`);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          subMessage={toast.subMessage}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
