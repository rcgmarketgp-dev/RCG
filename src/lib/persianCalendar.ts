/**
 * Comprehensive Persian / Jalali (Solar Hijri) Calendar Utilities
 * Accurate astronomical & arithmetic conversion between Gregorian and Jalali dates.
 */

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const JALALI_WEEKDAYS = [
  { key: 'sa', name: 'شنبه', short: 'ش' },
  { key: 'su', name: 'یکشنبه', short: 'ی' },
  { key: 'mo', name: 'دوشنبه', short: 'د' },
  { key: 'tu', name: 'سه‌شنبه', short: 'س' },
  { key: 'we', name: 'چهارشنبه', short: 'چ' },
  { key: 'th', name: 'پنج‌شنبه', short: 'پ' },
  { key: 'fr', name: 'جمعه', short: 'ج' },
];

export interface JalaliDate {
  jy: number; // 1300 ... 1450
  jm: number; // 1 ... 12
  jd: number; // 1 ... 31
}

/**
 * Check if a Jalali year is a leap year
 */
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262,
    2324, 2394, 2456, 3178,
  ];
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;
  const bl = breaks.length;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error('Invalid Jalali year ' + jy);
  }

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }

  let n = jy - jp;
  if (jump - n < 6) n = n - jump + ((jump + 4) >> 2) * 4;
  let mod = (n + 1) % 33;
  if (mod === 1) return true;
  if (mod === 0) mod = 33;
  return mod % 4 === 1 && mod > 1;
}

/**
 * Returns number of days in a Jalali month
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) {
    return isJalaliLeapYear(jy) ? 30 : 29;
  }
  return 30;
}

/**
 * Convert Gregorian date to Jalali date
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * Convert Jalali date to Gregorian date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let sal_a: number;
  let gy: number;
  let gm: number;
  let gd: number;
  let days: number;

  sal_a = jy - 979;
  days =
    365 * sal_a +
    Math.floor(sal_a / 33) * 8 +
    Math.floor(((sal_a % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;

  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else leap = false;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }

  const g_d_m = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (gm = 0; days >= g_d_m[gm]; gm++) {
    days -= g_d_m[gm];
  }
  gd = days + 1;

  return { gy, gm, gd };
}

/**
 * Convert Date instance or ISO string to Jalali
 */
export function dateToJalali(date: Date | string | number): JalaliDate {
  const d = typeof date === 'object' ? date : new Date(date);
  return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Convert Jalali date with time to ISO String
 */
export function jalaliToISOString(jy: number, jm: number, jd: number, hours: number = 0, minutes: number = 0): string {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, hours, minutes, 0, 0);
  return d.toISOString();
}

/**
 * Get weekday index for a Jalali date (0 = شنبه, 6 = جمعه)
 */
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  // In Persian calendar: Saturday (6 in JS) is 0, Sunday (0 in JS) is 1, ..., Friday (5 in JS) is 6
  return (day + 1) % 7;
}

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  if (num === null || num === undefined) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
}

/**
 * Format ISO datetime into full Persian textual date:
 * e.g. "چهارشنبه ۲۸ اسفند ۱۴۰۳ ساعت ۱۸:۳۰"
 */
export function formatToPersianFullDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const { jy, jm, jd } = dateToJalali(d);
    const dayOfWeek = getJalaliDayOfWeek(jy, jm, jd);
    const weekDayName = JALALI_WEEKDAYS[dayOfWeek]?.name || '';
    const monthName = JALALI_MONTH_NAMES[jm - 1] || '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${weekDayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)} - ساعت ${toPersianDigits(`${hours}:${minutes}`)}`;
  } catch (e) {
    return isoString;
  }
}

/**
 * Format ISO datetime into short Persian date key for calendar lookup:
 * e.g. "1403-12-28"
 */
export function getJalaliDateKey(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const { jy, jm, jd } = dateToJalali(d);
    return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
  } catch (e) {
    return '';
  }
}

/**
 * Current Jalali today
 */
export function getJalaliToday(): JalaliDate {
  return dateToJalali(new Date());
}
