import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '../types/device';
import { 
  getStoredCompanyProfile, 
  saveStoredCompanyProfile, 
  formatCompanySignature, 
  DEFAULT_COMPANY_PROFILE,
  PROFILE_TEMPLATES
} from '../lib/companyProfile';
import { 
  Building2, 
  X, 
  Phone, 
  Smartphone, 
  Send, 
  Globe, 
  MapPin, 
  Sparkles, 
  Check, 
  Copy, 
  RotateCcw, 
  Eye, 
  Save, 
  Sliders, 
  FileText, 
  MessageCircle, 
  AtSign,
  Share2
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: CompanyProfile) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<CompanyProfile>(getStoredCompanyProfile);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'socials' | 'format'>('info');
  const [copiedSignature, setCopiedSignature] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredCompanyProfile());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSignature = formatCompanySignature(profile);

  const handleFieldChange = (field: keyof CompanyProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    saveStoredCompanyProfile(profile);
    if (onProfileUpdated) {
      onProfileUpdated(profile);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleCopySignature = () => {
    navigator.clipboard.writeText(currentSignature);
    setCopiedSignature(true);
    setTimeout(() => setCopiedSignature(false), 2000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('آیا مایلید اطلاعات به پیش‌فرض بازگردانی شود؟')) {
      setProfile(DEFAULT_COMPANY_PROFILE);
    }
  };

  const handleApplyTemplate = (templateProfile: Partial<CompanyProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...templateProfile,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                  پروفایل و هویت سازمانی شرکت
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  امضای هوشمند پیام‌ها
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                تنظیم اطلاعات تماس، شعار، خطوط ثابت/همراه و آیدی پیام‌رسان‌ها جهت درج خودکار در انتهای هر پیام دستگاه
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Presets */}
        <div className="px-4 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-[11px]">قالب‌های آماده:</span>
            {PROFILE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl.profile)}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-700 hover:bg-blue-50 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 font-medium transition active:scale-95"
              >
                {tmpl.title}
              </button>
            ))}
          </div>
          <button
            onClick={handleResetToDefault}
            title="بازنشانی به مقادیر اولیه"
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0 font-medium px-2 py-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>پیش‌فرض</span>
          </button>
        </div>

        {/* Content Body: Tabs & Live Preview Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left/Main Column: Settings Form (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tabs Bar */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  activeTab === 'info'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>شعار و نام شرکت</span>
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  activeTab === 'contacts'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>شماره‌های تماس</span>
              </button>
              <button
                onClick={() => setActiveTab('socials')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  activeTab === 'socials'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>پیام‌رسان‌ها</span>
              </button>
              <button
                onClick={() => setActiveTab('format')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  activeTab === 'format'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>قالب و چیدمان</span>
              </button>
            </div>

            {/* Tab 1: Company Name, Slogan, Address */}
            {activeTab === 'info' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    نام شرکت / بازرگانی ماشین‌آلات
                  </label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    placeholder="مثال: بازرگانی ماشین‌آلات چوب آرسی‌جی"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      شعار سازمانی و تجاری شرکت
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.includeSlogan}
                        onChange={(e) => handleFieldChange('includeSlogan', e.target.checked)}
                        className="rounded-xs text-blue-600 focus:ring-blue-500"
                      />
                      <span>درج در انتهای پیام</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={profile.slogan}
                    onChange={(e) => handleFieldChange('slogan', e.target.value)}
                    placeholder="مثال: تضمین اصالت و سلامت فنی، اورهال تخصصی و فروش اقساطی"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    این شعار به عنوان معرف اعتبار و برند شما در انتهای هر آگهی و پیام درج خواهد شد.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      نشانی نمایشگاه / کارگاه
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.includeAddress}
                        onChange={(e) => handleFieldChange('includeAddress', e.target.checked)}
                        className="rounded-xs text-blue-600 focus:ring-blue-500"
                      />
                      <span>درج در انتهای پیام</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="مثال: تهران، بزرگراه آزادگان، شهرک صنعتی چهاردانگه..."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    وب‌سایت رسمی (اختیاری)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.website || ''}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      placeholder="www.rcg-machinery.ir"
                      className="w-full pl-3.5 pr-9 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden text-left"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      یادداشت پایانی / دعوت به اقدام (CTA)
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.includeCustomNote}
                        onChange={(e) => handleFieldChange('includeCustomNote', e.target.checked)}
                        className="rounded-xs text-blue-600 focus:ring-blue-500"
                      />
                      <span>درج در انتهای پیام</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={profile.customNote || ''}
                    onChange={(e) => handleFieldChange('customNote', e.target.value)}
                    placeholder="مثال: جهت استعلام شرایط فروش اقساطی و هماهنگی بازدید حضوری تماس بگیرید."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Contact Phones */}
            {activeTab === 'contacts' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                      تنظیم خطوط ارتباط تلفنی
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-blue-800 dark:text-blue-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={profile.includePhones}
                      onChange={(e) => handleFieldChange('includePhones', e.target.checked)}
                      className="rounded-xs text-blue-600 focus:ring-blue-500"
                    />
                    <span>درج تلفن‌ها در امضا</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    شماره همراه مشاوره و فروش (موبایل اصلی)
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.mobile}
                      onChange={(e) => handleFieldChange('mobile', e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full pl-3.5 pr-9 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      تلفن دفتر مرکزی / کارگاه
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.phone1}
                      onChange={(e) => handleFieldChange('phone1', e.target.value)}
                      placeholder="۰۲۱-۵۵۲۷۸۹۰۰"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      تلفن دوم / خط مستقیم فروش
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.phone2 || ''}
                      onChange={(e) => handleFieldChange('phone2', e.target.value)}
                      placeholder="۰۲۱-۵۵۲۶۱۲۰۳"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden text-left"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Social & Messenger IDs */}
            {activeTab === 'socials' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      پیام‌رسان‌های ایرانی و بین‌المللی
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={profile.includeSocials}
                      onChange={(e) => handleFieldChange('includeSocials', e.target.checked)}
                      className="rounded-xs text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>درج آیدی‌ها در انتهای پیام</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Telegram */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      آیدی یا لینک تلگرام
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.telegramId || ''}
                      onChange={(e) => handleFieldChange('telegramId', e.target.value)}
                      placeholder="@RCG_WoodMachinery"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-left focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      شماره یا لینک واتساپ
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.whatsappNumber || ''}
                      onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا wa.me/..."
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-left focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Bale */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      کانال یا آیدی پیام‌رسان بله
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.baleId || ''}
                      onChange={(e) => handleFieldChange('baleId', e.target.value)}
                      placeholder="ble.ir/rcg_wood یا @rcg_wood"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-left focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Eitaa */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      کانال یا آیدی پیام‌رسان ایتا
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.eitaaId || ''}
                      onChange={(e) => handleFieldChange('eitaaId', e.target.value)}
                      placeholder="eitaa.com/rcg_wood یا @rcg_wood"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-left focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      پیج اینستاگرام
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.instagramId || ''}
                      onChange={(e) => handleFieldChange('instagramId', e.target.value)}
                      placeholder="@rcg_woodmachinery"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-left focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Rubika */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      روبیکا (اختیاری)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profile.rubikaId || ''}
                      onChange={(e) => handleFieldChange('rubikaId', e.target.value)}
                      placeholder="@rcg_wood"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-left focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Formatting & Layout */}
            {activeTab === 'format' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    سبک خط جداکننده (Separator):
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'divider', title: 'خط ضخیم دوتایی', example: '━━━━━━━━━━━━━━━━━━━━' },
                      { id: 'dashes', title: 'خط‌چین کلاسیک', example: '------------------------------------' },
                      { id: 'stars', title: 'ستاره‌های درخشان', example: '✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨' },
                      { id: 'minimal', title: 'مینیمال ساده', example: '──────────────' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleFieldChange('separatorStyle', item.id)}
                        className={`p-2.5 rounded-xl border text-right transition ${
                          profile.separatorStyle === item.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                            : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="font-bold text-xs">{item.title}</div>
                        <div className="font-mono text-[11px] text-zinc-500 truncate mt-1">
                          {item.example}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2.5 text-xs">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    آیتم‌های فعال در امضای انتهای پیام:
                  </div>
                  <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.includeSlogan}
                      onChange={(e) => handleFieldChange('includeSlogan', e.target.checked)}
                      className="rounded-xs text-blue-600 focus:ring-blue-500"
                    />
                    <span>شعار سازمانی و تجاری شرکت</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.includePhones}
                      onChange={(e) => handleFieldChange('includePhones', e.target.checked)}
                      className="rounded-xs text-blue-600 focus:ring-blue-500"
                    />
                    <span>شماره‌های تماس (همراه، ثابت و فروش)</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.includeSocials}
                      onChange={(e) => handleFieldChange('includeSocials', e.target.checked)}
                      className="rounded-xs text-blue-600 focus:ring-blue-500"
                    />
                    <span>آیدی شبکه‌های اجتماعی و پیام‌رسان‌ها</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.includeAddress}
                      onChange={(e) => handleFieldChange('includeAddress', e.target.checked)}
                      className="rounded-xs text-blue-600 focus:ring-blue-500"
                    />
                    <span>نشانی نمایشگاه/کارگاه و وبسایت</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.includeCustomNote}
                      onChange={(e) => handleFieldChange('includeCustomNote', e.target.checked)}
                      className="rounded-xs text-blue-600 focus:ring-blue-500"
                    />
                    <span>یادداشت یا دعوت به اقدام اختصاصی (CTA)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Card Preview (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>پیش‌نمایش زنده امضا در انتهای پیام:</span>
              </div>
              <button
                onClick={handleCopySignature}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-95"
              >
                {copiedSignature ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>کپی امضا</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview Box styled like messenger chat bubble */}
            <div className="flex-1 bg-gradient-to-br from-zinc-50 to-zinc-100/60 dark:from-zinc-800/80 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 bg-white/70 dark:bg-zinc-800/70 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 leading-relaxed italic">
                  [متن آگهی، مشخصات فنی و شرایط اقساط دستگاه...]
                </div>
                
                {/* Real Signature Block */}
                <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-blue-200/70 dark:border-blue-900/40 text-xs font-sans leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 select-text">
                  {currentSignature}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/80 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>تعداد کاراکتر: {currentSignature.length}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  آماده درج در بله، تلگرام، ایتا و واتساپ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            بستن
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySignature}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
            >
              <Copy className="w-4 h-4 text-zinc-500" />
              <span>کپی کارت ویزیت شرکت</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
                savedSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>با موفقیت ذخیره شد!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات و اعمال در پیام‌ها</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
