import { StatusChangeLog, DeviceStatus } from '../types/device';

const STORAGE_KEY_HISTORY = 'rcg_status_history_v1';

// Initial sample logs for demo machines
const INITIAL_SAMPLE_LOGS: StatusChangeLog[] = [
  {
    id: 'log-w1-1',
    deviceId: 'dev-wood-1',
    fromStatus: 'initial',
    toStatus: 'under_overhaul',
    timestamp: '2026-03-01T09:00:00.000Z',
    notes: 'ورود دستگاه به تعمیرگاه چهاردانگه جهت تعویض تیغه‌های پیش‌فرز و سرویس دوره‌ای',
    changedBy: 'واحد فنی و کنترل کیفیت',
  },
  {
    id: 'log-w1-2',
    deviceId: 'dev-wood-1',
    fromStatus: 'under_overhaul',
    toStatus: 'ready_for_sale',
    timestamp: '2026-03-10T14:30:00.000Z',
    notes: 'اتمام موفقیت‌آمیز تست نوار ۲ میل و کرنر زن؛ انتقال به سالن ۱ نمایشگاه و آماده‌سازی برای فروش',
    changedBy: 'مدیر فروش نمایشگاه',
  },
  {
    id: 'log-w2-1',
    deviceId: 'dev-wood-2',
    fromStatus: 'initial',
    toStatus: 'ready_for_sale',
    timestamp: '2026-03-11T10:15:00.000Z',
    notes: 'تست ریل واگن و خط‌زن انجام شد. دستگاه بدون لقی و آماده تحویل به مشتری',
    changedBy: 'کارشناس فنی',
  },
  {
    id: 'log-w4-1',
    deviceId: 'dev-wood-4',
    fromStatus: 'initial',
    toStatus: 'ready_for_sale',
    timestamp: '2026-03-05T11:00:00.000Z',
    notes: 'ورود به نمایشگاه جاده آبعلی',
    changedBy: 'مسئول انبار',
  },
  {
    id: 'log-w4-2',
    deviceId: 'dev-wood-4',
    fromStatus: 'ready_for_sale',
    toStatus: 'under_overhaul',
    timestamp: '2026-03-13T09:00:00.000Z',
    notes: 'شروع سرویس پمپ وکیوم روغنی و تعویض المنت‌های کوره آسانسوری',
    changedBy: 'سرپرست تعمیرات',
  },
];

// Retrieve all logs from localStorage
export function getAllStatusHistory(): StatusChangeLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read status history from localStorage:', e);
  }
  return INITIAL_SAMPLE_LOGS;
}

// Retrieve logs for a specific device, sorted newest first
export function getStatusHistoryForDevice(deviceId: string): StatusChangeLog[] {
  const all = getAllStatusHistory();
  return all
    .filter((log) => log.deviceId === deviceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Record a new status change log
export function recordStatusChangeLog(
  deviceId: string,
  fromStatus: DeviceStatus | 'initial',
  toStatus: DeviceStatus,
  notes?: string,
  changedBy?: string
): StatusChangeLog {
  const all = getAllStatusHistory();

  const newLog: StatusChangeLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    deviceId,
    fromStatus,
    toStatus,
    timestamp: new Date().toISOString(),
    notes: notes?.trim() || undefined,
    changedBy: changedBy || 'کاربر سیستم',
  };

  const updated = [newLog, ...all];

  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write status history to localStorage:', e);
  }

  return newLog;
}

// Format ISO timestamp to Persian date & time string
export function formatPersianDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return isoString;
  }
}
