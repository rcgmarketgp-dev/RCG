export type DeviceStatus = 'ready_for_sale' | 'under_overhaul' | 'sold';

export interface StatusChangeLog {
  id: string;
  deviceId: string;
  fromStatus: DeviceStatus | 'initial';
  toStatus: DeviceStatus;
  timestamp: string;
  notes?: string;
  changedBy?: string;
}

export interface DeviceImage {
  id: string;
  url: string;
  title: string;
  isCover?: boolean;
}

export interface DeviceItem {
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
  specifications?: Record<string, string>;
  specList?: { id: string; key: string; value: string }[];
  relatedDeviceIds?: string[];
  notes?: string;
  images: DeviceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ColumnConfig {
  id: string;
  key: keyof DeviceItem | 'imagesCount' | 'actions';
  label: string;
  visible: boolean;
  order: number;
  minWidth?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  colorBadge: string;
  badgeHex: string;
  iconName: string;
  description: string;
}

export interface FilterOptions {
  searchQuery: string;
  status: 'all' | DeviceStatus;
  category: string;
  warrantyMonths: 'all' | 3 | 6 | 9 | 12;
  minCashPct: number;
  maxCashPct: number;
  minPrice: number;
  maxPrice: number;
  hasImagesOnly: boolean;
  sortBy: 'createdAt' | 'name' | 'price' | 'warrantyMonths' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface AICorrectionItem {
  field: string;
  original: string;
  corrected: string;
  reason: string;
}

export interface AISpellingResult {
  name: string;
  model: string;
  category: string;
  specsText: string;
  notes: string;
  corrections: AICorrectionItem[];
  rawOutput?: string;
}

export interface CompanyProfile {
  companyName: string;
  slogan: string;
  phone1: string;
  phone2?: string;
  mobile: string;
  address?: string;
  website?: string;
  telegramId?: string;
  whatsappNumber?: string;
  baleId?: string;
  eitaaId?: string;
  instagramId?: string;
  rubikaId?: string;
  customNote?: string;
  includeSlogan: boolean;
  includePhones: boolean;
  includeSocials: boolean;
  includeAddress: boolean;
  includeCustomNote: boolean;
  separatorStyle: 'divider' | 'dashes' | 'stars' | 'minimal';
}
