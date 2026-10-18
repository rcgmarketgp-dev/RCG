import React, { useState, useMemo } from 'react';
import { DeviceItem, BroadcastSchedule } from '../types/device';
import { BROADCAST_PLATFORMS, formatScheduledDateTime } from '../lib/broadcastSchedule';
import {
  getJalaliToday,
  getDaysInJalaliMonth,
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAYS,
  getJalaliDayOfWeek,
  toPersianDigits,
  getJalaliDateKey,
  jalaliToISOString,
  dateToJalali,
} from '../lib/persianCalendar';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Send,
  Trash2,
  Eye,
  Plus,
  Share2,
  Filter,
  Layers,
  Sparkles,
  ArrowUpRight,
  Check,
  CalendarDays,
  ListOrdered
} from 'lucide-react';

interface BroadcastCalendarViewProps {
  devices: DeviceItem[];
  onOpenDeviceDetail: (device: DeviceItem) => void;
  onOpenScheduleModal: (device: DeviceItem) => void;
  onOpenAICaption: (device: DeviceItem) => void;
  onDeleteSchedule: (deviceId: string, scheduleId: string) => void;
  onToggleScheduleStatus: (deviceId: string, scheduleId: string) => void;
}

interface ScheduleWithDevice {
  device: DeviceItem;
  schedule: BroadcastSchedule;
  jalaliKey: string;
}

export const BroadcastCalendarView: React.FC<BroadcastCalendarViewProps> = ({
  devices,
  onOpenDeviceDetail,
  onOpenScheduleModal,
  onOpenAICaption,
  onDeleteSchedule,
  onToggleScheduleStatus,
}) => {
  const todayJalali = useMemo(() => getJalaliToday(), []);
  const [selectedYear, setSelectedYear] = useState<number>(todayJalali.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayJalali.jm);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(() => {
    return `${todayJalali.jy}-${String(todayJalali.jm).padStart(2, '0')}-${String(todayJalali.jd).padStart(2, '0')}`;
  });

  const [filterMode, setFilterMode] = useState<'all' | 'sent' | 'pending'>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  // Flatten all schedules across all devices with their Jalali key
  const allSchedules = useMemo<ScheduleWithDevice[]>(() => {
    const list: ScheduleWithDevice[] = [];
    devices.forEach((device) => {
      if (device.schedules && Array.isArray(device.schedules)) {
        device.schedules.forEach((schedule) => {
          const jalaliKey = getJalaliDateKey(schedule.scheduledDateTime);
          list.push({
            device,
            schedule,
            jalaliKey,
          });
        });
      }
    });
    return list;
  }, [devices]);

  // Map schedules by date key: "YYYY-MM-DD"
  const schedulesByDateKey = useMemo(() => {
    const map = new Map<string, ScheduleWithDevice[]>();
    allSchedules.forEach((item) => {
      // Filter by status if requested
      if (filterMode === 'sent' && item.schedule.status !== 'sent') return;
      if (filterMode === 'pending' && item.schedule.status === 'sent') return;

      const current = map.get(item.jalaliKey) || [];
      current.push(item);
      map.set(item.jalaliKey, current);
    });
    return map;
  }, [allSchedules, filterMode]);

  // Calendar calculations for selected Month
  const daysInCurrentMonth = useMemo(() => {
    return getDaysInJalaliMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const firstDayWeekday = useMemo(() => {
    return getJalaliDayOfWeek(selectedYear, selectedMonth, 1);
  }, [selectedYear, selectedMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedYear(todayJalali.jy);
    setSelectedMonth(todayJalali.jm);
    setSelectedDayKey(
      `${todayJalali.jy}-${String(todayJalali.jm).padStart(2, '0')}-${String(todayJalali.jd).padStart(2, '0')}`
    );
  };

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let totalInMonth = 0;
    let sentInMonth = 0;
    let pendingInMonth = 0;

    allSchedules.forEach((item) => {
      if (!item.jalaliKey) return;
      const [y, m] = item.jalaliKey.split('-').map(Number);
      if (y === selectedYear && m === selectedMonth) {
        totalInMonth++;
        if (item.schedule.status === 'sent') sentInMonth++;
        else pendingInMonth++;
      }
    });

    return { totalInMonth, sentInMonth, pendingInMonth };
  }, [allSchedules, selectedYear, selectedMonth]);

  // Selected Day Items
  const selectedDayItems = useMemo(() => {
    if (!selectedDayKey) return [];
    return schedulesByDateKey.get(selectedDayKey) || [];
  }, [selectedDayKey, schedulesByDateKey]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Calendar Title & Month Selector */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
                  تقویم خورشیدی ارسال آگهی‌ها
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {toPersianDigits(allSchedules.length)} زمان‌بندی ثبت شده
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                مشاهده تاریخچه و زمان‌بندی‌های ارسال آگهی دستگاه‌ها در کانال‌ها و گروه‌ها بر روی تقویم شمسی
              </p>
            </div>
          </div>

          {/* Month Navigation & Today Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrevMonth}
              title="ماه قبل"
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            >
              <ChevronRight className="w-4 h-4" />
              <span>ماه قبل</span>
            </button>

            <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-sm sm:text-base flex items-center gap-2 min-w-[150px] justify-center shadow-2xs">
              <span>{JALALI_MONTH_NAMES[selectedMonth - 1]}</span>
              <span>{toPersianDigits(selectedYear)}</span>
            </div>

            <button
              onClick={handleNextMonth}
              title="ماه بعد"
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            >
              <span>ماه بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoToday}
              className="px-3 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition active:scale-95"
            >
              برو به امروز
            </button>
          </div>
        </div>

        {/* Stats Row & Filters */}
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>کل این ماه:</span>
              <span className="font-bold">{toPersianDigits(monthlyStats.totalInMonth)}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ارسال شده:</span>
              <span className="font-bold">{toPersianDigits(monthlyStats.sentInMonth)}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>در انتظار ارسال:</span>
              <span className="font-bold">{toPersianDigits(monthlyStats.pendingInMonth)}</span>
            </div>
          </div>

          {/* Filter & View Switch */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-700/60 p-1 rounded-xl">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setFilterMode('sent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filterMode === 'sent'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                ارسال شده‌ها
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filterMode === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                در انتظار
              </button>
            </div>

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-700/60 p-1 rounded-xl">
              <button
                onClick={() => setViewStyle('grid')}
                title="نمای تقویم ماهانه"
                className={`p-1.5 rounded-lg transition ${
                  viewStyle === 'grid'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewStyle('list')}
                title="نمای فهرست زمانی"
                className={`p-1.5 rounded-lg transition ${
                  viewStyle === 'list'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid + Selected Day Inspector */}
      {viewStyle === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Table (3 columns on large screens) */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-800/90 rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {JALALI_WEEKDAYS.map((wd, i) => (
                <div
                  key={wd.key}
                  className={`py-2 text-xs font-bold rounded-xl ${
                    i === 6
                      ? 'text-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                      : 'text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-700/30'
                  }`}
                >
                  <span className="hidden sm:inline">{wd.name}</span>
                  <span className="sm:hidden">{wd.short}</span>
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
              {/* Padding before first day of month */}
              {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[75px] sm:min-h-[95px] p-1.5 rounded-2xl bg-zinc-50/40 dark:bg-zinc-900/20 border border-transparent opacity-30"
                />
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const itemsOnThisDay = schedulesByDateKey.get(dateKey) || [];
                const isToday =
                  selectedYear === todayJalali.jy &&
                  selectedMonth === todayJalali.jm &&
                  dayNum === todayJalali.jd;
                const isSelected = selectedDayKey === dateKey;
                const hasSchedules = itemsOnThisDay.length > 0;

                const sentCount = itemsOnThisDay.filter((i) => i.schedule.status === 'sent').length;
                const pendingCount = itemsOnThisDay.length - sentCount;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDayKey(dateKey)}
                    className={`min-h-[75px] sm:min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/30'
                        : isToday
                        ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/30 dark:bg-amber-950/20'
                        : hasSchedules
                        ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-blue-400 hover:shadow-xs'
                        : 'border-zinc-100 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-700/30'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday
                            ? 'bg-amber-500 text-white'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'text-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        {toPersianDigits(dayNum)}
                      </span>

                      {isToday && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hidden sm:inline">
                          امروز
                        </span>
                      )}

                      {hasSchedules && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {toPersianDigits(itemsOnThisDay.length)}
                        </span>
                      )}
                    </div>

                    {/* Schedule items teaser pills on cell */}
                    <div className="mt-1 space-y-1 overflow-hidden">
                      {itemsOnThisDay.slice(0, 2).map((item) => {
                        const meta = BROADCAST_PLATFORMS[item.schedule.platform] || BROADCAST_PLATFORMS.other;
                        const isSent = item.schedule.status === 'sent';
                        return (
                          <div
                            key={item.schedule.id}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] truncate flex items-center gap-1 font-medium ${
                              isSent
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            }`}
                            title={`${item.device.name} - ${item.schedule.channelOrGroupName}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: meta.iconColor }}
                            />
                            <span className="truncate">{item.device.name}</span>
                          </div>
                        );
                      })}

                      {itemsOnThisDay.length > 2 && (
                        <div className="text-[9px] text-zinc-400 text-center font-bold">
                          +{toPersianDigits(itemsOnThisDay.length - 2)} آگهی دیگر
                        </div>
                      )}
                    </div>

                    {/* Quick indicator dots on mobile */}
                    <div className="flex sm:hidden items-center gap-1 justify-center mt-1">
                      {sentCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Inspector Panel (1 column on large screens) */}
          <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col h-full">
            <div className="pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-amber-500" />
                  <span>آگهی‌های تاریخ:</span>
                </h3>
                {selectedDayKey && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {toPersianDigits(selectedDayKey)}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {selectedDayItems.length > 0
                  ? `${toPersianDigits(selectedDayItems.length)} آگهی برای ارسال در این تاریخ ثبت شده است.`
                  : 'هیچ زمان‌بندی ارسالی در این تاریخ ثبت نشده است.'}
              </p>
            </div>

            {/* List of items on selected day */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[500px]">
              {selectedDayItems.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-3">
                  <Clock className="w-10 h-10 mx-auto stroke-1 opacity-40 text-amber-500" />
                  <p className="text-xs">در این تاریخ دستگاهی برای ارسال برنامه‌ریزی نشده است.</p>
                  <p className="text-[11px] text-zinc-400">
                    می‌توانید از بخش «ویترین» یا منوی دسترسی سریع، آگهی هر دستگاه را زمان‌بندی کنید.
                  </p>
                </div>
              ) : (
                selectedDayItems.map(({ device, schedule }) => {
                  const meta = BROADCAST_PLATFORMS[schedule.platform] || BROADCAST_PLATFORMS.other;
                  const isSent = schedule.status === 'sent';

                  return (
                    <div
                      key={schedule.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isSent
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-zinc-50/70 dark:bg-zinc-700/30 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {/* Device header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {device.images && device.images.length > 0 ? (
                            <img
                              src={device.images[0].url}
                              alt={device.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                              {device.code.slice(-3)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                              {device.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              کد: <span className="font-mono">{device.code}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => onToggleScheduleStatus(device.id, schedule.id)}
                          title={isSent ? 'تغییر به در انتظار' : 'تغییر به ارسال شده'}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 active:scale-95 transition ${
                            isSent
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ارسال شده</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>در انتظار</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Channel and Platform Info */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.iconColor }}
                          />
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {schedule.channelOrGroupName}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {formatScheduledDateTime(schedule.scheduledDateTime).split('-')[1] || ''}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-1">
                        <button
                          onClick={() => onOpenAICaption(device)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 transition"
                          title="تولید متن آگهی و کپی سریع برای ارسال"
                        >
                          <Send className="w-3 h-3" />
                          <span>ارسال آگهی</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenDeviceDetail(device)}
                            title="مشاهده مشخصات دستگاه"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteSchedule(device.id, schedule.id)}
                            title="حذف زمان‌بندی"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* View Style: List / Timeline View */
        <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
              فهرست خط زمانی زمان‌بندی‌های ماه {JALALI_MONTH_NAMES[selectedMonth - 1]} {toPersianDigits(selectedYear)}
            </h3>
            <span className="text-xs text-zinc-500">
              مرتب شده به ترتیب زمان اجرا
            </span>
          </div>

          <div className="space-y-3">
            {allSchedules
              .filter((item) => {
                const [y, m] = (item.jalaliKey || '').split('-').map(Number);
                if (y !== selectedYear || m !== selectedMonth) return false;
                if (filterMode === 'sent' && item.schedule.status !== 'sent') return false;
                if (filterMode === 'pending' && item.schedule.status === 'sent') return false;
                return true;
              })
              .map(({ device, schedule }) => {
                const meta = BROADCAST_PLATFORMS[schedule.platform] || BROADCAST_PLATFORMS.other;
                const isSent = schedule.status === 'sent';

                return (
                  <div
                    key={schedule.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-700/30 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {device.images && device.images.length > 0 ? (
                        <img
                          src={device.images[0].url}
                          alt={device.name}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                          {device.code.slice(-3)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                            {device.name}
                          </h4>
                          <span className="text-xs text-zinc-500 font-mono">({device.code})</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.badgeBg} ${meta.badgeText} border ${meta.border}`}>
                            {meta.name}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                            مقصد: {schedule.channelOrGroupName}
                          </span>
                          <span>•</span>
                          <span className="text-zinc-500">
                            {formatScheduledDateTime(schedule.scheduledDateTime)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onToggleScheduleStatus(device.id, schedule.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isSent
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ارسال شده</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>در انتظار ارسال</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onOpenAICaption(device)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال آگهی</span>
                      </button>

                      <button
                        onClick={() => onDeleteSchedule(device.id, schedule.id)}
                        className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
