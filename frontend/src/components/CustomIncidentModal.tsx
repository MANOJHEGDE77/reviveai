import React, { useState } from 'react';
import {
  X,
  Zap,
  Loader2,
  ShieldAlert,
  CreditCard,
  Building,
  Smartphone,
  Sparkles,
  HelpCircle,
  FileText,
  User,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import { apiClient, formatINR } from '../api/client';
import { Payment } from '../types';
import { InjectIncidentIcon } from './ActionIcons';

interface CustomIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

export const CustomIncidentModal: React.FC<CustomIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState<number>(18500);
  const [category, setCategory] = useState<string>('TEMPORARY_DECLINE');
  const [customReason, setCustomReason] = useState('');
  const [method, setMethod] = useState<string>('CARD');
  const [ltv, setLtv] = useState<number>(75000);
  const [pastTxns, setPastTxns] = useState<number>(6);
  const [autoExecute, setAutoExecute] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isHighValue = amount >= 50000;

  const templates = [
    {
      label: 'SaaS Mandate Lapse',
      name: 'CloudScale Technologies Pvt Ltd',
      email: 'finance@cloudscale.in',
      phone: '+91 98201 55432',
      amount: 68000,
      category: 'SUBSCRIPTION_DECLINE',
      method: 'NETBANKING',
      reason: 'Standing debit instruction not executed by issuing bank',
      ltv: 280000,
      pastTxns: 14
    },
    {
      label: 'E-Commerce 3DS Drop-off',
      name: 'Rahul Sharma',
      email: 'rahul.s@gmail.com',
      phone: '+91 99100 22334',
      amount: 4999,
      category: 'CHECKOUT_ABANDONED',
      method: 'CARD',
      reason: 'OTP entry timeout on bank 3D Secure redirect page',
      ltv: 24000,
      pastTxns: 4
    },
    {
      label: 'UPI Intent Gateway Spike',
      name: 'InstaCart Quick Orders',
      email: 'settlements@instacart.in',
      phone: '+91 98765 11223',
      amount: 14200,
      category: 'NETWORK_TIMEOUT',
      method: 'UPI',
      reason: 'PSP switch response delay exceeded 8000ms',
      ltv: 85000,
      pastTxns: 9
    }
  ];

  const applyTemplate = (t: typeof templates[0]) => {
    setCustomerName(t.name);
    setCustomerEmail(t.email);
    setCustomerPhone(t.phone);
    setAmount(t.amount);
    setCategory(t.category);
    setMethod(t.method);
    setCustomReason(t.reason);
    setLtv(t.ltv);
    setPastTxns(t.pastTxns);
  };

  const handleClear = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAmount(10000);
    setCustomReason('');
    setLtv(35000);
    setPastTxns(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiClient.createIncident({
        customer_name: customerName.trim() || 'Direct Merchant Customer',
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        amount: Number(amount),
        failure_category: category,
        failure_reason: customReason.trim() || undefined,
        payment_method_type: method,
        customer_ltv: Number(ltv),
        customer_successful_txns: Number(pastTxns),
        auto_execute: autoExecute,
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Failed to ingest custom incident:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-fintech-xl border border-[#E5E1D8] p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1EFEA] transition"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-3 border-b border-[#EAE6DD] flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-[#A7F3D0] shadow-fintech-xs shrink-0">
            <InjectIncidentIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] inline-flex items-center gap-1.5">
              <InjectIncidentIcon className="w-3 h-3" />
              REAL-WORLD INGESTION &bull; LIVE USER INPUT
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A] mt-1">
              Ingest Payment Failure Incident
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter your real customer order details, error reasons, and amounts to watch ReviveAI diagnose and evaluate recovery guardrails live.
            </p>
          </div>
        </div>

        {/* Quick Industry Templates */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold">
              Load Industry Template (Optional):
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] font-mono text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Clear to Blank
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            {templates.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(t)}
                className="p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] hover:border-[#0F172A] hover:bg-white text-left transition flex flex-col justify-between"
              >
                <strong className="text-[11px] text-[#0F172A] block font-sans">{t.label}</strong>
                <span className="text-[10px] text-[#059669] font-bold mt-1">₹{(t.amount).toLocaleString('en-IN')} &bull; {t.method}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Row 1: Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#475569] font-medium mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-[#64748B]" />
                Customer / Business Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Swiggy Pro / Acme Corp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-sans"
              />
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Customer Email (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="finance@company.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-sans"
              />
            </div>
          </div>

          {/* Row 2: Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#475569] font-medium mb-1 flex items-center justify-between">
                <span>Transaction Amount (INR)</span>
                <span className="text-[11px] font-bold text-[#0F172A]">{formatINR(amount)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#64748B] font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-bold text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Payment Rail / Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-medium"
              >
                <option value="CARD">Credit / Debit Card</option>
                <option value="UPI">UPI Intent / Collect</option>
                <option value="NETBANKING">NetBanking (Corporate / Retail)</option>
                <option value="MANDATE">Recurring Mandate (eNACH)</option>
                <option value="WALLET">Prepaid Wallet</option>
              </select>
            </div>
          </div>

          {/* High-Value Guardrail Callout */}
          {isHighValue ? (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[11px] text-[#92400E] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <strong>High-Value Governance Threshold Triggered (&ge; ₹50,000):</strong>
                <p className="mt-0.5 font-sans">
                  Deterministic guardrails will block autonomous retries and automatically escalate this payment to the Human Governance Queue (/approvals) for risk operator sign-off.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[11px] text-[#065F46] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>Standard Tier (&lt; ₹50,000): Autonomous AI recovery engine will execute calibrated cooldown playbooks automatically.</span>
            </div>
          )}

          {/* Row 3: Failure Category & Error Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Failure Category Signature
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A]"
              >
                <option value="TEMPORARY_DECLINE">Temporary Switch Decline (Bank throttling)</option>
                <option value="CHECKOUT_ABANDONED">Checkout Drop-off (3DS Page Abandonment)</option>
                <option value="SUBSCRIPTION_DECLINE">Subscription Mandate Debit Lapsed</option>
                <option value="NETWORK_TIMEOUT">HTTP 504 Gateway / UPI PSP Timeout</option>
                <option value="REPEAT_DECLINE">Repeat Consecutive Gateway Declines</option>
                <option value="OVERDUE_INVOICE">Overdue B2B Purchase Order Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Custom Bank / Gateway Error Reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Issuer switch rate limit (Code 91)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD8CC] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F172A] text-[#0F172A] font-sans"
              />
            </div>
          </div>

          {/* Row 4: Customer History Context (For AI Reasoning Formula) */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-2">
            <span className="text-[10px] text-[#64748B] font-bold uppercase block">
              Customer Loyalty Signals (Feeds AI Diagnosis Weighting):
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#475569] text-[11px] mb-1">
                  Customer Lifetime Value (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={ltv}
                  onChange={(e) => setLtv(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DDD8CC] bg-white text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-[#475569] text-[11px] mb-1">
                  Past Settled Transactions
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pastTxns}
                  onChange={(e) => setPastTxns(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DDD8CC] bg-white text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-[#EAE6DD]">
            <label className="flex items-center gap-2 cursor-pointer text-[#475569] text-[11px]">
              <input
                type="checkbox"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
                className="rounded border-[#DDD8CC] text-[#0F172A] focus:ring-[#0F172A]"
              />
              <span>Trigger autonomous recovery loop</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DDD8CC] bg-white hover:bg-[#FAF8F5] text-[#475569] transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-white bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 transition flex items-center gap-2 font-semibold shadow-fintech-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#34D399]" />
                    <span>Ingesting &amp; Diagnosing...</span>
                  </>
                ) : (
                  <>
                    <InjectIncidentIcon className="w-3.5 h-3.5" />
                    <span>Ingest Real Incident</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
