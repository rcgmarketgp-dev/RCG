import React, { useState, useEffect } from 'react';
import { DeviceItem, AISpellingResult } from '../types/device';
import { checkAndFixSpellingWithAI } from '../lib/aiClient';
import { 
  Wand2, 
  X, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface AIFixSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceItem | null;
  onApplyCorrections: (updatedDevice: DeviceItem) => void;
}

export const AIFixSpellModal: React.FC<AIFixSpellModalProps> = ({
  isOpen,
  onClose,
  device,
  onApplyCorrections,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISpellingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen && device) {
      setApplied(false);
      handleCheck();
    }
  }, [isOpen, device?.id]);

  if (!isOpen || !device) return null;

  const handleCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await checkAndFixSpellingWithAI(device);
      setResult(res);
    } catch (err: any) {
      console.error('Spelling check error:', err);
      setError(err.message || 'خطا در ارتباط با هوش مصنوعی برای ویرایش متن.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result || !device) return;

    const updated: DeviceItem = {
      ...device,
      name: result.name || device.name,
      model: result.model || device.model,
      category: result.category || device.category,
      specsText: result.specsText || device.specsText,
      notes: result.notes || device.notes,
      updatedAt: new Date().toISOString(),
    };

    onApplyCorrections(updated);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                ویراستار و اصلاح هوشمند اطلاعات با AI
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                بررسی غلط‌های املایی، نام برندهای صنعتی و نگارش استاندارد فارسی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center mb-3 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                هوش مصنوعی در حال تحلیل متن و مشخصات فنی دستگاه...
              </h4>
              <p className="text-xs text-zinc-400">
                بررسی املای اصطلاحات فنی، استانداردهای صنعتی و نیم‌فاصله‌ها
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs text-center">
              {error}
              <div className="mt-3">
                <button
                  onClick={handleCheck}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-medium"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Corrections Summary Badges */}
              {result.corrections && result.corrections.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>موارد اصلاح‌شده ({result.corrections.length} مورد):</span>
                  </h4>
                  <div className="space-y-1.5">
                    {result.corrections.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-center gap-2 bg-white/80 dark:bg-zinc-800/80 p-2 rounded-xl"
                      >
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                          {item.field}:
                        </span>
                        <span className="line-through text-red-500 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded-md">
                          {item.original}
                        </span>
                        <ArrowLeft className="w-3 h-3 text-zinc-400" />
                        <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">
                          {item.corrected}
                        </span>
                        {item.reason && (
                          <span className="text-[11px] text-zinc-400 mr-auto">({item.reason})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>متن دستگاه شما از لحاظ املایی و نگارش صنعتی کاملاً صحیح و استاندارد است!</span>
                </div>
              )}

              {/* Before & After Comparison Cards */}
              <div className="space-y-3">
                {/* Name */}
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1">نام دستگاه:</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">
                    {result.name || device.name}
                  </div>
                </div>

                {/* Model */}
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1">مدل و برند:</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">
                    {result.model || device.model}
                  </div>
                </div>

                {/* Specs */}
                {(result.specsText || device.specsText) && (
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-[11px] font-semibold text-zinc-400 mb-1">مشخصات فنی:</div>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                      {result.specsText || device.specsText}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(result.notes || device.notes) && (
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                    <div className="text-[11px] font-semibold text-zinc-400 mb-1">توضیحات:</div>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      {result.notes || device.notes}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بررسی دوباره</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={loading || !result || applied}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                applied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>اعمال شد!</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>اعمال اصلاحات هوشمند در دستگاه</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
