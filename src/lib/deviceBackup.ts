import { DeviceItem, CompanyProfile, ColumnConfig } from '../types/device';

export interface AppBackupData {
  version: string;
  appName: string;
  exportedAt: string;
  totalDevices: number;
  devices: DeviceItem[];
  companyProfile?: CompanyProfile;
  columns?: ColumnConfig[];
}

const LOCAL_SNAPSHOT_KEY = 'rcg_local_device_snapshot_v1';

/**
 * Downloads a complete JSON backup file to the user's local device
 */
export function downloadDeviceBackup(
  devices: DeviceItem[],
  companyProfile?: CompanyProfile,
  columns?: ColumnConfig[]
): void {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const backupData: AppBackupData = {
    version: '1.0',
    appName: 'سامانه هوشمند ماشین‌آلات چوب آرسی‌جی',
    exportedAt: now.toISOString(),
    totalDevices: devices.length,
    devices,
    companyProfile,
    columns,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `RCG-Machinery-Backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses a backup file selected from user's device
 */
export function parseDeviceBackupFile(file: File): Promise<AppBackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validation
        if (!data || !Array.isArray(data.devices)) {
          throw new Error('فایل پشتیبان فاقد ساختار صحیح ماشین‌آلات است.');
        }

        resolve(data as AppBackupData);
      } catch (err: any) {
        reject(new Error(err.message || 'خطا در خواندن و تحلیل فایل پشتیبان'));
      }
    };
    reader.onerror = () => reject(new Error('خطا در بارگذاری فایل از حافظه دیوایس'));
    reader.readAsText(file);
  });
}

/**
 * Stores an emergency snapshot in the device's local offline storage
 */
export function saveLocalDeviceSnapshot(devices: DeviceItem[]): void {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      count: devices.length,
      devices,
    };
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save local device snapshot:', err);
  }
}

/**
 * Retrieves the offline snapshot saved on this device
 */
export function getLocalDeviceSnapshot(): { savedAt: string; count: number; devices: DeviceItem[] } | null {
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read local device snapshot:', err);
  }
  return null;
}
