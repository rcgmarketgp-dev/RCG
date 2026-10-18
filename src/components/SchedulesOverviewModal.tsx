import React, { useState } from 'react';
import { DeviceItem, BroadcastSchedule } from '../types/device';
import { BROADCAST_PLATFORMS, formatScheduledDateTime } from '../lib/broadcastSchedule';
import { 
  Bell, 
  Send, 
  Trash2, 
  CheckCircle2, 
  X, 
  Calendar, 
  Clock, 
  Layers, 
  Plus, 
  Filter 
} from 'lucide-react';

interface SchedulesOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DeviceItem[];
  onOpenAICaption: (device: DeviceItem) => void;
  onToggleScheduleStatus: (deviceId: string, scheduleId: string) => void;
  onDeleteSchedule: (deviceId: string, scheduleId: string) => void;
  onAddNewSchedule: () => void;
}

export const SchedulesOverviewModal: React.FC<SchedulesOverviewModalProps> = ({
  isOpen,
  onClose,
  devices,
  onOpenAICaption,
  onToggleScheduleStatus,
  onDeleteSchedule,
  onAddNewSchedule,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent'>('all');

  if (!isOpen) return null;

  // Flatten all schedules with parent device
  const allSchedules: { device: DeviceItem; schedule: BroadcastSchedule }[] = [];
  devices.forEach((device) => {
    if (device.schedules && Array.isArray(device.schedules)) {
      device.schedules.forEach((schedule) => {
        allSchedules.push({ device, schedule });
      });
    }
  });

  // Sort by scheduledDateTime
  allSchedules.sort((a, b) => {
    return new Date(a.schedule.scheduledDateTime).getTime() - new Date(b.schedule.scheduledDateTime).getTime();
  });

  const filtered = filterStatus === 'all' 
    ? allSchedules 
    : allSchedules.filter((item) => item.schedule.status === filterStatus);

  const pendingCount = allSchedules.filter((i) => i.schedule.status === 'pending').length;
  const sentCount = allSchedules.filter((i) => i.schedule.status === 'sent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                مدیریت زمان‌بندی‌های ارسال آگهی
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                برنامه‌ریزی انتشار در کانال‌ها و گروه‌های تلگرام، بله، ایتا، واتساپ و اینستاگرام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Counters */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterStatus === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              همه ({allSchedules.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              در انتظار ارسال ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('sent')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterStatus === 'sent'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              ارسال شده ({sentCount})
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onAddNewSchedule();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>زمان‌بندی جدید</span>
          </button>
        </div>

        {/* Schedules List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-zinc-300" />
              <p className="text-xs">هیچ زمان‌بندی ارسالی در این بخش یافت نشد.</p>
            </div>
          ) : (
            filtered.map(({ device, schedule }) => {
              const platform = BROADCAST_PLATFORMS[schedule.platform] || BROADCAST_PLATFORMS.other;
              const isSent = schedule.status === 'sent';

              return (
                <div
                  key={schedule.id}
                  className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${platform.badgeBg} ${platform.badgeText}`}>
                        {platform.name}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {schedule.channelOrGroupName}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        (دستگاه: <span className="font-bold text-blue-600 dark:text-blue-400">{device.name}</span> - کد {device.code})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[11px]">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>موعد ارسال: {formatScheduledDateTime(schedule.scheduledDateTime)}</span>
                      {isSent ? (
                        <span className="text-emerald-600 font-bold mr-1">✓ ارسال شده</span>
                      ) : (
                        <span className="text-amber-600 font-bold mr-1">⏳ در انتظار ارسال</span>
                      )}
                    </div>

                    {schedule.notes && (
                      <p className="text-[11px] text-zinc-400">یادداشت: {schedule.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onToggleScheduleStatus(device.id, schedule.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isSent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600'
                      }`}
                      title={isSent ? 'تغییر به در انتظار' : 'علامت‌گذاری به عنوان ارسال شده'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSent ? 'ارسال شد' : 'ثبت ارسال'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAICaption(device);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                      title="تولید کپشن و ارسال مستقیم به پیام‌رسان"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ارسال آگهی</span>
                    </button>

                    <button
                      onClick={() => onDeleteSchedule(device.id, schedule.id)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="حذف این زمان‌بندی"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
