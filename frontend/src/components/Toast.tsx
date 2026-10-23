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
          card: 'bg-white border-[#B9E2CD] shadow-editorial-panel text-[#111216]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#168F5A] shrink-0" />,
          progress: 'bg-[#168F5A]',
        };
      case 'warning':
        return {
          card: 'bg-white border-[#FDE68A] shadow-editorial-panel text-[#111216]',
          icon: <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0" />,
          progress: 'bg-[#B45309]',
        };
      case 'error':
        return {
          card: 'bg-white border-[#FECACA] shadow-editorial-panel text-[#111216]',
          icon: <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />,
          progress: 'bg-[#B91C1C]',
        };
      default:
        return {
          card: 'bg-white border-[#DCD8CF] shadow-editorial-panel text-[#111216]',
          icon: <Info className="w-5 h-5 text-[#1D4ED8] shrink-0" />,
          progress: 'bg-[#1D4ED8]',
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className={`p-4 rounded-xl border overflow-hidden relative flex items-start gap-3 max-w-sm sm:max-w-md ${style.card}`}>
        {style.icon}
        <div className="flex-1 text-xs pr-2 font-mono">
          <p className="font-bold text-[#111216] tracking-tight">{message}</p>
          {subMessage && <p className="text-[#666A6B] mt-0.5 font-sans leading-relaxed">{subMessage}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#888B8C] hover:text-[#111216] hover:bg-[#F4F1E9] transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EDE9E0]">
          <div
            className={`h-full transition-all ease-linear ${style.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
