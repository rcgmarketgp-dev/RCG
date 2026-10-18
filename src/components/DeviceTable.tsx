import React, { useState } from 'react';
import { ColumnConfig, DeviceItem, CategoryInfo, DeviceStatus } from '../types/device';
import { STATUS_META } from '../data/initialData';
import { 
  Sparkles, 
  Wand2, 
  Eye, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  ShieldCheck, 
  ChevronDown,
  PlusCircle,
  FileSpreadsheet,
  ZoomIn
} from 'lucide-react';
import { QuickLookModal } from './QuickLookModal';

interface DeviceTableProps {
  devices: DeviceItem[];
  columns: ColumnConfig[];
  categories: CategoryInfo[];
  onViewDevice: (device: DeviceItem) => void;
  onEditDevice: (device: DeviceItem) => void;
  onDeleteDevice: (device: DeviceItem) => void;
  onOpenAICaption: (device: DeviceItem) => void;
  onOpenAIFixSpelling: (device: DeviceItem) => void;
  onStatusChange: (device: DeviceItem, newStatus: DeviceStatus) => void;
  onAddNewDevice: () => void;
  onOpenExcelModal: () => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  columns,
  categories,
  onViewDevice,
  onEditDevice,
  onDeleteDevice,
  onOpenAICaption,
  onOpenAIFixSpelling,
  onStatusChange,
  onAddNewDevice,
  onOpenExcelModal,
}) => {
  const [quickLookDevice, setQuickLookDevice] = useState<DeviceItem | null>(null);
  const visibleColumns = [...columns].filter((c) => c.visible).sort((a, b) => a.order - b.order);

  const getCategoryMeta = (catName: string) => {
    return (
      categories.find((c) => c.name === catName) || {
        id: 'other',
        name: catName,
        colorBg: 'bg-zinc-100 dark:bg-zinc-800',
        colorText: 'text-zinc-700 dark:text-zinc-300',
        colorBorder: 'border-zinc-200 dark:border-zinc-700',
        colorBadge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        badgeHex: '#71717a',
        iconName: 'Cog',
        description: '',
      }
    );
  };

  if (devices.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800/90 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 mx-auto flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
          هیچ دستگاهی با این مشخصات یافت نشد
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
          می‌توانید فیلترهای جستجو را پاک کنید یا اولین مشخصات ماشین‌آلات خود را ثبت یا از فایل اکسل آپلود نمایید.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onAddNewDevice}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت دستی مشخصات دستگاه</span>
          </button>
          <button
            onClick={onOpenExcelModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>آپلود فایل اکسل (XLSX)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800/95 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-xs overflow-hidden w-full max-w-full">
      
      {/* MOBILE CARD VIEW: Completely fits screen width, scrolling only vertically (up and down) */}
      <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-700 p-2.5 sm:p-3 space-y-3">
        {devices.map((device) => {
          const catMeta = getCategoryMeta(device.category);
          const statusMeta = STATUS_META[device.status] || STATUS_META.ready_for_sale;
          const coverImg = device.images?.find((img) => img.isCover) || device.images?.[0];

          return (
            <div
              key={device.id}
              className="bg-zinc-50/70 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-750 p-3.5 space-y-3 shadow-2xs hover:shadow-md transition-all duration-200"
            >
              {/* Header of mobile card: Image + Title + Status */}
              <div className="flex items-start gap-3">
                {/* Rounded Square Thumbnail with Quick Look */}
                <div
                  onClick={() => setQuickLookDevice(device)}
                  className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 cursor-pointer relative group"
                  title="مشاهده تصویر بزرگتر (Quick Look)"
                >
                  {coverImg ? (
                    <img src={coverImg.url} alt={device.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <ImageIcon className="w-6 h-6 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <ZoomIn className="w-5 h-5 drop-shadow-md" />
                  </div>
                  {device.images && device.images.length > 1 && (
                    <span className="absolute bottom-1 left-1 bg-black/75 text-[9px] text-white px-1 rounded-sm font-mono z-10">
                      +{device.images.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {device.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${catMeta.colorBg} ${catMeta.colorText} ${catMeta.colorBorder}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-xs" style={{ backgroundColor: catMeta.badgeHex }} />
                      <span className="truncate max-w-[120px]">{device.category}</span>
                    </span>
                  </div>

                  <h4
                    onClick={() => onViewDevice(device)}
                    className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white hover:text-blue-600 transition truncate cursor-pointer"
                  >
                    {device.name}
                  </h4>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {device.model || 'بدون برند'} {device.year && `• ساخت ${device.year}`}
                  </div>
                </div>
              </div>

              {/* Status Selector & Price */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <div className="relative inline-block text-right">
                  <select
                    value={device.status}
                    onChange={(e) => onStatusChange(device, e.target.value as DeviceStatus)}
                    className={`appearance-none cursor-pointer pl-6 pr-2.5 py-1 rounded-xl text-xs font-bold border ${statusMeta.badgeClass} focus:outline-hidden transition shadow-2xs`}
                  >
                    <option value="ready_for_sale">آماده فروش</option>
                    <option value="under_overhaul">در حال اورهال</option>
                    <option value="sold">فروخته شده</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>

                <div className="text-left font-mono font-bold text-xs text-zinc-900 dark:text-white">
                  {device.price ? (
                    <>
                      <span>{Number(device.price).toLocaleString('fa-IR')}</span>
                      <span className="text-[10px] font-sans text-zinc-400 mr-1">ت</span>
                    </>
                  ) : (
                    <span className="text-zinc-400 font-sans text-xs">توافقی</span>
                  )}
                </div>
              </div>

              {/* Payment conditions & Warranty info */}
              <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="text-emerald-600">%{device.cashPercentage} نقد</span>
                  <span className="text-zinc-300">/</span>
                  <span className="text-indigo-600">%{device.installmentPercentage} اقساط</span>
                </div>
                {device.warrantyMonths > 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{device.warrantyMonths} ماه ضمانت</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-400">بدون گارانتی</span>
                )}
              </div>

              {/* Action Buttons Row: Rounded Rectangles / Squares */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => onViewDevice(device)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>مشخصات</span>
                </button>

                <button
                  onClick={() => onOpenAICaption(device)}
                  title="کپشن هوشمند فروش"
                  className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center active:scale-95 transition"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenAIFixSpelling(device)}
                  title="اصلاح هوشمند نگارش"
                  className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 border border-blue-200 dark:border-blue-800 flex items-center justify-center active:scale-95 transition"
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onEditDevice(device)}
                  title="ویرایش اطلاعات"
                  className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center active:scale-95 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteDevice(device)}
                  title="حذف دستگاه"
                  className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 border border-red-200 dark:border-red-900/60 flex items-center justify-center active:scale-95 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto w-full max-w-full">
        <table className="w-full text-right text-xs">
          {/* Dynamic Table Header based on user order */}
          <thead className="bg-zinc-50/90 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  style={{ minWidth: col.minWidth || '120px' }}
                  className="px-4 py-3.5 first:pr-5 last:pl-5 text-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
            {devices.map((device) => {
              const catMeta = getCategoryMeta(device.category);
              const statusMeta = STATUS_META[device.status] || STATUS_META.ready_for_sale;
              const coverImg = device.images?.find((img) => img.isCover) || device.images?.[0];

              return (
                <tr
                  key={device.id}
                  className="hover:bg-blue-50/30 dark:hover:bg-zinc-700/30 transition-colors group"
                >
                  {visibleColumns.map((col) => {
                    switch (col.key) {
                      case 'code':
                        return (
                          <td key={col.id} className="px-4 py-3 first:pr-5 font-mono font-bold text-zinc-500 dark:text-zinc-400">
                            {device.code}
                          </td>
                        );

                      case 'imagesCount':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div
                              onClick={() => setQuickLookDevice(device)}
                              className="relative w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer group-hover:scale-105 transition shadow-2xs group/img"
                              title="مشاهده تصویر بزرگتر (Quick Look)"
                            >
                              {coverImg ? (
                                <img
                                  src={coverImg.url}
                                  alt={device.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              {/* Hover Quick Look overlay icon */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <ZoomIn className="w-4 h-4 drop-shadow-md" />
                              </div>
                              {device.images && device.images.length > 1 && (
                                <span className="absolute bottom-0.5 left-0.5 bg-black/75 text-[10px] text-white px-1 rounded-sm font-mono z-10">
                                  +{device.images.length}
                                </span>
                              )}
                            </div>
                          </td>
                        );

                      case 'name':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <button
                              onClick={() => onViewDevice(device)}
                              className="text-right font-bold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition block max-w-xs truncate"
                              title={device.name}
                            >
                              {device.name}
                            </button>
                            {device.location && (
                              <span className="text-[11px] text-zinc-400 block truncate max-w-xs mt-0.5">
                                📍 {device.location}
                              </span>
                            )}
                          </td>
                        );

                      case 'model':
                        return (
                          <td key={col.id} className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                            <span className="block max-w-[180px] truncate" title={device.model}>
                              {device.model || '—'}
                            </span>
                          </td>
                        );

                      case 'category':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${catMeta.colorBg} ${catMeta.colorText} ${catMeta.colorBorder}`}
                            >
                              <span
                                className="w-2 h-2 rounded-xs shrink-0"
                                style={{ backgroundColor: catMeta.badgeHex }}
                              />
                              <span className="truncate max-w-[150px]">{device.category}</span>
                            </span>
                          </td>
                        );

                      case 'status':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="relative inline-block text-right">
                              <select
                                value={device.status}
                                onChange={(e) => onStatusChange(device, e.target.value as DeviceStatus)}
                                className={`appearance-none cursor-pointer pl-6 pr-2.5 py-1 rounded-xl text-xs font-semibold border ${statusMeta.badgeClass} focus:outline-hidden transition shadow-2xs hover:shadow-xs`}
                              >
                                <option value="ready_for_sale">آماده فروش</option>
                                <option value="under_overhaul">در حال اورهال</option>
                                <option value="sold">فروخته شده</option>
                              </select>
                              <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>
                          </td>
                        );

                      case 'cashPercentage':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                              <span>%{device.cashPercentage}</span>
                              <span className="text-[10px] text-zinc-400 font-normal">نقد</span>
                            </div>
                          </td>
                        );

                      case 'installmentPercentage':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                                <span>%{device.installmentPercentage}</span>
                                <span className="text-[10px] text-zinc-400 font-normal">
                                  {device.installmentMonths ? `(${device.installmentMonths} قسط)` : 'اقساط'}
                                </span>
                              </div>
                              {/* Visual mini bar */}
                              <div className="w-20 h-1.5 rounded-sm bg-zinc-200 dark:bg-zinc-700 overflow-hidden mt-1 flex">
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{ width: `${device.cashPercentage}%` }}
                                  title={`نقد: ${device.cashPercentage}%`}
                                />
                                <div
                                  className="bg-indigo-500 h-full"
                                  style={{ width: `${device.installmentPercentage}%` }}
                                  title={`اقساط: ${device.installmentPercentage}%`}
                                />
                              </div>
                            </div>
                          </td>
                        );

                      case 'warrantyMonths':
                        return (
                          <td key={col.id} className="px-4 py-3">
                            {device.warrantyMonths > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{device.warrantyMonths} ماهه</span>
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-xs">بدون گارانتی</span>
                            )}
                          </td>
                        );

                      case 'price':
                        return (
                          <td key={col.id} className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                            {device.price ? (
                              <div>
                                <span>{Number(device.price).toLocaleString('fa-IR')}</span>
                                <span className="text-[10px] text-zinc-400 mr-1 font-sans">تومان</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 font-sans">توافقی</span>
                            )}
                          </td>
                        );

                      case 'year':
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                            {device.year || '—'}
                          </td>
                        );

                      case 'actions':
                        return (
                          <td key={col.id} className="px-4 py-3 last:pl-5">
                            <div className="flex items-center gap-1.5">
                              {/* AI Caption generator button */}
                              <button
                                onClick={() => onOpenAICaption(device)}
                                title="تولید کپشن فروش با هوش مصنوعی برای اینستاگرام، تلگرام و..."
                                className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>

                              {/* AI Fix spelling & polish */}
                              <button
                                onClick={() => onOpenAIFixSpelling(device)}
                                title="اصلاح غلط املایی و نگارش فنی با هوش مصنوعی"
                                className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                              >
                                <Wand2 className="w-4 h-4" />
                              </button>

                              {/* View detail */}
                              <button
                                onClick={() => onViewDevice(device)}
                                title="مشاهده پروفایل کامل و گالری"
                                className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => onEditDevice(device)}
                                title="ویرایش اطلاعات دستگاه"
                                className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => onDeleteDevice(device)}
                                title="حذف دستگاه"
                                className="w-8 h-8 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 flex items-center justify-center hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        );

                      default:
                        return (
                          <td key={col.id} className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {String((device as any)[col.key] || '—')}
                          </td>
                        );
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Look Modal for Instant Image Inspection */}
      <QuickLookModal
        isOpen={!!quickLookDevice}
        onClose={() => setQuickLookDevice(null)}
        device={quickLookDevice}
        onViewFullDetails={onViewDevice}
        onOpenAICaption={onOpenAICaption}
      />
    </div>
  );
};
