import { DeviceItem, AISpellingResult } from '../types/device';

export interface GenerateCaptionParams {
  device?: Partial<DeviceItem>;
  devices?: Partial<DeviceItem>[];
  platform: 'bale' | 'telegram' | 'eitaa' | 'whatsapp' | 'instagram' | 'divar' | 'linkedin';
  tone: 'attractive' | 'technical' | 'urgent' | 'formal';
}

export async function generateAICaption(params: GenerateCaptionParams): Promise<string> {
  const res = await fetch('/api/ai/generate-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'خطا در ارتباط با سرور هوش مصنوعی برای ساخت کپشن.');
  }

  const data = await res.json();
  return data.caption;
}

export async function checkAndFixSpellingWithAI(device: Partial<DeviceItem>): Promise<AISpellingResult> {
  const res = await fetch('/api/ai/fix-spelling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'خطا در ویرایش و اصلاح هوشمند متن.');
  }

  return await res.json();
}
