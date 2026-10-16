import React, { useState } from 'react';
import { DeviceItem, CategoryInfo, DeviceStatus } from '../types/device';
import { STATUS_META } from '../data/initialData';
import { 
  Sparkles, 
  Wand2, 
  Eye, 
  ShieldCheck, 
  Image as ImageIcon, 
  Layers, 
  ArrowLeft,
  Coins
} from 'lucide-react';

interface DeviceShowcaseProps {
  devices: DeviceItem[];
  categories: CategoryInfo[];
  onViewDevice: (device: DeviceItem) => void;
  onOpenAICaption: (device: DeviceItem) => void;
  onOpenAIFixSpelling: (device: DeviceItem) => void;
  onStatusChange: (device: DeviceItem, newStatus: DeviceStatus) => void;
}

export const DeviceShowcase: React.FC<DeviceShowcaseProps> = ({
  devices,
  categories,
  onViewDevice,
  onOpenAICaption,
  onOpenAIFixSpelling,
}) => {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Group devices by category
  const categoriesWithDevices = categories.map((cat) => {
    const items = devices.filter((d) => d.category === cat.name);
    return {
      category: cat,
      items,
    };
  });

  // Additional devices not matching existing categories
  const otherItems = devices.filter(
    (d) => !categories.some((c) => c.name === d.category)
  );

  const displayedGroups = selectedCategoryTab === 'all'
    ? categoriesWithDevices.filter((g) => g.items.length > 0)
    : categoriesWithDevices.filter((g) => g.category.name === selectedCategoryTab);

  return (
    <div className="space-y-8">
      {/* Category Quick Filter Buttons with Category Colors */}
      <div className="bg-white dark:bg-zinc-800/90 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-zinc-400 font-semibold shrink-0 ml-1">دسته‌بندی ویترین:</span>
          <button
            onClick={() => setSelectedCategoryTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
              selectedCategoryTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            همه دسته‌ها ({devices.length})
          </button>
          {categories.map((cat) => {
            const count = devices.filter((d) => d.category === cat.name).length;
            if (count === 0) return null;
            const isSelected = selectedCategoryTab === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryTab(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 shadow-xs'
                    : `${cat.colorBg} ${cat.colorText} ${cat.colorBorder}`
                }`}
              >
                <span
                  className="w-2 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: cat.badgeHex }}
                />
                <span>{cat.name}</span>
                <span className="text-[11px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render each Category section */}
      {displayedGroups.length === 0 && otherItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            دستگاهی در این دسته‌بندی موجود نیست
          </h4>
        </div>
      ) : (
        displayedGroups.map(({ category, items }) => (
          <div key={category.id} className="space-y-4">
            {/* Category Header Banner */}
            <div
              className={`p-4 rounded-2xl border ${category.colorBg} ${category.colorBorder} flex items-center justify-between shadow-2xs`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: category.badgeHex }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-base ${category.colorText}`}>
                      {category.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white/80 dark:bg-black/30 border border-current">
                      {items.length} دستگاه
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Device Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {items.map((device) => {
                const statusMeta = STATUS_META[device.status] || STATUS_META.ready_for_sale;
                const coverImg = device.images?.find((i) => i.isCover) || device.images?.[0];

                return (
                  <div
                    key={device.id}
                    className="bg-white dark:bg-zinc-800/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-700 overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex flex-col group"
                  >
                    {/* Image Thumbnail with Overlay Badges */}
                    <div className="relative h-48 bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer" onClick={() => onViewDevice(device)}>
                      {coverImg ? (
                        <img
                          src={coverImg.url}
                          alt={device.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-xs">بدون تصویر ثبت‌شده</span>
                        </div>
                      )}

                      {/* Status Badge: Rounded Rect */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shadow-xs backdrop-blur-md border ${statusMeta.badgeClass}`}
                        >
                          <span className={`w-2 h-2 rounded-xs ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* Photo Count: Rounded Rect */}
                      {device.images && device.images.length > 0 && (
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{device.images.length} تصویر</span>
                        </div>
                      )}

                      {/* Device Code: Rounded Rect */}
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs text-zinc-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        {device.code}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title & Model */}
                        <h4
                          onClick={() => onViewDevice(device)}
                          className="font-bold text-sm text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-1 mb-1 transition"
                          title={device.name}
                        >
                          {device.name}
                        </h4>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mb-3">
                          {device.model || 'بدون مشخصات برند'}
                        </div>

                        {/* Payment Conditions & Warranty Bar */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60 mb-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">شرایط پرداخت:</span>
                            <div className="flex items-center gap-2 font-bold">
                              <span className="text-emerald-600">%{device.cashPercentage} نقد</span>
                              <span className="text-zinc-300">|</span>
                              <span className="text-indigo-600">%{device.installmentPercentage} اقساط</span>
                            </div>
                          </div>

                          {/* Dual progress bar: Rounded rect */}
                          <div className="w-full h-1.5 rounded-sm bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${device.cashPercentage}%` }}
                            />
                            <div
                              className="bg-indigo-500 h-full"
                              style={{ width: `${device.installmentPercentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400">گارانتی:</span>
                            {device.warrantyMonths > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{device.warrantyMonths} ماه شرکتی</span>
                              </span>
                            ) : (
                              <span className="text-zinc-400">فاقد گارانتی</span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-zinc-400" />
                            قیمت پایه:
                          </span>
                          <span className="font-bold text-sm text-zinc-900 dark:text-white font-mono">
                            {device.price ? (
                              <>
                                <span>{Number(device.price).toLocaleString('fa-IR')}</span>
                                <span className="text-[11px] font-sans mr-1 text-zinc-500">تومان</span>
                              </>
                            ) : (
                              <span className="text-xs font-sans text-blue-600">تماس بگیرید</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between gap-1.5">
                        {/* AI Caption button */}
                        <button
                          onClick={() => onOpenAICaption(device)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-semibold hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                          title="تولید کپشن فروش با هوش مصنوعی"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>کپشن AI</span>
                        </button>

                        {/* AI Polish */}
                        <button
                          onClick={() => onOpenAIFixSpelling(device)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-semibold hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                          title="ویرایش و اصلاح هوشمند مشخصات"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>اصلاح متن</span>
                        </button>

                        {/* View Profile */}
                        <button
                          onClick={() => onViewDevice(device)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 text-xs font-bold hover:-translate-y-0.5 active:scale-95 transition-all duration-200 mr-auto shadow-xs"
                        >
                          <span>مشاهده</span>
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
