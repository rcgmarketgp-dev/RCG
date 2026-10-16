// Utility functions for direct sending to Telegram, WhatsApp, Bale, Eitaa and Native Share

export interface ShareOptions {
  text: string;
  photoUrls?: string[];
  contactTarget?: string; // phone number (e.g. 0912...) or username (e.g. @wood_buyer)
}

// Clean Iranian phone numbers to international standard (98912...)
export function normalizePhoneNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0098')) return digits.slice(2);
  if (digits.startsWith('98')) return digits;
  if (digits.startsWith('09')) return '98' + digits.slice(1);
  if (digits.startsWith('9') && digits.length === 10) return '98' + digits;
  return digits;
}

// Clean username (remove @ or URL prefix)
export function normalizeUsername(rawUser: string): string {
  let clean = rawUser.trim();
  clean = clean.replace(/^(https?:\/\/)?(t\.me|ble\.ir|eitaa\.com|wa\.me)\//i, '');
  clean = clean.replace(/^@/, '');
  return clean;
}

// 1. Share directly to Telegram
export function shareToTelegram(options: ShareOptions): void {
  const { text, photoUrls = [], contactTarget = '' } = options;
  const username = normalizeUsername(contactTarget);
  const primaryPhoto = photoUrls[0] || '';

  // If a specific username / chat was provided, open direct personal chat
  if (username && !/^\d{10,12}$/.test(username)) {
    const url = `https://t.me/${username}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Telegram share url format supports text and url (which displays photo preview)
  const shareUrl = primaryPhoto
    ? `https://t.me/share/url?url=${encodeURIComponent(primaryPhoto)}&text=${encodeURIComponent(text)}`
    : `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;

  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}

// 2. Share directly to WhatsApp (personal chat or selector)
export function shareToWhatsApp(options: ShareOptions): void {
  const { text, contactTarget = '' } = options;
  const phone = normalizePhoneNumber(contactTarget);

  if (phone) {
    const directUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  } else {
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }
}

// 3. Share directly to Bale (بله)
export function shareToBale(options: ShareOptions): void {
  const { text, photoUrls = [], contactTarget = '' } = options;
  const target = normalizeUsername(contactTarget);
  const primaryPhoto = photoUrls[0] || '';

  // If personal chat username or channel is specified
  if (target && !/^\d{10,12}$/.test(target)) {
    const directBaleUrl = `https://ble.ir/${target}`;
    window.open(directBaleUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Bale share URL format
  const shareUrl = primaryPhoto
    ? `https://ble.ir/share/url?url=${encodeURIComponent(primaryPhoto)}&text=${encodeURIComponent(text)}`
    : `https://ble.ir/share/url?text=${encodeURIComponent(text)}`;

  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}

// 4. Share directly to Eitaa (ایتا)
export function shareToEitaa(options: ShareOptions): void {
  const { text, photoUrls = [], contactTarget = '' } = options;
  const target = normalizeUsername(contactTarget);
  const primaryPhoto = photoUrls[0] || '';

  // If specific channel or user in Eitaa
  if (target && !/^\d{10,12}$/.test(target)) {
    const directEitaa = `https://eitaa.com/${target}`;
    window.open(directEitaa, '_blank', 'noopener,noreferrer');
    return;
  }

  // Eitaa share URL
  const shareUrl = primaryPhoto
    ? `https://eitaa.com/share/url?url=${encodeURIComponent(primaryPhoto)}&text=${encodeURIComponent(text)}`
    : `https://eitaa.com/share/url?text=${encodeURIComponent(text)}`;

  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}

// 5. Native Device Share with actual image files attached
export async function shareWithNativeFiles(
  title: string,
  text: string,
  photoUrls: string[]
): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    const files: File[] = [];

    // Attempt to convert available photo URLs to File objects
    for (let i = 0; i < Math.min(photoUrls.length, 5); i++) {
      const url = photoUrls[i];
      try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const extension = blob.type.split('/')[1] || 'jpg';
        const file = new File([blob], `woodworking-machine-${i + 1}.${extension}`, {
          type: blob.type || 'image/jpeg',
        });
        files.push(file);
      } catch (err) {
        console.warn('Could not fetch image file for native share:', url, err);
      }
    }

    const shareData: ShareData = {
      title,
      text,
    };

    if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
      shareData.files = files;
    }

    await navigator.share(shareData);
    return true;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Native share failed:', error);
    }
    return false;
  }
}

// 6. Copy Image directly to Clipboard so user can Paste (Ctrl+V) into any chat
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    
    // Convert to PNG for clipboard compatibility if needed
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const blobUrl = URL.createObjectURL(blob);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    URL.revokeObjectURL(blobUrl);

    if (!pngBlob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': pngBlob,
      }),
    ]);
    return true;
  } catch (err) {
    console.warn('Clipboard image write failed:', err);
    return false;
  }
}
