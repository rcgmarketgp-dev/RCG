import { CompanyProfile } from '../types/device';

export const COMPANY_PROFILE_STORAGE_KEY = 'rcg_company_profile_v2';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'بازرگانی ماشین‌آلات چوب آرسی‌جی',
  slogan: 'تضمین سلامت فنی، اورهال تخصصی و فروش اقساطی ماشین‌آلات صنایع چوب و MDF',
  phone1: '۰۲۱-۵۵۲۷۸۹۰۰',
  phone2: '۰۲۱-۵۵۲۶۱۲۰۳',
  mobile: '۰۹۱۲۳۴۵۶۷۸۹',
  address: 'تهران، بزرگراه آیت‌الله سعیدی، شهرک صنعتی چهاردانگه، خیابان ۲۲، پلاک ۱۸',
  website: 'www.rcg-machinery.ir',
  telegramId: '@RCG_WoodMachinery',
  whatsappNumber: '۰۹۱۲۳۴۵۶۷۸۹',
  baleId: 'ble.ir/rcg_wood',
  eitaaId: 'eitaa.com/rcg_wood',
  instagramId: '@rcg_woodmachinery',
  rubikaId: '@rcg_wood',
  customNote: 'جهت دریافت کاتالوگ، استعلام قیمت روز و هماهنگی بازدید حضوری در کارگاه با ما در تماس باشید.',
  includeSlogan: true,
  includePhones: true,
  includeSocials: true,
  includeAddress: true,
  includeCustomNote: true,
  separatorStyle: 'divider',
};

// Preset signature templates
export const PROFILE_TEMPLATES: { id: string; title: string; profile: Partial<CompanyProfile> }[] = [
  {
    id: 'formal',
    title: 'قالب رسمی و شرکتی',
    profile: {
      separatorStyle: 'divider',
      includeSlogan: true,
      includePhones: true,
      includeSocials: true,
      includeAddress: true,
      includeCustomNote: true,
    },
  },
  {
    id: 'quick_sale',
    title: 'فروش فوری و استعلام سریع',
    profile: {
      separatorStyle: 'dashes',
      slogan: 'فروش ویژه با اقساط استثنایی و تحویل فوری در سراسر کشور',
      includeSlogan: true,
      includePhones: true,
      includeSocials: true,
      includeAddress: false,
      includeCustomNote: true,
    },
  },
  {
    id: 'minimal',
    title: 'مینیمال و کم‌حجم (مخصوص پیام‌رسان‌ها)',
    profile: {
      separatorStyle: 'minimal',
      includeSlogan: false,
      includePhones: true,
      includeSocials: true,
      includeAddress: false,
      includeCustomNote: false,
    },
  },
];

export function getStoredCompanyProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(COMPANY_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COMPANY_PROFILE, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to read company profile from storage:', err);
  }
  return DEFAULT_COMPANY_PROFILE;
}

export function saveStoredCompanyProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    // Dispatch window event so components can sync immediately
    window.dispatchEvent(new CustomEvent('rcg_profile_updated', { detail: profile }));
  } catch (err) {
    console.warn('Failed to save company profile to storage:', err);
  }
}

// Separator line generator
function getSeparator(style: CompanyProfile['separatorStyle']): string {
  switch (style) {
    case 'divider':
      return '━━━━━━━━━━━━━━━━━━━━';
    case 'dashes':
      return '------------------------------------';
    case 'stars':
      return '✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨';
    case 'minimal':
    default:
      return '──────────────';
  }
}

/**
 * Generates formatted Persian signature / business card block
 */
export function formatCompanySignature(profile: CompanyProfile): string {
  const lines: string[] = [];
  const separator = getSeparator(profile.separatorStyle);

  lines.push(separator);

  // Company Name
  if (profile.companyName?.trim()) {
    lines.push(`🏢 ${profile.companyName.trim()}`);
  }

  // Slogan / Motto
  if (profile.includeSlogan && profile.slogan?.trim()) {
    lines.push(`✨ ${profile.slogan.trim()}`);
  }

  // Contact Phones
  if (profile.includePhones) {
    const phones: string[] = [];
    if (profile.mobile?.trim()) phones.push(`همراه و مشاوره: ${profile.mobile.trim()}`);
    if (profile.phone1?.trim()) phones.push(`دفتر: ${profile.phone1.trim()}`);
    if (profile.phone2?.trim()) phones.push(`فروش: ${profile.phone2.trim()}`);

    if (phones.length > 0) {
      lines.push(`📞 ${phones.join(' | ')}`);
    }
  }

  // Messengers & Social Media
  if (profile.includeSocials) {
    const socials: string[] = [];
    if (profile.telegramId?.trim()) socials.push(`تلگرام: ${profile.telegramId.trim()}`);
    if (profile.baleId?.trim()) socials.push(`بله: ${profile.baleId.trim()}`);
    if (profile.eitaaId?.trim()) socials.push(`ایتا: ${profile.eitaaId.trim()}`);
    if (profile.whatsappNumber?.trim()) socials.push(`واتساپ: ${profile.whatsappNumber.trim()}`);
    if (profile.instagramId?.trim()) socials.push(`اینستاگرام: ${profile.instagramId.trim()}`);
    if (profile.rubikaId?.trim()) socials.push(`روبیکا: ${profile.rubikaId.trim()}`);

    if (socials.length > 0) {
      lines.push(`💬 شبکه‌های اجتماعی:`);
      // Pair 2 per line for compact readability
      for (let i = 0; i < socials.length; i += 2) {
        lines.push(`   ${socials.slice(i, i + 2).join(' • ')}`);
      }
    }
  }

  // Address & Website
  if (profile.includeAddress) {
    if (profile.address?.trim()) {
      lines.push(`📍 آدرس: ${profile.address.trim()}`);
    }
    if (profile.website?.trim()) {
      lines.push(`🌐 وب‌سایت: ${profile.website.trim()}`);
    }
  }

  // Custom Note / CTA
  if (profile.includeCustomNote && profile.customNote?.trim()) {
    lines.push(`💡 ${profile.customNote.trim()}`);
  }

  lines.push(separator);

  return lines.join('\n');
}

const SIGNATURE_IDENTIFIER = '<!-- RCG_PROFILE_FOOTER -->';

/**
 * Checks if a caption already contains the company signature
 */
export function hasCompanySignature(text: string, profile?: CompanyProfile): boolean {
  if (!text) return false;
  if (text.includes(SIGNATURE_IDENTIFIER)) return true;
  if (profile && profile.companyName && text.includes(profile.companyName)) return true;
  return (
    text.includes('━━━━━━━━━━━━━━━━━━━━') ||
    text.includes('------------------------------------') ||
    text.includes('بازرگانی ماشین‌آلات چوب آرسی‌جی')
  );
}

/**
 * Appends the company signature to the end of a message
 */
export function appendCompanySignature(text: string, profile: CompanyProfile): string {
  const signature = formatCompanySignature(profile);
  if (!text.trim()) {
    return signature;
  }

  // If already contains signature, replace the footer
  if (hasCompanySignature(text, profile)) {
    const stripped = removeCompanySignature(text, profile);
    return `${stripped.trim()}\n\n${signature}`;
  }

  return `${text.trim()}\n\n${signature}`;
}

/**
 * Removes company signature from text if user wants to toggle it off
 */
export function removeCompanySignature(text: string, profile?: CompanyProfile): string {
  if (!text) return '';

  // Match separators and everything following
  const separators = [
    '━━━━━━━━━━━━━━━━━━━━',
    '------------------------------------',
    '✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨',
    '──────────────',
  ];

  for (const sep of separators) {
    const idx = text.indexOf(sep);
    if (idx !== -1) {
      return text.substring(0, idx).trim();
    }
  }

  // Fallback: if company name appears near the bottom
  if (profile?.companyName && text.includes(profile.companyName)) {
    const idx = text.lastIndexOf(profile.companyName);
    // Find preceding line break
    const beforeIdx = text.lastIndexOf('\n', idx);
    if (beforeIdx > 0) {
      return text.substring(0, beforeIdx).trim();
    }
  }

  return text;
}
