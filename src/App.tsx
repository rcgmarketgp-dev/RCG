import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  DeviceItem, 
  ColumnConfig, 
  CategoryInfo, 
  FilterOptions, 
  DeviceStatus 
} from './types/device';
import { 
  INITIAL_DEVICES, 
  DEFAULT_CATEGORIES, 
  DEFAULT_COLUMNS 
} from './data/initialData';
import { initAuth, googleSignIn, logoutGoogle } from './lib/firebase';
import { recordStatusChangeLog } from './lib/statusHistory';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
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

const STORAGE_KEY_DEVICES = 'rcg_woodworking_devices_v2';
const STORAGE_KEY_COLUMNS = 'rcg_woodworking_columns_v2';

export default function App() {
  // Devices state with localStorage persistence
  const [devices, setDevices] = useState<DeviceItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEVICES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load stored devices:', e);
    }
    return INITIAL_DEVICES;
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

  // View state: 'excel' (Excel-like Grid Entry), 'table' (Entry & Management), or 'showcase' (Catalog & Profile Cards)
  const [currentView, setCurrentView] = useState<'excel' | 'table' | 'showcase'>('excel');

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

  // Google Auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

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

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist devices
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devices));
    } catch (e) {
      console.warn('Failed to save devices to storage:', e);
    }
  }, [devices]);

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
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        showToast(`خوش آمدید، ${res.user.displayName || res.user.email}`);
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
    showToast('با موفقیت از حساب گوگل خارج شدید.');
  };

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

  // Handlers
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
    // Record initial status for imported devices
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
    // Check if any status changed in the grid
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

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

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
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full max-w-full overflow-x-hidden">
        {/* Top Analytics Bar */}
        <StatsOverview devices={devices} />

        {/* View Mode Quick Switch Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 bg-white dark:bg-zinc-800/80 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">حالت جاری:</span>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
              currentView === 'excel' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : currentView === 'table'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}>
              {currentView === 'excel' ? 'صفحه گسترده ورود اکسلی' : currentView === 'table' ? 'جدول مدیریت انبار و فیلترها' : 'ویترین کاتالوگ فروش'}
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
                جدول اصلی
              </button>
            )}
            {currentView !== 'showcase' && (
              <button
                onClick={() => setCurrentView('showcase')}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 active:scale-95 transition-all font-semibold"
              >
                ویترین فروش
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
          />
        )}

        {/* Filter bar for Table and Showcase views */}
        {currentView !== 'excel' && (
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

        {/* View 3: Showcase & Profile Catalog View */}
        {currentView === 'showcase' && (
          <DeviceShowcase
            devices={filteredDevices}
            categories={categories}
            onViewDevice={handleViewDevice}
            onOpenAICaption={handleOpenAICaption}
            onOpenAIFixSpelling={handleOpenAIFixSpelling}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50">
        <p>
          سامانه هوشمند مدیریت موجودی و فروش ماشین‌آلات صنعتی • اتصال مستقیم به Google Sheets و Drive • مجهز به هوش مصنوعی ویراستار و کپشن‌ساز
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
    </div>
  );
}
