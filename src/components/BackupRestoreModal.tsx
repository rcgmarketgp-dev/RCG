import React, { useState, useEffect, useRef } from 'react';
import { DeviceItem, ColumnConfig } from '../types/device';
import { CompanyProfile } from '../types/device';
import { 
  exportFullBackupFile, 
  parseBackupFile, 
  AppFullBackup, 
  LocalDeviceSnapshot, 
  getLocalSnapshots, 
  saveLocalSnapshot, 
  deleteLocalSnapshot,
  syncDevicesWithFirestore,
  fetchDevicesFromFirestore
} from '../lib/multiUserStorage';
import { getStoredCompanyProfile } from '../lib/companyProfile';
import { 
  Download, 
  Upload, 
  HardDrive, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RotateCcw, 
  FileText, 
  Save, 
  X,
  History,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { User } from 'firebase/auth';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DeviceItem[];
  onRestoreDevices: (restored: DeviceItem[], mode: 'replace' | 'merge') => void;
  googleUser: User | null;
  columns?: ColumnConfig[];
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  devices,
  onRestoreDevices,
  googleUser,
  columns,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'snapshots' | 'cloud'>('export');
  const [snapshots, setSnapshots] = useState<LocalDeviceSnapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [selectedFileBackup, setSelectedFileBackup] = useState<AppFullBackup | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeEmail = googleUser?.email || null;

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getLocalSnapshots(activeEmail));
      setSelectedFileBackup(null);
      setImportFileName('');
      setImportError(null);
      setCloudMessage(null);
    }
  }, [isOpen, activeEmail]);

  if (!isOpen) return null;

  const handleExportFile = () => {
    const profile = getStoredCompanyProfile();
    exportFullBackupFile(devices, activeEmail, profile, columns);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError(null);
    try {
      const parsed = await parseBackupFile(file);
      setSelectedFileBackup(parsed);
    } catch (err: any) {
      setImportError(err.message || 'فایل انتخاب شده معتبر نمی‌باشد');
      setSelectedFileBackup(null);
    }
  };

  const handleConfirmRestore = (mode: 'replace' | 'merge') => {
    if (!selectedFileBackup) return;
    onRestoreDevices(selectedFileBackup.devices, mode);
    onClose();
  };

  const handleCreateSnapshot = () => {
    const profile = getStoredCompanyProfile();
    const updated = saveLocalSnapshot(newSnapshotName, devices, activeEmail, profile);
    setSnapshots(updated);
    setNewSnapshotName('');
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteLocalSnapshot(id, activeEmail);
    setSnapshots(updated);
  };

  const handleRestoreFromSnapshot = (snapshot: LocalDeviceSnapshot) => {
    const confirmed = window.confirm(
      `آیا مایلید اطلاعات به نسخه پشتیبان «${snapshot.name}» با ${snapshot.devicesCount} دستگاه بازگردانی شود؟`
    );
    if (!confirmed) return;
    onRestoreDevices(snapshot.devices, 'replace');
    onClose();
  };

  const handleSyncToCloud = async () => {
    if (!activeEmail) return;
    setIsCloudSyncing(true);
    setCloudMessage(null);
    const profile = getStoredCompanyProfile();
    const ok = await syncDevicesWithFirestore(activeEmail, devices, profile);
    setIsCloudSyncing(false);
    if (ok) {
      setCloudMessage({ text: 'اطلاعات با موفقیت در فضای ابری فایربیس ذخیره و همگام شد.', success: true });
    } else {
      setCloudMessage({ text: 'خطا در اتصال به پایگاه ابری فایربیس.', success: false });
    }
  };

  const handleFetchFromCloud = async () => {
    if (!activeEmail) return;
    setIsCloudSyncing(true);
    setCloudMessage(null);
    const result = await fetchDevicesFromFirestore(activeEmail);
    setIsCloudSyncing(false);
    if (result && result.devices && result.devices.length > 0) {
      const confirmed = window.confirm(
        `تعداد ${result.devices.length} دستگاه در نسخه ابری یافت شد. آیا مایل به جایگزینی هستید؟`
      );
      if (confirmed) {
        onRestoreDevices(result.devices, 'replace');
        onClose();
      }
    } else {
      setCloudMessage({ text: 'اطلاعاتی در فضای ابری برای این حساب یافت نشد.', success: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                پشتیبان‌گیری و ذخیره‌سازی اطلاعات
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ذخیره روی حافظه دیوایس، دانلود فایل بکاپ، نقاط بازیابی محلی و همگام‌سازی
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

        {/* User Account Context Banner */}
        <div className="px-5 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>حساب فعال جاری:</span>
            <span className="font-bold font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800">
              {activeEmail || 'محیط محلی دیوایس (بدون لاگین)'}
            </span>
          </div>
          <span className="font-bold text-zinc-700 dark:text-zinc-300">
            {devices.length} دستگاه ثبت‌شده
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل پشتیبان</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>بازیابی از فایل دستگاه</span>
          </button>

          <button
            onClick={() => setActiveTab('snapshots')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'snapshots'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>نقاط پشتیبان محلی ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'cloud'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>همگام‌سازی ابری</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <p className="font-bold">ذخیره نسخه پشتیبان کامل در حافظه دیوایس:</p>
                  <p>
                    فایل پشتیبان شامل تمام مشخصات ماشین‌آلات، تصاویر، زمان‌بندی‌های ارسال، اطلاعات پروفایل شرکت و تنظیمات ستون‌ها می‌باشد و در قالب یک فایل استاندارد JSON در پوشه دانلودهای شما ذخیره می‌شود.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">تعداد ماشین‌آلات موجود:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">{devices.length} دستگاه</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">تعداد زمان‌بندی‌های ثبت شده:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">
                    {devices.reduce((acc, d) => acc + (d.schedules?.length || 0), 0)} زمان‌بندی
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">فرمت فایل خروجی:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">JSON (سازگار با نسخه ۲.۵)</span>
                </div>
              </div>

              <button
                onClick={handleExportFile}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition"
              >
                <Download className="w-4 h-4" />
                <span>دانلود و ذخیره فایل بکاپ روی دستگاه</span>
              </button>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer bg-zinc-50 dark:bg-zinc-800/40 transition group"
              >
                <Upload className="w-10 h-10 text-zinc-400 group-hover:text-blue-500 mx-auto mb-2 transition" />
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {importFileName ? `فایل انتخاب شده: ${importFileName}` : 'کلیک کنید یا فایل پشتیبان JSON را اینجا رها کنید'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  پشتیبانی از فایل‌های پشتیبان سامانه RCG
                </p>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {selectedFileBackup && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>فایل پشتیبان با موفقیت شناسایی شد:</span>
                  </div>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 grid grid-cols-2 gap-2">
                    <div>تعداد دستگاه‌ها: <span className="font-bold">{selectedFileBackup.devices?.length || 0}</span></div>
                    <div>تاریخ خروجی: <span className="font-bold">{new Date(selectedFileBackup.exportedAt).toLocaleDateString('fa-IR')}</span></div>
                    {selectedFileBackup.exportedByEmail && (
                      <div className="col-span-2">حساب مبدا: <span className="font-mono font-bold">{selectedFileBackup.exportedByEmail}</span></div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmRestore('replace')}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      جایگزینی کامل انبار با این فایل
                    </button>
                    <button
                      onClick={() => handleConfirmRestore('merge')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      ادغام و افزودن به دستگاه‌های موجود
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="عنوان نقطه پشتیبان سریع (مثلاً: قبل از ویرایش عمده قیمت‌ها)..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ثبت نقطه پشتیبان</span>
                </button>
              </div>

              <div className="space-y-2">
                {snapshots.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    هنوز نقطه پشتیبان سریعی در حافظه دیوایس ثبت نشده است.
                  </div>
                ) : (
                  snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white">{snap.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {new Date(snap.timestamp).toLocaleString('fa-IR')} • {snap.devicesCount} دستگاه
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRestoreFromSnapshot(snap)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold hover:bg-blue-200 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>بازیابی</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {!googleUser ? (
                <div className="p-6 text-center space-y-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <Cloud className="w-10 h-10 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    برای همگام‌سازی ابری و ذخیره در Firestore، ابتدا با حساب کاربری گوگل خود وارد شوید.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">حساب ابری فایربیس:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-white">{googleUser.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">پایگاه داده:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">Firestore (امن و اختصاصی)</span>
                    </div>
                  </div>

                  {cloudMessage && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      cloudMessage.success 
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200' 
                        : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200'
                    }`}>
                      {cloudMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{cloudMessage.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSyncToCloud}
                      disabled={isCloudSyncing}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>{isCloudSyncing ? 'در حال ارسال...' : 'ارسال و ذخیره در ابر'}</span>
                    </button>

                    <button
                      onClick={handleFetchFromCloud}
                      disabled={isCloudSyncing}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>بازیابی از ابر</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
