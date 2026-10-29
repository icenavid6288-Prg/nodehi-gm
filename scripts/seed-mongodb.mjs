/**
 * ساخت و مقداردهی کالکشن‌های دیتابیس سندگرای MongoDB / NoSQL (در مسیر backend/database/mongodb/*.json)
 * بدون وابستگی به Prisma یا Next.js و بدون نیاز به ترمینال روی هاست سی‌پنل
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

export function seedMongoCollections({ forceReset = false } = {}) {
  const mongoDir = join(root, 'backend', 'database', 'mongodb');
  mkdirSync(mongoDir, { recursive: true });

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

  // If products.json already exists and not forceReset, keep existing data
  if (!forceReset && existsSync(join(mongoDir, 'products.json')) && existsSync(join(mongoDir, 'settings.json'))) {
    return mongoDir;
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const seedDataDir = join(root, 'backend', 'database', 'seeders', 'data');

  const rawCategories = JSON.parse(readFileSync(join(seedDataDir, 'categories.json'), 'utf8'));
  const rawBrands = JSON.parse(readFileSync(join(seedDataDir, 'brands.json'), 'utf8'));
  const rawProducts = JSON.parse(readFileSync(join(seedDataDir, 'products.json'), 'utf8'));

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
  const categories = rawCategories.map((c, idx) => {
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
  const brands = rawBrands.map((b, idx) => {
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
  const products = rawProducts.map((p, idx) => {
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
          product_name: 'یخچال ساید بای ساید سامسونگ مدل RS68 ۲۸ فوت',
          product_slug: 'samsung-side-by-side-rs68-28ft',
          thumbnail: '/images/products/refrigerator.svg',
          price: 89000000,
          quantity: 1,
          total: 89000000,
          color: 'استیل نقره‌ای',
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
