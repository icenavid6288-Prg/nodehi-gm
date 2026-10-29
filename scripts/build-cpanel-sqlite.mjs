#!/usr/bin/env node
/**
 * ساخت دیتابیس آمادهٔ SQLite (database.sqlite) و بستهٔ استقرار بدون نیاز به SSH/ترمینال
 * ویژهٔ هاست اشتراکی سی‌پنل پارس‌پک (React + TypeScript + Laravel SQLite).
 */

import { DatabaseSync } from 'node:sqlite'
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createZip } from './zip.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const CATEGORY_ICONS = {
  refrigerator: '❄️',
  washer: '🧺',
  dishwasher: '🍽️',
  tv: '📺',
  'air-conditioner': '💨',
  vacuum: '🧹',
  oven: '🍳',
  'small-appliance': '☕',
}

const CATEGORY_SVG_CONFIG = {
  refrigerator: { title: 'یخچال و فریزر', color1: '#0D264C', color2: '#12B5A5', symbol: '❄️' },
  washer: { title: 'ماشین لباسشویی', color1: '#0F3460', color2: '#00A896', symbol: '🧺' },
  dishwasher: { title: 'ماشین ظرفشویی', color1: '#1A365D', color2: '#2B6CB0', symbol: '🍽️' },
  tv: { title: 'تلویزیون هوشمند', color1: '#111827', color2: '#4F46E5', symbol: '📺' },
  'air-conditioner': { title: 'کولر گازی اینورتر', color1: '#064E3B', color2: '#10B981', symbol: '💨' },
  vacuum: { title: 'جاروبرقی', color1: '#31102F', color2: '#E11D48', symbol: '🧹' },
  oven: { title: 'اجاق گاز و فر', color1: '#431407', color2: '#EA580C', symbol: '🍳' },
  'small-appliance': { title: 'لوازم آشپزخانه', color1: '#1E293B', color2: '#F59E0B', symbol: '☕' },
}

function generateCategorySvg(slug) {
  const cfg = CATEGORY_SVG_CONFIG[slug] || { title: 'لوازم خانگی نودهی', color1: '#0D264C', color2: '#12B5A5', symbol: '📦' }
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
</svg>`
}

console.log('۱) ساخت تصاویر SVG دسته‌بندی‌ها و کپی بنرهای اسلایدشو...')
const imgDirs = [
  join(root, 'dist-host', 'public_html', 'images', 'products'),
  join(root, 'backend', 'public', 'images', 'products'),
  join(root, 'frontend', 'public', 'images', 'products'),
]
for (const dir of imgDirs) {
  mkdirSync(dir, { recursive: true })
  for (const slug of Object.keys(CATEGORY_SVG_CONFIG)) {
    writeFileSync(join(dir, `${slug}.svg`), generateCategorySvg(slug), 'utf8')
  }
}

const slideSrcDir = join(root, 'public', 'images', 'slides')
const slideTargetDirs = [
  join(root, 'dist-host', 'public_html', 'images', 'slides'),
  join(root, 'backend', 'public', 'images', 'slides'),
  join(root, 'frontend', 'public', 'images', 'slides'),
]
if (existsSync(slideSrcDir)) {
  for (const sDir of slideTargetDirs) {
    mkdirSync(sDir, { recursive: true })
    cpSync(slideSrcDir, sDir, { recursive: true })
  }
}


console.log('۲) ساخت و پر کردن دیتابیس SQLite (database.sqlite)...')
const dbFile = join(root, 'backend', 'database', 'database.sqlite')
mkdirSync(dirname(dbFile), { recursive: true })
rmSync(dbFile, { force: true })

const db = new DatabaseSync(dbFile)
db.exec('PRAGMA journal_mode = DELETE;')
db.exec('PRAGMA synchronous = FULL;')
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
  CREATE TABLE migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration TEXT NOT NULL,
    batch INTEGER NOT NULL
  );

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'کاربر نودهی',
    phone TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'USER',
    phone_verified_at TEXT,
    remember_token TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
  );

  CREATE TABLE otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    consumed_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE auth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT DEFAULT 'منزل',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_fa TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    image TEXT,
    parent_id INTEGER,
    "order" INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_fa TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    country TEXT,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    category_id INTEGER NOT NULL,
    brand_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    compare_price INTEGER,
    stock INTEGER DEFAULT 0,
    images TEXT,
    thumbnail TEXT,
    short_description TEXT,
    description TEXT,
    specs TEXT,
    features TEXT,
    colors TEXT,
    tags TEXT,
    energy_grade TEXT,
    warranty TEXT,
    is_inverter INTEGER DEFAULT 0,
    has_installment INTEGER DEFAULT 0,
    is_ready_to_ship INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating_cache REAL DEFAULT 5.0,
    reviews_count_cache INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
  );

  CREATE TABLE coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'PERCENT',
    value INTEGER NOT NULL,
    min_order_amount INTEGER,
    max_discount_amount INTEGER,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    starts_at TEXT,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    shipping_cost INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    coupon_id INTEGER,
    status TEXT DEFAULT 'PENDING',
    payment_status TEXT DEFAULT 'PENDING',
    payment_method TEXT DEFAULT 'zarinpal',
    tracking_code TEXT,
    payment_ref_id TEXT,
    payment_redirect_url TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    product_slug TEXT NOT NULL,
    thumbnail TEXT,
    price INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    total INTEGER NOT NULL,
    color TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER,
    author_name TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    title TEXT,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'APPROVED',
    is_verified_purchase INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'NEW',
    admin_note TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE stock_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    is_notified INTEGER DEFAULT 0,
    notified_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE sms_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    gateway TEXT DEFAULT 'mock',
    status TEXT DEFAULT 'SENT',
    reference_id TEXT,
    error_message TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    "group" TEXT DEFAULT 'general',
    is_public INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE payment_gateways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    driver TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    config TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE automation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT,
    status TEXT DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    error TEXT,
    processed_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE article_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL,
    author TEXT DEFAULT 'تحریریه نودهی',
    read_time TEXT DEFAULT '۵ دقیقه',
    date TEXT,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    tags TEXT,
    related_slugs TEXT,
    related_product_slugs TEXT,
    is_published INTEGER DEFAULT 1,
    views_count INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE faq_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE legal_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    effective_date TEXT,
    sections TEXT,
    contacts TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE loyalty_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    min_points INTEGER DEFAULT 0,
    cashback_percent INTEGER DEFAULT 1,
    free_shipping INTEGER DEFAULT 0,
    exclusive_discounts INTEGER DEFAULT 0,
    priority_support INTEGER DEFAULT 0,
    color TEXT DEFAULT '#12B5A5',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE loyalty_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    title TEXT NOT NULL,
    months INTEGER DEFAULT 4,
    prepayment_percent INTEGER DEFAULT 25,
    interest_rate REAL DEFAULT 0,
    max_amount INTEGER DEFAULT 50000000,
    requirements TEXT,
    is_active INTEGER DEFAULT 1,
    "order" INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE loyalty_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    step_number INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`)

const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

// Record migrations so even `php artisan migrate` sees them as already run
const migrations = [
  '0001_01_01_000000_create_users_table',
  '0001_01_01_000001_create_cache_table',
  '0001_01_01_000002_create_jobs_table',
  '0001_01_01_000010_create_auth_tables',
  '0001_01_01_000020_create_catalog_tables',
  '0001_01_01_000030_create_commerce_tables',
  '0001_01_01_000040_create_engagement_tables',
  '0001_01_01_000050_create_operations_tables',
  '0001_01_01_000060_create_content_tables',
]
const insMig = db.prepare('INSERT INTO migrations (migration, batch) VALUES (?, 1)')
for (const m of migrations) insMig.run(m)

// 1. Seed Admin User
db.prepare(`
  INSERT INTO users (name, phone, email, role, phone_verified_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run('مدیر فروشگاه نودهی', '09120000000', 'admin@nodehi.ir', 'SUPER_ADMIN', now, now, now)

// 2. Seed Categories
const categories = JSON.parse(readFileSync(join(root, 'prisma', 'seed-data', 'categories.json'), 'utf8'))
const catMap = new Map()
const insCat = db.prepare(`
  INSERT INTO categories (name, name_fa, slug, description, icon, image, "order", created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
categories.forEach((c, idx) => {
  const icon = CATEGORY_ICONS[c.slug] || '📦'
  const res = insCat.run(
    c.nameEn || c.name,
    c.name,
    c.slug,
    c.description || '',
    icon,
    `/images/products/${c.slug}.svg`,
    idx,
    now,
    now,
  )
  catMap.set(c.slug, Number(res.lastInsertRowid))
})

// 3. Seed Brands
const brands = JSON.parse(readFileSync(join(root, 'prisma', 'seed-data', 'brands.json'), 'utf8'))
const brandMap = new Map()
const insBrand = db.prepare(`
  INSERT INTO brands (name, name_fa, slug, logo, country, description, "order", created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
brands.forEach((b, idx) => {
  const res = insBrand.run(
    b.nameEn || b.name,
    b.name,
    b.slug,
    null,
    b.origin || '',
    b.description || '',
    idx,
    now,
    now,
  )
  brandMap.set(b.slug, Number(res.lastInsertRowid))
})

// 4. Seed Products & Reviews
const products = JSON.parse(readFileSync(join(root, 'prisma', 'seed-data', 'products.json'), 'utf8'))
const insProd = db.prepare(`
  INSERT INTO products (
    name, name_en, slug, sku, category_id, brand_id, price, compare_price, stock,
    images, thumbnail, short_description, description, specs, features, colors, tags,
    energy_grade, warranty, is_inverter, has_installment, is_ready_to_ship, is_active,
    views_count, sales_count, rating_cache, reviews_count_cache, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
`)
const insRev = db.prepare(`
  INSERT INTO reviews (product_id, user_id, author_name, rating, title, comment, status, is_verified_purchase, created_at, updated_at)
  VALUES (?, NULL, ?, ?, ?, ?, 'APPROVED', 1, ?, ?)
`)

products.forEach((p, idx) => {
  const catId = catMap.get(p.category) || 1
  const brandId = brandMap.get(p.brand) || 1
  const attrs = p.attributes || {}
  const specsObj = {}
  if (Array.isArray(p.specs)) {
    for (const s of p.specs) {
      if (s && s.label && s.value) specsObj[s.label] = s.value
    }
  }
  const colors = attrs.color ? Array.from(new Set([attrs.color, 'سفید', 'نقره‌ای'])) : ['نقره‌ای', 'سفید']
  const thumb = `/images/products/${p.category}.svg`
  const warrantyMonths = attrs.warrantyMonths || 24
  const warranty = `${warrantyMonths} ماه گارانتی معتبر شرکتی`

  const res = insProd.run(
    p.name,
    p.slug.replace(/-/g, ' ').toUpperCase(),
    p.slug,
    `NDH-${1001 + idx}`,
    catId,
    brandId,
    p.price,
    p.compareAtPrice ?? null,
    p.stock ?? 10,
    JSON.stringify([thumb]),
    thumb,
    p.shortDescription || '',
    p.description || '',
    JSON.stringify(specsObj),
    JSON.stringify(p.highlights || []),
    JSON.stringify(colors),
    JSON.stringify(p.tags || []),
    attrs.energyRating || 'A++',
    warranty,
    attrs.inverter ? 1 : 0,
    attrs.installmentAvailable !== false ? 1 : 0,
    attrs.readyToShip !== false ? 1 : 0,
    40 + idx * 7,
    12 + (idx % 9) * 3,
    p.rating || 4.8,
    p.reviewCount || 12,
    now,
    now,
  )

  const prodId = Number(res.lastInsertRowid)
  insRev.run(
    prodId,
    'مریم احمدی',
    5,
    'کیفیت ساخت عالی و اصالت کالا',
    'محصول کاملاً اصل با برچسب اصالت و گارانتی رسمی تحویل شد. ارسال و بسته‌بندی نودهی عالی بود.',
    now,
    now,
  )
})

// 5. Seed Coupons
const coupons = [
  ['NODEHI10', 'PERCENT', 10, 5000000, 5000000],
  ['WELCOME15', 'PERCENT', 15, 10000000, 7500000],
  ['NOWRUZ20', 'PERCENT', 20, 20000000, 10000000],
  ['NODEHI1403', 'PERCENT', 10, 1000000, 5000000],
  ['FIRST50', 'FIXED', 200000, 2000000, null],
]
const insCoupon = db.prepare(`
  INSERT INTO coupons (code, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 1000, 0, 1, ?, ?)
`)
for (const c of coupons) insCoupon.run(c[0], c[1], c[2], c[3], c[4], now, now)

// 6. Seed Sample Order so tracking & admin work immediately
const orderRes = db.prepare(`
  INSERT INTO orders (
    order_number, user_id, customer_name, phone, province, city, address, postal_code,
    subtotal, discount, shipping_cost, total, status, payment_status, payment_method, created_at, updated_at
  ) VALUES (?, 1, ?, ?, 'تهران', 'تهران', 'خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۴۲', '1968765432', 89000000, 0, 0, 89000000, 'PROCESSING', 'PAID', 'zarinpal', ?, ?)
`).run('ORD-14030715-DEMO1', 'علی رضایی', '09120000000', now, now)

db.prepare(`
  INSERT INTO order_items (order_id, product_id, product_name, product_slug, thumbnail, price, quantity, total, color, created_at, updated_at)
  VALUES (?, 1, 'یخچال ساید بای ساید سامسونگ مدل RS68 ۲۸ فوت', 'samsung-side-by-side-rs68-28ft', '/images/products/refrigerator.svg', 89000000, 1, 89000000, 'استیل نقره‌ای', ?, ?)
`).run(Number(orderRes.lastInsertRowid), now, now)

// 7. Seed Settings & Payment Gateways
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
]

const settings = [
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
]
const insSet = db.prepare(`INSERT INTO settings (key, value, "group", is_public, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`)
for (const s of settings) insSet.run(s[0], s[1], s[2], now, now)

const gateways = [
  ['zarinpal', 'پرداخت آنلاین زرین‌پال (کلیه کارت‌های شتاب)', 'zarinpal', 1],
  ['snappay', 'پرداخت اقساطی اسنپ‌پی (۴ قسط ماهانه بدون بهره)', 'snappay', 2],
  ['card_to_card', 'کارت به کارت با تأیید فیش', 'offline', 3],
]
const insGw = db.prepare(`INSERT INTO payment_gateways (name, title, driver, is_active, "order", created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)`)
for (const g of gateways) insGw.run(g[0], g[1], g[2], g[3], now, now)

// 8. Seed Content (Articles, FAQs, Legal, Loyalty)
const catGuide = Number(
  db.prepare(`INSERT INTO article_categories (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
    .run('راهنمای خرید', 'buying-guides', 'راهنماهای تخصصی انتخاب و خرید لوازم خانگی', now, now).lastInsertRowid
)
const catTech = Number(
  db.prepare(`INSERT INTO article_categories (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
    .run('بررسی فناوری', 'tech-reviews', 'بررسی مشخصات فنی و فناوری‌های روز لوازم خانگی', now, now).lastInsertRowid
)

const insArt = db.prepare(`
  INSERT INTO articles (title, slug, category_id, author, read_time, date, excerpt, content, cover_image, tags, is_published, views_count, created_at, updated_at)
  VALUES (?, ?, ?, 'تیم فنی نودهی', ?, ?, ?, ?, ?, ?, 1, 125, ?, ?)
`)
insArt.run(
  'راهنمای جامع خرید یخچال فریزر و ساید بای ساید',
  'refrigerator-buying-guide',
  catGuide,
  '۸ دقیقه',
  '۱۴۰۳/۰۷/۱۰',
  'بررسی نکات کلیدی پیش از خرید یخچال: ظرفیت متناسب، موتور اینورتر خطی، مصرف انرژی و سیستم بدون برفک نوفراست.',
  'خرید یخچال یکی از مهم‌ترین خریدهای هر خانه‌ای است. در این مقاله به بررسی تفاوت‌های ساید‌بای‌ساید، دوقلو و در فرانسوی پرداخته و نکات مهم مصرف انرژی را شرح می‌دهیم.',
  '/images/products/refrigerator.svg',
  JSON.stringify(['یخچال', 'راهنمای خرید', 'لوازم خانگی', 'اینورتر']),
  now,
  now,
)
insArt.run(
  'چرا باید لباسشویی با موتور Direct Drive اینورتر بخریم؟',
  'washing-machine-inverter-benefits',
  catTech,
  '۶ دقیقه',
  '۱۴۰۳/۰۷/۰۵',
  'مزایای موتورهای بدون تسمه دایرکت درایو: لرزش کمتر، صدای فوق‌العاده پایین و ۱۰ سال ضمانت موتور.',
  'موتورهای اینورتر بدون تسمه انقلابی در آرامش خانه ایجاد کرده‌اند. کاهش اصطکاک داخلی نه تنها طول عمر دستگاه را دو برابر می‌کند، بلکه مصرف برق را تا ۴۰ درصد کاهش می‌دهد.',
  '/images/products/washer.svg',
  JSON.stringify(['ماشین لباسشویی', 'اینورتر', 'مصرف انرژی']),
  now,
  now,
)

const faqWarranty = Number(
  db.prepare(`INSERT INTO faq_categories (name, slug, icon, "order", created_at, updated_at) VALUES ('گارانتی و اصالت', 'warranty', 'shield-check', 1, ?, ?)`).run(now, now).lastInsertRowid
)
const faqShipping = Number(
  db.prepare(`INSERT INTO faq_categories (name, slug, icon, "order", created_at, updated_at) VALUES ('ارسال و تحویل', 'shipping', 'truck', 2, ?, ?)`).run(now, now).lastInsertRowid
)
const insFaq = db.prepare(`INSERT INTO faqs (category_id, question, answer, "order", created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`)
insFaq.run(
  faqWarranty,
  'آیا کالاهای نودهی دارای ضمانت اصالت و گارانتی معتبر هستند؟',
  'بله، تمامی محصولات عرضه شده در فروشگاه اینترنتی نودهی دارای برچسب اصالت کالا و گارانتی رسمی شرکت‌های معتبر هستند.',
  now,
  now,
)
insFaq.run(
  faqShipping,
  'ارسال سفارش‌ها به چه صورت و در چه بازه زمانی انجام می‌شود؟',
  'در شهر تهران سفارش‌ها ظرف ۲۴ ساعت تحویل و نصب می‌گردند و برای سایر استان‌ها ۲ الی ۳ روز کاری زمان می‌برد.',
  now,
  now,
)

const insLegal = db.prepare(`INSERT INTO legal_pages (slug, title, effective_date, sections, created_at, updated_at) VALUES (?, ?, '۱۴۰۳/۰۱/۰۱', ?, ?, ?)`)
insLegal.run(
  'terms',
  'قوانین و شرایط استفاده از خدمات نودهی',
  JSON.stringify([
    { title: 'ماده ۱: شرایط عمومی', body: 'ثبت سفارش در نودهی به منزله پذیرش کامل قوانین تجارت الکترونیک جمهوری اسلامی ایران است.' },
    { title: 'ماده ۲: ثبت و ارسال سفارش', body: 'روزهای کاری به معنی روز شنبه تا پنج‌شنبه هر هفته، به استثنای تعطیلات عمومی در ایران است.' },
    { title: 'ماده ۳: خسارت در هنگام حمل و نقل', body: 'فروشگاه نودهی همواره نهایت تلاش خود را می‌کند تا کلیه سفارش‌ها در نهایت صحت و بدون آسیب به دست مشتریان برسد.' },
  ]),
  now,
  now,
)
insLegal.run(
  'privacy',
  'حریم خصوصی و امنیت اطلاعات کاربران',
  JSON.stringify([
    { title: 'امنیت اطلاعات شخصی', body: 'فروشگاه نودهی به اطلاعات خصوصی اشخاصی که از خدمات سایت استفاده می‌کنند احترام گذاشته و از آن محافظت می‌کند.' },
    { title: 'ارتباطات الکترونیکی', body: 'هنگامی که شما از سرویس‌ها و خدمات نودهی استفاده می‌کنید، این ارتباطات به صورت الکترونیکی و امن انجام می‌شود.' },
  ]),
  now,
  now,
)

db.prepare(`INSERT INTO loyalty_tiers (name, min_points, cashback_percent, free_shipping, exclusive_discounts, priority_support, color, created_at, updated_at) VALUES ('برنزی', 0, 1, 0, 0, 0, '#CD7F32', ?, ?)`).run(now, now)
db.prepare(`INSERT INTO loyalty_tiers (name, min_points, cashback_percent, free_shipping, exclusive_discounts, priority_support, color, created_at, updated_at) VALUES ('نقره‌ای', 500, 2, 1, 0, 0, '#C0C0C0', ?, ?)`).run(now, now)
db.prepare(`INSERT INTO loyalty_tiers (name, min_points, cashback_percent, free_shipping, exclusive_discounts, priority_support, color, created_at, updated_at) VALUES ('طلایی', 2000, 3, 1, 1, 1, '#FFD700', ?, ?)`).run(now, now)

db.prepare(`
  INSERT INTO loyalty_installments (provider, title, months, prepayment_percent, interest_rate, max_amount, requirements, is_active, "order", created_at, updated_at)
  VALUES ('اسنپ‌پی', 'پرداخت اقساطی ۴ ماهه بدون چک و ضامن', 4, 25, 0, 50000000, ?, 1, 1, ?, ?)
`).run(JSON.stringify(['اعتبارسنجی آنلاین فوری', 'بدون نیاز به چک یا ضامن', 'پرداخت قسط اول در لحظه خرید']), now, now)

db.prepare(`INSERT INTO loyalty_steps (step_number, title, description, created_at, updated_at) VALUES (1, 'انتخاب کالا', 'کالای مورد نظر خود را به سبد خرید اضافه کنید.', ?, ?)`).run(now, now)
db.prepare(`INSERT INTO loyalty_steps (step_number, title, description, created_at, updated_at) VALUES (2, 'انتخاب روش اقساطی', 'در مرحله پرداخت، درگاه اقساطی اسنپ‌پی را برگزینید.', ?, ?)`).run(now, now)
db.prepare(`INSERT INTO loyalty_steps (step_number, title, description, created_at, updated_at) VALUES (3, 'تحویل کالا', 'سفارش خود را تحویل بگیرید و اقساط ماهانه را پرداخت نمایید.', ?, ?)`).run(now, now)

db.close()
console.log('  ✓ فایل دیتابیس SQLite با ۲۳ محصول، ۸ دسته‌بندی، ۹ برند و ۵ کد تخفیف ساخته شد.')

// 9. Sync backend & public_html into dist-host
console.log('۳) همگام‌سازی فایل‌ها در پوشه dist-host...')
const distBackend = join(root, 'dist-host', 'backend')
const distPublic = join(root, 'dist-host', 'public_html')

rmSync(distBackend, { recursive: true, force: true })
cpSync(join(root, 'backend'), distBackend, { recursive: true })

// Also place a copy of database.sqlite and api_kernel.php inside dist-host/public_html
// so even if the user ONLY uploads public_html contents to cPanel, it still works 100%!
mkdirSync(join(distPublic, 'database'), { recursive: true })
copyFileSync(dbFile, join(distPublic, 'database', 'database.sqlite'))
writeFileSync(
  join(distPublic, 'database', '.htaccess'),
  `<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n`,
  'utf8',
)
copyFileSync(
  join(root, 'backend', 'bootstrap', 'cpanel_sqlite_kernel.php'),
  join(distPublic, 'api_kernel.php'),
)
if (existsSync(join(root, 'backend', 'public', 'install.php'))) {
  copyFileSync(
    join(root, 'backend', 'public', 'install.php'),
    join(distPublic, 'install.php'),
  )
}

console.log('۴) ساخت فایل زیپ آماده آپلود در سی‌پنل پارس‌پک...')
const zipPathRoot = join(root, 'nodehi-cpanel-sqlite.zip')
const zipPathPublic = join(root, 'public', 'nodehi-cpanel-sqlite.zip')
const archive = createZip(join(root, 'dist-host'), zipPathRoot)
copyFileSync(zipPathRoot, zipPathPublic)
console.log(`  ✓ بسته زیپ آماده شد: ${archive.files} فایل (${(archive.bytes / 1024).toFixed(1)} کیلوبایت)`)
