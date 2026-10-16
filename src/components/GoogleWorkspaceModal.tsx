import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { DeviceItem } from '../types/device';
import { 
  exportDevicesToGoogleSheets, 
  listRecentGoogleSheets, 
  importFromGoogleSheet, 
  backupInventoryToDrive,
  SheetFileSummary 
} from '../lib/workspace';
import { convertRowsToDevices, autoSuggestMapping } from '../lib/excel';
import { 
  Cloud, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  FolderSync, 
  Check, 
  ShieldAlert
} from 'lucide-react';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DeviceItem[];
  onImportDevices: (newDevices: DeviceItem[]) => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  isLoggingIn: boolean;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  devices,
  onImportDevices,
  googleUser,
  onGoogleSignIn,
  isLoggingIn,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>('export');
  const [sheetTitle, setSheetTitle] = useState('');
  const [recentSheets, setRecentSheets] = useState<SheetFileSummary[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [customSheetUrl, setCustomSheetUrl] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Destructive / Mutating confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    show: false,
    title: '',
    description: '',
    action: async () => {},
  });

  useEffect(() => {
    if (isOpen && googleUser && activeTab === 'import') {
      loadDriveSheets();
    }
  }, [isOpen, googleUser, activeTab]);

  if (!isOpen) return null;

  const loadDriveSheets = async () => {
    try {
      setLoadingSheets(true);
      const list = await listRecentGoogleSheets();
      setRecentSheets(list);
    } catch (err: any) {
      console.warn('Could not load recent sheets:', err);
    } finally {
      setLoadingSheets(false);
    }
  };

  // Export to Google Sheets with user confirmation
  const triggerExport = () => {
    setConfirmDialog({
      show: true,
      title: 'ایجاد گوگل شیت جدید در حساب شما',
      description: `آیا مایلید فایل جدیدی در حساب گوگل درایو شما به نام "${sheetTitle || 'موجودی ماشین‌آلات صنعتی'}" ایجاد شود و اطلاعات ${devices.length} دستگاه به آن ارسال گردد؟`,
      action: async () => {
        try {
          setLoading(true);
          setErrorMessage(null);
          setSuccessMessage(null);
          setCreatedSheetUrl(null);

          const res = await exportDevicesToGoogleSheets(devices, sheetTitle.trim());
          setSuccessMessage('اطلاعات ماشین‌آلات با موفقیت در گوگل شیت ثبت شد!');
          setCreatedSheetUrl(res.spreadsheetUrl);
        } catch (err: any) {
          setErrorMessage(err.message || 'خطا در خروجی به گوگل شیت.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Import from Google Sheets
  const triggerImport = () => {
    const targetId = selectedSheetId || customSheetUrl.trim();
    if (!targetId) {
      setErrorMessage('لطفاً یک گوگل شیت را از لیست انتخاب کرده یا آدرس آن را وارد نمایید.');
      return;
    }

    setConfirmDialog({
      show: true,
      title: 'فراخوانی اطلاعات از گوگل شیت',
      description: 'آیا مایلید اطلاعات دستگاه‌ها از گوگل شیت موردنظر بازخوانی شده و به موجودی انبار شما افزوده شود؟',
      action: async () => {
        try {
          setLoading(true);
          setErrorMessage(null);
          setSuccessMessage(null);

          const values = await importFromGoogleSheet(targetId);
          if (values.length < 2) {
            throw new Error('فایل گوگل شیت خالی است یا سرستون ندارد.');
          }

          const headers = values[0].map(String);
          const rows = values.slice(1);
          const mapping = autoSuggestMapping(headers);
          const imported = convertRowsToDevices(rows, mapping);

          if (imported.length === 0) {
            throw new Error('هیچ دستگاه معتبری از گوگل شیت یافت نشد.');
          }

          onImportDevices(imported);
          setSuccessMessage(`${imported.length} دستگاه با موفقیت از گوگل شیت دریافت و به انبار اضافه شد!`);
        } catch (err: any) {
          setErrorMessage(err.message || 'خطا در بازخوانی اطلاعات از گوگل شیت.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Backup to Drive
  const triggerBackup = () => {
    setConfirmDialog({
      show: true,
      title: 'ذخیره نسخه پشتیبان در Google Drive',
      description: `آیا مایلید نسخه پشتیبان کامل انبار با ${devices.length} دستگاه به همراه تصاویر و مشخصات در Google Drive ذخیره شود؟`,
      action: async () => {
        try {
          setLoading(true);
          setErrorMessage(null);
          setSuccessMessage(null);

          const result = await backupInventoryToDrive(devices);
          setSuccessMessage(`فایل "${result.name}" با موفقیت در درایو شما ذخیره شد.`);
        } catch (err: any) {
          setErrorMessage(err.message || 'خطا در ذخیره نسخه پشتیبان در گوگل درایو.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                یکپارچه‌سازی با Google Sheets و Google Drive
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                همگام‌سازی مستقیم موجودی انبار، پشتیبان‌گیری در درایو و بازخوانی شیت‌ها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier if not signed in */}
        {!googleUser ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
              <Cloud className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-base text-zinc-900 dark:text-white">
              اتصال به حساب گوگل کاربر
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              برای خروجی گرفتن به گوگل شیت، ذخیره فایل‌های پشتیبان در درایو و فراخوانی فایل‌ها، لطفاً با حساب گوگل خود وارد شوید. این دسترسی‌ها با اجازه صریح شما انجام می‌پذیرد.
            </p>
            <div>
              <button
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'در حال برقراری ارتباط...' : 'ورود با حساب گوگل'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-800/40">
              <button
                onClick={() => {
                  setActiveTab('export');
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 px-4 border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'export'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>خروجی به Google Sheets</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('import');
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 px-4 border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'import'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>فراخوانی از Google Sheets</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('backup');
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 px-4 border-b-2 transition flex items-center justify-center gap-2 ${
                  activeTab === 'backup'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FolderSync className="w-4 h-4 text-purple-600" />
                <span>پشتیبان در Google Drive</span>
              </button>
            </div>

            {/* Notification messages */}
            {successMessage && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
                {createdSheetUrl && (
                  <a
                    href={createdSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>باز کردن شیت</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      عنوان فایل گوگل شیت
                    </label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      placeholder="مثال: لیست ماشین‌آلات آماده فروش - پاییز"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>تعداد دستگاه‌های خروجی:</span>
                      <strong className="text-zinc-900 dark:text-white">{devices.length} دستگاه</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ستون‌ها:</span>
                      <span>کد، نام، مدل، دسته‌بندی، شرایط پرداخت، گارانتی، قیمت، مشخصات</span>
                    </div>
                  </div>

                  <button
                    onClick={triggerExport}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>ایجاد و انتقال اطلاعات به Google Sheets</span>
                  </button>
                </div>
              )}

              {activeTab === 'import' && (
                <div className="space-y-4">
                  {/* Recent sheets list from Drive */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        فایل‌های گوگل شیت اخیر در گوگل درایو شما:
                      </span>
                      <button
                        onClick={loadDriveSheets}
                        disabled={loadingSheets}
                        className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingSheets ? 'animate-spin' : ''}`} />
                        <span>بروزرسانی لیست</span>
                      </button>
                    </div>

                    {loadingSheets ? (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        در حال جستجوی فایل‌های اسپردشیت در گوگل درایو...
                      </div>
                    ) : recentSheets.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2">
                        {recentSheets.map((sh) => (
                          <div
                            key={sh.id}
                            onClick={() => {
                              setSelectedSheetId(sh.id);
                              setCustomSheetUrl('');
                            }}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                              selectedSheetId === sh.id
                                ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 text-blue-900 dark:text-blue-200 font-bold'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="truncate">{sh.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                              {new Date(sh.modifiedTime).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 p-3 bg-zinc-50 rounded-xl">
                        فایلی در درایو یافت نشد یا دسترسی داده نشده است. می‌توانید لینک مستقیم شیت را در کادر زیر وارد کنید.
                      </p>
                    )}
                  </div>

                  {/* Or direct URL */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      یا آدرس اینترنتی (لینک) یا شناسه فایل Google Sheets:
                    </label>
                    <input
                      type="text"
                      value={customSheetUrl}
                      onChange={(e) => {
                        setCustomSheetUrl(e.target.value);
                        setSelectedSheetId('');
                      }}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={triggerImport}
                    disabled={loading || (!selectedSheetId && !customSheetUrl)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>فراخوانی دستگاه‌ها از شیت انتخابی</span>
                  </button>
                </div>
              )}

              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    با این قابلیت، نسخه پشتیبان کامل از تمامی مشخصات فنی، گالری‌های تصاویر، شرایط نقد و اقساط و تنظیمات تمامی <strong>{devices.length} دستگاه</strong> در یک فایل امن JSON روی گوگل درایو شخصی شما ذخیره خواهد شد.
                  </div>

                  <button
                    onClick={triggerBackup}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderSync className="w-4 h-4" />}
                    <span>ایجاد و ذخیره نسخه پشتیبان کامل در گوگل درایو</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* User Confirmation Dialog for Destructive / Mutating Operations */}
        {confirmDialog.show && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-zinc-800 rounded-3xl p-5 max-w-md w-full border border-zinc-200 dark:border-zinc-700 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-amber-600">
                <ShieldAlert className="w-6 h-6" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                  {confirmDialog.title}
                </h4>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog((p) => ({ ...p, show: false }))}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = confirmDialog.action;
                    setConfirmDialog((p) => ({ ...p, show: false }));
                    await action();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  تایید و انجام عملیات
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
