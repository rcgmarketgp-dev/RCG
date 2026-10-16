import { getAccessToken } from './firebase';
import { DeviceItem } from '../types/device';
import { STATUS_META } from '../data/initialData';

export interface SheetFileSummary {
  id: string;
  name: string;
  modifiedTime: string;
}

// Export devices to a new Google Sheet
export async function exportDevicesToGoogleSheets(
  devices: DeviceItem[],
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('لطفاً ابتدا با حساب گوگل خود وارد شوید.');
  }

  const nowFa = new Date().toLocaleDateString('fa-IR');
  const title = customTitle || `موجودی ماشین‌آلات صنعتی - ${nowFa}`;

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        locale: 'fa_IR',
      },
      sheets: [
        {
          properties: {
            title: 'موجودی تجهیزات',
            rightToLeft: true,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'خطا در ایجاد گوگل شیت جدید.');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Rows
  const headers = [
    'کد دستگاه',
    'نام دستگاه',
    'مدل و برند',
    'دسته‌بندی',
    'وضعیت',
    'پیش‌پرداخت نقد (درصد)',
    'اقساط (درصد)',
    'تعداد ماه اقساط',
    'مدت گارانتی (ماه)',
    'قیمت پایه (تومان)',
    'سال ساخت',
    'شماره سریال',
    'موقعیت استقرار',
    'مشخصات فنی',
    'توضیحات و شرایط فروش',
    'تعداد عکس‌ها',
  ];

  const rows = devices.map((dev) => [
    dev.code,
    dev.name,
    dev.model,
    dev.category,
    STATUS_META[dev.status]?.label || dev.status,
    dev.cashPercentage,
    dev.installmentPercentage,
    dev.installmentMonths || 0,
    dev.warrantyMonths,
    dev.price || '',
    dev.year || '',
    dev.serialNumber || '',
    dev.location || '',
    dev.specsText || '',
    dev.notes || '',
    dev.images?.length || 0,
  ]);

  const values = [headers, ...rows];

  // 3. Write data to sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Failed writing to default sheet name, trying Sheet index range...');
    // Fallback: without explicit sheet title in range
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  }

  return { spreadsheetId, spreadsheetUrl };
}

// Fetch list of recent Google Sheets from Google Drive
export async function listRecentGoogleSheets(): Promise<SheetFileSummary[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

// Read rows from Google Sheet
export async function importFromGoogleSheet(sheetIdOrUrl: string): Promise<any[][]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('برای دسترسی به گوگل شیت باید وارد حساب گوگل خود شوید.');
  }

  // Extract ID from URL if full link pasted
  let sheetId = sheetIdOrUrl.trim();
  const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    sheetId = match[1];
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z500`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'امکان بازخوانی اطلاعات از فایل گوگل شیت وجود ندارد.');
  }

  const data = await res.json();
  return data.values || [];
}

// Backup all inventory to Google Drive as a JSON file
export async function backupInventoryToDrive(devices: DeviceItem[]): Promise<{ fileId: string; name: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('لطفاً ابتدا با حساب گوگل خود وارد شوید.');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `پشتیبان_ماشین‌آلات_${dateStr}.json`;
  const fileContent = JSON.stringify({ backupDate: new Date().toISOString(), total: devices.length, devices }, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'فایل پشتیبان کامل سامانه هوشمند موجودی ماشین‌آلات',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error('خطا در ذخیره نسخه پشتیبان در گوگل درایو.');
  }

  const result = await res.json();
  return { fileId: result.id, name: fileName };
}
