import type { CategorySlug } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────
 *  مدیریت هویت بصری، پالت رنگی پویا و اسلایدشو صفحه اصلی
 * ─────────────────────────────────────────────────────────────
 *  بدون هیچ وابستگی سروری تا هم در Server Component و هم در Client Component
 *  قابل استفاده باشد.
 */

export interface ThemePalette {
  id: string
  name: string
  description: string
  primary: string
  secondary: string
  accent: string
}

export const DEFAULT_THEME_COLORS = {
  primary: '#0F2A43',
  secondary: '#12B5A5',
  accent: '#FF6B35',
} as const

export const COLOR_PALETTE_PRESETS: ThemePalette[] = [
  {
    id: 'nodehi-navy',
    name: 'سرمه‌ای و فیروزه‌ای نودهی (پیش‌فرض)',
    description: 'ترکیب کلاسیک سرمه‌ای اعتمادآفرین با فیروزه‌ای مدرن و نارنجی تأکیدی',
    primary: '#0F2A43',
    secondary: '#12B5A5',
    accent: '#FF6B35',
  },
  {
    id: 'ruby-crimson',
    name: 'یاقوتی و کهربایی (فروشگاهی گرم)',
    description: 'قرمز یاقوتی پرانرژی مناسب جشنواره‌های فروش و فروشگاه‌های بزرگ',
    primary: '#881337',
    secondary: '#E11D48',
    accent: '#D97706',
  },
  {
    id: 'emerald-luxury',
    name: 'زمردی و سبز لوکس',
    description: 'سبز تیره سلطنتی با حس پاکیزگی، کم‌مصرف بودن و طراوت خانه',
    primary: '#064E3B',
    secondary: '#10B981',
    accent: '#EA580C',
  },
  {
    id: 'royal-cobalt',
    name: 'آبی سلطنتی و آسمانی (تکنولوژی)',
    description: 'آبی لاجوردی مدرن ویژه لوازم خانگی هوشمند و دیجیتال',
    primary: '#1E3A8A',
    secondary: '#0284C7',
    accent: '#F97316',
  },
  {
    id: 'amethyst-modern',
    name: 'بنفش مدرن و یاسی',
    description: 'بنفش عمیق و متمایز با جلوه لوکس و مدرن',
    primary: '#3B0764',
    secondary: '#7C3AED',
    accent: '#EC4899',
  },
  {
    id: 'obsidian-gold',
    name: 'ذغالی و طلایی (مینیمال صنعتی)',
    description: 'خاکستری تیره استیل با акценت طلایی/کهربایی',
    primary: '#18181B',
    secondary: '#0D9488',
    accent: '#D97706',
  },
]

export interface HeroSlide {
  id: string
  eyebrow: string
  title: string
  description: string
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
  icon: CategorySlug
  /** کلاس‌های گرادیان پس‌زمینه */
  background: string
  /** نکات کلیدی اسلاید */
  bullets: string[]
  /** آدرس تصویر یا Data URL آپلودشده برای اسلاید */
  image?: string | null
  /** نحوه نمایش عکس در اسلاید: split (کادر چپ)، cover (پس‌زمینه کامل)، icon (فقط آیکون بدون عکس) */
  imageMode?: 'split' | 'cover' | 'icon'
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'side-by-side',
    eyebrow: 'پیشنهاد ویژه این هفته',
    title: 'یخچال ساید بای ساید با تخفیف تا ۸٪',
    description:
      'مدل‌های اینورتر با گارانتی ۱۰ ساله کمپرسور، ارسال همان‌روز در تهران و کرج و نصب رایگان در محل.',
    primary: { href: '/shop?category=refrigerator', label: 'مشاهده یخچال‌ها' },
    secondary: { href: '/guides/how-to-choose-refrigerator', label: 'راهنمای خرید' },
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
    primary: { href: '/ready-to-ship', label: 'کالاهای موجود' },
    secondary: { href: '/shop?sort=newest', label: 'جدیدترین محصولات' },
    icon: 'oven',
    background: 'from-accent-dark via-accent to-accent-light',
    bullets: ['سفارش تا ساعت ۱۴', 'ارسال همان‌روز', 'پرداخت درب منزل'],
    image: '/images/slides/slide-kitchen.svg',
    imageMode: 'split',
  },
]

export const SLIDE_BACKGROUND_OPTIONS = [
  { value: 'from-primary via-primary-light to-primary-dark', label: 'رنگ اصلی برند (گرادیان سرمه‌ای/اصلی)' },
  { value: 'from-secondary-dark via-secondary to-secondary-light', label: 'رنگ مکمل برند (گرادیان فیروزه‌ای/مکمل)' },
  { value: 'from-accent-dark via-accent to-accent-light', label: 'رنگ تأکیدی برند (گرادیان نارنجی/تأکیدی)' },
  { value: 'from-slate-900 via-slate-800 to-slate-900', label: 'مشکی و ذغالی لوکس' },
]

export const SLIDE_PRESET_IMAGES = [
  { url: '/images/slides/slide-refrigerator.svg', label: 'بنر یخچال ساید بای ساید' },
  { url: '/images/slides/slide-washer.svg', label: 'بنر ماشین لباسشویی' },
  { url: '/images/slides/slide-kitchen.svg', label: 'بنر آشپزخانه و ارسال فوری' },
  { url: '/images/products/tv.svg', label: 'بنر تلویزیون هوشمند' },
  { url: '/images/products/air-conditioner.svg', label: 'بنر کولر گازی اینورتر' },
]

/** پارس امن آرایه اسلایدها از رشته JSON ذخیره‌شده در تنظیمات */
export function parseHeroSlides(raw: string | null | undefined): HeroSlide[] {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return DEFAULT_HERO_SLIDES
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_HERO_SLIDES
    const valid = parsed
      .filter((item) => item && typeof item === 'object' && typeof item.title === 'string' && item.title.trim() !== '')
      .map((item, idx): HeroSlide => {
        const fallback = DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length]!
        return {
          id: typeof item.id === 'string' && item.id ? item.id : `slide-${idx + 1}`,
          eyebrow: typeof item.eyebrow === 'string' ? item.eyebrow : fallback.eyebrow,
          title: item.title,
          description: typeof item.description === 'string' ? item.description : fallback.description,
          primary: {
            href: typeof item.primary?.href === 'string' && item.primary.href ? item.primary.href : '/shop',
            label: typeof item.primary?.label === 'string' && item.primary.label ? item.primary.label : 'مشاهده کالاها',
          },
          secondary: {
            href: typeof item.secondary?.href === 'string' && item.secondary.href ? item.secondary.href : '/shop',
            label: typeof item.secondary?.label === 'string' && item.secondary.label ? item.secondary.label : 'بیشتر بدانید',
          },
          icon: (typeof item.icon === 'string' ? item.icon : fallback.icon) as CategorySlug,
          background: typeof item.background === 'string' && item.background ? item.background : fallback.background,
          bullets: Array.isArray(item.bullets)
            ? item.bullets.filter((b: unknown) => typeof b === 'string' && b.trim() !== '')
            : fallback.bullets,
          image: typeof item.image === 'string' && item.image.trim() !== '' ? item.image.trim() : null,
          imageMode:
            item.imageMode === 'cover' || item.imageMode === 'icon' || item.imageMode === 'split'
              ? item.imageMode
              : item.image
                ? 'split'
                : 'icon',
        }
      })
    return valid.length > 0 ? valid : DEFAULT_HERO_SLIDES
  } catch {
    return DEFAULT_HERO_SLIDES
  }
}

/** اعتبارسنجی کد رنگ هگزادسیمال (#RRGGBB) */
export function normalizeHexColor(input: string | null | undefined, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback
  const trimmed = input.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`
  return fallback
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [15, 42, 67]
  return [r, g, b]
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

/** روشن‌تر یا تیره‌تر کردن یک رنگ RGB */
function shiftRgb(rgb: [number, number, number], delta: number): [number, number, number] {
  if (delta >= 0) {
    return [
      clampByte(rgb[0] + (255 - rgb[0]) * delta),
      clampByte(rgb[1] + (255 - rgb[1]) * delta),
      clampByte(rgb[2] + (255 - rgb[2]) * delta),
    ]
  }
  const factor = 1 + delta
  return [
    clampByte(rgb[0] * factor),
    clampByte(rgb[1] * factor),
    clampByte(rgb[2] * factor),
  ]
}

function formatRgbVar(rgb: [number, number, number]): string {
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`
}

/**
 * ساخت متغیرهای CSS برای تزریق در `:root` یا `<html style={...}>`.
 * از فرمت کانال‌های RGB (`15 42 67`) استفاده می‌کند تا در Tailwind با
 * `rgb(var(--color-primary) / <alpha-value>)` همهٔ شفافیت‌ها (`bg-primary/10` و غیره) کار کنند.
 */
export function buildThemeCssVariables(options: {
  primary?: string | null
  secondary?: string | null
  accent?: string | null
}): Record<string, string> {
  const primaryHex = normalizeHexColor(options.primary, DEFAULT_THEME_COLORS.primary)
  const secondaryHex = normalizeHexColor(options.secondary, DEFAULT_THEME_COLORS.secondary)
  const accentHex = normalizeHexColor(options.accent, DEFAULT_THEME_COLORS.accent)

  const p = hexToRgbTuple(primaryHex)
  const pLight = shiftRgb(p, 0.16)
  const pDark = shiftRgb(p, -0.32)

  const s = hexToRgbTuple(secondaryHex)
  const sLight = shiftRgb(s, 0.22)
  const sDark = shiftRgb(s, -0.25)

  const a = hexToRgbTuple(accentHex)
  const aLight = shiftRgb(a, 0.18)
  const aDark = shiftRgb(a, -0.2)

  return {
    '--color-primary': formatRgbVar(p),
    '--color-primary-light': formatRgbVar(pLight),
    '--color-primary-dark': formatRgbVar(pDark),
    '--color-secondary': formatRgbVar(s),
    '--color-secondary-light': formatRgbVar(sLight),
    '--color-secondary-dark': formatRgbVar(sDark),
    '--color-accent': formatRgbVar(a),
    '--color-accent-light': formatRgbVar(aLight),
    '--color-accent-dark': formatRgbVar(aDark),
  }
}
