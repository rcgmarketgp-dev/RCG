import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { DeviceItem, CompanyProfile, ColumnConfig } from '../types/device';
import { 
  downloadDeviceBackup, 
  parseDeviceBackupFile, 
  saveLocalDeviceSnapshot, 
  getLocalDeviceSnapshot, 
  AppBackupData 
} from '../lib/deviceBackup';
import { saveUserDevicesToCloud } from '../lib/firestoreSync';
import { 
  Download, 
  Upload, 
  HardDrive, 
  Cloud, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  X, 
  FileJson, 
  Database, 
  RefreshCw,
  FolderArchive,
  Save
} from 'lucide-react';

interface DeviceBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DeviceItem[];
  onRestoreDevices: (restored: DeviceItem[], mode: 'replace' | 'merge') => void;
  currentUser: User | null;
  companyProfile?: CompanyProfile;
  columns?: ColumnConfig[];
  onShowToast: (msg: string) => void;
}

export const DeviceBackupModal: React.FC<DeviceBackupModalProps> = ({
  isOpen,
  onClose,
  devices,
  onRestoreDevices,
  currentUser,
  companyProfile,
  columns,
  onShowToast,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [localSnapshot, setLocalSnapshot] = useState(getLocalDeviceSnapshot());
  const [fileToImport, setFileToImport] = useState<AppBackupData | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      downloadDeviceBackup(devices, companyProfile, columns);
      setDownloadSuccess(true);
      onShowToast(`فایل پشتیبان با ${devices.length} دستگاه در دیوایس دانلود شد.`);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      onShowToast('خطا در دانلود فایل پشتیبان');
    }
  };

  const handleSaveLocalSnapshot = () => {
    saveLocalDeviceSnapshot(devices);
    setLocalSnapshot(getLocalDeviceSnapshot());
    onShowToast('نسخه پشتیبان محلی با موفقیت در حافظه دیوایس ثبت شد.');
  };

  const handleCloudSyncNow = async () => {
    if (!currentUser) {
      onShowToast('لطفاً ابتدا با حساب کاربری گوگل وارد شوید.');
      return;
    }
    try {
      setCloudSyncing(true);
      await saveUserDevicesToCloud(currentUser.uid, devices);
      onShowToast(`اطلاعات برای حساب ${currentUser.email} در فضای ابری ذخیره شد.`);
    } catch (err) {
      onShowToast('خطا در همگام‌سازی با پایگاه ابری.');
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportFileName(file.name);

    try {
      const parsed = await parseDeviceBackupFile(file);
      setFileToImport(parsed);
    } catch (err: any) {
      setImportError(err.message || 'فایل نامعتبر است.');
      setFileToImport(null);
    }
  };

  const handleConfirmRestore = () => {
    if (!fileToImport || !fileToImport.devices) return;
    onRestoreDevices(fileToImport.devices, restoreMode);
    onShowToast(
      restoreMode === 'replace'
        ? `کل اطلاعات با ${fileToImport.devices.length} دستگاه از فایل پشتیبان جایگزین شد.`
        : `${fileToImport.devices.length} دستگاه از فایل پشتیبان به لیست اضافه شد.`
    );
    setFileToImport(null);
    onClose();
  };

  const handleRestoreFromLocalSnapshot = () => {
    if (!localSnapshot || !localSnapshot.devices) return;
    if (window.confirm(`آیا مایلید ${localSnapshot.count} دستگاه از آخرین نسخه پشتیبان دیوایس بازیابی شود؟`)) {
      onRestoreDevices(localSnapshot.devices, 'replace');
      onShowToast('اطلاعات از حافظه داخلی دیوایس بازیابی شد.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                پشتیبان‌گیری و ذخیره‌سازی اطلاعات
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                ذخیره روی حافظه دیوایس، دانلود فایل JSON و همگام‌سازی ابری با هر ایمیل
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Card 1: Cloud Sync Status (per email login) */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl p-4 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                  ذخیره‌سازی ابری با حساب لاگین‌شده
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  {currentUser ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      متصل به ایمیل: {currentUser.email}
                    </span>
                  ) : (
                    'برای ذخیره ابری اطلاعات با ایمیل خود، ابتدا وارد حساب گوگل شوید.'
                  )}
                </span>
              </div>
            </div>

            {currentUser && (
              <button
                onClick={handleCloudSyncNow}
                disabled={cloudSyncing}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncing ? 'animate-spin' : ''}`} />
                <span>{cloudSyncing ? 'در حال ذخیره ابری...' : 'همگام‌سازی ابری الان'}</span>
              </button>
            )}
          </div>

          {/* Card 2: Export / Download JSON to Device */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    دانلود فایل پشتیبان در حافظه دیوایس (Backup File)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    خروجی استاندارد شامل تمام {devices.length} دستگاه، مشخصات، عکس‌ها، زمان‌بندی‌ها و اطلاعات شرکت
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition active:scale-95 ${
                  downloadSuccess ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>{downloadSuccess ? 'دانلود شد!' : 'دانلود فایل پشتیبان'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Restore / Import JSON from Device */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                  بازیابی اطلاعات از فایل پشتیبان دیوایس
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  فایل پشتیبان JSON را انتخاب کنید تا دستگاه‌ها به سامانه بازگردند
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {!fileToImport ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 text-xs font-medium text-zinc-600 dark:text-zinc-400 flex flex-col items-center justify-center gap-1.5 transition"
              >
                <FileJson className="w-6 h-6 text-zinc-400" />
                <span>کلیک جهت انتخاب فایل پشتیبان (.json) از این دستگاه</span>
              </button>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-950 dark:text-blue-200">
                      {importFileName}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {fileToImport.devices?.length || 0} دستگاه شناسایی شد
                  </span>
                </div>

                {/* Restore Mode */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">نحوه بازیابی:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                    />
                    <span>جایگزینی کامل انبار فعلی</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                    />
                    <span>افزودن به دستگاه‌های موجود</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setFileToImport(null);
                      setImportFileName('');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100"
                  >
                    لغو
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95"
                  >
                    تأیید و اعمال بازیابی
                  </button>
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          {/* Card 4: Emergency Local Snapshot */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                  ذخیره‌سازی سریع در حافظه آفلاین دیوایس (Snapshot)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {localSnapshot ? (
                    <>آخرین نسخه داخلی: {localSnapshot.count} دستگاه • {new Date(localSnapshot.savedAt).toLocaleDateString('fa-IR')}</>
                  ) : (
                    'هنوز نسخه ذخیره‌شده‌ای در این مرورگر ثبت نشده است.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {localSnapshot && (
                <button
                  onClick={handleRestoreFromLocalSnapshot}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition"
                >
                  بازیابی نسخه
                </button>
              )}
              <button
                onClick={handleSaveLocalSnapshot}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره الان در دیوایس</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
