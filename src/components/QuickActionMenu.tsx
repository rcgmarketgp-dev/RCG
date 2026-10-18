import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  FileSpreadsheet,
  Calendar,
  Bell,
  Upload,
  HardDrive,
  Sparkles,
  Layers,
  Wand2,
  Smartphone
} from 'lucide-react';

interface QuickActionMenuProps {
  onAddNewDevice: () => void;
  onOpenExcelGrid: () => void;
  onOpenCalendar: () => void;
  onOpenSchedulesOverview: () => void;
  onOpenExcelModal: () => void;
  onOpenBackupModal: () => void;
  onOpenAICaption: () => void;
  onOpenInstallModal?: () => void;
  pendingSchedulesCount?: number;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  onAddNewDevice,
  onOpenExcelGrid,
  onOpenCalendar,
  onOpenSchedulesOverview,
  onOpenExcelModal,
  onOpenBackupModal,
  onOpenAICaption,
  onOpenInstallModal,
  pendingSchedulesCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const actions = [
    {
      id: 'add-device',
      label: 'افزودن دستگاه جدید',
      description: 'ثبت مشخصات، قیمت و عکس‌های دستگاه',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25',
      onClick: () => {
        setIsOpen(false);
        onAddNewDevice();
      },
    },
    {
      id: 'calendar',
      label: 'تقویم خورشیدی ارسال‌ها',
      description: 'مشاهده برنامه‌ریزی ارسال آگهی‌ها روی تقویم شمسی',
      icon: Calendar,
      color: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25',
      badge: pendingSchedulesCount > 0 ? `${pendingSchedulesCount} فعال` : undefined,
      onClick: () => {
        setIsOpen(false);
        onOpenCalendar();
      },
    },
    {
      id: 'schedules-overview',
      label: 'لیست زمان‌بندی‌های آگهی',
      description: 'مدیریت گروه‌ها و کانال‌های مقصد تبلیغات',
      icon: Bell,
      color: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25',
      badge: pendingSchedulesCount > 0 ? String(pendingSchedulesCount) : undefined,
      onClick: () => {
        setIsOpen(false);
        onOpenSchedulesOverview();
      },
    },
    {
      id: 'excel-grid',
      label: 'صفحه گسترده ورود اکسلی',
      description: 'ویرایش سریع و پیوسته دستگاه‌ها در جدول تعاملی',
      icon: FileSpreadsheet,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25',
      onClick: () => {
        setIsOpen(false);
        onOpenExcelGrid();
      },
    },
    {
      id: 'ai-caption',
      label: 'تولید کپشن تبلیغاتی با هوش مصنوعی',
      description: 'نگارش متن حرفه‌ای آگهی برای تلگرام، ایتا و دیوار',
      icon: Sparkles,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25',
      onClick: () => {
        setIsOpen(false);
        onOpenAICaption();
      },
    },
    {
      id: 'excel-import',
      label: 'وارد کردن فایل اکسل انبار',
      description: 'بارگذاری سریع دستگاه‌ها از فایل Excel یا CSV',
      icon: Upload,
      color: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/25',
      onClick: () => {
        setIsOpen(false);
        onOpenExcelModal();
      },
    },
    {
      id: 'backup-restore',
      label: 'پشتیبان‌گیری و ذخیره در دیوایس',
      description: 'دانلود فایل JSON نسخه پشتیبان و همگام‌سازی ابری',
      icon: HardDrive,
      color: 'bg-zinc-700 hover:bg-zinc-800 text-white shadow-zinc-500/25',
      onClick: () => {
        setIsOpen(false);
        onOpenBackupModal();
      },
    },
    ...(onOpenInstallModal ? [{
      id: 'install-pwa',
      label: 'نصب برنامه روی گوشی (اندروید)',
      description: 'نصب نسخه وب‌اپلیکیشن تمام‌صفحه و دسترسی آفلاین',
      icon: Smartphone,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25',
      badge: 'نسخه موبایل',
      onClick: () => {
        setIsOpen(false);
        onOpenInstallModal();
      },
    }] : []),
  ];

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40" dir="rtl">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-2xs -z-10 animate-in fade-in duration-200"
        />
      )}

      {/* Expanded Actions Menu */}
      {isOpen && (
        <div className="mb-3 space-y-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl p-3 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-1.5 w-72 sm:w-80">
            <div className="px-3 py-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span>دسترسی سریع به امکانات</span>
              <span className="text-[10px] font-normal">کلیک برای اجرای عملیات</span>
            </div>

            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={act.onClick}
                  className="w-full p-2 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all flex items-center gap-3 text-right group active:scale-98"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${act.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {act.label}
                      </span>
                      {act.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {act.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {act.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 group relative ${
          isOpen
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rotate-90 ring-4 ring-zinc-500/20'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white hover:shadow-2xl hover:scale-105 ring-4 ring-blue-500/25 animate-pulse'
        }`}
        title="دسترسی سریع به عملیات پرکاربرد"
        aria-label="دسترسی سریع"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform" />
        ) : (
          <Sparkles className="w-6 h-6 transition-transform group-hover:rotate-12" />
        )}

        {/* Pending schedules notification badge */}
        {!isOpen && pendingSchedulesCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-md">
            {pendingSchedulesCount > 9 ? '+۹' : pendingSchedulesCount}
          </span>
        )}
      </button>
    </div>
  );
};
