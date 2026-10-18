import React, { useState, useEffect } from 'react';
import { DeviceItem, DeviceStatus } from '../types/device';
import { STATUS_META } from '../data/initialData';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Image as ImageIcon,
  Calendar,
  Layers
} from 'lucide-react';

interface QuickLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceItem | null;
  initialImageIndex?: number;
  onViewFullDetails?: (device: DeviceItem) => void;
  onOpenAICaption?: (device: DeviceItem) => void;
}

export const QuickLookModal: React.FC<QuickLookModalProps> = ({
  isOpen,
  onClose,
  device,
  initialImageIndex = 0,
  onViewFullDetails,
  onOpenAICaption,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(initialImageIndex);

  useEffect(() => {
    setActiveIdx(initialImageIndex);
  }, [initialImageIndex, device?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && device?.images && device.images.length > 1) {
        // RTL next
        setActiveIdx((prev) => (prev > 0 ? prev - 1 : (device.images?.length || 1) - 1));
      } else if (e.key === 'ArrowLeft' && device?.images && device.images.length > 1) {
        // RTL prev
        setActiveIdx((prev) => (prev < (device.images?.length || 1) - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, device]);

  if (!isOpen || !device) return null;

  const images = device.images && device.images.length > 0 ? device.images : [];
  const currentImg = images[activeIdx] || images[0];
  const statusMeta = STATUS_META[device.status] || STATUS_META.ready_for_sale;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col text-white my-auto animate-in zoom-in-95 duration-200"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
              {device.code}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                {device.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span>{device.model || 'بدون مدل'}</span>
                <span>•</span>
                <span className="text-zinc-300">{device.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badge */}
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </span>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition active:scale-95"
              title="بستن (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image View Area */}
        <div className="relative flex-1 min-h-[320px] max-h-[60vh] bg-black/60 flex items-center justify-center p-4 overflow-hidden select-none">
          {currentImg ? (
            <img
              src={currentImg.url}
              alt={currentImg.title || device.name}
              className="max-w-full max-h-[56vh] object-contain rounded-xl shadow-lg transition-transform duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <ImageIcon className="w-16 h-16 opacity-30 mb-2" />
              <span className="text-xs">هیچ تصویری برای این دستگاه ثبت نشده است</span>
            </div>
          )}

          {/* Navigation Arrows (if multiple photos) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center backdrop-blur-xs transition shadow-lg active:scale-95 z-10"
                title="تصویر قبلی"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 text-white flex items-center justify-center backdrop-blur-xs transition shadow-lg active:scale-95 z-10"
                title="تصویر بعدی"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Photo counter */}
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-xs border border-white/10 text-[11px] font-mono font-bold text-zinc-200">
                {activeIdx + 1} / {images.length}
              </div>
            </>
          )}

          {/* Cover badge */}
          {currentImg?.isCover && (
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-xl bg-amber-500/90 text-zinc-950 font-bold text-[11px] shadow-md">
              تصویر شاخص (کاور)
            </div>
          )}
        </div>

        {/* Thumbnail Carousel (if multiple photos) */}
        {images.length > 1 && (
          <div className="px-5 py-2.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setActiveIdx(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                  activeIdx === idx
                    ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                    : 'border-zinc-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.isCover && (
                  <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-[8px] font-bold text-zinc-950 text-center leading-none py-0.5">
                    کاور
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer with key specs & quick actions */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {device.price ? (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">قیمت:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {Number(device.price).toLocaleString('fa-IR')} تومان
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg">
              <span className="text-zinc-400">شرایط:</span>
              <span className="font-bold text-blue-400">%{device.cashPercentage} نقد</span>
              <span className="text-zinc-500">+</span>
              <span className="font-bold text-indigo-400">%{device.installmentPercentage} اقساط</span>
            </div>

            {device.warrantyMonths ? (
              <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{device.warrantyMonths} ماه ضمانت</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {onOpenAICaption && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAICaption(device);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>کپشن هوشمند</span>
              </button>
            )}

            {onViewFullDetails && (
              <button
                onClick={() => {
                  onClose();
                  onViewFullDetails(device);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition active:scale-95 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>مشاهده مشخصات کامل</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
