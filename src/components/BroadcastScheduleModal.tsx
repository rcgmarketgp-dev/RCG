import React, { useState } from 'react';
import { DeviceItem, BroadcastSchedule } from '../types/device';
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Check, 
  Bell, 
  Send, 
  X, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Share2, 
  AlertCircle 
} from 'lucide-react';

interface BroadcastScheduleModalProps {
  device: DeviceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSchedules: (deviceId: string, updatedSchedules: BroadcastSchedule[]) => void;
  onOpenAICaption?: (device: DeviceItem) => void;
}

export const BroadcastScheduleModal: React.FC<BroadcastScheduleModalProps> = ({
  device,
  isOpen,
  onClose,
  onSaveSchedules,
  onOpenAICaption,
}) => {
  const [channelName, setChannelName] = useState('');
  const [platform, setPlatform] = useState<BroadcastSchedule['platform']>('telegram');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!isOpen || !device) return null;

  const schedules = device.schedules || [];

  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !scheduledDateTime) return;

    const newSchedule: BroadcastSchedule = {
      id: `sch-${Date.now()}`,
      channelOrGroupName: channelName.trim(),
      platform,
      scheduledDateTime,
      notes: notes.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notified: false,
    };

    const updated = [...schedules, newSchedule];
    onSaveSchedules(device.id, updated);

    // Reset form
    setChannelName('');
    setScheduledDateTime('');
    setNotes('');

    // Ensure notification permission is requested
    if (notificationPermission === 'default') {
      handleRequestNotification();
    }
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    onSaveSchedules(device.id, updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated = schedules.map((s) =>
      s.id === id
        ? { ...s, status: s.status === 'sent' ? 'pending' : 'sent' }
        : s
    );
    onSaveSchedules(device.id, updated as BroadcastSchedule[]);
  };

  const formatPersianDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('fa-IR')} ساعت ${d.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return isoString;
    }
  };

  const getPlatformMeta = (plat: BroadcastSchedule['platform']) => {
    switch (plat) {
      case 'telegram':
        return { name: 'تلگرام', color: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300' };
      case 'bale':
        return { name: 'بله', color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' };
      case 'eitaa':
        return { name: 'ایتا', color: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' };
      case 'whatsapp':
        return { name: 'واتساپ', color: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300' };
      default:
        return { name: 'غیره', color: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                  زمان‌بندی ارسال آگهی دستگاه
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                  {device.name}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                تعیین نام گروه یا کانال، تاریخ و ساعت ارسال همراه با اعلان و نوتیفیکیشن
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Notification Permission Banner */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span className="text-zinc-700 dark:text-zinc-300">
                {notificationPermission === 'granted'
                  ? 'نوتیفیکیشن مرورگر فعال است (هنگام فرا رسیدن زمان ارسال به شما هشدار داده می‌شود).'
                  : 'جهت دریافت هشدار در زمان ارسال آگهی، اجازه نوتیفیکیشن را صادر کنید.'}
              </span>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestNotification}
                className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shrink-0"
              >
                فعال‌سازی نوتیفیکیشن
              </button>
            )}
          </div>

          {/* New Schedule Form */}
          <form onSubmit={handleAddSchedule} className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>افزودن زمان‌بندی جدید برای این دستگاه</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  نام گروه یا کانال مقصد *
                </label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="مثال: کانال تلگرام چوب‌آرا / گروه واتساپ نجاران"
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  پیام‌رسان هدف
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                >
                  <option value="telegram">تلگرام (Telegram)</option>
                  <option value="bale">بله (Bale)</option>
                  <option value="eitaa">ایتا (Eitaa)</option>
                  <option value="whatsapp">واتساپ (WhatsApp)</option>
                  <option value="other">سایر گروه‌ها و شبکه‌ها</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  تاریخ و ساعت ارسال *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: همراه با تخفیف ۵ درصدی..."
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت زمان‌بندی</span>
              </button>
            </div>
          </form>

          {/* Schedules List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>برنامه‌های زمان‌بندی‌شده این دستگاه ({schedules.length}):</span>
            </h4>

            {schedules.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-400">
                <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <span>هنوز زمان‌بندی ارسالی برای این دستگاه تعریف نشده است.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {schedules.map((sch) => {
                  const platMeta = getPlatformMeta(sch.platform);
                  const isSent = sch.status === 'sent';
                  const isOverdue = !isSent && new Date(sch.scheduledDateTime).getTime() <= Date.now();

                  return (
                    <div
                      key={sch.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSent
                          ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-70'
                          : isOverdue
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${platMeta.color}`}>
                            {platMeta.name}
                          </span>
                          <span className="font-bold text-xs text-zinc-900 dark:text-white">
                            {sch.channelOrGroupName}
                          </span>
                          {isOverdue && !isSent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                              🔔 زمان ارسال فرا رسیده
                            </span>
                          )}
                          {isSent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ارسال شده ✓
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {formatPersianDate(sch.scheduledDateTime)}
                          </span>
                          {sch.notes && <span>• {sch.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        {/* Send Now via AICaptionModal */}
                        {onOpenAICaption && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenAICaption(device);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-600 text-white text-xs font-bold shadow-2xs hover:opacity-95 transition"
                            title="ارسال مستقیم متن و عکس آگهی به پیام‌رسان"
                          >
                            <Send className="w-3 h-3 -rotate-12" />
                            <span>ارسال الان</span>
                          </button>
                        )}

                        {/* Toggle Sent Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sch.id)}
                          className={`p-1.5 rounded-xl border text-xs transition ${
                            isSent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100'
                          }`}
                          title={isSent ? 'تغییر به در انتظار ارسال' : 'علامت‌گذاری به عنوان ارسال شده'}
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        {/* Delete Schedule */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="حذف زمان‌بندی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            زمان‌بندی‌ها در حافظه دیوایس و فضای ابری حساب ذخیره می‌شوند.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
