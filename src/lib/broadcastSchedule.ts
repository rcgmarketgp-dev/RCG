import { BroadcastPlatform, BroadcastSchedule, DeviceItem } from '../types/device';

export interface PlatformMeta {
  id: BroadcastPlatform;
  name: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  iconColor: string;
}

export const BROADCAST_PLATFORMS: Record<BroadcastPlatform, PlatformMeta> = {
  telegram: {
    id: 'telegram',
    name: 'تلگرام',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-800',
    iconColor: '#0284c7',
  },
  bale: {
    id: 'bale',
    name: 'بله',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
    iconColor: '#059669',
  },
  eitaa: {
    id: 'eitaa',
    name: 'ایتا',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
    iconColor: '#d97706',
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'واتساپ',
    badgeBg: 'bg-green-50 dark:bg-green-950/60',
    badgeText: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-800',
    iconColor: '#16a34a',
  },
  instagram: {
    id: 'instagram',
    name: 'اینستاگرام',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/60',
    badgeText: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-800',
    iconColor: '#db2777',
  },
  divar: {
    id: 'divar',
    name: 'دیوار',
    badgeBg: 'bg-red-50 dark:bg-red-950/60',
    badgeText: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-800',
    iconColor: '#dc2626',
  },
  rubika: {
    id: 'rubika',
    name: 'روبیکا',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
    iconColor: '#9333ea',
  },
  other: {
    id: 'other',
    name: 'سایر کانال‌ها',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800',
    badgeText: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-300 dark:border-zinc-700',
    iconColor: '#71717a',
  },
};

/**
 * Play a gentle 2-tone melodic notification chime using Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Could not play audio chime:', e);
  }
}

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return 'denied';
  }
}

/**
 * Dispatch desktop browser notification
 */
export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        dir: 'rtl',
        lang: 'fa',
        ...options,
      });
    } catch (e) {
      console.warn('Failed to send browser notification:', e);
    }
  }
}

import { formatToPersianFullDateTime } from './persianCalendar';

/**
 * Formats date and time string in readable Persian Solar (Shamsi) format
 */
export function formatScheduledDateTime(isoString: string): string {
  if (!isoString) return '';
  return formatToPersianFullDateTime(isoString);
}

/**
 * Check which schedules in devices have reached their scheduled time and need notifying
 */
export function findDueSchedules(devices: DeviceItem[]): { device: DeviceItem; schedule: BroadcastSchedule }[] {
  const now = Date.now();
  const dueItems: { device: DeviceItem; schedule: BroadcastSchedule }[] = [];

  for (const device of devices) {
    if (!device.schedules || !Array.isArray(device.schedules)) continue;
    for (const schedule of device.schedules) {
      if (schedule.status === 'pending' && !schedule.notified) {
        const schedTime = new Date(schedule.scheduledDateTime).getTime();
        // If scheduled time has arrived (within the last 24 hours to prevent notifying ancient items)
        if (!isNaN(schedTime) && schedTime <= now && schedTime > now - 24 * 60 * 60 * 1000) {
          dueItems.push({ device, schedule });
        }
      }
    }
  }

  return dueItems;
}
