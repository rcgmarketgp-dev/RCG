import React, { useState } from 'react';
import { DeviceItem } from '../types/device';
import { 
  parseExcelFile, 
  autoSuggestMapping, 
  convertRowsToDevices, 
  TARGET_FIELDS, 
  downloadSampleExcelTemplate,
  exportDevicesToExcel
} from '../lib/excel';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  TableProperties
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedDevices: DeviceItem[]) => void;
  currentDevices: DeviceItem[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentDevices,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<number, any>>({});
  const [parsedPreview, setParsedPreview] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setFileName(file.name);
      const { headers, rows } = await parseExcelFile(file);
      setExcelHeaders(headers);
      setExcelRows(rows);

      // Auto suggested mapping
      const suggested = autoSuggestMapping(headers);
      setMapping(suggested);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری فایل اکسل');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (colIndex: number, targetField: any) => {
    setMapping((prev) => ({
      ...prev,
      [colIndex]: targetField,
    }));
  };

  const handleProceedToPreview = () => {
    // Check if at least "name" is mapped
    const hasNameMapped = Object.values(mapping).includes('name');
    if (!hasNameMapped) {
      setError('حداقل باید ستون «نام دستگاه» را به یکی از ستون‌های اکسل متصل کنید.');
      return;
    }

    setError(null);
    const devices = convertRowsToDevices(excelRows, mapping);
    if (devices.length === 0) {
      setError('هیچ دستگاه معتبری از سطرهای اکسل استخراج نشد.');
      return;
    }

    setParsedPreview(devices);
    setStep(3);
  };

  const handleFinishImport = () => {
    onImportSuccess(parsedPreview);
    onClose();
  };

  const handleExportCurrent = () => {
    exportDevicesToExcel(currentDevices);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                ورود و خروجی فایل اکسل (Excel / CSV)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                تنظیم دلخواه ترتیب ستون‌ها و تطبیق خودکار اطلاعات دستگاه‌ها
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

        {/* Step indicator */}
        <div className="px-6 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-8 text-xs font-semibold">
          <span className={step === 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-400'}>
            ۱. انتخاب یا دانلود الگو
          </span>
          <span className="text-zinc-300">←</span>
          <span className={step === 2 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-400'}>
            ۲. چیدمان و تطبیق ستون‌ها
          </span>
          <span className="text-zinc-300">←</span>
          <span className={step === 3 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-400'}>
            ۳. پیش‌نمایش و ثبت قطعی
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Body based on current step */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              {/* Upload Zone */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 rounded-3xl p-8 text-center transition bg-zinc-50/50 dark:bg-zinc-800/30">
                <input
                  type="file"
                  id="excel-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="excel-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-3">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                    فایل اکسل خود را اینجا رها کنید یا کلیک کنید
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
                    پشتیبانی از فایل‌های با پسوند <strong className="font-mono">.xlsx</strong> و{' '}
                    <strong className="font-mono">.xls</strong> و{' '}
                    <strong className="font-mono">.csv</strong> با هر چیدمان ستونی
                  </p>
                  <span className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition">
                    انتخاب فایل اکسل
                  </span>
                </label>
              </div>

              {/* Download template / Export current */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-right hover:border-emerald-400 transition group"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-white mb-1">
                    <Download className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                    <span>دانلود قالب آماده اکسل نمونه</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    قالب استاندارد فارسی با سرستون‌های آماده و نمونه اطلاعات ماشین‌آلات
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleExportCurrent}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-right hover:border-blue-400 transition group"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-white mb-1">
                    <TableProperties className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
                    <span>خروجی گرفتن از موجودی فعلی ({currentDevices.length} دستگاه)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    دانلود کل دستگاه‌های موجود به صورت فایل اکسل تر و تمیز
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                فایل <strong className="font-mono">{fileName}</strong> با موفقیت خوانده شد ({excelRows.length} ردیف داده).
                در این بخش مشخص کنید هر ستون از اکسل شما با کدام مشخصه در برنامه تطبیق داده شود:
              </div>

              <div className="space-y-3">
                {excelHeaders.map((header, colIndex) => {
                  const sampleVal1 = excelRows[0]?.[colIndex];
                  const sampleVal2 = excelRows[1]?.[colIndex];

                  return (
                    <div
                      key={colIndex}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-400">
                            ستون {colIndex + 1}:
                          </span>
                          <span className="font-bold text-xs text-zinc-900 dark:text-white">
                            {header || '(بدون عنوان)'}
                          </span>
                        </div>
                        {(sampleVal1 !== undefined || sampleVal2 !== undefined) && (
                          <div className="text-[11px] text-zinc-400 truncate max-w-md mt-1">
                            نمونه داده‌ها: {sampleVal1 ? `"${sampleVal1}"` : '—'}
                            {sampleVal2 ? ` ، "${sampleVal2}"` : ''}
                          </div>
                        )}
                      </div>

                      <div className="sm:w-64">
                        <select
                          value={mapping[colIndex] || 'skip'}
                          onChange={(e) => handleMappingChange(colIndex, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        >
                          {TARGET_FIELDS.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                <span>تعداد {parsedPreview.length} دستگاه آماده اضافه شدن به انبار هستند.</span>
              </div>

              {/* Preview table */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-x-auto max-h-80">
                <table className="w-full text-xs text-right">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 font-bold border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="p-2.5">نام دستگاه</th>
                      <th className="p-2.5">مدل</th>
                      <th className="p-2.5">دسته‌بندی</th>
                      <th className="p-2.5">وضعیت</th>
                      <th className="p-2.5">نقد / اقساط</th>
                      <th className="p-2.5">گارانتی</th>
                      <th className="p-2.5">قیمت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {parsedPreview.map((d, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="p-2.5 font-bold">{d.name}</td>
                        <td className="p-2.5">{d.model}</td>
                        <td className="p-2.5">{d.category}</td>
                        <td className="p-2.5">
                          {d.status === 'ready_for_sale' ? 'آماده فروش' : d.status === 'under_overhaul' ? 'اورهال' : 'فروخته شده'}
                        </td>
                        <td className="p-2.5 font-mono">%{d.cashPercentage} / %{d.installmentPercentage}</td>
                        <td className="p-2.5">{d.warrantyMonths} ماه</td>
                        <td className="p-2.5 font-mono">
                          {d.price ? Number(d.price).toLocaleString('fa-IR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>مرحله قبل</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300"
            >
              انصراف
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
              >
                <span>مشاهده پیش‌نمایش</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleFinishImport}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>تایید و افزودن به انبار</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
