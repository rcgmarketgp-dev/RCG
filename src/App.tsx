import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  DeviceItem, 
  ColumnConfig, 
  CategoryInfo, 
  FilterOptions, 
  DeviceStatus,
  BroadcastSchedule
} from './types/device';
import { 
  INITIAL_DEVICES, 
  DEFAULT_CATEGORIES, 
  DEFAULT_COLUMNS 
} from './data/initialData';
import { initAuth, googleSignIn, logoutGoogle } from './lib/firebase';
import { recordStatusChangeLog } from './lib/statusHistory';
import { loadDevicesForUser, saveDevicesForUser } from './lib/multiUserStorage';
import { 
  findDueSchedules, 
  playNotificationChime, 
  sendBrowserNotification,
  requestNotificationPermission 
} from './lib/broadcastSchedule';
import { Header } from './components/Header';
import { AdvancedFilterBar } from './components/AdvancedFilterBar';
import { DeviceTable } from './components/DeviceTable';
import { DeviceShowcase } from './components/DeviceShowcase';
import { ExcelGridEntry } from './components/ExcelGridEntry';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { DeviceFormModal } from './components/DeviceFormModal';
import { ColumnConfigModal } from './components/ColumnConfigModal';
import { AICaptionModal } from './components/AICaptionModal';
import { AIFixSpellModal } from './components/AIFixSpellModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { ScheduleModal } from './components/ScheduleModal';
import { SchedulesOverviewModal } from './components/SchedulesOverviewModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { BroadcastNotificationToast } from './components/BroadcastNotificationToast';
import { BroadcastCalendarView } from './components/BroadcastCalendarView';
import { QuickActionMenu } from './components/QuickActionMenu';

const STORAGE_KEY_COLUMNS = 'rcg_woodworking_columns_v2';

export default function App() {
  // Google Auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Devices state with multi-user / per-email persistence
  const [devices, setDevices] = useState<DeviceItem[]>(() => {
    return loadDevicesForUser(null, INITIAL_DEVICES);
  });

  // Table columns state with localStorage persistence
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COLUMNS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load stored columns:', e);
    }
    return DEFAULT_COLUMNS;
  });

  // Categories
  const [categories] = useState<CategoryInfo[]>(DEFAULT_CATEGORIES);

  // View state: 'excel' (Excel-like Grid Entry), 'table' (Entry & Management), 'showcase' (Catalog), or 'calendar' (Solar Hijri Broadcast Calendar)
  const [currentView, setCurrentView] = useState<'excel' | 'table' | 'showcase' | 'calendar'>('excel');

  // Theme state with localStorage persistence and system preference detection
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('rcg_theme_mode');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.warn('Failed to load theme preference:', e);
    }
    return 'light';
  });

  // Sync theme with document class and data-theme attribute
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('rcg_theme_mode', theme);
    } catch (e) {
      console.warn('Failed to update theme:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    status: 'all',
    category: 'all',
    warrantyMonths: 'all',
    minCashPct: 0,
    maxCashPct: 100,
    minPrice: 0,
    maxPrice: 10000000000,
    hasImagesOnly: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);

  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [isAICaptionOpen, setIsAICaptionOpen] = useState(false);
  const [aiCaptionDevice, setAiCaptionDevice] = useState<DeviceItem | null>(null);

  const [isAIFixSpellOpen, setIsAIFixSpellOpen] = useState(false);
  const [aiFixSpellDevice, setAiFixSpellDevice] = useState<DeviceItem | null>(null);

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCompanyProfileOpen, setIsCompanyProfileOpen] = useState(false);

  // New Modals: Schedule, Schedules Overview & Device Backup
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingDevice, setSchedulingDevice] = useState<DeviceItem | null>(null);
  const [isSchedulesOverviewOpen, setIsSchedulesOverviewOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Due Broadcast Schedules Notification
  const [dueSchedules, setDueSchedules] = useState<{ device: DeviceItem; schedule: BroadcastSchedule }[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist devices per logged in email or local guest
  useEffect(() => {
    saveDevicesForUser(googleUser?.email, devices);
  }, [devices, googleUser?.email]);

  // Persist column settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columns));
    } catch (e) {
      console.warn('Failed to save columns to storage:', e);
    }
  }, [columns]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
        // Load data specific to this authenticated email
        const userDevices = loadDevicesForUser(user.email, devices);
        setDevices(userDevices);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Request browser notification permission on first interaction
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  // Check for due broadcast schedules periodically (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const due = findDueSchedules(devices);
      if (due.length > 0) {
        setDueSchedules(due);
        playNotificationChime();
        due.forEach(({ device, schedule }) => {
          sendBrowserNotification('⏰ موعد ارسال آگهی فرا رسید', {
            body: `زمان ارسال آگهی «${device.name}» به ${schedule.channelOrGroupName} فرا رسیده است.`,
          });
        });

        // Mark schedules as notified in device list to avoid repetitive alerts
        setDevices((prev) =>
          prev.map((d) => {
            if (!d.schedules) return d;
            const updated = d.schedules.map((s) => {
              if (due.some((item) => item.schedule.id === s.id)) {
                return { ...s, notified: true };
              }
              return s;
            });
            return { ...d, schedules: updated };
          })
        );
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [devices]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        const userDevices = loadDevicesForUser(res.user.email, devices);
        setDevices(userDevices);
        showToast(`خوش آمدید، اطلاعات حساب ${res.user.email} بارگذاری شد.`);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      showToast('خطا در ورود با حساب گوگل');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    const guestDevices = loadDevicesForUser(null, INITIAL_DEVICES);
    setDevices(guestDevices);
    showToast('با موفقیت از حساب خارج شدید و انبار محلی بارگذاری شد.');
  };

  // Count pending schedules for the Header notification bell
  const pendingSchedulesCount = useMemo(() => {
    let count = 0;
    devices.forEach((d) => {
      if (d.schedules) {
        count += d.schedules.filter((s) => s.status === 'pending').length;
      }
    });
    return count;
  }, [devices]);

  // Filtered & Sorted devices list
  const filteredDevices = useMemo(() => {
    return devices
      .filter((device) => {
        // Search query
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matches =
            device.name?.toLowerCase().includes(q) ||
            device.model?.toLowerCase().includes(q) ||
            device.code?.toLowerCase().includes(q) ||
            device.serialNumber?.toLowerCase().includes(q) ||
            device.location?.toLowerCase().includes(q) ||
            device.category?.toLowerCase().includes(q) ||
            device.specsText?.toLowerCase().includes(q) ||
            device.notes?.toLowerCase().includes(q);

          if (!matches) return false;
        }

        // Status
        if (filters.status !== 'all' && device.status !== filters.status) {
          return false;
        }

        // Category
        if (filters.category !== 'all' && device.category !== filters.category) {
          return false;
        }

        // Warranty
        if (filters.warrantyMonths !== 'all') {
          if (filters.warrantyMonths === 9) {
            if (device.warrantyMonths < 9) return false;
          } else if (device.warrantyMonths !== filters.warrantyMonths) {
            return false;
          }
        }

        // Max cash %
        if (device.cashPercentage > filters.maxCashPct) {
          return false;
        }

        // Has images only
        if (filters.hasImagesOnly && (!device.images || device.images.length === 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const order = filters.sortOrder === 'asc' ? 1 : -1;
        if (filters.sortBy === 'name') {
          return a.name.localeCompare(b.name, 'fa') * order;
        }
        if (filters.sortBy === 'price') {
          return ((a.price || 0) - (b.price || 0)) * order;
        }
        if (filters.sortBy === 'warrantyMonths') {
          return (a.warrantyMonths - b.warrantyMonths) * order;
        }
        if (filters.sortBy === 'status') {
          return a.status.localeCompare(b.status) * order;
        }
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
      });
  }, [devices, filters]);

  // Handlers for Device management
  const handleAddNewDevice = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };

  const handleEditDevice = (device: DeviceItem) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

  const handleSaveDevice = (savedDevice: DeviceItem) => {
    const existing = devices.find((d) => d.id === savedDevice.id);
    if (existing) {
      if (existing.status !== savedDevice.status) {
        recordStatusChangeLog(
          savedDevice.id,
          existing.status,
          savedDevice.status,
          'ویرایش وضعیت در فرم دستگاه',
          googleUser?.displayName || googleUser?.email || 'کاربر سیستم'
        );
      }
    } else {
      recordStatusChangeLog(
        savedDevice.id,
        'initial',
        savedDevice.status,
        'ثبت اولیه دستگاه در سامانه',
        googleUser?.displayName || googleUser?.email || 'کاربر سیستم'
      );
    }

    setDevices((prev) => {
      const exists = prev.some((d) => d.id === savedDevice.id);
      if (exists) {
        return prev.map((d) => (d.id === savedDevice.id ? savedDevice : d));
      }
      return [savedDevice, ...prev];
    });

    if (selectedDevice?.id === savedDevice.id) {
      setSelectedDevice(savedDevice);
    }

    showToast(`دستگاه «${savedDevice.name}» با موفقیت ذخیره شد.`);
  };

  const handleDeleteDevice = (device: DeviceItem) => {
    const confirmed = window.confirm(
      `آیا از حذف دستگاه «${device.name}» با کد ${device.code} اطمینان دارید؟`
    );
    if (!confirmed) return;

    setDevices((prev) => prev.filter((d) => d.id !== device.id));
    if (selectedDevice?.id === device.id) {
      setIsDetailOpen(false);
      setSelectedDevice(null);
    }
    showToast('دستگاه با موفقیت حذف گردید.');
  };

  const handleStatusChange = (device: DeviceItem, newStatus: DeviceStatus, note?: string) => {
    if (device.status === newStatus) return;
    const oldStatus = device.status;

    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, status: newStatus } : d))
    );

    recordStatusChangeLog(
      device.id,
      oldStatus,
      newStatus,
      note || 'تغییر وضعیت از طریق جدول انبار',
      googleUser?.displayName || googleUser?.email || 'کاربر سیستم'
    );

    if (selectedDevice?.id === device.id) {
      setSelectedDevice({ ...device, status: newStatus });
    }

    showToast('وضعیت دستگاه بروزرسانی و در تاریخچه ثبت شد.');
  };

  const handleViewDevice = (device: DeviceItem) => {
    setSelectedDevice(device);
    setIsDetailOpen(true);
  };

  const handleOpenAICaption = (device: DeviceItem) => {
    setAiCaptionDevice(device);
    setIsAICaptionOpen(true);
  };

  const handleOpenAIFixSpelling = (device: DeviceItem) => {
    setAiFixSpellDevice(device);
    setIsAIFixSpellOpen(true);
  };

  const handleApplyAICorrections = (updatedDevice: DeviceItem) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d))
    );
    if (selectedDevice?.id === updatedDevice.id) {
      setSelectedDevice(updatedDevice);
    }
    showToast('اصلاحات هوش مصنوعی بر روی دستگاه اعمال شد.');
  };

  const handleImportExcelSuccess = (imported: DeviceItem[]) => {
    imported.forEach((dev) => {
      recordStatusChangeLog(
        dev.id,
        'initial',
        dev.status,
        'ورود از طریق فایل اکسل',
        googleUser?.displayName || googleUser?.email || 'کاربر سیستم'
      );
    });
    setDevices((prev) => [...imported, ...prev]);
    showToast(`${imported.length} دستگاه با موفقیت از اکسل به موجودی اضافه شد.`);
  };

  const handleResetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    showToast('چیدمان ستون‌ها به حالت پیش‌فرض بازگشت.');
  };

  const handleSaveAllFromGrid = (updatedList: DeviceItem[]) => {
    updatedList.forEach((newDev) => {
      const prevDev = devices.find((d) => d.id === newDev.id);
      if (prevDev && prevDev.status !== newDev.status) {
        recordStatusChangeLog(
          newDev.id,
          prevDev.status,
          newDev.status,
          'تغییر وضعیت از طریق محیط اکسل',
          googleUser?.displayName || googleUser?.email || 'کاربر سیستم'
        );
      } else if (!prevDev) {
        recordStatusChangeLog(
          newDev.id,
          'initial',
          newDev.status,
          'ثبت مستقیم از جدول گسترده اکسل',
          googleUser?.displayName || googleUser?.email || 'کاربر سیستم'
        );
      }
    });

    setDevices(updatedList);
    showToast(`اطلاعات ${updatedList.length} دستگاه در انبار با موفقیت ذخیره شد.`);
  };

  // Schedule Management Handlers
  const handleOpenScheduleModal = (device: DeviceItem) => {
    setSchedulingDevice(device);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (deviceId: string, schedule: BroadcastSchedule) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const currentSchedules = d.schedules || [];
        const exists = currentSchedules.some((s) => s.id === schedule.id);
        const updated = exists
          ? currentSchedules.map((s) => (s.id === schedule.id ? schedule : s))
          : [...currentSchedules, schedule];
        return { ...d, schedules: updated };
      })
    );
    showToast(`زمان‌بندی ارسال به «${schedule.channelOrGroupName}» ذخیره شد.`);
  };

  const handleDeleteSchedule = (deviceId: string, scheduleId: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          schedules: (d.schedules || []).filter((s) => s.id !== scheduleId),
        };
      })
    );
    showToast('زمان‌بندی با موفقیت حذف گردید.');
  };

  const handleToggleScheduleStatus = (deviceId: string, scheduleId: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          schedules: (d.schedules || []).map((s) => {
            if (s.id !== scheduleId) return s;
            const nextStatus = s.status === 'sent' ? 'pending' : 'sent';
            return { ...s, status: nextStatus };
          }),
        };
      })
    );
    showToast('وضعیت ارسال تغییر یافت.');
  };

  const handleSnoozeSchedule = (deviceId: string, scheduleId: string, minutes: number) => {
    const newTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          schedules: (d.schedules || []).map((s) => {
            if (s.id !== scheduleId) return s;
            return { ...s, scheduledDateTime: newTime, notified: false, status: 'pending' };
          }),
        };
      })
    );
    setDueSchedules((prev) => prev.filter((i) => i.schedule.id !== scheduleId));
    showToast(`ارسال آگهی به مدت ${minutes} دقیقه به تعویق افتاد.`);
  };

  const handleDismissDueNotification = (scheduleId: string) => {
    setDueSchedules((prev) => prev.filter((i) => i.schedule.id !== scheduleId));
  };

  const handleMarkSentFromNotification = (deviceId: string, scheduleId: string) => {
    handleToggleScheduleStatus(deviceId, scheduleId);
    setDueSchedules((prev) => prev.filter((i) => i.schedule.id !== scheduleId));
  };

  // Backup & Restore Handlers
  const handleRestoreDevices = (restored: DeviceItem[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setDevices(restored);
      showToast(`موجودی انبار با موفقیت با ${restored.length} دستگاه از فایل پشتیبان جایگزین شد.`);
    } else {
      setDevices((prev) => {
        const map = new Map<string, DeviceItem>();
        prev.forEach((d) => map.set(d.id, d));
        restored.forEach((d) => map.set(d.id, d));
        return Array.from(map.values());
      });
      showToast(`${restored.length} دستگاه از نسخه پشتیبان با اطلاعات موجود ادغام گردید.`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Broadcast Due Notification Banner / Toast */}
      <BroadcastNotificationToast
        dueItems={dueSchedules}
        onDismiss={handleDismissDueNotification}
        onMarkSent={handleMarkSentFromNotification}
        onSendNow={(device) => {
          handleOpenAICaption(device);
        }}
        onSnooze={handleSnoozeSchedule}
      />

      {/* Main App Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onAddNewDevice={handleAddNewDevice}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleLogout={handleGoogleLogout}
        isLoggingIn={isLoggingIn}
        totalDevicesCount={devices.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAICaption={() => {
          setAiCaptionDevice(null);
          setIsAICaptionOpen(true);
        }}
        onOpenCompanyProfile={() => setIsCompanyProfileOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        pendingSchedulesCount={pendingSchedulesCount}
        onOpenSchedulesList={() => setIsSchedulesOverviewOpen(true)}
      />

      {/* Main Container */}
      <main 
        style={{ width: '1400px', maxWidth: '100%', minHeight: '200px' }}
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full overflow-x-hidden"
      >
        {/* View Mode Quick Switch Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 bg-white dark:bg-zinc-800/80 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">حالت جاری:</span>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
              currentView === 'excel' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : currentView === 'table'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : currentView === 'showcase'
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {currentView === 'excel'
                ? 'صفحه گسترده ورود اکسلی'
                : currentView === 'table'
                ? 'جدول مدیریت انبار و فیلترها'
                : currentView === 'showcase'
                ? 'ویترین کاتالوگ فروش'
                : 'تقویم خورشیدی ارسال آگهی‌ها'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {currentView !== 'excel' && (
              <button
                onClick={() => setCurrentView('excel')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all font-semibold"
              >
                ورود اطلاعات شبیه اکسل
              </button>
            )}
            {currentView !== 'table' && (
              <button
                onClick={() => setCurrentView('table')}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 active:scale-95 transition-all font-semibold"
              >
                جدول اصلی انبار
              </button>
            )}
            {currentView !== 'showcase' && (
              <button
                onClick={() => setCurrentView('showcase')}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 active:scale-95 transition-all font-semibold"
              >
                ویترین فروش و زمان‌بندی
              </button>
            )}
            {currentView !== 'calendar' && (
              <button
                onClick={() => setCurrentView('calendar')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 active:scale-95 transition-all font-semibold"
              >
                تقویم خورشیدی ارسال‌ها
              </button>
            )}
          </div>
        </div>

        {/* View 1: Excel Spreadsheet Grid Entry */}
        {currentView === 'excel' && (
          <ExcelGridEntry
            devices={devices}
            onSaveAll={handleSaveAllFromGrid}
            categories={categories}
            onOpenAICaption={handleOpenAICaption}
            onOpenAIFixSpelling={handleOpenAIFixSpelling}
            onViewDevice={handleViewDevice}
            onOpenColumnConfig={() => setIsColumnConfigOpen(true)}
          />
        )}

        {/* Filter bar for Table and Showcase views */}
        {(currentView === 'table' || currentView === 'showcase') && (
          <AdvancedFilterBar
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            onOpenColumnConfig={() => setIsColumnConfigOpen(true)}
            filteredCount={filteredDevices.length}
            totalCount={devices.length}
          />
        )}

        {/* View 2: Data Table Workspace with customizable columns */}
        {currentView === 'table' && (
          <DeviceTable
            devices={filteredDevices}
            columns={columns}
            categories={categories}
            onViewDevice={handleViewDevice}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
            onOpenAICaption={handleOpenAICaption}
            onOpenAIFixSpelling={handleOpenAIFixSpelling}
            onStatusChange={handleStatusChange}
            onAddNewDevice={handleAddNewDevice}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}

        {/* View 3: Showcase & Profile Catalog View with Schedules */}
        {currentView === 'showcase' && (
          <DeviceShowcase
            devices={filteredDevices}
            categories={categories}
            onViewDevice={handleViewDevice}
            onOpenAICaption={handleOpenAICaption}
            onOpenAIFixSpelling={handleOpenAIFixSpelling}
            onStatusChange={handleStatusChange}
            onOpenScheduleModal={handleOpenScheduleModal}
            onDeleteSchedule={handleDeleteSchedule}
            onToggleScheduleStatus={handleToggleScheduleStatus}
          />
        )}

        {/* View 4: Persian Solar Calendar for Broadcast Ads */}
        {currentView === 'calendar' && (
          <BroadcastCalendarView
            devices={devices}
            onOpenDeviceDetail={handleViewDevice}
            onOpenScheduleModal={handleOpenScheduleModal}
            onOpenAICaption={handleOpenAICaption}
            onDeleteSchedule={handleDeleteSchedule}
            onToggleScheduleStatus={handleToggleScheduleStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50">
        <p>
          سامانه هوشمند مدیریت موجودی و فروش ماشین‌آلات صنعتی • اتصال به Google Sheets و Drive • سیستم زمان‌بندی ارسال آگهی، پشتیبان‌گیری دیوایس و هوش مصنوعی
        </p>
      </footer>

      {/* Modals */}
      <DeviceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDevice(null);
        }}
        onSave={handleSaveDevice}
        initialDevice={editingDevice}
        categories={categories}
      />

      <DeviceDetailModal
        device={selectedDevice}
        allDevices={devices}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDevice(null);
        }}
        onEdit={(d) => {
          setIsDetailOpen(false);
          handleEditDevice(d);
        }}
        onOpenAICaption={handleOpenAICaption}
        onOpenAIFixSpelling={handleOpenAIFixSpelling}
        onUpdateDevice={handleSaveDevice}
        onStatusChange={handleStatusChange}
        currentUser={googleUser}
        categories={categories}
      />

      <ColumnConfigModal
        isOpen={isColumnConfigOpen}
        onClose={() => setIsColumnConfigOpen(false)}
        columns={columns}
        setColumns={setColumns}
        onResetColumns={handleResetColumns}
      />

      <AICaptionModal
        isOpen={isAICaptionOpen}
        onClose={() => {
          setIsAICaptionOpen(false);
          setAiCaptionDevice(null);
        }}
        device={aiCaptionDevice}
        allDevices={devices}
        onOpenCompanyProfile={() => setIsCompanyProfileOpen(true)}
      />

      <CompanyProfileModal
        isOpen={isCompanyProfileOpen}
        onClose={() => setIsCompanyProfileOpen(false)}
        onProfileUpdated={(p) => {
          showToast(`پروفایل و امضای «${p.companyName}» با موفقیت ذخیره شد.`);
        }}
      />

      <AIFixSpellModal
        isOpen={isAIFixSpellOpen}
        onClose={() => {
          setIsAIFixSpellOpen(false);
          setAiFixSpellDevice(null);
        }}
        device={aiFixSpellDevice}
        onApplyCorrections={handleApplyAICorrections}
      />

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportSuccess={handleImportExcelSuccess}
        currentDevices={devices}
      />

      <GoogleWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        devices={devices}
        onImportDevices={(imported) => {
          setDevices((prev) => [...imported, ...prev]);
          showToast(`${imported.length} دستگاه از گوگل شیت اضافه شد.`);
        }}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        isLoggingIn={isLoggingIn}
      />

      {/* Broadcast Schedule Modal for Device */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSchedulingDevice(null);
        }}
        device={schedulingDevice}
        onSaveSchedule={handleSaveSchedule}
      />

      {/* Schedules Overview List Modal */}
      <SchedulesOverviewModal
        isOpen={isSchedulesOverviewOpen}
        onClose={() => setIsSchedulesOverviewOpen(false)}
        devices={devices}
        onOpenAICaption={handleOpenAICaption}
        onToggleScheduleStatus={handleToggleScheduleStatus}
        onDeleteSchedule={handleDeleteSchedule}
        onAddNewSchedule={() => {
          if (devices.length > 0) {
            setSchedulingDevice(devices[0]);
            setIsScheduleModalOpen(true);
          }
        }}
      />

      {/* Device Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        devices={devices}
        onRestoreDevices={handleRestoreDevices}
        googleUser={googleUser}
        columns={columns}
      />

      {/* Floating Quick Action Speed-Dial Menu */}
      <QuickActionMenu
        onAddNewDevice={handleAddNewDevice}
        onOpenExcelGrid={() => setCurrentView('excel')}
        onOpenCalendar={() => setCurrentView('calendar')}
        onOpenSchedulesOverview={() => setIsSchedulesOverviewOpen(true)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenAICaption={() => {
          setAiCaptionDevice(null);
          setIsAICaptionOpen(true);
        }}
        pendingSchedulesCount={pendingSchedulesCount}
      />
    </div>
  );
}
