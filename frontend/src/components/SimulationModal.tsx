import React, { useState } from 'react';
import {
  X,
  Zap,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  CreditCard,
  Building,
  Smartphone
} from 'lucide-react';
import { apiClient, formatINR } from '../api/client';
import { Payment } from '../types';
import { SimulateFailureIcon } from './ActionIcons';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('Swiggy Cloud Kitchen Partner');
  const [amount, setAmount] = useState<number>(24900);
  const [category, setCategory] = useState<string>('TEMPORARY_DECLINE');
  const [method, setMethod] = useState<string>('CARD');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { label: 'Card Switch Throttle (₹24.9K)', category: 'TEMPORARY_DECLINE', amount: 24900, method: 'CARD' },
    { label: 'Mandate Failure (₹1.25L)', category: 'SUBSCRIPTION_DECLINE', amount: 125000, method: 'NETBANKING' },
    { label: 'Checkout Drop-off (₹74K)', category: 'CHECKOUT_ABANDONED', amount: 74000, method: 'CARD' },
    { label: 'UPI PSP Timeout (₹12.5K)', category: 'NETWORK_TIMEOUT', amount: 12500, method: 'UPI' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiClient.triggerSimulation({
        customer_name: customerName,
        amount: Number(amount),
        failure_category: category,
        payment_method_type: method,
        auto_execute: true,
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Failed to trigger simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E1D8] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-fintech-xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1EFEA] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-3 border-b border-[#EAE6DD] flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] shadow-fintech-xs shrink-0">
            <SimulateFailureIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
              SIMULATION LAB &bull; INJECT PAYLOAD
            </span>
            <h2 className="text-lg font-bold text-[#0F172A] mt-1">
              Simulate Payment Failure Event
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Injects a synthetic payment decline webhook into the live ReviveAI closed-loop pipeline.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold">1-Click Presets:</span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCategory(p.category);
                  setAmount(p.amount);
                  setMethod(p.method);
                }}
                className="p-2 text-left rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] hover:border-[#0F172A] hover:bg-white transition text-[#334155]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-[#475569] block mb-1 font-bold">Customer / Merchant Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] focus:outline-hidden focus:border-[#0F172A]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[#475569] font-bold">Transaction Value (INR)</label>
              <span className="text-xs font-bold text-[#0F172A]">{formatINR(amount)}</span>
            </div>
            <input
              type="number"
              required
              min={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] focus:outline-hidden focus:border-[#0F172A] font-bold"
            />
            {amount >= 50000 && (
              <p className="text-[11px] text-[#D97706] mt-1 font-sans">
                ⚠ Amount &ge; ₹50,000 mandates Human Approval via /approvals.
              </p>
            )}
          </div>

          <div>
            <label className="text-[#475569] block mb-1 font-bold">Failure Signature Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] focus:outline-hidden focus:border-[#0F172A]"
            >
              <option value="TEMPORARY_DECLINE">TEMPORARY_DECLINE (Bank Switch Throttle)</option>
              <option value="CHECKOUT_ABANDONED">CHECKOUT_ABANDONED (Cart drop-off)</option>
              <option value="SUBSCRIPTION_DECLINE">SUBSCRIPTION_DECLINE (Mandate failure)</option>
              <option value="NETWORK_TIMEOUT">NETWORK_TIMEOUT (UPI Gateway 504)</option>
              <option value="OVERDUE_INVOICE">OVERDUE_INVOICE (B2B Net-30)</option>
            </select>
          </div>

          <div>
            <label className="text-[#475569] block mb-1 font-bold">Payment Rail</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#DDD8CC] rounded-lg text-[#0F172A] focus:outline-hidden focus:border-[#0F172A]"
            >
              <option value="CARD">Credit/Debit Card (•••• 4821)</option>
              <option value="UPI">UPI Intent (merchant@okhdfc)</option>
              <option value="NETBANKING">NetBanking Corporate</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#EAE6DD]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 transition shadow-fintech-sm flex items-center gap-2 group"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SimulateFailureIcon className="w-3.5 h-3.5" />}
              <span>Simulate Incident</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
