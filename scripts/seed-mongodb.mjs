/**
 * ساخت و مقداردهی کالکشن‌های دیتابیس سندگرای MongoDB / NoSQL (در مسیر backend/database/mongodb/*.json)
 * بدون وابستگی به Prisma یا Next.js و بدون نیاز به ترمینال روی هاست سی‌پنل
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function makeObjectId(index) {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machine = '6e6f646568'; // "nodeh" in hex (10 chars)
  const counter = (index & 0xffffff).toString(16).padStart(6, '0');
  return (ts + machine + counter).slice(0, 24);
}

const CATEGORY_ICONS = {
  refrigerator: '❄️',
  washer: '🧺',
  dishwasher: '🍽️',
  tv: '📺',
  'air-conditioner': '💨',
  vacuum: '🧹',
  oven: '🍳',
  'small-appliance': '☕',
};

const CATEGORY_SVG_CONFIG = {
  refrigerator: { title: 'یخچال و فریزر', color1: '#0D264C', color2: '#12B5A5', symbol: '❄️' },
  washer: { title: 'ماشین لباسشویی', color1: '#0F3460', color2: '#00A896', symbol: '🧺' },
  dishwasher: { title: 'ماشین ظرفشویی', color1: '#1A365D', color2: '#2B6CB0', symbol: '🍽️' },
  tv: { title: 'تلویزیون هوشمند', color1: '#111827', color2: '#4F46E5', symbol: '📺' },
  'air-conditioner': { title: 'کولر گازی اینورتر', color1: '#064E3B', color2: '#10B981', symbol: '💨' },
  vacuum: { title: 'جاروبرقی', color1: '#31102F', color2: '#E11D48', symbol: '🧹' },
  oven: { title: 'اجاق گاز و فر', color1: '#431407', color2: '#EA580C', symbol: '🍳' },
  'small-appliance': { title: 'لوازم آشپزخانه', color1: '#1E293B', color2: '#F59E0B', symbol: '☕' },
};

function generateCategorySvg(slug) {
  const cfg = CATEGORY_SVG_CONFIG[slug] || {
    title: 'لوازم خانگی نودهی',
    color1: '#0D264C',
    color2: '#12B5A5',
    symbol: '📦',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cfg.color1}" />
      <stop offset="100%" stop-color="${cfg.color2}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="40" fill="#F8FAFC" />
  <rect x="40" y="36" width="320" height="260" rx="28" fill="url(#bg-${slug})" />
  <circle cx="200" cy="150" r="64" fill="rgba(255,255,255,0.14)" />
  <text x="200" y="172" font-size="64" text-anchor="middle">${cfg.symbol}</text>
  <text x="200" y="262" font-family="Tahoma, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${cfg.title}</text>
  <rect x="110" y="320" width="180" height="36" rx="18" fill="#E2E8F0" />
  <text x="200" y="344" font-family="Tahoma, sans-serif" font-size="14" font-weight="bold" fill="#0D264C" text-anchor="middle">فروشگاه لوازم خانگی نودهی</text>
</svg>`;
}

const EMBEDDED_CATEGORIES = [
  { slug: 'refrigerator', name: 'یخچال و ساید بای ساید', nameEn: 'Refrigerator', description: 'انواع یخچال و ساید بای ساید اینورتر با گارانتی معتبر' },
  { slug: 'washer', name: 'ماشین لباسشویی', nameEn: 'Washing Machine', description: 'ماشین‌های لباسشویی اتوماتیک درب از جلو کم‌مصرف و بی‌صدا' },
  { slug: 'dishwasher', name: 'ماشین ظرفشویی', nameEn: 'Dishwasher', description: 'ماشین ظرفشویی مبله و رومیزی با رده انرژی A+++' },
  { slug: 'tv', name: 'تلویزیون و صوتی', nameEn: 'TV & Audio', description: 'تلویزیون‌های هوشمند 4K و سیستم‌های صوتی خانگی' },
  { slug: 'air-conditioner', name: 'کولر گازی و اسپلیت', nameEn: 'Air Conditioner', description: 'کولر گازی اینورتر کم‌مصرف با قابلیت سرمایش و گرمایش' },
  { slug: 'vacuum', name: 'جاروبرقی و نظافت', nameEn: 'Vacuum Cleaner', description: 'جاروبرقی‌های کیسه‌ای و مخزنی با مکش فوق‌العاده' },
  { slug: 'oven', name: 'فر، هود و اجاق گاز', nameEn: 'Oven & Stove', description: 'تجهیزات توکار آشپزخانه، هود هوشمند و اجاق گاز صفحه‌ای' },
  { slug: 'small-appliance', name: 'لوازم خرد آشپزخانه', nameEn: 'Small Appliances', description: 'سرخ‌کن بدون روغن، قهوه‌ساز، خردکن و غذاساز' },
];

const EMBEDDED_BRANDS = [
  { slug: 'samsung', name: 'سامسونگ', nameEn: 'Samsung', origin: 'کره جنوبی', description: 'پیشرو در نوآوری و لوازم خانگی هوشمند' },
  { slug: 'lg', name: 'ال‌جی', nameEn: 'LG', origin: 'کره جنوبی', description: 'کیفیت برتر و موتورهای اینورتر خطی' },
  { slug: 'bosch', name: 'بوش', nameEn: 'Bosch', origin: 'آلمان', description: 'استاندارد جهانی دوام، کیفیت و مهندسی آلمانی' },
  { slug: 'snowa', name: 'اسنوا', nameEn: 'Snowa', origin: 'ایران', description: 'بزرگترین تولیدکننده لوازم خانگی با خدمات گسترده' },
  { slug: 'daewoo', name: 'دوو', nameEn: 'Daewoo', origin: 'کره جنوبی / ایران', description: 'طراحی مدرن و عملکرد قدرتمند با ضمانت انتخاب' },
  { slug: 'philips', name: 'فیلیپس', nameEn: 'Philips', origin: 'هلند', description: 'تخصص برتر در لوازم خرد آشپزخانه و نظافت' },
  { slug: 'panasonic', name: 'پاناسونیک', nameEn: 'Panasonic', origin: 'ژاپن', description: 'دقت ژاپنی و کیفیت ماندگار' },
  { slug: 'sony', name: 'سونی', nameEn: 'Sony', origin: 'ژاپن', description: 'استاندارد مرجع کیفیت تصویر و سیستم‌های تصویری' },
];

const EMBEDDED_PRODUCTS = [
  {
    name: 'یخچال ساید بای ساید ۳۰ فوت سامسونگ مدل RS68',
    slug: 'samsung-side-by-side-rs68-30ft',
    category: 'refrigerator',
    brand: 'samsung',
    price: 89000000,
    compareAtPrice: 94000000,
    stock: 12,
    shortDescription: 'یخچال ساید بای ساید ۳۰ فوت با کمپرسور اینورتر دیجیتال و سیستم سرمایش دوگانه Twin Cooling',
    description: 'یخچال ساید بای ساید سامسونگ مدل RS68 با گنجایش ۶۶۸ لیتر، قابلیت اتصال به آب شهری، یخ‌ساز اتوماتیک باریک و فناوری SpaceMax برای حداکثر فضای داخلی.',
    attributes: { color: 'استیل دودی', energyRating: 'A++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت', value: '۳۰ فوت (۶۶۸ لیتر)' }, { label: 'نوع کمپرسور', value: 'اینورتر دیجیتال' }, { label: 'یخ‌ساز و آبریز', value: 'اتوماتیک متصل به آب شهری' }],
    highlights: ['سیستم خنک‌کننده دوقلو Twin Cooling Plus', 'فناوری SpaceMax', 'گارانتی ۱۰ ساله کمپرسور'],
    rating: 4.9,
    reviewCount: 28,
  },
  {
    name: 'یخچال فریزر دوقلو ال‌جی مدل GR-B404',
    slug: 'lg-twin-refrigerator-gr-b404',
    category: 'refrigerator',
    brand: 'lg',
    price: 92000000,
    compareAtPrice: 98000000,
    stock: 8,
    shortDescription: 'یخچال و فریزر دوقلو ال‌جی با موتور اینورتر خطی، بدون برفک و کشوی حفظ رطوبت Moist Balance Crisper',
    description: 'دوقلوی محبوب ال‌جی با ۴۰ فوت فضای خالص ذخیره‌سازی، جریان هوای چندگانه Multi Air Flow و فیلتر بهداشتی هوای داخل کابین.',
    attributes: { color: 'نقره‌ای پلاتینیوم', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت کل', value: '۴۰ فوت (۷۵۰ لیتر)' }, { label: 'موتور', value: 'Smart Inverter' }, { label: 'سیستم تهویه', value: 'Multi Air Flow' }],
    highlights: ['بدون برفک نوفراست', 'کمپرسور کم‌صدا', 'روشنایی یکنواخت LED'],
    rating: 4.8,
    reviewCount: 19,
  },
  {
    name: 'یخچال ساید بای ساید اسنوا سری هایپر مدل SN8-2261',
    slug: 'snowa-side-by-side-sn8-2261',
    category: 'refrigerator',
    brand: 'snowa',
    price: 68500000,
    compareAtPrice: 72000000,
    stock: 15,
    shortDescription: 'ساید بای ساید با طراحی مدرن درب سوم Food Show Case و کمپرسور نسل جدید پربازده اینورتر دیجیتال',
    description: 'مجهز به فیلتر تصفیه هوای نانو سیلور، سیستم کنترل سرمایش هوشمند Smart Cooling و سامانه گردش هوای سه‌بعدی.',
    attributes: { color: 'سفید متالیک', energyRating: 'A+', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت', value: '۲۷ فوت' }, { label: 'بار خانگی', value: 'دارد (درب سوم)' }, { label: 'فیلتر بوگیر', value: 'نانو کربن دوگانه' }],
    highlights: ['سامانه سرمایش سریع Super Cool', 'گارانتی ۱۲۴ ماهه کمپرسور', 'طراحی ارگونومیک ایرانی'],
    rating: 4.7,
    reviewCount: 34,
  },
  {
    name: 'ماشین لباسشویی ۹ کیلویی بوش سری ۸ مدل WAW32560',
    slug: 'bosch-washing-machine-waw32560-9kg',
    category: 'washer',
    brand: 'bosch',
    price: 49500000,
    compareAtPrice: 53000000,
    stock: 10,
    shortDescription: 'لباسشویی ۹ کیلویی بوش ساخت آلمان با موتور EcoSilence Drive و فناوری ضدلرزش AntiVibration',
    description: 'لباسشویی فوق‌کم‌صدا با چرخش ۱۶۰۰ دور در دقیقه، سنسور هوشمند تشخیص وزن ActiveWater Plus و برنامه شستشوی آلرژی‌پلاس.',
    attributes: { color: 'سفید', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 36 },
    specs: [{ label: 'ظرفیت دیگ', value: '۹ کیلوگرم' }, { label: 'سرعت چرخش', value: '۱۶۰۰ دور در دقیقه' }, { label: 'کشور سازنده', value: 'آلمان' }],
    highlights: ['موتور بی‌صدا EcoSilence Drive', 'فناوری VarioDrum مراقبت از الیاف', 'برنامه ضدچروک'],
    rating: 5.0,
    reviewCount: 42,
  },
  {
    name: 'ماشین لباسشویی ۸ کیلویی ال‌جی مدل F4V5',
    slug: 'lg-washing-machine-f4v5-8kg',
    category: 'washer',
    brand: 'lg',
    price: 36800000,
    compareAtPrice: 39500000,
    stock: 14,
    shortDescription: 'لباسشویی ۸ کیلویی ال‌جی با هوش مصنوعی AI DD و فناوری بخارشوی ضدآلرژی Steam',
    description: 'موتور دایرکت درایو بدون تسمه با ۱۴ برنامه شستشو، قابلیت اضافه کردن لباس حین کار Add Item و اتصال Wi-Fi از طریق ThinQ.',
    attributes: { color: 'نقره‌ای', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت', value: '۸ کیلوگرم' }, { label: 'سرعت چرخش', value: '۱۴۰۰ دور در دقیقه' }, { label: 'فناوری هوش مصنوعی', value: 'AI DD' }],
    highlights: ['فناوری بخارشوی Steam', 'موتور بدون تسمه Direct Drive', 'سیستم عیب‌یابی هوشمند'],
    rating: 4.8,
    reviewCount: 31,
  },
  {
    name: 'ماشین لباسشویی ۸ کیلویی دوو سری لایف مدل DWK-8540',
    slug: 'daewoo-washing-machine-dwk-8540-8kg',
    category: 'washer',
    brand: 'daewoo',
    price: 24900000,
    compareAtPrice: 27000000,
    stock: 18,
    shortDescription: 'لباسشویی اینورتر دایرکت درایو دوو با دیگ الماسه نسل جدید و سیستم حباب‌ساز نانو ایربابل',
    description: 'لباسشویی اقتصادی و باکیفیت دوو با محفظه شستشوی زمردی، سیستم چرخش آب ۱۴۰۰ دور و هیتر سرامیکی مقاوم در برابر رسوب.',
    attributes: { color: 'سفید', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت', value: '۸ کیلوگرم' }, { label: 'موتور', value: 'دایرکت درایو ۱۴۰۰ دور' }, { label: 'حباب‌ساز', value: 'Air Bubble' }],
    highlights: ['۱۴ برنامه متنوع شستشو', 'شستشوی سریع ۱۹ دقیقه‌ای', 'موتور ۱۰ سال ضمانت'],
    rating: 4.7,
    reviewCount: 22,
  },
  {
    name: 'ماشین ظرفشویی ۱۴ نفره بوش سری ۸ مدل SMS8YCI01',
    slug: 'bosch-dishwasher-sms8yci01-14place',
    category: 'dishwasher',
    brand: 'bosch',
    price: 59000000,
    compareAtPrice: 63000000,
    stock: 6,
    shortDescription: 'ماشین ظرفشویی ۳ سبده بوش آلمان با خشک‌کن زئولیت Zeolith و بازوی شستشوی چندجهته',
    description: 'برترین مدل ظرفشویی بوش با مصرف آب تنها ۹.۵ لیتر در هر چرخه، سیستم فوق‌کم‌صدا ۴۳ دسی‌بل و سبدهای قابل تنظیم VarioFlex Pro.',
    attributes: { color: 'استیل ضدلک', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 36 },
    specs: [{ label: 'ظرفیت', value: '۱۴ نفره (۳ سبد)' }, { label: 'فناوری خشک‌کن', value: 'سنگ زئولیت طبیعی' }, { label: 'میزان صدا', value: '۴۳ دسی‌بل' }],
    highlights: ['خشک‌کن زئولیت با درخشش کریستال‌ها', 'سبد قاشق و چنگال مجزا', 'ساخت کشور آلمان'],
    rating: 5.0,
    reviewCount: 39,
  },
  {
    name: 'ماشین ظرفشویی ۱۴ نفره ال‌جی مدل DFB512',
    slug: 'lg-dishwasher-dfb512-14place',
    category: 'dishwasher',
    brand: 'lg',
    price: 38500000,
    compareAtPrice: 41000000,
    stock: 9,
    shortDescription: 'ظرفشویی توربو اینورتر ال‌جی با فناوری QuadWash و اسپری آب از چهار زاویه مختلف',
    description: 'مجهز به موتور Inverter Direct Drive، سیستم شستشوی دو منطقه‌ای Dual Zone برای شستشوی همزمان ظروف حساس و قابلمه‌ها.',
    attributes: { color: 'نقره‌ای تیتانیوم', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت', value: '۱۴ نفره' }, { label: 'فناوری شستشو', value: 'QuadWash چهار بازویی' }, { label: 'موتور', value: 'Inverter Direct Drive' }],
    highlights: ['بازوی چهارگانه شستشوی کامل', 'سیستم کم‌صدا ۴۶ دسی‌بل', 'قابلیت دانلود برنامه‌های جدید'],
    rating: 4.8,
    reviewCount: 26,
  },
  {
    name: 'تلویزیون هوشمند ۶۵ اینچ سونی مدل 65X85L 4K 120Hz',
    slug: 'sony-smart-tv-65x85l-4k',
    category: 'tv',
    brand: 'sony',
    price: 76000000,
    compareAtPrice: 81000000,
    stock: 7,
    shortDescription: 'تلویزیون ۶۵ اینچ سونی با پنل Full Array LED، پردازنده X1 4K HDR و رفرش‌ریت ۱۲۰ هرتز مخصوص بازی و فیلم',
    description: 'مجهز به سیستم صوتی دالبی اتموس، سیستم‌عامل گوگل تی‌وی Google TV و سازگاری کامل با کنسول‌های بازی پلی‌استیشن ۵.',
    attributes: { color: 'مشکی کرومی', energyRating: 'A', inverter: false, installmentAvailable: true, readyToShip: true, warrantyMonths: 18 },
    specs: [{ label: 'اندازه صفحه', value: '۶۵ اینچ 4K' }, { label: 'نرخ نوسازی', value: '۱۲۰ هرتز واقعی' }, { label: 'سیستم‌عامل', value: 'Google TV' }],
    highlights: ['نور پس‌زمینه Full Array LED', 'پورت HDMI 2.1 با VRR و ALLM', 'کیفیت تصویر سینمایی سونی'],
    rating: 4.9,
    reviewCount: 45,
  },
  {
    name: 'تلویزیون هوشمند ۵۵ اینچ سامسونگ مدل 55CU8000 Crystal 4K',
    slug: 'samsung-smart-tv-55cu8000-4k',
    category: 'tv',
    brand: 'samsung',
    price: 34500000,
    compareAtPrice: 37000000,
    stock: 16,
    shortDescription: 'تلویزیون کریستال ۵۵ اینچ سامسونگ با طراحی باریک AirSlim، کیفیت رنگ Dynamic Crystal Color و سیستم تایزن',
    description: 'وضوح تصویر 4K UHD، ریموت کنترل خورشیدی شارژی SolarCell، پشتیبانی از دستیار صوتی و امکان اتصال آسان به گوشی‌های هوشمند.',
    attributes: { color: 'مشکی باریک', energyRating: 'A+', inverter: false, installmentAvailable: true, readyToShip: true, warrantyMonths: 18 },
    specs: [{ label: 'اندازه', value: '۵۵ اینچ' }, { label: 'پردازنده', value: 'Crystal Processor 4K' }, { label: 'طراحی', value: 'AirSlim فوق‌باریک' }],
    highlights: ['رنگ‌های زنده Dynamic Crystal', 'ریموت خورشیدی سازگار با محیط‌زیست', 'سیستم‌عامل تایزن هوشمند'],
    rating: 4.7,
    reviewCount: 52,
  },
  {
    name: 'کولر گازی اینورتر ۲۴۰۰۰ ال‌جی سری آرت‌کول مدل Artcool Dual Inverter',
    slug: 'lg-air-conditioner-artcool-24000',
    category: 'air-conditioner',
    brand: 'lg',
    price: 74000000,
    compareAtPrice: 79000000,
    stock: 5,
    shortDescription: 'اسپلیت ۲۴۰۰۰ سرد و گرم ال‌جی با پنل شیشه‌ای مشکی آینه‌ای، کمپرسور دوال اینورتر و فیلتر یونایزر پلاسماستر',
    description: 'کاهش مصرف برق تا ۷۰٪ و خنک‌کنندگی ۴۰٪ سریع‌تر با تکنولوژی Dual Inverter و کنترل از راه دور از طریق Wi-Fi و اپلیکیشن ThinQ.',
    attributes: { color: 'مشکی آینه‌ای', energyRating: 'A+++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 60 },
    specs: [{ label: 'ظرفیت', value: '۲۴۰۰۰ BTU/h' }, { label: 'نوع عملکرد', value: 'سرمایش و گرمایش' }, { label: 'نوع گاز', value: 'R410a دوستدار محیط‌زیست' }],
    highlights: ['پنل شیشه‌ای لوکس آرت‌کول', 'کمپرسور دوال اینورتر با ۱۰ سال گارانتی', 'فیلتر پلاسمایی استریل هوا'],
    rating: 4.9,
    reviewCount: 18,
  },
  {
    name: 'کولر گازی اینورتر ۱۸۰۰۰ سامسونگ مدل Wind-Free',
    slug: 'samsung-air-conditioner-windfree-18000',
    category: 'air-conditioner',
    brand: 'samsung',
    price: 58000000,
    compareAtPrice: 62000000,
    stock: 8,
    shortDescription: 'کولر گازی ۱۸۰۰۰ سامسونگ با فناوری خنک‌کنندگی بدون باد مستقیم WindFree از طریق ۲۳۰۰۰ میکرو حفره',
    description: 'جلوگیری از احساس ناخوشایند باد سرد مستقیم، سیستم فیلتر بهداشتی Tri-Care و کمپرسور دیجیتال اینورتر بیست و سه هزار میکرو هول.',
    attributes: { color: 'سفید مات', energyRating: 'A++', inverter: true, installmentAvailable: true, readyToShip: true, warrantyMonths: 60 },
    specs: [{ label: 'ظرفیت', value: '۱۸۰۰۰ BTU/h' }, { label: 'فناوری منحصربه‌فرد', value: 'WindFree بدون باد مستقیم' }, { label: 'کمپرسور', value: 'Digital Inverter Boost' }],
    highlights: ['هوای خنک بدون باد آزاردهنده', 'مصرف انرژی تا ۷۷٪ کمتر در حالت ویندفری', 'فیلتر تصفیه ذرات معلق'],
    rating: 4.8,
    reviewCount: 23,
  },
  {
    name: 'جاروبرقی کیسه‌ای فیلیپس مدل FC9174 با توان ۲۲۰۰ وات',
    slug: 'philips-vacuum-cleaner-fc9174',
    category: 'vacuum',
    brand: 'philips',
    price: 13900000,
    compareAtPrice: 15200000,
    stock: 25,
    shortDescription: 'پرفروش‌ترین جاروبرقی فیلیپس با قدرت مکش ۵۰۰ وات واقعی، فیلتر بهداشتی HEPA 13 و پارویی توربو براش',
    description: 'مجهز به لوله تلسکوپی آلومینیومی، کیسه ۴ لیتری s-bag با دوام طولانی و سیم‌جمع‌کن خودکار با شعاع عملکرد ۱۰ متر.',
    attributes: { color: 'زرشکی متالیک', energyRating: 'A', inverter: false, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'توان موتور', value: '۲۲۰۰ وات' }, { label: 'قدرت مکش', value: '۵۰۰ وات' }, { label: 'نوع فیلتر', value: 'HEPA 13 ضدآلرژی' }],
    highlights: ['پارویی ویژه TriActive و توربو برای فرش و موی حیوانات', 'کیسه با گنجایش ۴ لیتر', 'فیلتراسیون ۹۹.۹۵٪ گرد و غبار'],
    rating: 4.9,
    reviewCount: 78,
  },
  {
    name: 'جاروبرقی کیسه‌ای بوش آلمان مدل BGL8GOLDIR سری طلایی',
    slug: 'bosch-vacuum-cleaner-bgl8goldir',
    category: 'vacuum',
    brand: 'bosch',
    price: 18400000,
    compareAtPrice: 19800000,
    stock: 20,
    shortDescription: 'جاروبرقی ۲۲۰۰ وات بوش ساخت آلمان با کیسه ۵ لیتری XXL و فناوری QuattroPower برای حداکثر مکش با کمترین مصرف',
    description: 'بدنه مشکی طلایی مات با پوشش ضدخش، سیم بلند ۱۵ متری با شعاع عمل گسترده و فیلتر بهداشتی قابل شستشوی اولترا هپا.',
    attributes: { color: 'مشکی طلایی', energyRating: 'A', inverter: false, installmentAvailable: true, readyToShip: true, warrantyMonths: 36 },
    specs: [{ label: 'توان', value: '۲۲۰۰ وات' }, { label: 'شعاع کارکرد', value: '۱۵ متر' }, { label: 'کشور سازنده', value: 'آلمان' }],
    highlights: ['کیسه فوق‌العاده جادار ۵ لیتری', 'سیستم PowerProtect با مکش پایدار در کیسه پر', 'ساخت کشور آلمان'],
    rating: 4.9,
    reviewCount: 64,
  },
  {
    name: 'سرخ‌کن بدون روغن فیلیپس مدل HD9270 ظرفیت ۶.۲ لیتر',
    slug: 'philips-airfryer-hd9270-xl',
    category: 'small-appliance',
    brand: 'philips',
    price: 8900000,
    compareAtPrice: 9700000,
    stock: 30,
    shortDescription: 'هواپز و سرخ‌کن بدون روغن فیلیپس سایز XL با تکنولوژی Rapid Air و صفحه نمایش لمسی با ۷ برنامه پخت آماده',
    description: 'کاهش ۹۰ درصدی مصرف روغن با پخت یکنواخت و ترد. سبد نچسب قابل شستشو در ماشین ظرفشویی و قابلیت گرم‌نگه‌دارنده خودکار.',
    attributes: { color: 'مشکی براق', energyRating: 'A', inverter: false, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'ظرفیت سبد', value: '۶.۲ لیتر (۱.۲ کیلوگرم سیب‌زمینی)' }, { label: 'توان مصرفی', value: '۲۰۰۰ وات' }, { label: 'تعداد برنامه‌های پیش‌فرض', value: '۷ برنامه لمسی' }],
    highlights: ['فناوری گردش هوای داغ Rapid Air', 'پخت سریع مرغ کامل و سبزیجات', 'شستشوی آسان قطعات'],
    rating: 4.9,
    reviewCount: 91,
  },
  {
    name: 'اسپرسوساز دلونگی مدل ددیکا EC685 پمپ ۱۵ بار',
    slug: 'delonghi-espresso-machine-dedica-ec685',
    category: 'small-appliance',
    brand: 'philips',
    price: 10400000,
    compareAtPrice: 11200000,
    stock: 22,
    shortDescription: 'اسپرسوساز نیمه‌صنعتی باریک دلونگی با پمپ ۱۵ بار ایتالیایی، نازل بخار حرفه‌ای کاپوچینو و سیستم حرارتی ترموبلاک',
    description: 'بدنه استیل ضدزنگ با عرض کم ۱۵ سانتی‌متر برای هر نوع آشپزخانه، امکان تهیه اسپرسو تک و دبل، لاته و کاپوچینوی خامه‌ای.',
    attributes: { color: 'استیل مات', energyRating: 'A', inverter: false, installmentAvailable: true, readyToShip: true, warrantyMonths: 24 },
    specs: [{ label: 'فشار بخار', value: '۱۵ بار ایتالیایی' }, { label: 'سیستم گرمایشی', value: 'Thermblock سریع ۴۰ ثانیه‌ای' }, { label: 'عرض دستگاه', value: '۱۵ سانتی‌متر فوق‌باریک' }],
    highlights: ['نازل بخار قابل تنظیم برای فوم شیر غلیظ', 'قابلیت استفاده از پودر قهوه و پد ESE', 'سینی دو طبقه برای ماگ بلند'],
    rating: 4.8,
    reviewCount: 84,
  },
];

export function seedMongoCollections({ forceReset = false } = {}) {
  const mongoDir = join(root, 'backend', 'database', 'mongodb');
  const seedDataDir = join(root, 'backend', 'database', 'seeders', 'data');
  mkdirSync(mongoDir, { recursive: true });
  mkdirSync(seedDataDir, { recursive: true });

  // Always keep seeders/data sync so any PHP/Laravel script also has them
  writeFileSync(join(seedDataDir, 'categories.json'), JSON.stringify(EMBEDDED_CATEGORIES, null, 2), 'utf8');
  writeFileSync(join(seedDataDir, 'brands.json'), JSON.stringify(EMBEDDED_BRANDS, null, 2), 'utf8');
  writeFileSync(join(seedDataDir, 'products.json'), JSON.stringify(EMBEDDED_PRODUCTS, null, 2), 'utf8');

  // Ensure SVG product illustrations & slide banners exist in public/ and frontend/public/
  const imgDirs = [
    join(root, 'public', 'images', 'products'),
    join(root, 'backend', 'public', 'images', 'products'),
    join(root, 'frontend', 'public', 'images', 'products'),
  ];
  for (const dir of imgDirs) {
    mkdirSync(dir, { recursive: true });
    for (const slug of Object.keys(CATEGORY_SVG_CONFIG)) {
      writeFileSync(join(dir, `${slug}.svg`), generateCategorySvg(slug), 'utf8');
    }
  }

  const slideSrcDir = join(root, 'public', 'images', 'slides');
  if (existsSync(slideSrcDir)) {
    for (const sDir of [
      join(root, 'backend', 'public', 'images', 'slides'),
      join(root, 'frontend', 'public', 'images', 'slides'),
    ]) {
      mkdirSync(sDir, { recursive: true });
      cpSync(slideSrcDir, sDir, { recursive: true });
    }
  }

  // If products.json already exists and not forceReset, return existing
  if (!forceReset && existsSync(join(mongoDir, 'products.json')) && existsSync(join(mongoDir, 'settings.json'))) {
    return mongoDir;
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const writeCol = (name, docs) => {
    writeFileSync(join(mongoDir, `${name}.json`), JSON.stringify(docs, null, 2), 'utf8');
  };

  // 1. Users Collection
  writeCol('users', [
    {
      _id: makeObjectId(1),
      id: 1,
      name: 'مدیر فروشگاه نودهی',
      phone: '09120000000',
      email: 'admin@nodehi.ir',
      role: 'SUPER_ADMIN',
      phone_verified_at: now,
      created_at: now,
      updated_at: now,
    },
  ]);

  // 2. Categories Collection
  const catMap = new Map();
  const categories = EMBEDDED_CATEGORIES.map((c, idx) => {
    const id = idx + 1;
    catMap.set(c.slug, id);
    return {
      _id: makeObjectId(100 + id),
      id,
      name: c.nameEn || c.name,
      name_fa: c.name,
      slug: c.slug,
      description: c.description || '',
      icon: CATEGORY_ICONS[c.slug] || '📦',
      image: `/images/products/${c.slug}.svg`,
      order: idx,
      created_at: now,
      updated_at: now,
    };
  });
  writeCol('categories', categories);

  // 3. Brands Collection
  const brandMap = new Map();
  const brands = EMBEDDED_BRANDS.map((b, idx) => {
    const id = idx + 1;
    brandMap.set(b.slug, id);
    return {
      _id: makeObjectId(200 + id),
      id,
      name: b.nameEn || b.name,
      name_fa: b.name,
      slug: b.slug,
      logo: null,
      country: b.origin || '',
      description: b.description || '',
      order: idx,
      created_at: now,
      updated_at: now,
    };
  });
  writeCol('brands', brands);

  // 4. Products & Reviews Collections
  const reviews = [];
  const products = EMBEDDED_PRODUCTS.map((p, idx) => {
    const id = idx + 1;
    const catId = catMap.get(p.category) || 1;
    const brandId = brandMap.get(p.brand) || 1;
    const attrs = p.attributes || {};
    const specsObj = {};
    if (Array.isArray(p.specs)) {
      for (const s of p.specs) {
        if (s && s.label && s.value) specsObj[s.label] = s.value;
      }
    }
    const colors = attrs.color
      ? Array.from(new Set([attrs.color, 'سفید', 'نقره‌ای']))
      : ['نقره‌ای', 'سفید'];
    const thumb = `/images/products/${p.category}.svg`;
    const warrantyMonths = attrs.warrantyMonths || 24;

    reviews.push({
      _id: makeObjectId(3000 + id),
      id,
      product_id: id,
      user_id: null,
      author_name: 'مریم احمدی',
      rating: 5,
      title: 'کیفیت ساخت عالی و اصالت کالا',
      comment:
        'محصول کاملاً اصل با برچسب اصالت و گارانتی رسمی تحویل شد. ارسال و بسته‌بندی نودهی عالی بود.',
      status: 'APPROVED',
      is_verified_purchase: true,
      created_at: now,
      updated_at: now,
    });

    return {
      _id: makeObjectId(1000 + id),
      id,
      name: p.name,
      name_en: p.slug.replace(/-/g, ' ').toUpperCase(),
      slug: p.slug,
      sku: `NDH-${1000 + id}`,
      category_id: catId,
      category_slug: p.category,
      brand_id: brandId,
      brand_slug: p.brand,
      price: p.price,
      compare_price: p.compareAtPrice ?? null,
      stock: p.stock ?? 10,
      images: [thumb],
      thumbnail: thumb,
      short_description: p.shortDescription || '',
      description: p.description || '',
      specs: specsObj,
      features: p.highlights || [],
      colors,
      tags: p.tags || [],
      energy_grade: attrs.energyRating || 'A++',
      warranty: `${warrantyMonths} ماه گارانتی معتبر شرکتی`,
      is_inverter: Boolean(attrs.inverter),
      has_installment: attrs.installmentAvailable !== false,
      is_ready_to_ship: attrs.readyToShip !== false,
      is_active: true,
      views_count: 40 + idx * 7,
      sales_count: 12 + (idx % 9) * 3,
      rating_cache: p.rating || 4.8,
      reviews_count_cache: p.reviewCount || 12,
      created_at: now,
      updated_at: now,
    };
  });
  writeCol('products', products);
  writeCol('reviews', reviews);

  // 5. Coupons Collection
  const rawCoupons = [
    ['NODEHI10', 'PERCENT', 10, 5000000, 5000000],
    ['WELCOME15', 'PERCENT', 15, 10000000, 7500000],
    ['NOWRUZ20', 'PERCENT', 20, 20000000, 10000000],
    ['NODEHI1403', 'PERCENT', 10, 1000000, 5000000],
    ['FIRST50', 'FIXED', 200000, 2000000, null],
  ];
  writeCol(
    'coupons',
    rawCoupons.map((c, idx) => ({
      _id: makeObjectId(400 + idx + 1),
      id: idx + 1,
      code: c[0],
      type: c[1],
      value: c[2],
      min_order_amount: c[3],
      max_discount_amount: c[4],
      usage_limit: 1000,
      used_count: 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    }))
  );

  // 6. Orders Collection
  writeCol('orders', [
    {
      _id: makeObjectId(501),
      id: 1,
      order_number: 'ORD-14030715-DEMO1',
      user_id: 1,
      customer_name: 'علی رضایی',
      phone: '09120000000',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۴۲',
      postal_code: '1968765432',
      subtotal: 89000000,
      discount: 0,
      shipping_cost: 0,
      total: 89000000,
      status: 'PROCESSING',
      payment_status: 'PAID',
      payment_method: 'zarinpal',
      items: [
        {
          product_id: 1,
          product_name: 'یخچال ساید بای ساید ۳۰ فوت سامسونگ مدل RS68',
          product_slug: 'samsung-side-by-side-rs68-30ft',
          thumbnail: '/images/products/refrigerator.svg',
          price: 89000000,
          quantity: 1,
          total: 89000000,
          color: 'استیل دودی',
        },
      ],
      created_at: now,
      updated_at: now,
    },
  ]);

  // 7. Settings Collection
  const defaultHeroSlides = [
    {
      id: 'side-by-side',
      eyebrow: 'پیشنهاد ویژه این هفته',
      title: 'یخچال ساید بای ساید با تخفیف تا ۸٪',
      description:
        'مدل‌های اینورتر با گارانتی ۱۰ ساله کمپرسور، ارسال همان‌روز در تهران و کرج و نصب رایگان در محل.',
      primary: { href: '/shop?category=refrigerator', label: 'مشاهده یخچال‌ها' },
      secondary: { href: '/guides', label: 'راهنمای خرید' },
      icon: 'refrigerator',
      background: 'from-primary via-primary-light to-primary-dark',
      bullets: ['ارسال همان‌روز', 'نصب رایگان', 'گارانتی ۱۰ ساله کمپرسور'],
      image: '/images/slides/slide-refrigerator.svg',
      imageMode: 'split',
    },
    {
      id: 'washer',
      eyebrow: 'پرفروش‌ترین‌های ماه',
      title: 'ماشین لباسشویی کم‌مصرف با اقساط بدون ضامن',
      description:
        'ظرفیت ۸ و ۹ کیلوگرمی با رده انرژی A+++، موتور اینورتر بی‌صدا و امکان بازپرداخت تا ۲۴ ماه.',
      primary: { href: '/shop?category=washer', label: 'مشاهده لباسشویی‌ها' },
      secondary: { href: '/loyalty', label: 'خرید اقساطی' },
      icon: 'washer',
      background: 'from-secondary-dark via-secondary to-secondary-light',
      bullets: ['اقساط بدون ضامن', 'رده انرژی A+++', 'بخارشوی ضدحساسیت'],
      image: '/images/slides/slide-washer.svg',
      imageMode: 'split',
    },
    {
      id: 'ready',
      eyebrow: 'موجودی فوری انبار',
      title: 'کالاهای آماده ارسال، همین امروز به دستتان می‌رسد',
      description:
        'بیش از ۲۰۰ قلم کالا در انبار تهران موجود است. سفارش تا ساعت ۱۴ ثبت کنید، همان روز ارسال می‌شود.',
      primary: { href: '/shop?ready=1', label: 'کالاهای موجود' },
      secondary: { href: '/shop?sort=newest', label: 'جدیدترین محصولات' },
      icon: 'oven',
      background: 'from-accent-dark via-accent to-accent-light',
      bullets: ['سفارش تا ساعت ۱۴', 'ارسال همان‌روز', 'پرداخت درب منزل'],
      image: '/images/slides/slide-kitchen.svg',
      imageMode: 'split',
    },
  ];

  const rawSettings = [
    ['store_name', 'فروشگاه لوازم خانگی نودهی', 'general'],
    ['brand_name', 'نودهی', 'general'],
    ['tagline', 'لوازم خانگی اصیل', 'general'],
    ['logo_url', '', 'general'],
    ['primary_color', '#0F2A43', 'general'],
    ['secondary_color', '#12B5A5', 'general'],
    ['accent_color', '#FF6B35', 'general'],
    ['hero_slides', JSON.stringify(defaultHeroSlides), 'pages'],
    ['phone', '۰۲۱-۹۱۰۰۰۰۰۰', 'general'],
    ['mobile', '۰۹۱۲۰۰۰۰۰۰۰', 'general'],
    ['email', 'info@nodehi.ir', 'general'],
    ['address', 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم', 'general'],
    ['free_shipping_threshold', '5000000', 'shipping'],
    ['working_hours', 'شنبه تا پنجشنبه، ۹ صبح تا ۹ شب', 'general'],
  ];
  writeCol(
    'settings',
    rawSettings.map((s, idx) => ({
      _id: makeObjectId(600 + idx + 1),
      id: idx + 1,
      key: s[0],
      value: s[1],
      group: s[2],
      is_public: true,
      created_at: now,
      updated_at: now,
    }))
  );

  // 8. Payment Gateways Collection
  writeCol('payment_gateways', [
    {
      _id: makeObjectId(701),
      id: 1,
      name: 'zarinpal',
      title: 'پرداخت آنلاین زرین‌پال (کلیه کارت‌های شتاب)',
      driver: 'zarinpal',
      is_active: true,
      order: 1,
    },
    {
      _id: makeObjectId(702),
      id: 2,
      name: 'snappay',
      title: 'پرداخت اقساطی اسنپ‌پی (۴ قسط ماهانه بدون بهره)',
      driver: 'snappay',
      is_active: true,
      order: 2,
    },
    {
      _id: makeObjectId(703),
      id: 3,
      name: 'card_to_card',
      title: 'کارت به کارت با تأیید فیش',
      driver: 'offline',
      is_active: true,
      order: 3,
    },
  ]);

  // 9. Content Collections (Articles, FAQs, Legal, Loyalty)
  writeCol('article_categories', [
    { _id: makeObjectId(801), id: 1, name: 'راهنمای خرید', slug: 'buying-guides', description: 'راهنماهای تخصصی انتخاب و خرید لوازم خانگی' },
    { _id: makeObjectId(802), id: 2, name: 'بررسی فناوری', slug: 'tech-reviews', description: 'بررسی مشخصات فنی و فناوری‌های روز لوازم خانگی' },
  ]);

  writeCol('articles', [
    {
      _id: makeObjectId(811),
      id: 1,
      title: 'راهنمای جامع خرید یخچال فریزر و ساید بای ساید',
      slug: 'refrigerator-buying-guide',
      category_id: 1,
      author: 'تیم فنی نودهی',
      read_time: '۸ دقیقه',
      date: '۱۴۰۳/۰۷/۱۰',
      excerpt: 'بررسی نکات کلیدی پیش از خرید یخچال: ظرفیت متناسب، موتور اینورتر خطی، مصرف انرژی و سیستم بدون برفک نوفراست.',
      content: 'خرید یخچال یکی از مهم‌ترین خریدهای هر خانه‌ای است. در این مقاله به بررسی تفاوت‌های ساید‌بای‌ساید، دوقلو و در فرانسوی پرداخته و نکات مهم مصرف انرژی را شرح می‌دهیم.',
      cover_image: '/images/products/refrigerator.svg',
      tags: ['یخچال', 'راهنمای خرید', 'لوازم خانگی', 'اینورتر'],
      is_published: true,
      views_count: 125,
    },
    {
      _id: makeObjectId(812),
      id: 2,
      title: 'چرا باید لباسشویی با موتور Direct Drive اینورتر بخریم؟',
      slug: 'washing-machine-inverter-benefits',
      category_id: 2,
      author: 'تیم فنی نودهی',
      read_time: '۶ دقیقه',
      date: '۱۴۰۳/۰۷/۰۵',
      excerpt: 'مزایای موتورهای بدون تسمه دایرکت درایو: لرزش کمتر، صدای فوق‌العاده پایین و ۱۰ سال ضمانت موتور.',
      content: 'موتورهای اینورتر بدون تسمه انقلابی در آرامش خانه ایجاد کرده‌اند. کاهش اصطکاک داخلی نه تنها طول عمر دستگاه را دو برابر می‌کند، بلکه مصرف برق را تا ۴۰ درصد کاهش می‌دهد.',
      cover_image: '/images/products/washer.svg',
      tags: ['ماشین لباسشویی', 'اینورتر', 'مصرف انرژی'],
      is_published: true,
      views_count: 98,
    },
  ]);

  writeCol('faq_categories', [
    { _id: makeObjectId(821), id: 1, name: 'گارانتی و اصالت', slug: 'warranty', icon: 'shield-check', order: 1 },
    { _id: makeObjectId(822), id: 2, name: 'ارسال و تحویل', slug: 'shipping', icon: 'truck', order: 2 },
  ]);

  writeCol('faqs', [
    {
      _id: makeObjectId(831),
      id: 1,
      category_id: 1,
      question: 'آیا کالاهای نودهی دارای ضمانت اصالت و گارانتی معتبر هستند؟',
      answer: 'بله، تمامی محصولات عرضه شده در فروشگاه اینترنتی نودهی دارای برچسب اصالت کالا و گارانتی رسمی شرکت‌های معتبر هستند.',
      order: 1,
    },
    {
      _id: makeObjectId(832),
      id: 2,
      category_id: 2,
      question: 'ارسال سفارش‌ها به چه صورت و در چه بازه زمانی انجام می‌شود؟',
      answer: 'در شهر تهران سفارش‌ها ظرف ۲۴ ساعت تحویل و نصب می‌گردند و برای سایر استان‌ها ۲ الی ۳ روز کاری زمان می‌برد.',
      order: 1,
    },
  ]);

  writeCol('legal_pages', [
    {
      _id: makeObjectId(841),
      id: 1,
      slug: 'terms',
      title: 'قوانین و شرایط استفاده از خدمات نودهی',
      effective_date: '۱۴۰۳/۰۱/۰۱',
      sections: [
        { title: 'ماده ۱: شرایط عمومی', body: 'ثبت سفارش در نودهی به منزله پذیرش کامل قوانین تجارت الکترونیک جمهوری اسلامی ایران است.' },
        { title: 'ماده ۲: ثبت و ارسال سفارش', body: 'روزهای کاری به معنی روز شنبه تا پنج‌شنبه هر هفته، به استثنای تعطیلات عمومی در ایران است.' },
        { title: 'ماده ۳: خسارت در هنگام حمل و نقل', body: 'فروشگاه نودهی همواره نهایت تلاش خود را می‌کند تا کلیه سفارش‌ها در نهایت صحت و بدون آسیب به دست مشتریان برسد.' },
      ],
    },
    {
      _id: makeObjectId(842),
      id: 2,
      slug: 'privacy',
      title: 'حریم خصوصی و امنیت اطلاعات کاربران',
      effective_date: '۱۴۰۳/۰۱/۰۱',
      sections: [
        { title: 'امنیت اطلاعات شخصی', body: 'فروشگاه نودهی به اطلاعات خصوصی اشخاصی که از خدمات سایت استفاده می‌کنند احترام گذاشته و از آن محافظت می‌کند.' },
        { title: 'ارتباطات الکترونیکی', body: 'هنگامی که شما از سرویس‌ها و خدمات نودهی استفاده می‌کنید، این ارتباطات به صورت الکترونیکی و امن انجام می‌شود.' },
      ],
    },
  ]);

  writeCol('loyalty_tiers', [
    { _id: makeObjectId(851), id: 1, name: 'برنزی', min_points: 0, cashback_percent: 1, free_shipping: false, exclusive_discounts: false, priority_support: false, color: '#CD7F32' },
    { _id: makeObjectId(852), id: 2, name: 'نقره‌ای', min_points: 500, cashback_percent: 2, free_shipping: true, exclusive_discounts: false, priority_support: false, color: '#C0C0C0' },
    { _id: makeObjectId(853), id: 3, name: 'طلایی', min_points: 2000, cashback_percent: 3, free_shipping: true, exclusive_discounts: true, priority_support: true, color: '#FFD700' },
  ]);

  writeCol('loyalty_installments', [
    {
      _id: makeObjectId(861),
      id: 1,
      provider: 'اسنپ‌پی',
      title: 'پرداخت اقساطی ۴ ماهه بدون چک و ضامن',
      months: 4,
      prepayment_percent: 25,
      interest_rate: 0,
      max_amount: 50000000,
      requirements: ['اعتبارسنجی آنلاین فوری', 'بدون نیاز به چک یا ضامن', 'پرداخت قسط اول در لحظه خرید'],
      is_active: true,
      order: 1,
    },
  ]);

  writeCol('loyalty_steps', [
    { _id: makeObjectId(871), id: 1, step_number: 1, title: 'انتخاب کالا', description: 'کالای مورد نظر خود را به سبد خرید اضافه کنید.' },
    { _id: makeObjectId(872), id: 2, step_number: 2, title: 'انتخاب روش اقساطی', description: 'در مرحله پرداخت، درگاه اقساطی اسنپ‌پی را برگزینید.' },
    { _id: makeObjectId(873), id: 3, step_number: 3, title: 'تحویل کالا', description: 'سفارش خود را تحویل بگیرید و اقساط ماهانه را پرداخت نمایید.' },
  ]);

  writeCol('addresses', []);
  writeCol('auth_sessions', []);
  writeCol('otp_codes', []);
  writeCol('contact_messages', []);
  writeCol('stock_alerts', []);

  return mongoDir;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const forceReset = process.argv.includes('--reset');
  const dir = seedMongoCollections({ forceReset });
  console.log(`✓ کالکشن‌های دیتابیس سندگرای MongoDB / NoSQL آماده شد: ${dir}`);
}
