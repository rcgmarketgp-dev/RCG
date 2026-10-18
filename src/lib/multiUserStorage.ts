import { DeviceItem, ColumnConfig } from '../types/device';
import { CompanyProfile } from '../types/device';
import { DEFAULT_COMPANY_PROFILE, COMPANY_PROFILE_STORAGE_KEY } from './companyProfile';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface LocalDeviceSnapshot {
  id: string;
  name: string;
  timestamp: string;
  devicesCount: number;
  devices: DeviceItem[];
  companyProfile?: CompanyProfile;
}

export interface AppFullBackup {
  appName: string;
  version: string;
  exportedAt: string;
  exportedByEmail?: string;
  devices: DeviceItem[];
  companyProfile?: CompanyProfile;
  columns?: ColumnConfig[];
}

const GLOBAL_DEFAULT_KEY = 'rcg_woodworking_devices_v2';
const SNAPSHOTS_KEY_PREFIX = 'rcg_snapshots_';

/**
 * Get device storage key based on user email
 */
export function getStorageKeyForEmail(email?: string | null): string {
  if (!email) return GLOBAL_DEFAULT_KEY;
  // Sanitize email for localStorage key
  const safe = email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `rcg_devices_usr_${safe}`;
}

/**
 * Load devices for a specific email
 */
export function loadDevicesForUser(email?: string | null, fallbackDevices: DeviceItem[] = []): DeviceItem[] {
  const key = getStorageKeyForEmail(email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(`Failed to load devices for key ${key}:`, e);
  }

  // If user has no specific data, check fallback default
  if (email) {
    try {
      const globalRaw = localStorage.getItem(GLOBAL_DEFAULT_KEY);
      if (globalRaw) {
        const parsedGlobal = JSON.parse(globalRaw);
        if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
          // Copy global data for the newly signed-in user
          saveDevicesForUser(email, parsedGlobal);
          return parsedGlobal;
        }
      }
    } catch {}
  }

  return fallbackDevices;
}

/**
 * Save devices for a specific email
 */
export function saveDevicesForUser(email: string | null | undefined, devices: DeviceItem[]) {
  const key = getStorageKeyForEmail(email);
  try {
    localStorage.setItem(key, JSON.stringify(devices));
    // Also save in global fallback if user is logged out or primary
    if (!email) {
      localStorage.setItem(GLOBAL_DEFAULT_KEY, JSON.stringify(devices));
    }
  } catch (e) {
    console.warn(`Failed to save devices for key ${key}:`, e);
  }
}

/**
 * Sync devices with Firestore for authenticated user
 */
export async function syncDevicesWithFirestore(
  email: string,
  devices: DeviceItem[],
  companyProfile?: CompanyProfile
): Promise<boolean> {
  if (!email || !db) return false;
  try {
    const safeDocId = email.trim().toLowerCase();
    const userDocRef = doc(db, 'user_inventories', safeDocId);
    await setDoc(
      userDocRef,
      {
        email: safeDocId,
        updatedAt: new Date().toISOString(),
        devicesCount: devices.length,
        devices: JSON.stringify(devices),
        companyProfile: companyProfile || null,
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('Error syncing with Firestore:', e);
    return false;
  }
}

/**
 * Fetch devices from Firestore for authenticated user
 */
export async function fetchDevicesFromFirestore(
  email: string
): Promise<{ devices?: DeviceItem[]; companyProfile?: CompanyProfile } | null> {
  if (!email || !db) return null;
  try {
    const safeDocId = email.trim().toLowerCase();
    const userDocRef = doc(db, 'user_inventories', safeDocId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const devices = data.devices ? JSON.parse(data.devices) : [];
      return {
        devices,
        companyProfile: data.companyProfile,
      };
    }
  } catch (e) {
    console.error('Error fetching from Firestore:', e);
  }
  return null;
}

/**
 * Export full backup file to user's local machine disk (.json)
 */
export function exportFullBackupFile(
  devices: DeviceItem[],
  userEmail?: string | null,
  companyProfile?: CompanyProfile,
  columns?: ColumnConfig[]
) {
  const backupData: AppFullBackup = {
    appName: 'سامانه مدیریت و فروش ماشین‌آلات صنعتی RCG',
    version: '2.5.0',
    exportedAt: new Date().toISOString(),
    exportedByEmail: userEmail || undefined,
    devices,
    companyProfile: companyProfile || DEFAULT_COMPANY_PROFILE,
    columns,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `RCG_Machinery_Backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate uploaded backup file
 */
export async function parseBackupFile(file: File): Promise<AppFullBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.devices)) {
          throw new Error('ساختار فایل معتبر نیست. آرایه اطلاعات ماشین‌آلات یافت نشد.');
        }
        resolve(parsed as AppFullBackup);
      } catch (err: any) {
        reject(new Error(err.message || 'خطا در خواندن و تحلیل فایل پشتیبان'));
      }
    };
    reader.onerror = () => reject(new Error('خطا در بارگذاری فایل از حافظه دستگاه'));
    reader.readAsText(file);
  });
}

/**
 * Manage local snapshots inside device storage
 */
export function getLocalSnapshots(email?: string | null): LocalDeviceSnapshot[] {
  const key = `${SNAPSHOTS_KEY_PREFIX}${getStorageKeyForEmail(email)}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load snapshots:', e);
  }
  return [];
}

export function saveLocalSnapshot(
  name: string,
  devices: DeviceItem[],
  email?: string | null,
  companyProfile?: CompanyProfile
): LocalDeviceSnapshot[] {
  const key = `${SNAPSHOTS_KEY_PREFIX}${getStorageKeyForEmail(email)}`;
  const current = getLocalSnapshots(email);
  const newSnapshot: LocalDeviceSnapshot = {
    id: `snap_${Date.now()}`,
    name: name.trim() || `پشتیبان ${new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`,
    timestamp: new Date().toISOString(),
    devicesCount: devices.length,
    devices,
    companyProfile,
  };
  const updated = [newSnapshot, ...current.slice(0, 9)]; // Keep up to 10 latest snapshots
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save snapshot:', e);
  }
  return updated;
}

export function deleteLocalSnapshot(snapshotId: string, email?: string | null): LocalDeviceSnapshot[] {
  const key = `${SNAPSHOTS_KEY_PREFIX}${getStorageKeyForEmail(email)}`;
  const current = getLocalSnapshots(email);
  const updated = current.filter((s) => s.id !== snapshotId);
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
  return updated;
}
