import React, { useState } from 'react';
import { DeviceItem, CategoryInfo, DeviceStatus, BroadcastSchedule } from '../types/device';
import { STATUS_META } from '../data/initialData';
import { BROADCAST_PLATFORMS, formatScheduledDateTime } from '../lib/broadcastSchedule';
import { 
  Sparkles, 
  Wand2, 
  Eye, 
  ShieldCheck, 
  Image as ImageIcon, 
  Layers, 
  ArrowLeft,
  Coins,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  ChevronDown,
  Calendar
} from 'lucide-react';

interface DeviceShowcaseProps {
  devices: DeviceItem[];
  categories: CategoryInfo[];
  onViewDevice: (device: DeviceItem) => void;
  onOpenAICaption: (device: DeviceItem) => void;
  onOpenAIFixSpelling: (device: DeviceItem) => void;
  onStatusChange: (device: DeviceItem, newStatus: DeviceStatus) => void;
  onOpenScheduleModal?: (device: DeviceItem) => void;
  onDeleteSchedule?: (deviceId: string, scheduleId: string) => void;
  onToggleScheduleStatus?: (deviceId: string, scheduleId: string) => void;
}

export const DeviceShowcase: React.FC<DeviceShowcaseProps> = ({
  devices,
  categories,
  onViewDevice,
  onOpenAICaption,
  onOpenAIFixSpelling,
  onOpenScheduleModal,
  onDeleteSchedule,
  onToggleScheduleStatus,
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
      {/* Category Dropdown List Filter (لیست کشویی دسته‌بندی ویترین) */}
      <div className="bg-white dark:bg-zinc-800/90 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
              انتخاب دسته‌بندی ویترین (لیست کشویی)
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              نمایش تخصصی ماشین‌آلات بر اساس دسته انتخاب‌شده
            </p>
          </div>
        </div>

        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <select
            value={selectedCategoryTab}
            onChange={(e) => setSelectedCategoryTab(e.target.value)}
            className="w-full px-3.5 py-2.5 pr-9 pl-9 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer appearance-none shadow-2xs transition"
          >
            <option value="all">همه دسته‌بندی‌ها (مجموع {devices.length} دستگاه)</option>
            {categories.map((cat) => {
              const count = devices.filter((d) => d.category === cat.name).length;
              return (
                <option key={cat.id} value={cat.name}>
                  {cat.name} ({count} دستگاه)
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Layers className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                const deviceSchedules = device.schedules || [];

                return (
                  <div
                    key={device.id}
                    className="bg-white dark:bg-zinc-800/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-700 overflow-hidden shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex flex-col group"
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

                          {/* Dual progress bar */}
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
                        <div className="flex items-center justify-between mb-3">
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

                        {/* ======================================================== */}
                        {/* Dedicated Broadcast Scheduling Section for this Device  */}
                        {/* ======================================================== */}
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-2.5 mb-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>زمان‌بندی ارسال آگهی ({deviceSchedules.length})</span>
                            </div>
                            {onOpenScheduleModal && (
                              <button
                                onClick={() => onOpenScheduleModal(device)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-2xs transition active:scale-95"
                                title="افزودن زمان‌بندی جدید برای ارسال به کانال یا گروه"
                              >
                                <Plus className="w-3 h-3" />
                                <span>افزودن</span>
                              </button>
                            )}
                          </div>

                          {/* List of schedules */}
                          {deviceSchedules.length === 0 ? (
                            <div className="text-[11px] text-zinc-400 py-1 text-center">
                              هنوز زمان‌بندی ارسالی برای این دستگاه تعریف نشده است.
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                              {deviceSchedules.map((sched) => {
                                const platformInfo = BROADCAST_PLATFORMS[sched.platform] || BROADCAST_PLATFORMS.other;
                                const isSent = sched.status === 'sent';

                                return (
                                  <div
                                    key={sched.id}
                                    className="p-2 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-1 text-[11px]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`px-1.5 py-0.2 rounded-md font-bold text-[10px] ${platformInfo.badgeBg} ${platformInfo.badgeText}`}>
                                          {platformInfo.name}
                                        </span>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate" title={sched.channelOrGroupName}>
                                          {sched.channelOrGroupName}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                                        <Calendar className="w-2.5 h-2.5" />
                                        <span>{formatScheduledDateTime(sched.scheduledDateTime)}</span>
                                        {isSent && (
                                          <span className="text-emerald-600 font-bold mr-1">✓ ارسال شد</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {onToggleScheduleStatus && (
                                        <button
                                          onClick={() => onToggleScheduleStatus(device.id, sched.id)}
                                          title={isSent ? 'تغییر به در انتظار' : 'علامت‌گذاری به عنوان ارسال شده'}
                                          className={`p-1 rounded-lg transition ${
                                            isSent 
                                              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                                              : 'text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100'
                                          }`}
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => onOpenAICaption(device)}
                                        title="ارسال مستقیم آگهی این دستگاه"
                                        className="p-1 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>

                                      {onDeleteSchedule && (
                                        <button
                                          onClick={() => onDeleteSchedule(device.id, sched.id)}
                                          title="حذف این زمان‌بندی"
                                          className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
