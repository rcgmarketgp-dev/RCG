import * as XLSX from 'xlsx';
import { DeviceItem, DeviceStatus } from '../types/device';
import { STATUS_META } from '../data/initialData';

export interface ColumnMappingOption {
  key: keyof DeviceItem | 'skip';
  label: string;
  required?: boolean;
}

export const TARGET_FIELDS: ColumnMappingOption[] = [
  { key: 'name', label: 'نام دستگاه', required: true },
  { key: 'model', label: 'مدل و برند' },
  { key: 'category', label: 'دسته‌بندی' },
  { key: 'status', label: 'وضعیت (آماده فروش/اورهال/فروخته شده)' },
  { key: 'cashPercentage', label: 'درصد نقد (%)' },
  { key: 'installmentPercentage', label: 'درصد اقساط (%)' },
  { key: 'installmentMonths', label: 'تعداد ماه اقساط' },
  { key: 'warrantyMonths', label: 'مدت گارانتی (ماه: ۳، ۶، ۹...)' },
  { key: 'price', label: 'قیمت پایه (تومان)' },
  { key: 'year', label: 'سال ساخت' },
  { key: 'serialNumber', label: 'شماره سریال' },
  { key: 'location', label: 'محل استقرار / انبار' },
  { key: 'specsText', label: 'مشخصات فنی' },
  { key: 'notes', label: 'توضیحات و شرایط فروش' },
  { key: 'skip', label: '— نادیده گرفتن این ستون —' },
];

// Export devices to an Excel file (.xlsx)
export function exportDevicesToExcel(devices: DeviceItem[], filename = 'موجودی_ماشین_آلات.xlsx') {
  const data = devices.map((dev) => ({
    'کد دستگاه': dev.code,
    'نام دستگاه': dev.name,
    'مدل و برند': dev.model,
    'دسته‌بندی': dev.category,
    'وضعیت': STATUS_META[dev.status]?.label || dev.status,
    'پیش‌پرداخت نقد (%)': dev.cashPercentage,
    'اقساط (%)': dev.installmentPercentage,
    'تعداد ماه‌های اقساط': dev.installmentMonths || 0,
    'گارانتی (ماه)': dev.warrantyMonths,
    'قیمت (تومان)': dev.price || '',
    'سال ساخت': dev.year || '',
    'شماره سریال': dev.serialNumber || '',
    'محل دستگاه': dev.location || '',
    'مشخصات فنی': dev.specsText || '',
    'توضیحات': dev.notes || '',
    'تعداد عکس': dev.images?.length || 0,
    'تاریخ ثبت': new Date(dev.createdAt).toLocaleDateString('fa-IR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set sheet direction RTL
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'لیست ماشین‌آلات');
  XLSX.writeFile(workbook, filename);
}

// Download sample Excel template preconfigured for users
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'نام دستگاه': 'فرز CNC عمودی ۳ محوره',
      'مدل و برند': 'Haas VF-3',
      'دسته‌بندی': 'ماشین‌آلات CNC و تراشکاری',
      'وضعیت': 'آماده فروش',
      'پیش‌پرداخت نقد (%)': 40,
      'اقساط (%)': 60,
      'تعداد ماه‌های اقساط': 6,
      'گارانتی (ماه)': 6,
      'قیمت (تومان)': 1850000000,
      'سال ساخت': '2021',
      'شماره سریال': 'HS-VF3-01',
      'محل دستگاه': 'انبار تهران',
      'مشخصات فنی': 'کورس ۱۰۰۰×۵۰۰×۶۰۰ میلی‌متر، کنترلر زیمنس ۸۴۰D، اسپیندل ۱۰ هزار دور',
      'توضیحات': 'تست فنی انجام شده، آماده بارگیری',
    },
    {
      'نام دستگاه': 'دستگاه تزریق پلاستیک ۲۵۰ تن',
      'مدل و برند': 'Haitian Mars II',
      'دسته‌بندی': 'تزریق پلاستیک و قالب‌گیری',
      'وضعیت': 'در حال اورهال',
      'پیش‌پرداخت نقد (%)': 50,
      'اقساط (%)': 50,
      'تعداد ماه‌های اقساط': 8,
      'گارانتی (ماه)': 9,
      'قیمت (تومان)': 1350000000,
      'سال ساخت': '2022',
      'شماره سریال': 'HT-250-99',
      'محل دستگاه': 'شهرک صنعتی شمس‌آباد',
      'مشخصات فنی': 'سروو موتور کم‌مصرف، فاصله میله‌ها ۵۸۰ میلی‌متر، کنترلر کبا',
      'توضیحات': 'تحویل به همراه چیلر ۵ تن',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الگوی ورود اطلاعات');
  XLSX.writeFile(workbook, 'الگوی_ورود_ماشین_آلات.xlsx');
}

// Parse uploaded Excel or CSV file
export async function parseExcelFile(file: File): Promise<{ headers: string[]; rows: any[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('فایل اکسل خالی است.');
        }

        const headers = (rawJson[0] || []).map((h) => String(h || '').trim());
        const rows = rawJson.slice(1).filter((r) => r.some((cell) => cell !== undefined && cell !== ''));

        resolve({ headers, rows });
      } catch (err: any) {
        reject(new Error(err.message || 'خطا در خواندن فایل اکسل.'));
      }
    };
    reader.onerror = () => reject(new Error('خطا در بارگذاری فایل.'));
    reader.readAsBinaryString(file);
  });
}

// Auto guess column mapping based on Persian names
export function autoSuggestMapping(headers: string[]): Record<number, keyof DeviceItem | 'skip'> {
  const mapping: Record<number, keyof DeviceItem | 'skip'> = {};

  headers.forEach((header, index) => {
    const h = header.toLowerCase().replace(/\s+/g, '');
    if (h.includes('نام') && !h.includes('خانوادگی')) mapping[index] = 'name';
    else if (h.includes('مدل') || h.includes('برند') || h.includes('مارک')) mapping[index] = 'model';
    else if (h.includes('دسته') || h.includes('گروه') || h.includes('کتگوری')) mapping[index] = 'category';
    else if (h.includes('وضعیت') || h.includes('استاتوس')) mapping[index] = 'status';
    else if (h.includes('نقد') || h.includes('پیش‌پرداخت') || h.includes('پیشپرداخت')) mapping[index] = 'cashPercentage';
    else if (h.includes('اقساط') || h.includes('قسط') || h.includes('چک')) mapping[index] = 'installmentPercentage';
    else if (h.includes('ماه') || h.includes('تعدادقسط')) mapping[index] = 'installmentMonths';
    else if (h.includes('گارانتی') || h.includes('ضمانت')) mapping[index] = 'warrantyMonths';
    else if (h.includes('قیمت') || h.includes('مبلغ') || h.includes('ارزش')) mapping[index] = 'price';
    else if (h.includes('سال') || h.includes('ساخت')) mapping[index] = 'year';
    else if (h.includes('سریال') || h.includes('شماره‌سریال')) mapping[index] = 'serialNumber';
    else if (h.includes('مکان') || h.includes('انبار') || h.includes('موقعیت') || h.includes('شهرک')) mapping[index] = 'location';
    else if (h.includes('مشخصات') || h.includes('فنی') || h.includes('توضیح‌فنی')) mapping[index] = 'specsText';
    else if (h.includes('توضیح') || h.includes('نکته') || h.includes('شرایط')) mapping[index] = 'notes';
    else mapping[index] = 'skip';
  });

  return mapping;
}

// Convert parsed rows into DeviceItem array
export function convertRowsToDevices(
  rows: any[][],
  mapping: Record<number, keyof DeviceItem | 'skip'>
): DeviceItem[] {
  const result: DeviceItem[] = [];

  rows.forEach((row, rowIndex) => {
    let name = '';
    let model = '';
    let category = 'سایر تجهیزات و خطوط تولید';
    let status: DeviceStatus = 'ready_for_sale';
    let cashPercentage = 50;
    let installmentPercentage = 50;
    let installmentMonths = 6;
    let warrantyMonths: any = 6;
    let price: number | undefined = undefined;
    let year = '';
    let serialNumber = '';
    let location = '';
    let specsText = '';
    let notes = '';

    row.forEach((cell, colIndex) => {
      const targetField = mapping[colIndex];
      if (!targetField || targetField === 'skip' || cell === undefined || cell === null) return;

      const val = String(cell).trim();

      switch (targetField) {
        case 'name':
          name = val;
          break;
        case 'model':
          model = val;
          break;
        case 'category':
          category = val;
          break;
        case 'status':
          if (val.includes('اورهال') || val.includes('تعمیر') || val.toLowerCase().includes('overhaul')) {
            status = 'under_overhaul';
          } else if (val.includes('فروش') && (val.includes('رفته') || val.includes('شد')) || val.toLowerCase().includes('sold')) {
            status = 'sold';
          } else {
            status = 'ready_for_sale';
          }
          break;
        case 'cashPercentage': {
          const num = parseFloat(val.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) cashPercentage = Math.min(100, Math.max(0, num));
          break;
        }
        case 'installmentPercentage': {
          const num = parseFloat(val.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) installmentPercentage = Math.min(100, Math.max(0, num));
          break;
        }
        case 'installmentMonths': {
          const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) installmentMonths = num;
          break;
        }
        case 'warrantyMonths': {
          const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if ([0, 3, 6, 9, 12, 18, 24].includes(num)) {
            warrantyMonths = num as any;
          } else if (num >= 9) warrantyMonths = 9;
          else if (num >= 6) warrantyMonths = 6;
          else if (num >= 3) warrantyMonths = 3;
          else warrantyMonths = 0;
          break;
        }
        case 'price': {
          const num = parseFloat(val.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) price = num;
          break;
        }
        case 'year':
          year = val;
          break;
        case 'serialNumber':
          serialNumber = val;
          break;
        case 'location':
          location = val;
          break;
        case 'specsText':
          specsText = val;
          break;
        case 'notes':
          notes = val;
          break;
      }
    });

    if (name) {
      const id = `dev-imp-${Date.now()}-${rowIndex}`;
      const code = `IMP-${Math.floor(1000 + Math.random() * 9000)}`;
      result.push({
        id,
        code,
        name,
        model,
        category,
        status,
        cashPercentage,
        installmentPercentage: 100 - cashPercentage || installmentPercentage,
        installmentMonths,
        warrantyMonths,
        price,
        year,
        serialNumber,
        location,
        specsText,
        notes,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return result;
}
