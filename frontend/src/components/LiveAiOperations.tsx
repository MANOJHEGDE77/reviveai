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
    <div className="rounded-2xl p-6 sm:p-7 bg-white border border-[#DCD8CF] shadow-editorial-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#DCD8CF]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#666A6B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#168F5A]" />
              AI OPERATIONS STREAM
            </h3>
            <p className="text-xs text-[#666A6B] mt-0.5">Live operational event stream</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#168F5A] animate-pulse" />
        </div>

        <div className="space-y-2.5 pt-4">
          {operations.length === 0 ? (
            <p className="text-xs text-[#666A6B] font-mono py-8 text-center">
              No live operations recorded yet.
            </p>
          ) : (
            operations.map((op) => (
              <div
                key={op.id}
                onClick={() => navigate('/investigations')}
                className="p-3.5 rounded-xl border border-[#DCD8CF] bg-[#F4F1E9] hover:bg-white hover:border-[#111216] transition cursor-pointer space-y-1 group shadow-xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#666A6B]">
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
                <p className="text-xs font-bold text-[#111216] group-hover:text-[#168F5A] transition leading-snug">
                  {op.message}
                </p>
                {op.sub_message && (
                  <p className="text-[11px] text-[#666A6B] font-mono">
                    {op.sub_message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#DCD8CF] flex items-center justify-between text-xs font-mono">
        <span className="text-[#666A6B]">
          Recorded to immutable ledger.
        </span>
        <button
          onClick={() => navigate('/audit')}
          className="font-bold text-[#111216] hover:text-[#168F5A] flex items-center gap-1 transition"
        >
          <span>Full Audit Trail</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
