import React, { useState, useRef, useEffect } from 'react';
import { DeviceItem, CategoryInfo, DeviceStatus } from '../types/device';
import { STATUS_META } from '../data/initialData';
import { checkAndFixSpellingWithAI } from '../lib/aiClient';
import { 
  Plus, 
  Trash2, 
  Save, 
  Wand2, 
  FileSpreadsheet, 
  Copy, 
  ClipboardPaste, 
  Check, 
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Info,
  Columns3
} from 'lucide-react';

interface ExcelGridEntryProps {
  devices: DeviceItem[];
  onSaveAll: (devices: DeviceItem[]) => void;
  categories: CategoryInfo[];
  onOpenAICaption: (device: DeviceItem) => void;
  onOpenAIFixSpelling: (device: DeviceItem) => void;
  onViewDevice: (device: DeviceItem) => void;
  onOpenColumnConfig?: () => void;
}

interface EditableRow {
  id: string;
  code: string;
  name: string;
  model: string;
  category: string;
  status: DeviceStatus;
  cashPercentage: number;
  installmentPercentage: number;
  installmentMonths: number;
  warrantyMonths: 0 | 3 | 6 | 9 | 12 | 18 | 24;
  price?: number;
  year?: string;
  serialNumber?: string;
  location?: string;
  specsText?: string;
  notes?: string;
  imagesCount: number;
  images: any[];
  isNew?: boolean;
}

const COLUMN_HEADERS = [
  { col: 'A', key: 'code', label: 'کد دستگاه', width: '90px' },
  { col: 'B', key: 'name', label: 'نام دستگاه *', width: '220px' },
  { col: 'C', key: 'model', label: 'مدل و برند', width: '160px' },
  { col: 'D', key: 'category', label: 'دسته‌بندی', width: '180px' },
  { col: 'E', key: 'status', label: 'وضعیت دستگاه', width: '130px' },
  { col: 'F', key: 'cashPercentage', label: 'نقد (%)', width: '90px' },
  { col: 'G', key: 'installmentPercentage', label: 'اقساط (%)', width: '90px' },
  { col: 'H', key: 'installmentMonths', label: 'ماه قسط', width: '80px' },
  { col: 'I', key: 'warrantyMonths', label: 'گارانتی', width: '94px' },
  { col: 'J', key: 'price', label: 'قیمت پایه (تومان)', width: '132px' },
  { col: 'K', key: 'year', label: 'سال ساخت', width: '90px' },
  { col: 'L', key: 'location', label: 'انبار / مکان', width: '130px' },
  { col: 'M', key: 'specsText', label: 'مشخصات فنی دستگاه', width: '220px' },
  { col: 'N', key: 'notes', label: 'توضیحات و شرایط فروش', width: '180px' },
];

export const ExcelGridEntry: React.FC<ExcelGridEntryProps> = ({
  devices,
  onSaveAll,
  categories,
  onOpenAICaption,
  onOpenAIFixSpelling,
  onViewDevice,
  onOpenColumnConfig,
}) => {
  // Convert current devices to editable rows
  const [rows, setRows] = useState<EditableRow[]>(() => {
    return devices.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      model: d.model || '',
      category: d.category || categories[0]?.name || 'ماشین‌آلات CNC و تراشکاری',
      status: d.status || 'ready_for_sale',
      cashPercentage: d.cashPercentage ?? 40,
      installmentPercentage: d.installmentPercentage ?? 60,
      installmentMonths: d.installmentMonths ?? 6,
      warrantyMonths: d.warrantyMonths ?? 6,
      price: d.price,
      year: d.year || '',
      serialNumber: d.serialNumber || '',
      location: d.location || '',
      specsText: d.specsText || '',
      notes: d.notes || '',
      imagesCount: d.images?.length || 0,
      images: d.images || [],
    }));
  });

  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colKey: string } | null>({
    rowIdx: 0,
    colKey: 'name',
  });
  const [cellEditValue, setCellEditValue] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [aiCheckingRowIdx, setAiCheckingRowIdx] = useState<number | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Sync rows if devices external list changes and no local edits pending
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setRows(
        devices.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          model: d.model || '',
          category: d.category || categories[0]?.name || 'ماشین‌آلات CNC و تراشکاری',
          status: d.status || 'ready_for_sale',
          cashPercentage: d.cashPercentage ?? 40,
          installmentPercentage: d.installmentPercentage ?? 60,
          installmentMonths: d.installmentMonths ?? 6,
          warrantyMonths: d.warrantyMonths ?? 6,
          price: d.price,
          year: d.year || '',
          serialNumber: d.serialNumber || '',
          location: d.location || '',
          specsText: d.specsText || '',
          notes: d.notes || '',
          imagesCount: d.images?.length || 0,
          images: d.images || [],
        }))
      );
    }
  }, [devices]);

  // Update a single cell
  const handleCellChange = (rowIdx: number, field: keyof EditableRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[rowIdx], [field]: value };

      // Auto balance cash/installment if one is changed
      if (field === 'cashPercentage') {
        const val = Math.min(100, Math.max(0, Number(value) || 0));
        target.cashPercentage = val;
        target.installmentPercentage = 100 - val;
      } else if (field === 'installmentPercentage') {
        const val = Math.min(100, Math.max(0, Number(value) || 0));
        target.installmentPercentage = val;
        target.cashPercentage = 100 - val;
      }

      updated[rowIdx] = target;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Add empty row(s)
  const handleAddRows = (count = 1) => {
    const newItems: EditableRow[] = [];
    for (let i = 0; i < count; i++) {
      const idx = rows.length + i + 1;
      newItems.push({
        id: `dev-grid-${Date.now()}-${i}`,
        code: `EQP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        model: '',
        category: categories[0]?.name || 'ماشین‌آلات CNC و تراشکاری',
        status: 'ready_for_sale',
        cashPercentage: 40,
        installmentPercentage: 60,
        installmentMonths: 6,
        warrantyMonths: 6,
        price: undefined,
        year: '2023',
        location: 'انبار مرکزی',
        specsText: '',
        notes: '',
        imagesCount: 0,
        images: [],
        isNew: true,
      });
    }

    setRows((prev) => [...prev, ...newItems]);
    setHasUnsavedChanges(true);
    setActiveCell({ rowIdx: rows.length, colKey: 'name' });
  };

  // Delete row
  const handleDeleteRow = (rowIdx: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== rowIdx));
    setHasUnsavedChanges(true);
  };

  // Save all to database/localStorage
  const handleSaveAll = () => {
    // Filter out rows with empty names
    const validRows = rows.filter((r) => r.name.trim().length > 0);

    const convertedDevices: DeviceItem[] = validRows.map((r) => ({
      id: r.id,
      code: r.code || `EQP-${Math.floor(100 + Math.random() * 900)}`,
      name: r.name.trim(),
      model: r.model?.trim() || '',
      category: r.category,
      status: r.status,
      cashPercentage: r.cashPercentage,
      installmentPercentage: r.installmentPercentage,
      installmentMonths: r.installmentMonths,
      warrantyMonths: r.warrantyMonths,
      price: r.price ? Number(r.price) : undefined,
      year: r.year?.trim() || '',
      serialNumber: r.serialNumber?.trim() || '',
      location: r.location?.trim() || '',
      specsText: r.specsText?.trim() || '',
      notes: r.notes?.trim() || '',
      images: r.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onSaveAll(convertedDevices);
    setHasUnsavedChanges(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // AI proofread single row
  const handleAIRowFix = async (rowIdx: number) => {
    const row = rows[rowIdx];
    if (!row || !row.name) return;

    try {
      setAiCheckingRowIdx(rowIdx);
      const res = await checkAndFixSpellingWithAI({
        name: row.name,
        model: row.model,
        category: row.category,
        specsText: row.specsText,
        notes: row.notes,
      });

      setRows((prev) => {
        const copy = [...prev];
        copy[rowIdx] = {
          ...copy[rowIdx],
          name: res.name || copy[rowIdx].name,
          model: res.model || copy[rowIdx].model,
          specsText: res.specsText || copy[rowIdx].specsText,
          notes: res.notes || copy[rowIdx].notes,
        };
        return copy;
      });
      setHasUnsavedChanges(true);
    } catch (e) {
      console.error('Row AI fix error:', e);
    } finally {
      setAiCheckingRowIdx(null);
    }
  };

  // Handle Clipboard Paste (Paste from Excel or Google Sheets!)
  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData || !clipboardData.includes('\t')) return;

    // It's tabular data from Excel/Sheets!
    e.preventDefault();
    const pastedRows = clipboardData
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.split('\t'));

    if (pastedRows.length === 0) return;

    const startRowIdx = activeCell ? activeCell.rowIdx : rows.length;
    const newRows = [...rows];

    pastedRows.forEach((cells, pIdx) => {
      const targetIdx = startRowIdx + pIdx;
      const rowItem: EditableRow = newRows[targetIdx] || {
        id: `dev-paste-${Date.now()}-${pIdx}`,
        code: `IMP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        model: '',
        category: categories[0]?.name || 'ماشین‌آلات CNC و تراشکاری',
        status: 'ready_for_sale',
        cashPercentage: 40,
        installmentPercentage: 60,
        installmentMonths: 6,
        warrantyMonths: 6,
        price: undefined,
        year: '2023',
        location: '',
        specsText: '',
        notes: '',
        imagesCount: 0,
        images: [],
      };

      // Fill columns in order: Name, Model, Category, Status, Cash%, Installment%, Warranty, Price, Year, Location, Specs, Notes
      if (cells[0]) rowItem.name = cells[0].trim();
      if (cells[1]) rowItem.model = cells[1].trim();
      if (cells[2]) rowItem.category = cells[2].trim();
      if (cells[3]) {
        const st = cells[3].trim();
        if (st.includes('اورهال') || st.toLowerCase().includes('overhaul')) rowItem.status = 'under_overhaul';
        else if (st.includes('فروخته') || st.toLowerCase().includes('sold')) rowItem.status = 'sold';
        else rowItem.status = 'ready_for_sale';
      }
      if (cells[4]) {
        const num = parseFloat(cells[4].replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          rowItem.cashPercentage = num;
          rowItem.installmentPercentage = 100 - num;
        }
      }
      if (cells[5]) {
        const num = parseFloat(cells[5].replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) rowItem.installmentPercentage = num;
      }
      if (cells[6]) {
        const num = parseInt(cells[6].replace(/[^0-9]/g, ''), 10);
        if ([0, 3, 6, 9, 12].includes(num)) rowItem.warrantyMonths = num as any;
      }
      if (cells[7]) {
        const num = parseFloat(cells[7].replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) rowItem.price = num;
      }
      if (cells[8]) rowItem.year = cells[8].trim();
      if (cells[9]) rowItem.location = cells[9].trim();
      if (cells[10]) rowItem.specsText = cells[10].trim();
      if (cells[11]) rowItem.notes = cells[11].trim();

      newRows[targetIdx] = rowItem;
    });

    setRows(newRows);
    setHasUnsavedChanges(true);
  };

  // Get active cell value for formula bar
  const currentActiveVal =
    activeCell && rows[activeCell.rowIdx]
      ? String((rows[activeCell.rowIdx] as any)[activeCell.colKey] ?? '')
      : '';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-300 dark:border-zinc-700 shadow-md overflow-hidden mb-6 flex flex-col w-full max-w-full">
      {/* Top Excel Ribbon Toolbar */}
      <div className="px-4 sm:px-5 py-3 bg-zinc-100 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">
                محیط ورود اطلاعات اکسل‌مانند (Spreadsheet Grid)
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                ورود مستقیم سلولی
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              کلیک روی سلول برای ویرایش • پشتیبانی از کپی/پیست مستقیم از اکسل (Ctrl+V)
            </p>
          </div>
        </div>

        {/* Action Buttons: Rounded Rectangles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Configuration Button - Exclusively in Excel entry */}
          {onOpenColumnConfig && (
            <button
              onClick={onOpenColumnConfig}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              title="شخصی‌سازی، جابجایی و پنهان/آشکار کردن ستون‌ها"
            >
              <Columns3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>تنظیم ستون‌ها</span>
            </button>
          )}

          {/* Add Row Button */}
          <button
            onClick={() => handleAddRows(1)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>+ ۱ سطر</span>
          </button>

          {/* Add 5 Rows */}
          <button
            onClick={() => handleAddRows(5)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            <span>+ ۵ سطر</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveAll}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:scale-95 ${
              saveFeedback
                ? 'bg-emerald-600 text-white'
                : hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
            }`}
          >
            {saveFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveFeedback ? 'ذخیره شد!' : hasUnsavedChanges ? 'ذخیره تغییرات *' : 'ذخیره در انبار'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Hint Banner: Explaining horizontal pan on grid only */}
      <div className="block lg:hidden px-4 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 text-[11px] text-blue-800 dark:text-blue-300 border-b border-blue-100 dark:border-blue-900/40">
        💡 برای مشاهده ستون‌های بیشتر این جدول گسترده، فقط کادر خود جدول را به چپ بکشید — صفحه اصلی ثابت است و تنها عمودی اسکرول می‌شود.
      </div>

      {/* Excel Formula / Cell Bar */}
      <div 
        style={{ height: '53px' }}
        className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-xs"
      >
        {/* Cell coordinate badge */}
        <div className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-zinc-600 dark:text-zinc-400 min-w-14 text-center shadow-2xs">
          {activeCell
            ? `${
                COLUMN_HEADERS.find((c) => c.key === activeCell.colKey)?.col || 'A'
              }${activeCell.rowIdx + 1}`
            : 'A1'}
        </div>

        <span className="font-mono text-zinc-400 font-bold select-none">fx</span>

        {/* Active Cell Input */}
        <input
          type="text"
          value={cellEditValue !== '' ? cellEditValue : currentActiveVal}
          onChange={(e) => {
            setCellEditValue(e.target.value);
            if (activeCell) {
              handleCellChange(activeCell.rowIdx, activeCell.colKey as any, e.target.value);
            }
          }}
          onBlur={() => setCellEditValue('')}
          placeholder="محتوای سلول انتخابی..."
          className="flex-1 px-3 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
        />

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Info className="w-3.5 h-3.5" />
          <span>مجموع: {rows.length} سطر ثبت‌شده</span>
        </div>
      </div>

      {/* Interactive Spreadsheet Grid Container */}
      <div
        ref={gridContainerRef}
        onPaste={handlePaste}
        style={{ height: '300px', width: '1365px', maxWidth: '100%' }}
        className="overflow-x-auto overflow-y-auto bg-white dark:bg-zinc-900 scrollbar-thin select-none"
      >
        <table className="w-full text-right text-xs border-collapse">
          {/* Header Row with Column Letters (A, B, C...) + Persian Labels */}
          <thead className="sticky top-0 z-20 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-300 dark:border-zinc-700 shadow-2xs">
            <tr>
              {/* Row number column */}
              <th className="w-10 px-2 py-2 text-center bg-zinc-200/80 dark:bg-zinc-700/80 border-r border-zinc-300 dark:border-zinc-700 font-mono text-[11px] text-zinc-500">
                #
              </th>

              {COLUMN_HEADERS.map((ch) => (
                <th
                  key={ch.key}
                  style={{ 
                    minWidth: ch.width, 
                    width: ch.width,
                    ...(ch.key === 'price' ? { height: '22.5px' } : {}) 
                  }}
                  className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-700 text-nowrap"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-zinc-800 dark:text-zinc-200">{ch.label}</span>
                    <span className="font-mono text-[10px] text-zinc-400 opacity-60">
                      {ch.col}
                    </span>
                  </div>
                </th>
              ))}

              {/* Actions Header */}
              <th className="w-24 px-3 py-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-nowrap">
                عملیات و هوش مصنوعی
              </th>
            </tr>
          </thead>

          {/* Grid Rows */}
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
            {rows.map((row, rIdx) => {
              const isSelectedRow = activeCell?.rowIdx === rIdx;

              return (
                <tr
                  key={row.id}
                  className={`hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-colors ${
                    isSelectedRow ? 'bg-blue-50/15 dark:bg-blue-950/30' : ''
                  }`}
                >
                  {/* Row Index */}
                  <td className="px-2 py-1.5 text-center bg-zinc-100/80 dark:bg-zinc-800/80 font-mono text-[11px] text-zinc-500 border-r border-zinc-300 dark:border-zinc-700 select-none">
                    {rIdx + 1}
                  </td>

                  {/* Col A: Code */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'code' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'code'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) => handleCellChange(rIdx, 'code', e.target.value)}
                      className="w-full h-full px-2 py-2 bg-transparent font-mono text-zinc-600 dark:text-zinc-400 focus:outline-hidden"
                    />
                  </td>

                  {/* Col B: Name (Required) */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'name' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'name'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleCellChange(rIdx, 'name', e.target.value)}
                      placeholder="نام دستگاه..."
                      className="w-full h-full px-2 py-2 bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-hidden"
                    />
                  </td>

                  {/* Col C: Model */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'model' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'model'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.model}
                      onChange={(e) => handleCellChange(rIdx, 'model', e.target.value)}
                      placeholder="مدل و برند..."
                      className="w-full h-full px-2 py-2 bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                    />
                  </td>

                  {/* Col D: Category (Dropdown) */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'category' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'category'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <select
                      value={row.category}
                      onChange={(e) => handleCellChange(rIdx, 'category', e.target.value)}
                      className="w-full h-full px-2 py-1.5 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Col E: Status (Dropdown) */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'status' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'status'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <select
                      value={row.status}
                      onChange={(e) => handleCellChange(rIdx, 'status', e.target.value as DeviceStatus)}
                      className="w-full h-full px-2 py-1.5 bg-transparent text-xs font-semibold focus:outline-hidden cursor-pointer"
                    >
                      <option value="ready_for_sale">🟢 آماده فروش</option>
                      <option value="under_overhaul">🟡 در حال اورهال</option>
                      <option value="sold">⚪ فروخته شده</option>
                    </select>
                  </td>

                  {/* Col F: Cash % */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'cashPercentage' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'cashPercentage'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.cashPercentage}
                        onChange={(e) => handleCellChange(rIdx, 'cashPercentage', e.target.value)}
                        className="w-full py-2 bg-transparent text-center font-bold text-emerald-600 focus:outline-hidden font-mono"
                      />
                      <span className="text-zinc-400 text-[10px]">%</span>
                    </div>
                  </td>

                  {/* Col G: Installment % */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'installmentPercentage' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'installmentPercentage'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.installmentPercentage}
                        onChange={(e) => handleCellChange(rIdx, 'installmentPercentage', e.target.value)}
                        className="w-full py-2 bg-transparent text-center font-bold text-indigo-600 focus:outline-hidden font-mono"
                      />
                      <span className="text-zinc-400 text-[10px]">%</span>
                    </div>
                  </td>

                  {/* Col H: Installment Months */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'installmentMonths' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'installmentMonths'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <select
                      value={row.installmentMonths}
                      onChange={(e) => handleCellChange(rIdx, 'installmentMonths', Number(e.target.value))}
                      className="w-full h-full px-1.5 py-1.5 bg-transparent text-xs text-center font-mono focus:outline-hidden cursor-pointer"
                    >
                      <option value={0}>۰ (نقد)</option>
                      <option value={3}>۳ ماه</option>
                      <option value={6}>۶ ماه</option>
                      <option value={9}>۹ ماه</option>
                      <option value={12}>۱۲ ماه</option>
                      <option value={18}>۱۸ ماه</option>
                      <option value={24}>۲۴ ماه</option>
                    </select>
                  </td>

                  {/* Col I: Warranty */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'warrantyMonths' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'warrantyMonths'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <select
                      value={row.warrantyMonths}
                      onChange={(e) => handleCellChange(rIdx, 'warrantyMonths', Number(e.target.value))}
                      className="w-full h-full px-2 py-1.5 bg-transparent text-xs font-semibold text-emerald-700 dark:text-emerald-300 focus:outline-hidden cursor-pointer"
                    >
                      <option value={0}>بدون گارانتی</option>
                      <option value={3}>۳ ماهه</option>
                      <option value={6}>۶ ماهه</option>
                      <option value={9}>۹ ماهه</option>
                      <option value={12}>۱۲ ماهه</option>
                      <option value={24}>۲۴ ماهه</option>
                    </select>
                  </td>

                  {/* Col J: Price */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'price' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'price'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={
                        row.price !== undefined && row.price !== null
                          ? Number(row.price).toLocaleString('fa-IR')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        handleCellChange(rIdx, 'price', raw ? Number(raw) : undefined);
                      }}
                      placeholder="توافقی"
                      className="w-full h-full px-2 py-2 bg-transparent font-mono text-zinc-900 dark:text-white focus:outline-hidden"
                    />
                  </td>

                  {/* Col K: Year */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'year' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'year'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.year}
                      onChange={(e) => handleCellChange(rIdx, 'year', e.target.value)}
                      placeholder="سال..."
                      className="w-full h-full px-2 py-2 bg-transparent text-center font-mono text-zinc-600 dark:text-zinc-400 focus:outline-hidden"
                    />
                  </td>

                  {/* Col L: Location */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'location' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'location'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.location}
                      onChange={(e) => handleCellChange(rIdx, 'location', e.target.value)}
                      placeholder="محل انبار..."
                      className="w-full h-full px-2 py-2 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
                    />
                  </td>

                  {/* Col M: Specs */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'specsText' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'specsText'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.specsText}
                      onChange={(e) => handleCellChange(rIdx, 'specsText', e.target.value)}
                      placeholder="کورس، توان، کنترلر..."
                      className="w-full h-full px-2 py-2 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
                    />
                  </td>

                  {/* Col N: Notes */}
                  <td
                    onClick={() => setActiveCell({ rowIdx: rIdx, colKey: 'notes' })}
                    className={`p-0 border-r border-zinc-200 dark:border-zinc-800 ${
                      activeCell?.rowIdx === rIdx && activeCell?.colKey === 'notes'
                        ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40 dark:bg-blue-950/50'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleCellChange(rIdx, 'notes', e.target.value)}
                      placeholder="شرایط فروش و تحویل..."
                      className="w-full h-full px-2 py-2 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
                    />
                  </td>

                  {/* Row Actions */}
                  <td className="px-2 py-1 text-center border-r border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-center gap-1">
                      {/* AI Row Proofread */}
                      <button
                        type="button"
                        onClick={() => handleAIRowFix(rIdx)}
                        disabled={aiCheckingRowIdx === rIdx || !row.name}
                        title="اصلاح هوشمند غلط‌های املایی و نام برندهای این سطر با AI"
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                      >
                        <Wand2 className={`w-3.5 h-3.5 ${aiCheckingRowIdx === rIdx ? 'animate-spin' : ''}`} />
                      </button>

                      {/* AI Caption for row */}
                      {row.name && (
                        <button
                          type="button"
                          onClick={() => onOpenAICaption(row as any)}
                          title="تولید کپشن فروش برای این دستگاه"
                          className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
                        </button>
                      )}

                      {/* Delete row */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        title="حذف این سطر"
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Grid Footer Bar */}
      <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => handleAddRows(1)}
            className="flex items-center gap-1 font-semibold text-blue-600 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن سطر جدید</span>
          </button>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ClipboardPaste className="w-3.5 h-3.5 text-zinc-400" />
            <span>می‌توانید اطلاعات را مستقیماً از اکسل کپی کرده و با <kbd className="font-mono bg-zinc-200 dark:bg-zinc-700 px-1 rounded-xs">Ctrl+V</kbd> در جدول جای‌گذاری کنید.</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[11px] text-amber-600 font-medium">
              تغییرات ذخیره‌نشده دارید
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            ذخیره تمامی سطرها
          </button>
        </div>
      </div>
    </div>
  );
};
