import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  onOpenModal, 
  className = '',
  variant = 'compact'
}) => {
  const { isInstallable, isInstalled } = usePWAInstall();

  // If already running in standalone installed mode, don't clutter the UI
  if (isInstalled) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={onOpenModal}
        title="نصب نسخه موبایل (اندروید / iOS)"
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm
          bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 
          text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60
          hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="hidden sm:inline">نصب اپلیکیشن</span>
        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-bold">اندروید</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenModal}
      className={`flex items-center justify-between p-3 rounded-2xl bg-gradient-to-l from-indigo-50 to-emerald-50 dark:from-zinc-800 dark:to-zinc-800/80 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 transition-all ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="text-right">
          <p className="font-bold text-xs text-zinc-900 dark:text-white">نصب روی موبایل (اندروید)</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">اجرای تمام‌صفحه و دسترسی آفلاین</p>
        </div>
      </div>
      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    </button>
  );
};
