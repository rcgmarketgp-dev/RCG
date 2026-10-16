import React, { useState } from 'react';
import { DeviceItem, CategoryInfo, DeviceStatus, DeviceImage } from '../types/device';
import { checkAndFixSpellingWithAI } from '../lib/aiClient';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Wand2, 
  Sparkles, 
  Star, 
  Upload, 
  ShieldCheck, 
  Coins, 
  Check, 
  Layers
} from 'lucide-react';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: DeviceItem) => void;
  initialDevice: DeviceItem | null;
  categories: CategoryInfo[];
}

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDevice,
  categories,
}) => {
  const isEditing = Boolean(initialDevice);

  const [name, setName] = useState(initialDevice?.name || '');
  const [model, setModel] = useState(initialDevice?.model || '');
  const [category, setCategory] = useState(initialDevice?.category || categories[0]?.name || 'ماشین‌آلات CNC و تراشکاری');
  const [status, setStatus] = useState<DeviceStatus>(initialDevice?.status || 'ready_for_sale');
  const [cashPercentage, setCashPercentage] = useState<number>(initialDevice?.cashPercentage ?? 40);
  const [installmentPercentage, setInstallmentPercentage] = useState<number>(initialDevice?.installmentPercentage ?? 60);
  const [installmentMonths, setInstallmentMonths] = useState<number>(initialDevice?.installmentMonths ?? 6);
  const [warrantyMonths, setWarrantyMonths] = useState<any>(initialDevice?.warrantyMonths ?? 6);
  const [price, setPrice] = useState<string>(initialDevice?.price ? String(initialDevice.price) : '');
  const [year, setYear] = useState(initialDevice?.year || '');
  const [serialNumber, setSerialNumber] = useState(initialDevice?.serialNumber || '');
  const [location, setLocation] = useState(initialDevice?.location || '');
  const [specsText, setSpecsText] = useState(initialDevice?.specsText || '');
  const [notes, setNotes] = useState(initialDevice?.notes || '');
  const [images, setImages] = useState<DeviceImage[]>(initialDevice?.images || []);

  // Image input state
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [aiChecking, setAiChecking] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sync cash + installment percentages
  const handleCashChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setCashPercentage(clamped);
    setInstallmentPercentage(100 - clamped);
  };

  const handleInstallmentChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setInstallmentPercentage(clamped);
    setCashPercentage(100 - clamped);
  };

  // Add image by URL
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const newImg: DeviceImage = {
      id: `img-${Date.now()}`,
      url: newImageUrl.trim(),
      title: newImageTitle.trim() || `تصویر ${images.length + 1}`,
      isCover: images.length === 0,
    };
    setImages((prev) => [...prev, newImg]);
    setNewImageUrl('');
    setNewImageTitle('');
  };

  // Upload local image via file reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        if (dataUrl) {
          setImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${index}`,
              url: dataUrl,
              title: file.name.replace(/\.[^/.]+$/, ''),
              isCover: prev.length === 0 && index === 0,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSetCover = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === id,
      }))
    );
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((i) => i.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  // Direct AI proofread in the form
  const handleAISpellCheck = async () => {
    try {
      setAiChecking(true);
      setAiNotice(null);
      const res = await checkAndFixSpellingWithAI({
        name,
        model,
        category,
        specsText,
        notes,
      });

      if (res.name) setName(res.name);
      if (res.model) setModel(res.model);
      if (res.specsText) setSpecsText(res.specsText);
      if (res.notes) setNotes(res.notes);

      if (res.corrections && res.corrections.length > 0) {
        setAiNotice(`${res.corrections.length} مورد غلط املایی و نگارشی اصلاح شد.`);
      } else {
        setAiNotice('متن و مشخصات بررسی شد و ایرادی یافت نشد.');
      }
    } catch {
      setAiNotice('خطا در ارتباط با هوش مصنوعی.');
    } finally {
      setAiChecking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined;

    const deviceData: DeviceItem = {
      id: initialDevice?.id || `dev-${Date.now()}`,
      code: initialDevice?.code || `EQP-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      model: model.trim(),
      category,
      status,
      cashPercentage,
      installmentPercentage,
      installmentMonths,
      warrantyMonths,
      price: parsedPrice,
      year: year.trim(),
      serialNumber: serialNumber.trim(),
      location: location.trim(),
      specsText: specsText.trim(),
      notes: notes.trim(),
      images,
      specList: initialDevice?.specList || [],
      relatedDeviceIds: initialDevice?.relatedDeviceIds || [],
      createdAt: initialDevice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(deviceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              {isEditing ? 'ویرایش مشخصات دستگاه' : 'ثبت دستگاه جدید در انبار'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              اطلاعات، شرایط پرداخت، گارانتی، دسته‌بندی و تصاویر دستگاه را وارد نمایید.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* AI Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                بررسی خودکار غلط‌های املایی، نام برندها و نگارش با هوش مصنوعی
              </span>
            </div>
            <button
              type="button"
              onClick={handleAISpellCheck}
              disabled={aiChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Wand2 className={`w-3.5 h-3.5 ${aiChecking ? 'animate-spin' : ''}`} />
              <span>{aiChecking ? 'در حال بررسی...' : 'اصلاح املایی با هوش مصنوعی'}</span>
            </button>
          </div>

          {aiNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{aiNotice}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Device Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                نام دستگاه <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: دستگاه فرز CNC عمودی ۳ محوره / تزریق پلاستیک ۲۵۰ تن"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Model & Brand */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                مدل و برند سازنده
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="مثال: Haas VF-3 / کنترلر زیمنس 840D"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                دسته‌بندی دستگاه
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                وضعیت فعلی دستگاه <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-semibold"
              >
                <option value="ready_for_sale">🟢 آماده فروش (تحویل فوری)</option>
                <option value="under_overhaul">🟡 در حال اورهال و بازسازی فنی</option>
                <option value="sold">⚪ فروخته شده (بایگانی)</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                قیمت پایه (تومان)
              </label>
              <input
                type="text"
                value={price ? Number(price.replace(/,/g, '')).toLocaleString('fa-IR') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setPrice(raw);
                }}
                placeholder="مثال: ۱,۸۵۰,۰۰۰,۰۰۰ (خالی = توافقی)"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Section 2: Payment Terms & Warranty (Crucial Requirement) */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>شرایط پرداخت تسهیلاتی و گارانتی:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cash % */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  پیش‌پرداخت نقد: <span className="font-bold text-emerald-600">%{cashPercentage}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cashPercentage}
                  onChange={(e) => handleCashChange(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Installment % */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  الباقی اقساط: <span className="font-bold text-indigo-600">%{installmentPercentage}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={installmentPercentage}
                  onChange={(e) => handleInstallmentChange(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Installment Months */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  تعداد ماه‌های اقساط (چک)
                </label>
                <select
                  value={installmentMonths}
                  onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                >
                  <option value={0}>بدون اقساط (تمام نقد)</option>
                  <option value={3}>۳ ماهه (۳ فقره چک)</option>
                  <option value={6}>۶ ماهه (۶ فقره چک)</option>
                  <option value={9}>۹ ماهه (۹ فقره چک)</option>
                  <option value={12}>۱۲ ماهه (۱ سال)</option>
                  <option value={18}>۱۸ ماهه</option>
                  <option value={24}>۲۴ ماهه (۲ سال)</option>
                </select>
              </div>
            </div>

            {/* Warranty Selector: 0, 3, 6, 9, 12 */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>مدت گارانتی معتبر شرکتی:</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { val: 0, label: 'بدون گارانتی' },
                  { val: 3, label: '۳ ماهه' },
                  { val: 6, label: '۶ ماهه' },
                  { val: 9, label: '۹ ماهه' },
                  { val: 12, label: '۱۲ ماهه' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.val}
                    onClick={() => setWarrantyMonths(item.val as any)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      warrantyMonths === item.val
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Specs & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                سال ساخت
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="مثال: 2022 / 1401"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                شماره سریال / پلاک
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="مثال: SN-99841"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                محل استقرار / انبار
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: کارخانه شمس‌آباد / انبار مرکزی"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              مشخصات فنی و توانمندی‌ها
            </label>
            <textarea
              rows={3}
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              placeholder="کورس محورها، توان موتور، ابعاد میز، سیستم خنک‌کننده، کنترلر و سایر پارامترهای فنی..."
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              توضیحات و شرایط فروش
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="نکات تحویل، تست فنی حضوری، همراه با تجهیزات جانبی و غیره..."
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Section 4: Image Gallery Management */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>گالری تصاویر دستگاه ({images.length} تصویر)</span>
              </h4>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-xs font-medium cursor-pointer text-zinc-700 dark:text-zinc-300 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>انتخاب فایل از سیستم</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Add Image by URL / Tag */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="لینک مستقیم تصویر (http://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
              <input
                type="text"
                value={newImageTitle}
                onChange={(e) => setNewImageTitle(e.target.value)}
                placeholder="عنوان/دسته تصویر (مثلاً نمای روبرو، پلاک)"
                className="w-full sm:w-48 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                افزودن
              </button>
            </div>

            {/* Image Thumbnails with Cover selection and Delete */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 aspect-4/3 bg-zinc-900"
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    
                    {/* Badge Cover */}
                    {img.isCover && (
                      <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-white" />
                        کاور اصلی
                      </span>
                    )}

                    {/* Bottom label */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-white text-[10px] truncate">
                      {img.title || 'بدون عنوان'}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className="p-1.5 rounded-lg bg-blue-600 text-white text-xs"
                          title="انتخاب به عنوان کاور اصلی"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="p-1.5 rounded-lg bg-red-600 text-white text-xs"
                        title="حذف تصویر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'ذخیره تغییرات' : 'ثبت قطعی دستگاه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
