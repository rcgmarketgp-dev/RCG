import React from 'react';
import { ColumnConfig } from '../types/device';
import { ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, X, Check } from 'lucide-react';

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  onResetColumns: () => void;
}

export const ColumnConfigModal: React.FC<ColumnConfigModalProps> = ({
  isOpen,
  onClose,
  columns,
  setColumns,
  onResetColumns,
}) => {
  if (!isOpen) return null;

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const toggleVisibility = (id: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col))
    );
  };

  const moveColumn = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedColumns.length) return;

    const newSorted = [...sortedColumns];
    const [moved] = newSorted.splice(currentIndex, 1);
    newSorted.splice(targetIndex, 0, moved);

    // Re-assign order indices
    const updated = newSorted.map((col, idx) => ({ ...col, order: idx }));
    setColumns(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">
              تنظیم و چیدمان ستون‌های جدول
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              ترتیب ستون‌ها را با دکمه‌های بالا/پایین تغییر دهید و موارد دلخواه را فعال/غیرفعال کنید.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column List */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {sortedColumns.map((col, idx) => (
            <div
              key={col.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                col.visible
                  ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700'
                  : 'bg-zinc-100/50 dark:bg-zinc-900/20 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-mono font-bold text-zinc-400">
                  {idx + 1}
                </span>
                <span className={`text-xs font-semibold ${col.visible ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>
                  {col.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => toggleVisibility(col.id)}
                  title={col.visible ? 'مخفی کردن ستون' : 'نمایش دادن ستون'}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    col.visible
                      ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Move Up */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveColumn(idx, 'up')}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  title="انتقال به بالا (سمت راست جدول)"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  disabled={idx === sortedColumns.length - 1}
                  onClick={() => moveColumn(idx, 'down')}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  title="انتقال به پایین (سمت چپ جدول)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <button
            onClick={onResetColumns}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>چیدمان پیش‌فرض</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>تایید و ذخیره چیدمان</span>
          </button>
        </div>
      </div>
    </div>
  );
};
