import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { LiveAiOperation } from '../types';

interface LiveAiOperationsProps {
  operations: LiveAiOperation[];
}

export const LiveAiOperations: React.FC<LiveAiOperationsProps> = ({ operations }) => {
  const navigate = useNavigate();

  return (
    <div className="editorial-surface rounded-2xl p-6 sm:p-7 bg-white shadow-fintech-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DD]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              AI OPERATIONS STREAM
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Live operational event stream</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        </div>

        <div className="space-y-2.5 pt-4">
          {operations.length === 0 ? (
            <p className="text-xs text-[#64748B] font-mono py-8 text-center">
              No live operations recorded yet.
            </p>
          ) : (
            operations.map((op) => (
              <div
                key={op.id}
                onClick={() => navigate('/investigations')}
                className="p-3.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] hover:bg-white hover:border-[#0F172A] transition cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                  <span>{op.timestamp}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full border ${
                      op.stage === 'RESOLVED'
                        ? 'state-tag-recovered'
                        : op.stage === 'EXECUTING'
                        ? 'state-tag-investigating'
                        : 'state-tag-neutral'
                    }`}
                  >
                    ● {op.stage}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition leading-snug">
                  {op.message}
                </p>
                {op.sub_message && (
                  <p className="text-[11px] text-[#64748B] font-mono">
                    {op.sub_message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#EAE6DD] flex items-center justify-between text-xs font-mono">
        <span className="text-[#94A3B8]">
          Recorded to immutable ledger.
        </span>
        <button
          onClick={() => navigate('/audit')}
          className="font-bold text-[#0F172A] hover:text-[#059669] flex items-center gap-1 transition"
        >
          <span>Full Audit Trail</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
