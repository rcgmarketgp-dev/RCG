import React, { useState, useEffect } from 'react';
import { DeviceItem, DeviceImage, CompanyProfile } from '../types/device';
import { generateAICaption } from '../lib/aiClient';
import { 
  getStoredCompanyProfile, 
  appendCompanySignature, 
  removeCompanySignature, 
  formatCompanySignature, 
  hasCompanySignature 
} from '../lib/companyProfile';
import { 
  shareToTelegram, 
  shareToWhatsApp, 
  shareToBale, 
  shareToEitaa, 
  shareWithNativeFiles, 
  copyImageToClipboard 
} from '../lib/messengerShare';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Send, 
  Share2,
  CheckCheck,
  Phone,
  User as UserIcon,
  Layers,
  Image as ImageIcon,
  Flame,
  Wrench,
  Building2,
  ThumbsUp,
  Download,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  MessageSquare,
  FileSignature
} from 'lucide-react';

interface AICaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceItem | null;
  allDevices?: DeviceItem[];
  onOpenCompanyProfile?: () => void;
}

type MessengerPlatform = 'bale' | 'telegram' | 'eitaa' | 'whatsapp';

export const AICaptionModal: React.FC<AICaptionModalProps> = ({
  isOpen,
  onClose,
  device,
  allDevices = [],
  onOpenCompanyProfile,
}) => {
  // Mode: Single Device vs Multi-Device Catalog
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  // Selected messenger for preview and optimization
  const [activeMessenger, setActiveMessenger] = useState<MessengerPlatform>('telegram');

  // Tone & caption state
  const [tone, setTone] = useState<'attractive' | 'technical' | 'urgent' | 'formal'>('attractive');
  const [caption, setCaption] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [nativeShareSuccess, setNativeShareSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Direct recipient target (phone number for WhatsApp or username for Telegram/Bale/Eitaa)
  const [contactTarget, setContactTarget] = useState<string>('');

  // Selected photos for inclusion
  const [selectedPhotoUrls, setSelectedPhotoUrls] = useState<string[]>([]);

  // Active view in modal: Preview vs Edit/Settings
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');

  // Company Profile Integration
  const [profile, setProfile] = useState<CompanyProfile>(getStoredCompanyProfile);
  const [appendProfile, setAppendProfile] = useState<boolean>(true);
  const [copiedProfileCard, setCopiedProfileCard] = useState<boolean>(false);

  // Sync profile when window event fires or when modal opens
  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredCompanyProfile());
    }
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      } else {
        setProfile(getStoredCompanyProfile());
      }
    };
    window.addEventListener('rcg_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('rcg_profile_updated', handleProfileUpdate);
  }, [isOpen]);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen && device) {
      setMode('single');
      setSelectedDeviceIds([device.id]);
      const initialPhotos = device.images?.map((img) => img.url) || [];
      setSelectedPhotoUrls(initialPhotos);
      handleGenerate([device], activeMessenger, tone);
    } else if (isOpen && allDevices.length > 0) {
      setMode('multi');
      const firstFew = allDevices.slice(0, 3).map((d) => d.id);
      setSelectedDeviceIds(firstFew);
      const multiPhotos = allDevices
        .slice(0, 3)
        .flatMap((d) => d.images?.map((img) => img.url) || []);
      setSelectedPhotoUrls(multiPhotos);
      handleGenerate(allDevices.slice(0, 3), activeMessenger, tone);
    }
  }, [isOpen, device?.id]);

  if (!isOpen) return null;

  // Selected devices list
  const currentTargetDevices: DeviceItem[] = mode === 'single'
    ? (device ? [device] : allDevices.filter((d) => selectedDeviceIds.includes(d.id)))
    : allDevices.filter((d) => selectedDeviceIds.includes(d.id));

  // Available photos from target devices
  const allAvailablePhotos: { url: string; deviceName: string; isCover?: boolean }[] =
    currentTargetDevices.flatMap((d) =>
      (d.images || []).map((img) => ({
        url: img.url,
        deviceName: d.name,
        isCover: img.isCover,
      }))
    );

  const handleGenerate = async (
    targetDevs: DeviceItem[] = currentTargetDevices,
    platform: MessengerPlatform = activeMessenger,
    currentTone = tone
  ) => {
    if (targetDevs.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      const generated = await generateAICaption({
        device: targetDevs.length === 1 ? targetDevs[0] : undefined,
        devices: targetDevs.length > 1 ? targetDevs : undefined,
        platform,
        tone: currentTone,
        companyProfile: appendProfile ? profile : undefined,
      });

      if (appendProfile && !hasCompanySignature(generated, profile)) {
        setCaption(appendCompanySignature(generated, profile));
      } else {
        setCaption(generated);
      }
    } catch (err: any) {
      console.error('Caption generation error:', err);
      setError(err.message || 'خطا در ارتباط با سرور هوش مصنوعی.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAppendProfile = () => {
    const next = !appendProfile;
    setAppendProfile(next);
    if (next) {
      setCaption((prev) => appendCompanySignature(prev, profile));
    } else {
      setCaption((prev) => removeCompanySignature(prev, profile));
    }
  };

  const handleCopyCompanyCard = () => {
    const card = formatCompanySignature(profile);
    navigator.clipboard.writeText(card);
    setCopiedProfileCard(true);
    setTimeout(() => setCopiedProfileCard(false), 2000);
  };

  const handleToggleDevice = (devId: string) => {
    const updated = selectedDeviceIds.includes(devId)
      ? selectedDeviceIds.filter((id) => id !== devId)
      : [...selectedDeviceIds, devId];
    setSelectedDeviceIds(updated);
    const devs = allDevices.filter((d) => updated.includes(d.id));
    const photos = devs.flatMap((d) => d.images?.map((img) => img.url) || []);
    setSelectedPhotoUrls(photos);
    handleGenerate(devs, activeMessenger, tone);
  };

  const handleTogglePhoto = (url: string) => {
    setSelectedPhotoUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleSelectAllPhotos = () => {
    setSelectedPhotoUrls(allAvailablePhotos.map((p) => p.url));
  };

  const handleDeselectAllPhotos = () => {
    setSelectedPhotoUrls([]);
  };

  const handleCopyText = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFirstImage = async () => {
    if (selectedPhotoUrls.length === 0) return;
    const ok = await copyImageToClipboard(selectedPhotoUrls[0]);
    if (ok) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const success = await shareWithNativeFiles(
      currentTargetDevices[0]?.name || 'آگهی ماشین‌آلات چوب',
      caption,
      selectedPhotoUrls
    );
    if (success) {
      setNativeShareSuccess(true);
      setTimeout(() => setNativeShareSuccess(false), 3000);
    }
  };

  // Dispatch to individual messengers
  const handleSendToMessenger = (platform: MessengerPlatform) => {
    const shareOpts = {
      text: caption,
      photoUrls: selectedPhotoUrls,
      contactTarget,
    };

    switch (platform) {
      case 'bale':
        shareToBale(shareOpts);
        break;
      case 'telegram':
        shareToTelegram(shareOpts);
        break;
      case 'eitaa':
        shareToEitaa(shareOpts);
        break;
      case 'whatsapp':
        shareToWhatsApp(shareOpts);
        break;
    }
  };

  const tones = [
    { id: 'attractive', label: 'جذاب و پربازدید', icon: ThumbsUp },
    { id: 'technical', label: 'تخصصی و فنی', icon: Wrench },
    { id: 'urgent', label: 'فروش فوری و تخفیف', icon: Flame },
    { id: 'formal', label: 'رسمی و شرکتی', icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                  ارسال مستقیم آگهی و عکس به پیام‌رسان‌ها
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
                  بله • تلگرام • ایتا • واتساپ
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                پیش‌نمایش زنده چت، ضمیمه هوشمند تصاویر دستگاه‌ها و ارسال مستقیم به پیوی یا گروه
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

        {/* Top Controls: Mode Switcher (Single vs Multi) & Target Selection */}
        <div className="px-4 py-3 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => {
                setMode('single');
                if (device) {
                  setSelectedDeviceIds([device.id]);
                  handleGenerate([device]);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                mode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <span>آگهی تکی دستگاه</span>
              {device && <span className="opacity-80">({device.name.slice(0, 15)}...)</span>}
            </button>
            <button
              onClick={() => {
                setMode('multi');
                const initial = allDevices.slice(0, 3).map((d) => d.id);
                setSelectedDeviceIds(initial);
                handleGenerate(allDevices.slice(0, 3));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                mode === 'multi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>آگهی کاتالوگ چند موردی ({allDevices.length} دستگاه)</span>
            </button>
          </div>

          {/* Tab Switcher: Preview vs Editor */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'preview'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پیش‌نمایش زنده در چت</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'editor'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>تنظیمات و ویرایش متن</span>
            </button>
          </div>
        </div>

        {/* Company Profile Footer Integration Bar */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border-b border-blue-200/80 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-zinc-900 dark:text-white truncate">
                  {profile.companyName}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:inline truncate max-w-sm">
                  • {profile.slogan}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Append to Message */}
            <button
              onClick={handleToggleAppendProfile}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-2xs ${
                appendProfile
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
              }`}
              title="درج خودکار مشخصات، شعار و آیدی‌های شرکت در انتهای پیام دستگاه"
            >
              <Check className={`w-3.5 h-3.5 ${appendProfile ? 'opacity-100' : 'opacity-0'}`} />
              <span>{appendProfile ? 'امضای شرکت فعال در انتهای پیام' : 'امضای شرکت غیرفعال'}</span>
            </button>

            {/* Copy Card button */}
            <button
              onClick={handleCopyCompanyCard}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              title="کپی متن اطلاعات تماس و شعار شرکت"
            >
              {copiedProfileCard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{copiedProfileCard ? 'کپی شد!' : 'کپی کارت شرکت'}</span>
            </button>

            {/* Open Profile Modal */}
            {onOpenCompanyProfile && (
              <button
                onClick={onOpenCompanyProfile}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold transition"
                title="ویرایش نام، شعار، تلفن‌ها و آیدی‌های پیام‌رسان‌ها"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>تنظیمات پروفایل</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Device Picker (Visible only if mode === 'multi') */}
        {mode === 'multi' && (
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                دستگاه‌های انتخابی برای آگهی تجمیعی ({selectedDeviceIds.length} از {allDevices.length}):
              </span>
              <button
                onClick={() => {
                  if (selectedDeviceIds.length === allDevices.length) {
                    setSelectedDeviceIds([]);
                  } else {
                    const allIds = allDevices.map((d) => d.id);
                    setSelectedDeviceIds(allIds);
                    handleGenerate(allDevices);
                  }
                }}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedDeviceIds.length === allDevices.length ? 'لغو انتخاب همه' : 'انتخاب همه ماشین‌آلات'}
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {allDevices.map((d) => {
                const isChecked = selectedDeviceIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => handleToggleDevice(d.id)}
                    className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border text-xs shrink-0 transition ${
                      isChecked
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {d.images?.[0]?.url ? (
                      <img
                        src={d.images[0].url}
                        alt=""
                        className="w-6 h-6 rounded-md object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px]">
                        ⚙️
                      </div>
                    )}
                    <span className="font-bold max-w-[120px] truncate">{d.name}</span>
                    <span className="text-[10px] opacity-75">
                      {d.price ? `${(d.price / 1000000).toLocaleString('fa-IR')} م` : 'استعلام'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messenger Platform Switcher Tab Bar */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-2">
            پیام‌رسان هدف برای فرمت‌بندی و پیش‌نمایش دقیق:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Telegram */}
            <button
              onClick={() => {
                setActiveMessenger('telegram');
                handleGenerate(currentTargetDevices, 'telegram');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition ${
                activeMessenger === 'telegram'
                  ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>تلگرام (Telegram)</span>
            </button>

            {/* Bale */}
            <button
              onClick={() => {
                setActiveMessenger('bale');
                handleGenerate(currentTargetDevices, 'bale');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition ${
                activeMessenger === 'bale'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white text-emerald-600 font-black flex items-center justify-center text-[10px]">
                ب
              </span>
              <span>بله (Bale)</span>
            </button>

            {/* Eitaa */}
            <button
              onClick={() => {
                setActiveMessenger('eitaa');
                handleGenerate(currentTargetDevices, 'eitaa');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition ${
                activeMessenger === 'eitaa'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 scale-[1.02]'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white text-amber-600 font-black flex items-center justify-center text-[10px]">
                ای
              </span>
              <span>ایتا (Eitaa)</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => {
                setActiveMessenger('whatsapp');
                handleGenerate(currentTargetDevices, 'whatsapp');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition ${
                activeMessenger === 'whatsapp'
                  ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20 scale-[1.02]'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-green-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>واتساپ (WhatsApp)</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'preview' ? (
            /* TAB 1: REALISTIC MESSENGER CHAT SIMULATOR */
            <div className="max-w-2xl mx-auto space-y-4">
              
              {/* Optional Recipient Phone or Username */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      ارسال به پیوی / چت شخصی مخاطب خاص:
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      شماره موبایل (مثلا 09121234567) یا آیدی تلگرام/بله/ایتا
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={contactTarget}
                    onChange={(e) => setContactTarget(e.target.value)}
                    dir="ltr"
                    placeholder="0912... یا @username"
                    className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Photo Selector Checkboxes */}
              {allAvailablePhotos.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                      تصاویر انتخابی برای ضمیمه به آگهی ({selectedPhotoUrls.length} از {allAvailablePhotos.length}):
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        onClick={handleSelectAllPhotos}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        انتخاب همه
                      </button>
                      <span className="text-zinc-300">|</span>
                      <button
                        onClick={handleDeselectAllPhotos}
                        className="text-zinc-500 hover:underline"
                      >
                        لغو همه
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {allAvailablePhotos.map((photo, index) => {
                      const isSelected = selectedPhotoUrls.includes(photo.url);
                      return (
                        <div
                          key={index}
                          onClick={() => handleTogglePhoto(photo.url)}
                          className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition shrink-0 group ${
                            isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-20 h-16 object-cover"
                          />
                          <div className={`absolute top-1 right-1 w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-black/40 text-transparent'
                          }`}>
                            ✓
                          </div>
                          {photo.isCover && (
                            <span className="absolute bottom-1 right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-xs">
                              کاور
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REALISTIC CHAT ENVIRONMENT SIMULATION */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-3xl overflow-hidden shadow-lg">
                
                {/* Chat App Header Bar */}
                <div className={`px-4 py-2.5 flex items-center justify-between text-white ${
                  activeMessenger === 'telegram'
                    ? 'bg-[#229ED9]'
                    : activeMessenger === 'bale'
                    ? 'bg-[#00897B]'
                    : activeMessenger === 'eitaa'
                    ? 'bg-[#D96B27]'
                    : 'bg-[#075E54]'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      {contactTarget ? contactTarget.slice(0, 2) : '🪵'}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>
                          {contactTarget
                            ? `چت مستقیم: ${contactTarget}`
                            : activeMessenger === 'telegram'
                            ? 'کانال ماشین‌آلات صنایع چوب'
                            : activeMessenger === 'bale'
                            ? 'نمایشگاه بله: ماشین‌ابزار چوب'
                            : activeMessenger === 'eitaa'
                            ? 'کانال رسمی ایتا - ابزار چوب'
                            : 'گروه مشتریان واتساپ'}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80 block">
                        {contactTarget ? 'آنلاین (ارسال به پیوی شخصی)' : 'پیش‌نمایش زنده پست ارسالی'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono opacity-80">
                    {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Chat Background & Message Bubble */}
                <div className={`p-4 sm:p-6 min-h-[300px] flex flex-col justify-end ${
                  activeMessenger === 'telegram'
                    ? 'bg-[#E5DDD5] dark:bg-[#0E1621]'
                    : activeMessenger === 'bale'
                    ? 'bg-[#E0F2F1] dark:bg-[#102A27]'
                    : activeMessenger === 'eitaa'
                    ? 'bg-[#FFF3E0] dark:bg-[#251A14]'
                    : 'bg-[#ECE5DD] dark:bg-[#121B22]'
                }`}>
                  
                  {/* Chat Bubble Container */}
                  <div className={`max-w-[92%] sm:max-w-[85%] ml-auto rounded-2xl shadow-md overflow-hidden text-right transition-all ${
                    activeMessenger === 'telegram'
                      ? 'bg-white dark:bg-[#182533] text-zinc-900 dark:text-zinc-100'
                      : activeMessenger === 'bale'
                      ? 'bg-white dark:bg-[#1D3B37] text-zinc-900 dark:text-zinc-100'
                      : activeMessenger === 'eitaa'
                      ? 'bg-white dark:bg-[#2A1F18] text-zinc-900 dark:text-zinc-100'
                      : 'bg-[#DCF8C6] dark:bg-[#005C4B] text-zinc-900 dark:text-zinc-100'
                  }`}>
                    
                    {/* Simulated Attached Images Album in Chat */}
                    {selectedPhotoUrls.length > 0 && (
                      <div className="relative">
                        {selectedPhotoUrls.length === 1 ? (
                          <img
                            src={selectedPhotoUrls[0]}
                            alt="Machine"
                            className="w-full h-56 sm:h-64 object-cover"
                          />
                        ) : selectedPhotoUrls.length === 2 ? (
                          <div className="grid grid-cols-2 gap-1 bg-black/10">
                            <img src={selectedPhotoUrls[0]} alt="" className="w-full h-44 object-cover" />
                            <img src={selectedPhotoUrls[1]} alt="" className="w-full h-44 object-cover" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1 bg-black/10">
                            <img src={selectedPhotoUrls[0]} alt="" className="w-full h-32 object-cover col-span-2 row-span-2 h-full" />
                            <img src={selectedPhotoUrls[1]} alt="" className="w-full h-24 object-cover" />
                            <div className="relative">
                              <img src={selectedPhotoUrls[2]} alt="" className="w-full h-24 object-cover" />
                              {selectedPhotoUrls.length > 3 && (
                                <div className="absolute inset-0 bg-black/60 text-white font-bold text-sm flex items-center justify-center">
                                  +{selectedPhotoUrls.length - 2} عکس دیگر
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <ImageIcon className="w-3 h-3" />
                          <span>{selectedPhotoUrls.length} تصویر پیوست</span>
                        </div>
                      </div>
                    )}

                    {/* Simulated Message Text */}
                    <div className="p-3.5 sm:p-4 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans select-text">
                      {loading ? (
                        <div className="py-8 text-center text-zinc-400 flex flex-col items-center justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                          <span>هوش مصنوعی در حال تولید متن آگهی اختصاصی...</span>
                        </div>
                      ) : error ? (
                        <div className="text-red-500 text-xs py-2">{error}</div>
                      ) : (
                        caption || 'متن آگهی در حال آماده‌سازی...'
                      )}
                    </div>

                    {/* Chat Bubble Footer: Simulated Timestamp & Double Checkmarks */}
                    <div className="px-3.5 pb-2.5 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-black/5 dark:border-white/5 pt-1.5">
                      <span className="font-semibold">
                        {activeMessenger === 'telegram'
                          ? 'ارسال با ربات / کلاینت تلگرام'
                          : activeMessenger === 'bale'
                          ? 'بله نسخه وب / اپلیکیشن'
                          : activeMessenger === 'eitaa'
                          ? 'پیام‌رسان ایتا'
                          : 'واتساپ تجاری'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span>{new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCheck className={`w-3.5 h-3.5 ${activeMessenger === 'whatsapp' ? 'text-sky-500' : 'text-zinc-400'}`} />
                      </div>
                    </div>

                    {/* Telegram / Bale Glass Button Simulation (Inline action buttons) */}
                    {(activeMessenger === 'telegram' || activeMessenger === 'bale') && (
                      <div className="p-2 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-1.5 text-center text-[11px] font-bold">
                        <div className="py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/10 text-blue-600 dark:text-blue-300">
                          📞 تماس مستقیم با کارشناس
                        </div>
                        <div className="py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-300">
                          💳 خرید اقساطی ماشین‌آلات
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* TAB 2: TEXT EDITOR, TONE & SETTINGS */
            <div className="max-w-2xl mx-auto space-y-4">
              
              {/* Tone Selection */}
              <div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                  لحن نگارش متن آگهی:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tones.map((t) => {
                    const IconComponent = t.icon;
                    const isSelected = tone === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTone(t.id as any);
                          handleGenerate(currentTargetDevices, activeMessenger, t.id as any);
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 shadow-xs'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    متن نهایی آگهی (قابل ویرایش دستی):
                  </span>
                  <button
                    onClick={() => handleGenerate(currentTargetDevices, activeMessenger, tone)}
                    disabled={loading}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>تولید مجدد با هوش مصنوعی</span>
                  </button>
                </div>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={12}
                  className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm leading-relaxed text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-sans"
                  placeholder="متن آگهی در اینجا ظاهر می‌شود..."
                />
                
                {/* Signature Actions in Editor */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                      <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                      امضای مشخصات شرکت:
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaption((prev) => appendCompanySignature(prev, profile))}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 font-medium transition active:scale-95"
                    >
                      + افزودن به انتهای متن
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaption((prev) => removeCompanySignature(prev, profile))}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 font-medium transition active:scale-95"
                    >
                      حذف از انتهای متن
                    </button>
                  </div>
                  {onOpenCompanyProfile && (
                    <button
                      type="button"
                      onClick={onOpenCompanyProfile}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      ویرایش شعار و شماره‌ها ↗
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5 px-1">
                  <span>تعداد کاراکترها: {caption.length.toLocaleString('fa-IR')}</span>
                  <span>متن بلافاصله در پیش‌نمایش چت بروزرسانی می‌شود.</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Action Footer: Direct Messenger Dispatch Buttons */}
        <div className="p-4 bg-zinc-50/95 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          
          {/* Main Direct Send Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* 1. Send to Telegram */}
            <button
              onClick={() => handleSendToMessenger('telegram')}
              disabled={!caption || loading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
              <span>ارسال در تلگرام</span>
            </button>

            {/* 2. Send to Bale */}
            <button
              onClick={() => handleSendToMessenger('bale')}
              disabled={!caption || loading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#00897B] hover:bg-[#00796B] text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              <span className="w-4 h-4 rounded-full bg-white text-[#00897B] font-black flex items-center justify-center text-[10px]">
                ب
              </span>
              <span>ارسال در بله</span>
            </button>

            {/* 3. Send to Eitaa */}
            <button
              onClick={() => handleSendToMessenger('eitaa')}
              disabled={!caption || loading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#D96B27] hover:bg-[#BF5C1E] text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <span className="w-4 h-4 rounded-full bg-white text-[#D96B27] font-black flex items-center justify-center text-[10px]">
                ای
              </span>
              <span>ارسال در ایتا</span>
            </button>

            {/* 4. Send to WhatsApp */}
            <button
              onClick={() => handleSendToMessenger('whatsapp')}
              disabled={!caption || loading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold shadow-md shadow-green-500/20 active:scale-95 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ارسال در واتساپ</span>
            </button>
          </div>

          {/* Secondary Helpers: Copy Text, Copy Image, Native Share */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              {/* Copy Caption Text */}
              <button
                onClick={handleCopyText}
                disabled={!caption || loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'متن کپی شد!' : 'کپی متن آگهی'}</span>
              </button>

              {/* Copy Image to Clipboard */}
              {selectedPhotoUrls.length > 0 && (
                <button
                  onClick={handleCopyFirstImage}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition ${
                    copiedImage
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>{copiedImage ? 'عکس کپی شد!' : 'کپی عکس اصلی'}</span>
                </button>
              )}

              {/* Native System Share (files + text) */}
              <button
                onClick={handleNativeShare}
                disabled={!caption || loading}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{nativeShareSuccess ? 'به اشتراک گذاشته شد' : 'اشتراک مستقیم فایل عکس + متن'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
