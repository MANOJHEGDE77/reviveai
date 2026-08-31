import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  subMessage?: string;
  onClose?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  subMessage,
  onClose,
  duration = 4500,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0 || !onClose) return;

    const interval = 20;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-white/95 border-[#A7F3D0] shadow-fintech-lg text-[#0F172A]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />,
          progress: 'bg-[#10B981]',
        };
      case 'warning':
        return {
          card: 'bg-white/95 border-[#FDE68A] shadow-fintech-lg text-[#0F172A]',
          icon: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
          progress: 'bg-[#F59E0B]',
        };
      case 'error':
        return {
          card: 'bg-white/95 border-[#FECACA] shadow-fintech-lg text-[#0F172A]',
          icon: <XCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
          progress: 'bg-[#EF4444]',
        };
      default:
        return {
          card: 'bg-white/95 border-[#BFDBFE] shadow-fintech-lg text-[#0F172A]',
          icon: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
          progress: 'bg-[#3B82F6]',
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`p-4 rounded-xl border backdrop-blur-md overflow-hidden relative flex items-start gap-3 max-w-sm sm:max-w-md ${style.card}`}>
        {style.icon}
        <div className="flex-1 text-xs pr-2">
          <p className="font-bold text-[#0F172A] tracking-tight">{message}</p>
          {subMessage && <p className="text-[#64748B] mt-0.5 font-sans leading-relaxed">{subMessage}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1EFEA] transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E2E8F0]">
          <div
            className={`h-full transition-all ease-linear ${style.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
