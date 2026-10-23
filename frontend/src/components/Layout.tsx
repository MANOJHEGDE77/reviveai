import React, { useState, useEffect } from 'react';
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
import { CustomIncidentModal } from './CustomIncidentModal';
import { Toast, ToastProps } from './Toast';
import { BrandLogo } from './BrandLogo';
import { SimulateFailureIcon, InjectIncidentIcon } from './ActionIcons';
import { apiClient } from '../api/client';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [configMenuOpen, setConfigMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<'VIEWER' | 'OPERATOR' | 'RISK_LEAD' | 'ADMIN'>(
    () => (localStorage.getItem('reviveai_role') as any) || 'RISK_LEAD'
  );
  const [operatorName, setOperatorName] = useState('Aditi Rao');

  useEffect(() => {
    // Sync current operator from server
    apiClient.getCurrentOperator().then((res) => {
      if (res?.operator) {
        setCurrentRole(res.operator.role);
        setOperatorName(res.operator.name);
      }
    }).catch(() => {
      // Offline fallback
    });
  }, []);

  const handleRoleChange = async (newRole: 'VIEWER' | 'OPERATOR' | 'RISK_LEAD' | 'ADMIN') => {
    try {
      const res = await apiClient.switchRole(newRole);
      setCurrentRole(newRole);
      setOperatorName(res.operator.name);
      setRoleMenuOpen(false);
      setToast({
        type: 'success',
        message: `Identity Switched: ${newRole}`,
        subMessage: `Now acting as ${res.operator.name} with verified server JWT token.`,
      });
      setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      setToast({
        type: 'error',
        message: 'Role Switch Failed',
        subMessage: 'Could not switch operator role.',
      });
    }
  };

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
    <div className="min-h-screen w-screen flex flex-col bg-[#F4F1E9] text-[#111216] font-sans selection:bg-[#E2DDD3] selection:text-[#111216]">
      {/* 1. Header with 5 Primary Nav Items + Secondary Tools & Config */}
      <header className="sticky top-0 z-40 bg-[#F4F1E9]/95 backdrop-blur-md border-b border-[#DCD8CF] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Primary 5 Items */}
        <div className="flex items-center gap-6 lg:gap-8">
          <NavLink to="/" className="shrink-0 transition hover:opacity-90">
            <BrandLogo size="sm" subtitleText="AUTONOMOUS REVENUE RECOVERY" />
          </NavLink>

          {/* 5 Primary Navigation Items */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium font-mono">
            {primaryNav.map((item) => {
              const isActive =
                item.to === '/journey'
                  ? location.pathname === '/journey' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to) || (item.to === '/investigations' && location.pathname.startsWith('/incidents'));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#111216] font-bold border border-[#DCD8CF] shadow-xs'
                      : 'text-[#666A6B] hover:text-[#111216] hover:bg-[#EDE9E0]'
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
          <Search className="w-3.5 h-3.5 text-[#888B8C] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payments, customers, reasons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#DCD8CF] hover:border-[#B4AEA0] focus:border-[#111216] focus:outline-hidden rounded-lg text-xs font-mono text-[#111216] transition placeholder:text-[#888B8C]"
          />
          <span className="absolute right-2.5 text-[9px] font-mono text-[#888B8C] border border-[#DCD8CF] px-1 py-0.5 rounded bg-[#F4F1E9]">
            /
          </span>
        </form>

        {/* Right: Secondary Tools, Ingest Action & Simulation */}
        <div className="flex items-center gap-2.5">
          {/* Quick Real Incident Ingestion Button */}
          <button
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-[#111216] hover:bg-[#23262D] shadow-fintech-xs transition group"
          >
            <InjectIncidentIcon className="w-3.5 h-3.5 text-[#168F5A]" />
            <span>+ Ingest Incident</span>
          </button>

          {/* Tools: Simulation Lab */}
          <NavLink
            to="/simulation"
            className={({ isActive }) =>
              `hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                isActive
                  ? 'bg-white text-[#111216] font-bold border border-[#DCD8CF] shadow-xs'
                  : 'text-[#666A6B] hover:text-[#111216] hover:bg-[#EDE9E0]'
              }`
            }
          >
            <Zap className="w-3.5 h-3.5 text-[#168F5A]" />
            <span>Simulation Lab</span>
          </NavLink>

          {/* Operator RBAC Identity & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#111216] bg-white hover:bg-[#EDE9E0] border border-[#DCD8CF] transition shadow-xs"
              title="Authenticated Operator Role & Identity"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#168F5A]" />
              <span className="font-bold text-[11px] text-[#168F5A]">{currentRole}</span>
              <span className="hidden md:inline text-[11px] text-[#666A6B]">&bull; {operatorName.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-[#888B8C]" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border border-[#DCD8CF] rounded-xl shadow-editorial-panel py-2 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-1 text-[10px] uppercase text-[#666A6B] font-bold border-b border-[#EDE9E0]">
                  Switch Operator Identity (RBAC)
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleRoleChange('RISK_LEAD')}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-[#F4F1E9] transition ${
                      currentRole === 'RISK_LEAD' ? 'bg-[#F4F1E9] font-bold text-[#168F5A]' : 'text-[#111216]'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>Aditi Rao (Risk Lead)</span>
                      {currentRole === 'RISK_LEAD' && <span className="text-[10px] text-[#168F5A] font-bold">Active</span>}
                    </span>
                    <span className="text-[10px] text-[#666A6B] font-sans">Full sign-off on approvals &gt; ₹50K &amp; recovery</span>
                  </button>

                  <button
                    onClick={() => handleRoleChange('OPERATOR')}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-[#F4F1E9] transition ${
                      currentRole === 'OPERATOR' ? 'bg-[#F4F1E9] font-bold text-[#168F5A]' : 'text-[#111216]'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>Vikram Seth (Operator)</span>
                      {currentRole === 'OPERATOR' && <span className="text-[10px] text-[#168F5A] font-bold">Active</span>}
                    </span>
                    <span className="text-[10px] text-[#666A6B] font-sans">Execute workflows &amp; trigger investigations</span>
                  </button>

                  <button
                    onClick={() => handleRoleChange('VIEWER')}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-[#F4F1E9] transition ${
                      currentRole === 'VIEWER' ? 'bg-[#F4F1E9] font-bold text-[#168F5A]' : 'text-[#111216]'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>Pooja Nair (Viewer)</span>
                      {currentRole === 'VIEWER' && <span className="text-[10px] text-[#168F5A] font-bold">Active</span>}
                    </span>
                    <span className="text-[10px] text-[#666A6B] font-sans">Read-only audit &amp; compliance inspector</span>
                  </button>

                  <button
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-[#F4F1E9] transition ${
                      currentRole === 'ADMIN' ? 'bg-[#F4F1E9] font-bold text-[#168F5A]' : 'text-[#111216]'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>Karan Mehra (Admin)</span>
                      {currentRole === 'ADMIN' && <span className="text-[10px] text-[#168F5A] font-bold">Active</span>}
                    </span>
                    <span className="text-[10px] text-[#666A6B] font-sans">System reset &amp; security governance</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Dropdown */}
          <div className="relative">
            <button
              onClick={() => setConfigMenuOpen(!configMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#666A6B] hover:text-[#111216] hover:bg-[#EDE9E0] border border-[#DCD8CF] transition"
            >
              <Sliders className="w-3.5 h-3.5 text-[#666A6B]" />
              <span className="hidden sm:inline">Config</span>
              <ChevronDown className="w-3 h-3 text-[#888B8C]" />
            </button>

            {configMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white border border-[#DCD8CF] rounded-xl shadow-editorial-panel py-1.5 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setConfigMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase text-[#666A6B] font-bold border-b border-[#EDE9E0]">
                  System Controls
                </div>
                <NavLink
                  to="/settings?tab=strategies"
                  className="block px-3 py-2 text-[#111216] hover:bg-[#F4F1E9]"
                >
                  Strategies &amp; Playbooks
                </NavLink>
                <NavLink
                  to="/settings?tab=guardrails"
                  className="block px-3 py-2 text-[#111216] hover:bg-[#F4F1E9]"
                >
                  Deterministic Guardrails
                </NavLink>
                <NavLink
                  to="/settings?tab=integrations"
                  className="block px-3 py-2 text-[#111216] hover:bg-[#F4F1E9]"
                >
                  Gateway &amp; Webhooks
                </NavLink>
                <NavLink
                  to="/settings?tab=settings"
                  className="block px-3 py-2 text-[#111216] hover:bg-[#F4F1E9]"
                >
                  Merchant Organization
                </NavLink>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#666A6B] hover:text-[#111216] hover:bg-[#EDE9E0] border border-[#DCD8CF] transition"
            title="Reset to clean baseline dataset"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-[#168F5A]' : ''}`} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setSimModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-[#111216] hover:bg-[#23262D] shadow-fintech-sm transition active:scale-95 shrink-0 group"
          >
            <SimulateFailureIcon className="w-3.5 h-3.5 text-[#168F5A]" />
            <span>Simulate Failure</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-[#DCD8CF] text-[#666A6B] hover:text-[#111216]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#DCD8CF] px-4 py-3 space-y-2 font-mono text-xs shadow-editorial-panel animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleGlobalSearch} className="mb-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F1E9] border border-[#DCD8CF] rounded-lg text-xs"
            />
          </form>
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-[#111216] hover:bg-[#F4F1E9] font-medium"
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/simulation"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-[#168F5A] hover:bg-[#F4F1E9] font-medium"
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
      <footer className="border-t border-[#DCD8CF] bg-[#F4F1E9] py-6 px-6 text-center text-xs text-[#666A6B] font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium text-sm text-[#111216]">
            "AI recommends the action. Deterministic rules enforce the guardrails. Every recovery is traceable."
          </span>
          <span className="text-[11px] text-[#888B8C]">
            ReviveAI Sovereign Financial Intelligence &bull; Production Platform
          </span>
        </div>
      </footer>

      {/* Custom Real Incident Ingestion Modal */}
      <CustomIncidentModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSuccess={(payment) => {
          setToast({
            type: 'success',
            message: `Custom Incident Ingested: ${payment.payment_ref}`,
            subMessage: `AI evaluated ${payment.customer?.name || 'Customer'} (₹${payment.amount.toLocaleString('en-IN')}) -> ${payment.ai_recommendation || 'DELAYED_RETRY'}`,
          });
          navigate(`/investigations/${payment.id}`);
        }}
      />

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
