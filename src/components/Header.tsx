import React from 'react';
import { User } from 'firebase/auth';
import { 
  Plus, 
  FileSpreadsheet, 
  Cloud, 
  LayoutGrid, 
  TableProperties, 
  Wrench, 
  LogOut, 
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Send,
  Building2
} from 'lucide-react';

interface HeaderProps {
  currentView: 'excel' | 'table' | 'showcase';
  setCurrentView: (view: 'excel' | 'table' | 'showcase') => void;
  onAddNewDevice: () => void;
  onOpenExcelModal: () => void;
  onOpenWorkspaceModal: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleLogout: () => void;
  isLoggingIn: boolean;
  totalDevicesCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAICaption?: () => void;
  onOpenCompanyProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  onAddNewDevice,
  onOpenExcelModal,
  onOpenWorkspaceModal,
  googleUser,
  onGoogleSignIn,
  onGoogleLogout,
  isLoggingIn,
  totalDevicesCount,
  theme,
  onToggleTheme,
  onOpenAICaption,
  onOpenCompanyProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Main Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Top Line on Mobile: Brand + Action Buttons */}
          <div className="flex items-center justify-between gap-2 w-full md:w-auto">
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 hover:scale-105 active:scale-95 transition-transform duration-200">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white tracking-tight truncate">
                    سامانه ماشین‌آلات چوب
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    اکسل و هوش مصنوعی
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden xl:block truncate">
                  ورود داده شبیه اکسل، جدول سفارشی، گالری و کپشن‌ساز هوشمند
                </p>
              </div>
            </div>

            {/* Mobile Actions: Add Device + Theme + User (Visible on mobile right next to brand) */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              {onOpenAICaption && (
                <button
                  onClick={onOpenAICaption}
                  title="ارسال مستقیم آگهی به پیام‌رسان‌ها (بله، تلگرام، ایتا، واتساپ)"
                  className="w-8 h-8 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900 active:scale-95 transition-all shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 -rotate-12" />
                </button>
              )}

              {onOpenCompanyProfile && (
                <button
                  onClick={onOpenCompanyProfile}
                  title="پروفایل شرکت و امضای پیام‌ها (اطلاعات تماس، شعار، آیدی‌ها)"
                  className="w-8 h-8 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 active:scale-95 transition-all shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onAddNewDevice}
                title="ثبت دستگاه جدید"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md active:scale-95 transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>دستگاه</span>
              </button>

              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'تم روشن' : 'تم تاریک'}
                className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-2xs"
                aria-label="تغییر تم"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              {googleUser ? (
                <button
                  onClick={onGoogleLogout}
                  title={`خروج: ${googleUser.email}`}
                  className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden hover:border-red-300 transition shadow-2xs"
                >
                  {googleUser.photoURL ? (
                    <img src={googleUser.photoURL} alt="کاربر" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-blue-600">
                      {googleUser.displayName?.charAt(0) || 'U'}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={onGoogleSignIn}
                  disabled={isLoggingIn}
                  title="ورود با گوگل"
                  className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* View Mode Switcher: Rounded Rectangles with smooth visual indication */}
          <div className="w-full md:w-auto flex items-center bg-zinc-100/90 dark:bg-zinc-800/90 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-700 shadow-2xs">
            <button
              onClick={() => setCurrentView('excel')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentView === 'excel'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold scale-[1.02]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>ورود اکسلی</span>
            </button>
            <button
              onClick={() => setCurrentView('table')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentView === 'table'
                  ? 'bg-blue-600 text-white shadow-sm font-bold scale-[1.02]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              <TableProperties className="w-4 h-4 shrink-0" />
              <span style={{ width: '70.8667px', height: '28px' }} className="inline-flex items-center justify-center truncate">
                جدول انبار ({totalDevicesCount})
              </span>
            </button>
            <button
              onClick={() => setCurrentView('showcase')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentView === 'showcase'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold scale-[1.02]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span style={{ width: '48.05px' }} className="inline-flex items-center justify-center">
                ویترین
              </span>
            </button>
          </div>

          {/* Desktop Actions */}
          <div 
            style={{ width: '700px', height: '69px', maxWidth: '100%' }}
            className="hidden md:flex items-center gap-2"
          >
            {/* Direct Messenger Share Ad tool */}
            {onOpenAICaption && (
              <button
                onClick={onOpenAICaption}
                title="ارسال مستقیم آگهی و عکس به پیام‌رسان‌ها (بله، تلگرام، ایتا، واتساپ)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
              >
                <Send className="w-3.5 h-3.5 -rotate-12 text-sky-600 dark:text-sky-400" />
                <span>ارسال به پیام‌رسان‌ها</span>
              </button>
            )}

            {/* Excel tool */}
            <button
              onClick={onOpenExcelModal}
              title="ورود و خروجی فایل اکسل"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>اکسل</span>
            </button>

            {/* Google Sheets & Drive */}
            <button
              onClick={onOpenWorkspaceModal}
              title="اتصال و همگام‌سازی گوگل شیت و درایو"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-xs font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Google Drive & Sheets</span>
              {googleUser && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            {/* Company Profile & Signature Button */}
            {onOpenCompanyProfile && (
              <button
                onClick={onOpenCompanyProfile}
                title="پروفایل و هویت سازمانی شرکت (شعار، اطلاعات تماس، آیدی‌های پیام‌رسان‌ها جهت درج در انتهای پیام)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
              >
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>پروفایل شرکت</span>
              </button>
            )}

            {/* Add New Machine button */}
            <button
              onClick={onAddNewDevice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت دستگاه جدید</span>
            </button>

            {/* Google Auth Status / Sign-in button */}
            {googleUser ? (
              <div className="relative group">
                <button
                  onClick={onGoogleLogout}
                  title={`خروج از حساب گوگل: ${googleUser.email}`}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 text-xs text-zinc-700 dark:text-zinc-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
                >
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'کاربر'}
                      className="w-6 h-6 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {googleUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden xl:inline text-xs truncate max-w-[120px]">
                    {googleUser.displayName || googleUser.email}
                  </span>
                  <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
                title="ورود با حساب گوگل جهت دسترسی به گوگل درایو و گوگل شیت"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden sm:inline">{isLoggingIn ? 'اتصال...' : 'ورود با گوگل'}</span>
              </button>
            )}

            {/* Theme Switcher Button: Rounded Square */}
            <button
              onClick={onToggleTheme}
              style={{ width: '45px' }}
              title={theme === 'dark' ? 'تغییر به تم روشن (روز)' : 'تغییر به تم تاریک (شب)'}
              className="flex items-center justify-center h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 shadow-2xs group shrink-0"
              aria-label="تغییر تم"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
