import React, { useState, useEffect } from 'react';
import { DeviceItem } from '../types/device';
import { generateAICaption } from '../lib/aiClient';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Instagram, 
  Send, 
  Linkedin, 
  ShoppingBag, 
  MessageSquare,
  Flame,
  Wrench,
  Building2,
  ThumbsUp
} from 'lucide-react';

interface AICaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceItem | null;
}

export const AICaptionModal: React.FC<AICaptionModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [platform, setPlatform] = useState<'instagram' | 'telegram' | 'linkedin' | 'divar' | 'whatsapp'>('instagram');
  const [tone, setTone] = useState<'attractive' | 'technical' | 'urgent' | 'formal'>('attractive');
  const [caption, setCaption] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && device) {
      handleGenerate();
    }
  }, [isOpen, device?.id, platform, tone]);

  if (!isOpen || !device) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const generated = await generateAICaption({
        device,
        platform,
        tone,
      });
      setCaption(generated);
    } catch (err: any) {
      console.error('Caption generation error:', err);
      setError(err.message || 'خطا در ارتباط با سرور هوش مصنوعی.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    { id: 'instagram', label: 'اینستاگرام', icon: Instagram, color: 'text-pink-600' },
    { id: 'telegram', label: 'کانال تلگرام', icon: Send, color: 'text-sky-500' },
    { id: 'linkedin', label: 'لینکدین B2B', icon: Linkedin, color: 'text-blue-600' },
    { id: 'divar', label: 'دیوار / شیپور', icon: ShoppingBag, color: 'text-red-500' },
    { id: 'whatsapp', label: 'واتساپ / بله / ایتا', icon: MessageSquare, color: 'text-emerald-500' },
  ];

  const tones = [
    { id: 'attractive', label: 'جذاب و پربازدید', icon: ThumbsUp },
    { id: 'technical', label: 'تخصصی و فنی', icon: Wrench },
    { id: 'urgent', label: 'فروش فوری و تخفیف', icon: Flame },
    { id: 'formal', label: 'رسمی و شرکتی', icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                تولید هوشمند کپشن و آگهی فروش
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                دستگاه: <strong className="text-zinc-700 dark:text-zinc-200">{device.name}</strong>
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

        {/* Settings Bar: Platform & Tone */}
        <div className="p-4 bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          {/* Platforms */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
              پلتفرم هدف برای انتشار:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {platforms.map((p) => {
                const IconComponent = p.icon;
                const isSelected = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-white/60'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${p.color}`} />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
              لحن و استایل نگارش:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {tones.map((t) => {
                const IconComponent = t.icon;
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                هوش مصنوعی در حال تدوین کپشن فروش...
              </h4>
              <p className="text-xs text-zinc-400">
                بررسی مشخصات فنی، تبدیل به لحن جذاب و تولید هشتگ‌های تخصصی
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs text-center">
              {error}
              <div className="mt-3">
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-medium"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={12}
                className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm leading-relaxed text-zinc-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition font-sans"
                placeholder="متن کپشن در اینجا نمایش داده خواهد شد..."
              />
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1">
                <span>تعداد کاراکتر: {caption.length.toLocaleString('fa-IR')}</span>
                <span>می‌توانید متن را به صورت دستی هم ویرایش کنید.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تولید مجدد کپشن</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!caption || loading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی در کلیپ‌بورد</span>
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
