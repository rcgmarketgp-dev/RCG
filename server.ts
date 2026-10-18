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

// Endpoint: Generate specialized social media & messenger captions (single or multi-device)
app.post('/api/ai/generate-caption', async (req: Request, res: Response) => {
  try {
    const { device, devices, platform = 'bale', tone = 'attractive', companyProfile } = req.body;

    const targetList: any[] = Array.isArray(devices) && devices.length > 0
      ? devices
      : (device && device.name ? [device] : []);

    if (targetList.length === 0) {
      return res.status(400).json({ error: 'اطلاعات حداقل یک دستگاه برای ساخت کپشن الزامی است.' });
    }

    const platformGuides: Record<string, string> = {
      bale: 'پیام استاندارد پیام‌رسان بله (Bale) با تیترهای جذاب، ایموجی‌های منظم، تفکیک قیمت و اقساط، راه‌های ارتباطی و خرید مستقیم در پیام‌رسان بله.',
      telegram: 'پست استاندارد کانال و سوپرگروه تلگرام با فرمت بولد، ساختار منظم، درصد نقد و اقساط، گارانتی، آیدی تلگرام مشاوره و شماره تماس.',
      eitaa: 'پست یا پیام استاندارد پیام‌رسان ایتا (Eitaa) با فونت خوانا، هشتگ‌های پرمخاطب، شماره تماس و آیدی ایتا جهت سفارش و مشاوره.',
      whatsapp: 'متن منظم و ساختاریافته برای ارسال در چت شخصی (پیوی) و گروه‌های واتساپ همراه با خلاصه مشخصات فنی و اطلاعات تماس سریع.',
      instagram: 'پست اینستاگرام با قلاب اول (Hook) جذاب، ایموجی‌های صنعتی مرتبط، مشخصات کلیدی به صورت بولت‌پوینت، شرایط پرداخت نقد و اقساط، مدت گارانتی، هشتگ‌های تخصصی پربازدید و دعوت به اقدام (CTA) برای دایرکت و تماس.',
      divar: 'آگهی مناسب دیوار و شیپور با تیتر روشن، تفکیک شفاف قیمت و پیش‌پرداخت، شرایط چک و اقساط، وضعیت کارکرد و سلامت فنی، و نحوه بازدید حضوری.',
      linkedin: 'پست لینکدین حرفه‌ای و سازمانی B2B، تأکید بر بهره‌وری خط تولید، بازگشت سرمایه (ROI)، استانداردها و شرایط فروش اعتباری و تسهیلاتی برای کارخانجات.',
    };

    const toneGuides: Record<string, string> = {
      attractive: 'لحن بازاریابی حرفه‌ای، هیجان‌انگیز، جذاب و متمایز',
      technical: 'لحن کاملاً فنی، مهندسی و دقیق با تأکید بر قطعات و استانداردها',
      urgent: 'فروش فوری با آفر ویژه، تخفیف محدود و شرایط استثنایی نقدی/اقساطی',
      formal: 'رسمی، شرکتی، متین و اعتباری برای خریداران حقوقی',
    };

    let itemsDescription = '';
    if (targetList.length === 1) {
      const d = targetList[0];
      itemsDescription = `
مشخصات دستگاه تک موردی:
- نام دستگاه: ${d.name}
- مدل / برند: ${d.model || 'نامشخص'}
- دسته‌بندی: ${d.category || 'صنایع چوب'}
- وضعیت فعلی: ${d.status === 'ready_for_sale' ? 'آماده تحویل در نمایشگاه' : d.status === 'under_overhaul' ? 'در حال سرویس و اورهال فنی' : 'فروخته شده'}
- شرایط پرداخت: ${d.cashPercentage}% نقد + ${d.installmentPercentage}% اقساط${d.installmentMonths ? ` (${d.installmentMonths} ماهه)` : ''}
- گارانتی: ${d.warrantyMonths ? `${d.warrantyMonths} ماه گارانتی معتبر شرکتی` : 'فاقد گارانتی'}
- قیمت تقریبی: ${d.price ? `${Number(d.price).toLocaleString('fa-IR')} تومان` : 'تماس بگیرید'}
- سال ساخت: ${d.year || 'اعلام نشده'}
- مشخصات فنی: ${d.specsText || JSON.stringify(d.specList || d.specifications || {})}
- توضیحات تکمیلی: ${d.notes || 'ندارد'}
`;
    } else {
      itemsDescription = `
لیست چند دستگاه انتخابی جهت آگهی تجمیعی / کاتالوگ فروش گروهی (${targetList.length} دستگاه):
${targetList.map((d, idx) => `
دستگاه شماره ${idx + 1}:
• نام: ${d.name} (مدل: ${d.model || '-'} / دسته: ${d.category || '-'})
• وضعیت: ${d.status === 'ready_for_sale' ? 'موجود و آماده تحویل' : 'در حال اورهال'}
• قیمت: ${d.price ? `${Number(d.price).toLocaleString('fa-IR')} تومان` : 'توافقی / استعلام'}
• شرایط: ${d.cashPercentage}% نقد + ${d.installmentPercentage}% اقساط (${d.installmentMonths || 0} ماه)
• گارانتی: ${d.warrantyMonths || 0} ماه
• خلاصه فنی: ${d.specsText ? d.specsText.slice(0, 100) : '-'}
`).join('\n')}
`;
    }

    let companyProfileText = '';
    if (companyProfile) {
      companyProfileText = `
اطلاعات تماس و پروفایل شرکت جهت درج در انتهای پیام:
- نام شرکت / بازرگانی: ${companyProfile.companyName || ''}
${companyProfile.includeSlogan && companyProfile.slogan ? `- شعار سازمانی: ${companyProfile.slogan}` : ''}
${companyProfile.includePhones ? `- شماره‌های تماس: همراه (${companyProfile.mobile || '-'}) | ثابت (${companyProfile.phone1 || '-'}) | پشتیبانی (${companyProfile.phone2 || '-'})` : ''}
${companyProfile.includeSocials ? `- آیدی‌ها و پیام‌رسان‌ها: تلگرام: ${companyProfile.telegramId || '-'} | بله: ${companyProfile.baleId || '-'} | ایتا: ${companyProfile.eitaaId || '-'} | واتساپ: ${companyProfile.whatsappNumber || '-'} | اینستاگرام: ${companyProfile.instagramId || '-'}` : ''}
${companyProfile.includeAddress && companyProfile.address ? `- آدرس نمایشگاه و کارگاه: ${companyProfile.address}` : ''}
${companyProfile.includeCustomNote && companyProfile.customNote ? `- یادداشت یا دعوت به اقدام اختصاصی: ${companyProfile.customNote}` : ''}
`;
    }

    const prompt = `
شما یک مدیر بازاریابی و فروش ارشد ماشین‌آلات و ابزارآلات صنایع چوب، ام‌دی‌اف، نجاری و کابینت‌سازی در ایران هستید.
لطفاً برای اطلاعات ماشین‌آلات زیر یک متن آگهی / کپشن فروش فوق‌العاده برای ارسال به مشتری یا انتشار در پیام‌رسان‌های بله، تلگرام، ایتا و واتساپ بنویسید:

${itemsDescription}

${companyProfileText}

پیام‌رسان / پلتفرم مقصد: ${platform} (${platformGuides[platform] || platformGuides.bale})
لحن متن: ${tone} (${toneGuides[tone] || toneGuides.attractive})
حالت آگهی: ${targetList.length > 1 ? 'آگهی کاتالوگ چند موردی (لیست دستگاه‌های موجود با شرایط ویژه اقساطی)' : 'آگهی تکی اختصاصی دستگاه'}

دستورالعمل‌های خروجی:
۱. خروجی باید کاملاً به زبان فارسی روان، اصیل و جذاب با اصطلاحات تخصصی دقیق صنعت چوب (مانند ایستگاه‌ها، پیش‌فرز، ریل واگن، خط‌زن، اسپیندل، زاویه‌خور، پی‌ال‌سی و...) باشد.
۲. شرایط پرداخت نقد و اقساط و مدت گارانتی به شکل برجسته و خوانا با ایموجی‌های منظم ذکر شوند.
۳. اطلاعات تماس و پروفایل شرکت در صورت وجود، دقیقاً و به شکلی منظم و حرفه‌ای با خط جداکننده (مانند ━━━━━━━━━━━━━━━━━━━━) در انتهای پیام قرار گیرند و شماره‌ها و آیدی‌ها بدون دستکاری درج شوند.
۴. هشتگ‌های تخصصی صنعت چوب مانند #صنایع_چوب #فروش_اقساطی_ماشین_آلات #چوب_و_ام_دی_اف و نام دستگاه‌ها در انتها درج شود.
۵. فقط خود متن نهایی کپشن را خروجی دهید بدون توضیحات اضافه در ابتدا یا انتها.
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
        hmr: false,
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
