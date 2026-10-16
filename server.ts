import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client instance with User-Agent header per skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Generate specialized social media captions
app.post('/api/ai/generate-caption', async (req: Request, res: Response) => {
  try {
    const { device, platform = 'instagram', tone = 'attractive', targetAudience = 'general' } = req.body;

    if (!device || !device.name) {
      return res.status(400).json({ error: 'اطلاعات دستگاه ناقص است.' });
    }

    const platformGuides: Record<string, string> = {
      instagram: 'پست اینستاگرام با قلاب اول (Hook) جذاب، ایموجی‌های صنعتی مرتبط، مشخصات کلیدی به صورت بولت‌پوینت، شرایط پرداخت نقد و اقساط، مدت گارانتی، هشتگ‌های تخصصی پربازدید و دعوت به اقدام (CTA) برای دایرکت و تماس.',
      telegram: 'پست استاندارد کانال تلگرام با فرمت بولد، ساختار منظم، مشخصات کامل، درصد نقد و اقساط، گارانتی، آیدی مشاوره و شماره تماس به همراه متن دکمه‌های شیشه‌ای.',
      linkedin: 'پست لینکدین حرفه‌ای و سازمانی B2B، تأکید بر بهره‌وری خط تولید، بازگشت سرمایه (ROI)، استانداردها و شرایط فروش اعتباری و تسهیلاتی برای کارخانجات.',
      divar: 'آگهی مناسب دیوار و شیپور با تیتر روشن، تفکیک شفاف قیمت و پیش‌پرداخت، شرایط چک و اقساط، وضعیت کارکرد و سلامت فنی، و نحوه بازدید حضوری.',
      whatsapp: 'متن خلاصه و شکیل مناسب ارسال در گروه‌ها و چت‌های واتساپ و ایتا/بله به همراه اطلاعات تماس فوری.',
    };

    const toneGuides: Record<string, string> = {
      attractive: 'لحن بازاریابی حرفه‌ای، هیجان‌انگیز، جذاب و متمایز',
      technical: 'لحن کاملاً فنی، مهندسی و دقیق با تأکید بر قطعات و استانداردها',
      urgent: 'فروش فوری با آفر ویژه، تخفیف محدود و شرایط استثنایی نقدی/اقساطی',
      formal: 'رسمی، شرکتی، متین و اعتباری برای خریداران حقوقی',
    };

    const prompt = `
شما یک مدیر بازاریابی و فروش ارشد ماشین‌آلات و ابزارآلات صنایع چوب، ام‌دی‌اف، منبت و کابینت‌سازی در ایران هستید.
لطفاً برای دستگاه ماشین‌ابزار چوب زیر یک متن کپشن/آگهی فروش فوق‌العاده بنویسید:

مشخصات دستگاه چوب:
- نام دستگاه: ${device.name}
- مدل / برند: ${device.model || 'نامشخص'}
- دسته‌بندی: ${device.category || 'صنایع چوب'}
- وضعیت فعلی: ${device.status === 'ready_for_sale' ? 'آماده تحویل در نمایشگاه' : device.status === 'under_overhaul' ? 'در حال سرویس و اورهال فنی' : 'فروخته شده'}
- شرایط پرداخت: ${device.cashPercentage}% نقد + ${device.installmentPercentage}% اقساط${device.installmentMonths ? ` (${device.installmentMonths} ماهه)` : ''}
- گارانتی: ${device.warrantyMonths ? `${device.warrantyMonths} ماه گارانتی معتبر شرکتی` : 'فاقد گارانتی'}
- قیمت تقریبی: ${device.price ? `${Number(device.price).toLocaleString('fa-IR')} تومان` : 'تماس بگیرید'}
- سال ساخت: ${device.year || 'اعلام نشده'}
- مشخصات فنی: ${device.specsText || JSON.stringify(device.specList || device.specifications || {})}
- توضیحات تکمیلی: ${device.notes || 'ندارد'}

پلتفرم مقصد: ${platform} (${platformGuides[platform] || platformGuides.instagram})
لحن متن: ${tone} (${toneGuides[tone] || toneGuides.attractive})

دستورالعمل‌های خروجی:
۱. خروجی باید کاملاً به زبان فارسی روان و اصیل با اصطلاحات تخصصی دقیق صنعت چوب (مانند ایستگاه‌ها، پیش‌فرز، ریل واگن، خط‌زن، اسپیندل و...) باشد.
۲. هشتگ‌های تخصصی صنعت چوب مانند #صنایع_چوب #دستگاه_لبه_چسبان #دورکن_واگنی #سی_ان_سی_چوب #ام_دی_اف #کابینت_سازی #فروش_اقساطی درج شود.
۳. شرایط پرداخت نقد و اقساط و گارانتی به شکل برجسته ذکر شوند.
۴. فقط خود متن نهایی کپشن را خروجی دهید بدون توضیحات اضافه در اول یا آخر.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const caption = response.text || '';
    return res.json({ caption });
  } catch (error: any) {
    console.error('Caption generation error:', error);
    return res.status(500).json({ error: error.message || 'خطا در تولید کپشن با هوش مصنوعی' });
  }
});

// Endpoint: Fix spelling, grammatical issues and normalize machine specifications
app.post('/api/ai/fix-spelling', async (req: Request, res: Response) => {
  try {
    const { device } = req.body;

    if (!device) {
      return res.status(400).json({ error: 'اطلاعات دستگاه ارسال نشده است.' });
    }

    const prompt = `
شما یک متخصص ویراستاری فارسی و کارشناس اصطلاحات فنی ماشین‌آلات و ابزارآلات صنایع چوب، ام‌دی‌اف، نجاری و کابینت‌سازی هستید.
وظیفه شما بررسی و اصلاح غلط‌های املایی، نگارشی، نیم‌فاصله‌ها و نام برندها و اصطلاحات فنی صنایع چوب (مانند هماگ Homag، فلدر Felder، پایون Payon، نوین چوب Novin Choob، براندت Brandt، کاوا Kawa، لبه‌چسبان، پیش‌فرز، کرنر زن، واگن ساچمه‌ای، دورکن، خط‌زن، اسپیندل HSD، وکیوم ممبران، اپتیمایزر، اینورتر، سوراخ‌زن الیت و غیره) در اطلاعات این دستگاه است.

اطلاعات ورودی:
نام دستگاه: ${device.name || ''}
مدل / برند: ${device.model || ''}
دسته‌بندی: ${device.category || ''}
مشخصات فنی: ${device.specsText || JSON.stringify(device.specList || {})}
توضیحات: ${device.notes || ''}

خروجی باید صرفاً یک آبجکت JSON معتبر (بدون هیچ مارک‌داون یا توضیحات اضافی) با فرمت زیر باشد:
{
  "name": "نام اصلاح شده",
  "model": "مدل اصلاح شده",
  "category": "دسته‌بندی اصلاح شده",
  "specsText": "مشخصات اصلاح شده با رعایت نیم‌فاصله‌ها و واژگان دقیق",
  "notes": "توضیحات اصلاح شده",
  "corrections": [
    { "field": "نام فیلد", "original": "کلمه یا عبارت اشتباه", "corrected": "شکل صحیح", "reason": "علت اصلاح" }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let rawText = response.text || '{}';
    // Clean code fences if present
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(rawText);
      return res.json(parsed);
    } catch {
      return res.json({
        name: device.name,
        model: device.model,
        category: device.category,
        specsText: device.specsText,
        notes: device.notes,
        corrections: [],
        rawOutput: rawText,
      });
    }
  } catch (error: any) {
    console.error('Spelling correction error:', error);
    return res.status(500).json({ error: error.message || 'خطا در ویرایش متن با هوش مصنوعی' });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  const http = await import('http');
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
