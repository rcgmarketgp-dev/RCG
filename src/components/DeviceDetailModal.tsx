import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { DeviceItem, CategoryInfo, StatusChangeLog, DeviceStatus } from '../types/device';
import { STATUS_META, WOODWORKING_SPEC_TEMPLATES } from '../data/initialData';
import { 
  getStatusHistoryForDevice, 
  recordStatusChangeLog, 
  formatPersianDateTime 
} from '../lib/statusHistory';
import { 
  X, 
  Sparkles, 
  Wand2, 
  Edit3, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Tag, 
  ChevronRight, 
  ChevronLeft, 
  FileText,
  Plus,
  Trash2,
  Check,
  Printer,
  Layers,
  ShoppingBag,
  ListPlus,
  ArrowLeft,
  Settings2,
  CheckCircle2,
  History,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  CheckCheck
} from 'lucide-react';

interface DeviceDetailModalProps {
  device: DeviceItem | null;
  allDevices: DeviceItem[];
  onClose: () => void;
  onEdit: (device: DeviceItem) => void;
  onOpenAICaption: (device: DeviceItem) => void;
  onOpenAIFixSpelling: (device: DeviceItem) => void;
  onUpdateDevice?: (updated: DeviceItem) => void;
  onStatusChange?: (device: DeviceItem, newStatus: DeviceStatus, note?: string) => void;
  currentUser?: User | null;
  categories: CategoryInfo[];
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  allDevices,
  onClose,
  onEdit,
  onOpenAICaption,
  onOpenAIFixSpelling,
  onUpdateDevice,
  onStatusChange,
  currentUser,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'custom_specs' | 'related_machines' | 'status_history'>('overview');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Status history state
  const [statusLogs, setStatusLogs] = useState<StatusChangeLog[]>([]);
  const [newStatusNote, setNewStatusNote] = useState('');
  const [statusChangeSuccess, setStatusChangeSuccess] = useState<string | null>(null);

  // Load status history on mount or when device changes
  useEffect(() => {
    if (device?.id) {
      setStatusLogs(getStatusHistoryForDevice(device.id));
    }
  }, [device?.id, device?.status]);

  // New spec row states
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saveSpecsFeedback, setSaveSpecsFeedback] = useState(false);

  // Related machines select state
  const [selectedRelatedId, setSelectedRelatedId] = useState('');

  if (!device) return null;

  const catMeta = categories.find((c) => c.name === device.category) || {
    id: 'wood_general',
    name: device.category,
    colorBg: 'bg-amber-50 dark:bg-amber-950/40',
    colorText: 'text-amber-800 dark:text-amber-300',
    colorBorder: 'border-amber-200 dark:border-amber-800',
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeHex: '#d97706',
    iconName: 'Layers',
    description: '',
  };

  const statusMeta = STATUS_META[device.status] || STATUS_META.ready_for_sale;
  const images = device.images && device.images.length > 0 ? device.images : [];
  const currentImage = images[activeImageIndex] || null;

  // Financial calculations
  const price = device.price || 0;
  const cashAmount = Math.round((price * device.cashPercentage) / 100);
  const installmentAmount = price - cashAmount;
  const checkMonths = device.installmentMonths || 6;
  const perCheckAmount = checkMonths > 0 ? Math.round(installmentAmount / checkMonths) : 0;

  // Current spec list
  const specList = device.specList || [];
  const relatedDeviceIds = device.relatedDeviceIds || [];
  const relatedDevices = allDevices.filter((d) => relatedDeviceIds.includes(d.id) && d.id !== device.id);
  const availableToAddAsRelated = allDevices.filter(
    (d) => d.id !== device.id && !relatedDeviceIds.includes(d.id)
  );

  // Total package price if related machines exist
  const totalPackagePrice = [device, ...relatedDevices].reduce((sum, d) => sum + (d.price || 0), 0);

  // Handlers for Custom Specifications Builder
  const handleAddSpecRow = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) return;

    const updatedList = [
      ...specList,
      {
        id: `sp-${Date.now()}`,
        key: newSpecKey.trim(),
        value: newSpecValue.trim(),
      },
    ];

    const updatedDevice: DeviceItem = {
      ...device,
      specList: updatedList,
      updatedAt: new Date().toISOString(),
    };

    onUpdateDevice?.(updatedDevice);
    setNewSpecKey('');
    setNewSpecValue('');
    setSaveSpecsFeedback(true);
    setTimeout(() => setSaveSpecsFeedback(false), 2000);
  };

  const handleDeleteSpecRow = (id: string) => {
    const updatedList = specList.filter((sp) => sp.id !== id);
    const updatedDevice: DeviceItem = {
      ...device,
      specList: updatedList,
      updatedAt: new Date().toISOString(),
    };
    onUpdateDevice?.(updatedDevice);
  };

  const handleUpdateSpecRow = (id: string, newKey: string, newVal: string) => {
    const updatedList = specList.map((sp) =>
      sp.id === id ? { ...sp, key: newKey, value: newVal } : sp
    );
    const updatedDevice: DeviceItem = {
      ...device,
      specList: updatedList,
      updatedAt: new Date().toISOString(),
    };
    onUpdateDevice?.(updatedDevice);
  };

  const handleApplyPresetTemplate = (templateId: string) => {
    const template = WOODWORKING_SPEC_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const newRows = template.defaultSpecs.map((s, idx) => ({
      id: `sp-tpl-${Date.now()}-${idx}`,
      key: s.key,
      value: s.value,
    }));

    const updatedDevice: DeviceItem = {
      ...device,
      specList: newRows,
      updatedAt: new Date().toISOString(),
    };

    onUpdateDevice?.(updatedDevice);
    setSelectedTemplateId('');
    setSaveSpecsFeedback(true);
    setTimeout(() => setSaveSpecsFeedback(false), 2000);
  };

  // Handlers for Related Machines Package
  const handleAddRelatedDevice = () => {
    if (!selectedRelatedId) return;

    const updatedRelated = [...relatedDeviceIds, selectedRelatedId];
    const updatedDevice: DeviceItem = {
      ...device,
      relatedDeviceIds: updatedRelated,
      updatedAt: new Date().toISOString(),
    };

    onUpdateDevice?.(updatedDevice);
    setSelectedRelatedId('');
  };

  const handleRemoveRelatedDevice = (idToRemove: string) => {
    const updatedRelated = relatedDeviceIds.filter((id) => id !== idToRemove);
    const updatedDevice: DeviceItem = {
      ...device,
      relatedDeviceIds: updatedRelated,
      updatedAt: new Date().toISOString(),
    };
    onUpdateDevice?.(updatedDevice);
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick Status Change handler with LocalStorage history logging
  const handleQuickStatusChange = (newStatus: DeviceStatus) => {
    if (!device || device.status === newStatus) return;
    const oldStatus = device.status;
    const authorName = currentUser?.displayName || currentUser?.email || 'کاربر سیستم';
    const noteText = newStatusNote.trim() || undefined;

    const newLog = recordStatusChangeLog(device.id, oldStatus, newStatus, noteText, authorName);
    setStatusLogs((prev) => [newLog, ...prev]);

    const updated: DeviceItem = {
      ...device,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    onUpdateDevice?.(updated);
    if (onStatusChange) {
      onStatusChange(device, newStatus, noteText);
    }

    setNewStatusNote('');
    setStatusChangeSuccess(`وضعیت با موفقیت به «${STATUS_META[newStatus].label}» تغییر یافت.`);
    setTimeout(() => setStatusChangeSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white w-full max-w-full">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-4xl overflow-hidden my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900/60 print:hidden flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {device.code}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${catMeta.colorBg} ${catMeta.colorText} ${catMeta.colorBorder}`}
            >
              <span
                className="w-2 h-2 rounded-xs"
                style={{ backgroundColor: catMeta.badgeHex }}
              />
              {device.category}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${statusMeta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-xs ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              title="چاپ مشخصات فنی"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">چاپ</span>
            </button>
            <button
              onClick={() => onEdit(device)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایش</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation in Device Profile: Rounded Rectangles, scrollable without page overflow */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-800/50 text-xs font-semibold print:hidden overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 transition shrink-0 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 font-bold'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مشخصات و گالری</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_specs')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 transition shrink-0 ${
              activeTab === 'custom_specs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 font-bold'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <Settings2 className="w-4 h-4 text-emerald-600" />
            <span>سازنده جدول فنی ({specList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('related_machines')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 transition shrink-0 ${
              activeTab === 'related_machines'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 font-bold'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <ListPlus className="w-4 h-4 text-amber-600" />
            <span>دستگاه‌های مکمل ({relatedDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('status_history')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 transition shrink-0 ${
              activeTab === 'status_history'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-zinc-900 font-bold'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>تاریخچه وضعیت ({statusLogs.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 print:overflow-visible">
          
          {/* Header Title & Model (Visible in all tabs) */}
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-1">
              {device.name}
            </h2>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>برند / مدل: <strong>{device.model || 'نامشخص'}</strong></span>
              </span>
              {device.serialNumber && (
                <span className="text-xs font-mono text-zinc-400">
                  (سریال: {device.serialNumber})
                </span>
              )}
              {device.year && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>سال ساخت: {device.year}</span>
                </span>
              )}
              {device.location && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>محل استقرار: {device.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* TAB 1: Overview & Gallery */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Photo Gallery */}
              <div className="space-y-3 print:break-inside-avoid">
                <div className="relative aspect-16/9 bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group">
                  {currentImage ? (
                    <img
                      src={currentImage.url}
                      alt={currentImage.title || device.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-zinc-500 text-sm">عکسی برای این دستگاه آپلود نشده است</div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition shadow-md print:hidden"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition shadow-md print:hidden"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {currentImage && currentImage.title && (
                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-xl font-medium">
                      📷 {currentImage.title}
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none print:hidden">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                          idx === activeImageIndex
                            ? 'border-blue-600 scale-102 shadow-sm'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial & Warranty Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs text-zinc-400 block mb-1">قیمت دستگاه:</span>
                  <div className="text-lg font-black text-zinc-900 dark:text-white font-mono">
                    {price > 0 ? (
                      <>
                        <span>{price.toLocaleString('fa-IR')}</span>
                        <span className="text-xs font-sans text-zinc-500 mr-1.5">تومان</span>
                      </>
                    ) : (
                      <span className="text-blue-600 text-sm font-sans">قیمت توافقی / روز</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs text-zinc-400 block mb-1">شرایط پرداخت نقد و اقساط:</span>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    <span className="text-emerald-600">%{device.cashPercentage} نقد</span> +{' '}
                    <span className="text-indigo-600">%{device.installmentPercentage} اقساط</span>
                  </div>
                  {price > 0 && device.installmentPercentage > 0 && (
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      نقد: {cashAmount.toLocaleString('fa-IR')} ت
                      {checkMonths > 0 && ` (${checkMonths} قسط ماهانه ${perCheckAmount.toLocaleString('fa-IR')} ت)`}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs text-zinc-400 block mb-1">ضمانت ماشین‌ابزار چوب:</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {device.warrantyMonths > 0
                        ? `${device.warrantyMonths} ماه گارانتی قطعات و پشتیبانی`
                        : 'بدون گارانتی شرکتی'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Free Text Specs & Notes */}
              {device.specsText && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>خلاصه مشخصات فنی دستگاه:</span>
                  </h4>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {device.specsText}
                  </p>
                </div>
              )}

              {/* Structured Spec Table preview in Overview */}
              {specList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-emerald-600" />
                      <span>جدول مشخصات فنی تفکیک‌شده:</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('custom_specs')}
                      className="text-xs text-blue-600 hover:underline print:hidden"
                    >
                      ویرایش و افزودن مشخصات →
                    </button>
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-right divide-y divide-zinc-200 dark:divide-zinc-700">
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {specList.map((sp) => (
                          <tr key={sp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="w-1/3 px-4 py-2.5 font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/30">
                              {sp.key}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">
                              {sp.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Device Status History & Quick Transition Section */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>تاریخچه تغییرات وضعیت دستگاه</span>
                        <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {statusLogs.length} رویداد ثبت در LocalStorage
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        وضعیت فعلی: <span className="font-bold text-zinc-800 dark:text-zinc-200">{statusMeta.label}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('status_history')}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold flex items-center gap-1 self-start sm:self-auto print:hidden"
                  >
                    <span>مشاهده تمام وقایع ({statusLogs.length})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Status Update Form */}
                <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-750 space-y-3 print:hidden">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    تغییر سریع وضعیت دستگاه در گردش انبار:
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(['ready_for_sale', 'under_overhaul', 'sold'] as DeviceStatus[]).map((st) => {
                      const meta = STATUS_META[st];
                      const isCurrent = device.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleQuickStatusChange(st)}
                          disabled={isCurrent}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                            isCurrent
                              ? `${meta.badgeClass} ring-2 ring-offset-1 ring-blue-500 opacity-90 cursor-default`
                              : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                          <span>{meta.label}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 mr-auto" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newStatusNote}
                      onChange={(e) => setNewStatusNote(e.target.value)}
                      placeholder="یادداشت یا علت تغییر وضعیت (اختیاری: مثلاً تست سلامت تیغه، تحویل به مشتری...)"
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                    />
                  </div>

                  {statusChangeSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{statusChangeSuccess}</span>
                    </div>
                  )}
                </div>

                {/* Recent Status Logs Timeline (Short Preview) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">
                    تاریخچه کوتاهی از تغییرات اخیر:
                  </span>

                  {statusLogs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      هنوز تغییری برای این دستگاه ثبت نشده است. با انتخاب وضعیت جدید در بالا، سابقه آن بلافاصله در LocalStorage ثبت می‌شود.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {statusLogs.slice(0, 3).map((log) => {
                        const toMeta = STATUS_META[log.toStatus] || STATUS_META.ready_for_sale;
                        const fromMeta = log.fromStatus === 'initial' 
                          ? { label: 'ثبت اولیه', badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' }
                          : STATUS_META[log.fromStatus as DeviceStatus] || STATUS_META.ready_for_sale;

                        return (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${fromMeta.badgeClass}`}>
                                  {fromMeta.label}
                                </span>
                                <ArrowLeft className="w-3 h-3 text-zinc-400" />
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${toMeta.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${toMeta.dotClass}`} />
                                  {toMeta.label}
                                </span>
                                {log.changedBy && (
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                    توسط: {log.changedBy}
                                  </span>
                                )}
                              </div>
                              {log.notes && (
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-normal pr-1">
                                  💬 {log.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 self-end sm:self-center shrink-0">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{formatPersianDateTime(log.timestamp)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Specifications Builder */}
          {activeTab === 'custom_specs' && (
            <div className="space-y-6">
              {/* Presets Toolbar */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>قالب‌های آماده مشخصات ماشین‌ابزار صنعت چوب</span>
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    می‌توانید با یک کلیک مشخصات فنی استاندارد لبه‌چسبان، دورکن، CNC یا پرس وکیوم را بارگذاری کنید.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      if (e.target.value) handleApplyPresetTemplate(e.target.value);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-blue-300 dark:border-blue-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                  >
                    <option value="">— انتخاب قالب آماده صنعت چوب —</option>
                    {WOODWORKING_SPEC_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {saveSpecsFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>مشخصات فنی با موفقیت ذخیره و بروزرسانی شد.</span>
                </div>
              )}

              {/* Add New Specification Row */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>افزودن مشخصه فنی سفارشی جدید:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    placeholder="نام پارامتر (مثلاً: ابعاد میز واگن)"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="مقدار مشخصه (مثلاً: ۳۸۰ سانتی‌متر واگنی)"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن سطر</span>
                  </button>
                </div>
              </div>

              {/* Existing Specifications Table with Direct Inline Editing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    لیست مشخصات فنی ثبت‌شده ({specList.length} پارامتر):
                  </h4>
                </div>

                {specList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    هنوز مشخصه فنی تفکیک‌شده‌ای اضافه نشده است. می‌توانید با دکمه بالا مشخصه دلخواه اضافه کنید یا از قالب‌های آماده صنعت چوب استفاده نمایید.
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-right divide-y divide-zinc-200 dark:divide-zinc-700">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-600 dark:text-zinc-300">
                        <tr>
                          <th className="w-12 px-3 py-2.5 text-center">ردیف</th>
                          <th className="w-1/3 px-3 py-2.5">نام مشخصه / پارامتر</th>
                          <th className="px-3 py-2.5">مقدار / شرح فنی</th>
                          <th className="w-16 px-3 py-2.5 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {specList.map((sp, idx) => (
                          <tr key={sp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            <td className="px-3 py-2 text-center font-mono text-zinc-400">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={sp.key}
                                onChange={(e) => handleUpdateSpecRow(sp.id, e.target.value, sp.value)}
                                className="w-full px-2 py-1 rounded-lg bg-transparent font-bold text-zinc-800 dark:text-zinc-200 border border-transparent hover:border-zinc-300 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={sp.value}
                                onChange={(e) => handleUpdateSpecRow(sp.id, sp.key, e.target.value)}
                                className="w-full px-2 py-1 rounded-lg bg-transparent text-zinc-700 dark:text-zinc-300 border border-transparent hover:border-zinc-300 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleDeleteSpecRow(sp.id)}
                                title="حذف این مشخصه"
                                className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Related Machines / Custom Curated Package */}
          {activeTab === 'related_machines' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ListPlus className="w-4 h-4 text-amber-600" />
                  <span>ساخت لیست سفارشی دستگاه‌های مکمل و پکیج کارگاهی چوب</span>
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  می‌توانید دستگاه‌های مکمل (مانند دورکن + لبه‌چسبان + مکنده دوقلو) را به لیست این دستگاه پیوست کنید تا به عنوان یک پکیج جامع خط تولید کابینت یا کارگاه نجاری به خریدار پیشنهاد داده شود.
                </p>
              </div>

              {/* Add Machine to Curated List Selector */}
              {availableToAddAsRelated.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                    افزودن دستگاه از انبار:
                  </span>
                  <select
                    value={selectedRelatedId}
                    onChange={(e) => setSelectedRelatedId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">— یک دستگاه از انبار را انتخاب کنید —</option>
                    {availableToAddAsRelated.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.model}) — {d.price ? `${(d.price / 1000000).toLocaleString('fa-IR')} م تومان` : 'توافقی'}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddRelatedDevice}
                    disabled={!selectedRelatedId}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن به لیست پیشنهادی</span>
                  </button>
                </div>
              )}

              {/* List of Curated Related Machines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    دستگاه‌های موجود در لیست پکیج این ماشین ({relatedDevices.length} دستگاه):
                  </h4>
                  {relatedDevices.length > 0 && totalPackagePrice > 0 && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      مجموع قیمت پکیج کامل: {Number(totalPackagePrice).toLocaleString('fa-IR')} تومان
                    </div>
                  )}
                </div>

                {relatedDevices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    هنوز دستگاه مکملی به لیست این محصول اضافه نشده است. با منوی کشویی بالا می‌توانید دستگاه‌های همکار (مانند مکنده یا لبه‌چسبان) را به این لیست اضافه فرمایید.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedDevices.map((rel) => {
                      const relCover = rel.images?.find((i) => i.isCover) || rel.images?.[0];
                      return (
                        <div
                          key={rel.id}
                          className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3 relative group"
                        >
                          <div className="w-14 h-14 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                            {relCover ? (
                              <img src={relCover.url} alt={rel.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px]">
                                بدون عکس
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                              {rel.name}
                            </h5>
                            <span className="text-[11px] text-zinc-500 block truncate">
                              {rel.model || rel.category}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                {rel.price ? `${Number(rel.price).toLocaleString('fa-IR')} ت` : 'توافقی'}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                (%{rel.cashPercentage} نقد / %{rel.installmentPercentage} اقساط)
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveRelatedDevice(rel.id)}
                            title="حذف از لیست پکیج"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Comprehensive Status History Timeline */}
          {activeTab === 'status_history' && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                      <span>پرونده تغییرات وضعیت و گردش انبار</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-200/60 dark:bg-purple-900/60 text-purple-900 dark:text-purple-300">
                        {statusLogs.length} رویداد
                      </span>
                    </h4>
                    <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                      تمامی تغییرات وضعیت در حافظه مرورگر (LocalStorage) ذخیره شده و در مراجعات بعدی در دسترس است.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">وضعیت کنونی:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${statusMeta.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {/* Status Update & Note Logging Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                    <span>ثبت تغییر وضعیت جدید همراه با یادداشت:</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    اپراتور جاری: {currentUser?.displayName || currentUser?.email || 'کاربر سیستم'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['ready_for_sale', 'under_overhaul', 'sold'] as DeviceStatus[]).map((st) => {
                    const meta = STATUS_META[st];
                    const isCurrent = device.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleQuickStatusChange(st)}
                        disabled={isCurrent}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                          isCurrent
                            ? `${meta.badgeClass} ring-2 ring-offset-1 ring-purple-500 opacity-90 cursor-default shadow-xs`
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                        <span>{meta.label}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 mr-auto" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={newStatusNote}
                    onChange={(e) => setNewStatusNote(e.target.value)}
                    placeholder="شرح یا توضیحات این مرحله (مثلاً: تعویض فک وکیوم، فروش نقدی به مشتری اصفهان، انتقال به نمایشگاه...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                  />
                </div>

                {statusChangeSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{statusChangeSuccess}</span>
                  </div>
                )}
              </div>

              {/* Full Timeline List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>گاه‌شمار وقایع دستگاه ({statusLogs.length} ثبت تاریخی):</span>
                  </h4>
                </div>

                {statusLogs.length === 0 ? (
                  <div className="p-10 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    هنوز تغییری برای این دستگاه در LocalStorage ثبت نشده است. با انتخاب دکمه‌های وضعیت بالا، اولین سابقه ثبت خواهد شد.
                  </div>
                ) : (
                  <div className="relative pr-4 border-r-2 border-zinc-200 dark:border-zinc-700 space-y-4 mr-2">
                    {statusLogs.map((log, idx) => {
                      const toMeta = STATUS_META[log.toStatus] || STATUS_META.ready_for_sale;
                      const fromMeta = log.fromStatus === 'initial' 
                        ? { label: 'ثبت اولیه دستگاه', badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' }
                        : STATUS_META[log.fromStatus as DeviceStatus] || STATUS_META.ready_for_sale;

                      return (
                        <div key={log.id} className="relative group">
                          {/* Timeline dot */}
                          <div className={`absolute -right-[23px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${toMeta.dotClass} shadow-xs`} />

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2 hover:border-purple-300 dark:hover:border-purple-800 transition">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${fromMeta.badgeClass}`}>
                                  {fromMeta.label}
                                </span>
                                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${toMeta.badgeClass}`}>
                                  <span className={`w-2 h-2 rounded-full ${toMeta.dotClass}`} />
                                  {toMeta.label}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                    آخرین وضعیت
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                <span>{formatPersianDateTime(log.timestamp)}</span>
                              </div>
                            </div>

                            {log.notes && (
                              <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-700 dark:text-zinc-300">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 ml-1">یادداشت فنی / بازرگانی:</span>
                                {log.notes}
                              </div>
                            )}

                            <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                              <span>ثبت‌شده توسط: <strong>{log.changedBy || 'کاربر سیستم'}</strong></span>
                              <span className="font-mono text-[10px]">شناسه: {log.id}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAICaption(device);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 transition"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>ساخت کپشن فروش با هوش مصنوعی</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAIFixSpelling(device);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-semibold transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>اصلاح غلط املایی و نگارش چوب با AI</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
