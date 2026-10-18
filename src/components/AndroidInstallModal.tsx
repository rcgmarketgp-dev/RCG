import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Share2, 
  MoreVertical, 
  PlusSquare, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">نصب برنامه روی گوشی موبایل</h2>
              <p className="text-xs text-indigo-200">نصب نسخه وب‌اپلیکیشن پیشرونده (PWA) روی اندروید و آیفون</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Selection Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'android'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            گوشی‌های اندروید (Android)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            آیفون و آیپد (iOS)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-zinc-800 dark:text-zinc-200 text-sm">
          
          {/* Status banner */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">برنامه در دستگاه شما نصب شده است</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">شما هم‌اکنون در حالت نرم‌افزار تمام‌صفحه مستقل هستید.</p>
              </div>
            </div>
          ) : installSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">نصب با موفقیت انجام شد!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">آیکون سامانه به صفحه اصلی موبایل شما اضافه گردید.</p>
              </div>
            </div>
          ) : isInstallable ? (
            /* Direct 1-Tap Install Button */
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50 dark:from-indigo-950/30 dark:to-zinc-800/80 border border-indigo-200 dark:border-indigo-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-right">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Download className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">نصب فوری ۱-کلیک</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">مرورگر شما آماده نصب خودکار اپلیکیشن است.</p>
                </div>
              </div>
              <button
                onClick={handleDirectInstall}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                نصب مستقیم روی گوشی
              </button>
            </div>
          ) : null}

          {/* Android Steps */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                مراحل نصب در مرورگر گوگل کروم یا سامسونگ اینترنت (اندروید):
              </h3>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ۱
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">باز کردن منوی مرورگر کروم</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      روی آیکون سه نقطه
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[11px] font-bold">
                        <MoreVertical className="w-3.5 h-3.5" /> ⋮
                      </span>
                      در بالا یا پایین مرورگر کلیک کنید.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ۲
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">انتخاب گزینه نصب برنامه</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      روی گزینه
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        <Download className="w-3 h-3" /> «نصب برنامه» یا «افزودن به صفحه اصلی» (Install app / Add to Home screen)
                      </span>
                      بزنید.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ۳
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">تایید و شروع استفاده</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      دکمه «نصب» (Install) را تایید کنید. آیکون برنامه در منوی برنامه‌های موبایل و صفحه خانگی قرار می‌گیرد و مشابه یک نرم‌افزار نیتیو بدون کادر مرورگر اجرا خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Steps */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                مراحل نصب در مرورگر سافاری (Safari در آیفون و آیپد):
              </h3>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ۱
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">لمس دکمه اشتراک‌گذاری (Share)</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      در نوار پایین یا بالای مرورگر Safari روی دکمه
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs font-bold">
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </span>
                      بزنید.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ۲
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">انتخاب Add to Home Screen</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      کمی به پایین اسکرول کرده و روی گزینه
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-xs">
                        <PlusSquare className="w-3 h-3" /> «Add to Home Screen» (افزودن به صفحه اصلی)
                      </span>
                      بزنید.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ۳
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">زدن گزینه Add در بالا</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      در گوشه بالا روی «Add» بزنید. برنامه با آیکون اختصاصی و به صورت تمام‌صفحه ذخیره می‌شود.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Grid */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3">مزایای نصب نسخه موبایل:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex flex-col items-center gap-1.5">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-[11px] font-bold">سرعت بالا و روان</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex flex-col items-center gap-1.5">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span className="text-[11px] font-bold">اجرای تمام‌صفحه</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex flex-col items-center gap-1.5">
                <WifiOff className="w-5 h-5 text-emerald-500" />
                <span className="text-[11px] font-bold">دسترسی آفلاین</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span className="text-[11px] font-bold">امن و بدون اشغال حافظه</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            نسخه پیشرفته وب‌اپلیکیشن (PWA)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
