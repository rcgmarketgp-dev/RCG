import React from 'react';
import { DeviceItem, BroadcastSchedule } from '../types/device';
import { BROADCAST_PLATFORMS } from '../lib/broadcastSchedule';
import { Bell, Send, CheckCircle2, Clock, X } from 'lucide-react';

interface BroadcastNotificationToastProps {
  dueItems: { device: DeviceItem; schedule: BroadcastSchedule }[];
  onDismiss: (scheduleId: string) => void;
  onMarkSent: (deviceId: string, scheduleId: string) => void;
  onSendNow: (device: DeviceItem) => void;
  onSnooze: (deviceId: string, scheduleId: string, minutes: number) => void;
}

export const BroadcastNotificationToast: React.FC<BroadcastNotificationToastProps> = ({
  dueItems,
  onDismiss,
  onMarkSent,
  onSendNow,
  onSnooze,
}) => {
  if (!dueItems || dueItems.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-full max-w-xl px-3 pointer-events-none" dir="rtl">
      <div className="space-y-2 pointer-events-auto">
        {dueItems.map(({ device, schedule }) => {
          const platform = BROADCAST_PLATFORMS[schedule.platform] || BROADCAST_PLATFORMS.other;

          return (
            <div
              key={schedule.id}
              className="bg-white dark:bg-zinc-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-amber-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 animate-bounce">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                      زمان ارسال آگهی فرا رسید!
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${platform.badgeBg} ${platform.badgeText}`}>
                      {platform.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                    دستگاه: <span className="font-bold text-blue-600 dark:text-blue-400">{device.name}</span>
                    {' '}➔ مقصد:{' '}
                    <span className="font-bold text-amber-700 dark:text-amber-400">{schedule.channelOrGroupName}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onSendNow(device)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال آگهی</span>
                </button>

                <button
                  onClick={() => onMarkSent(device.id, schedule.id)}
                  title="علامت‌گذاری به عنوان ارسال شده"
                  className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition border border-emerald-200 dark:border-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSnooze(device.id, schedule.id, 10)}
                  title="تعویق به مدت ۱۰ دقیقه"
                  className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition"
                >
                  <Clock className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDismiss(schedule.id)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
