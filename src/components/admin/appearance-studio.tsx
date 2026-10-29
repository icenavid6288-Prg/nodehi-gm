'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useBranding } from '@/components/providers/branding-provider'
import { ApplianceIcon } from '@/components/ui/appliance-icon'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import {
  COLOR_PALETTE_PRESETS,
  DEFAULT_HERO_SLIDES,
  DEFAULT_THEME_COLORS,
  SLIDE_BACKGROUND_OPTIONS,
  SLIDE_PRESET_IMAGES,
  type HeroSlide,
} from '@/lib/theme'
import { cn } from '@/lib/utils/cn'
import { toPersianDigits } from '@/lib/utils/format'
import type { CategorySlug } from '@/types'

/**
 * فشرده‌سازی و تغییر اندازه عکس انتخاب‌شده توسط کاربر در مرورگر (Canvas)
 * تا بدون نیاز به سرور فایل مجزا، به‌صورت Data URL سبک در دیتابیس SQLite ذخیره شود.
 */
async function fileToCompressedDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.84,
): Promise<string> {
  if (file.type === 'image/svg+xml' && file.size < 250_000) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('خواندن فایل SVG ناموفق بود.'))
      reader.readAsDataURL(file)
    })
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let width = img.width || maxWidth
        let height = img.height || maxHeight
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(String(reader.result ?? ''))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const mime = file.type === 'image/png' ? 'image/png' : 'image/webp'
        const dataUrl = canvas.toDataURL(mime, quality)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('فرمت تصویر معتبر نیست.'))
      img.src = String(reader.result ?? '')
    }
    reader.onerror = () => reject(new Error('خواندن فایل تصویر ناموفق بود.'))
    reader.readAsDataURL(file)
  })
}

const CATEGORY_ICON_OPTIONS: { value: CategorySlug; label: string }[] = [
  { value: 'refrigerator', label: 'یخچال و فریزر' },
  { value: 'washer', label: 'ماشین لباسشویی' },
  { value: 'dishwasher', label: 'ماشین ظرفشویی' },
  { value: 'tv', label: 'تلویزیون' },
  { value: 'air-conditioner', label: 'کولر گازی' },
  { value: 'vacuum', label: 'جاروبرقی' },
  { value: 'oven', label: 'اجاق گاز و فر' },
  { value: 'small-appliance', label: 'لوازم خانگی کوچک' },
]

export function AppearanceStudio() {
  const router = useRouter()
  const branding = useBranding()

  const [brandName, setBrandName] = useState(branding.brandName)
  const [tagline, setTagline] = useState(branding.tagline)
  const [logoUrl, setLogoUrl] = useState<string>(branding.logoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor)
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor)
  const [accentColor, setAccentColor] = useState(branding.accentColor)
  const [slides, setSlides] = useState<HeroSlide[]>(
    branding.heroSlides.length > 0 ? branding.heroSlides : DEFAULT_HERO_SLIDES,
  )
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  const [pending, setPending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentSlide = slides[activeSlideIndex] ?? slides[0]

  function applyColorLive(nextPrimary: string, nextSecondary: string, nextAccent: string) {
    setPrimaryColor(nextPrimary)
    setSecondaryColor(nextSecondary)
    setAccentColor(nextAccent)
    branding.previewBranding({
      primaryColor: nextPrimary,
      secondaryColor: nextSecondary,
      accentColor: nextAccent,
    })
  }

  function updateCurrentSlide(patch: Partial<HeroSlide>) {
    setSlides((prev) => {
      const next = prev.map((item, idx) => (idx === activeSlideIndex ? { ...item, ...patch } : item))
      branding.previewBranding({ heroSlides: next })
      return next
    })
  }

  function addNewSlide() {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      eyebrow: 'پیشنهاد ویژه جدید',
      title: 'عنوان اسلاید تبلیغاتی جدید',
      description: 'توضیح کوتاه درباره جشنواره فروش، تخفیف ویژه یا شرایط ارسال فوری محصولات.',
      primary: { href: '/shop', label: 'مشاهده محصولات' },
      secondary: { href: '/loyalty', label: 'شرایط اقساط' },
      icon: 'refrigerator',
      background: 'from-primary via-primary-light to-primary-dark',
      bullets: ['ضمانت اصالت کالا', 'ارسال سریع'],
      image: '/images/slides/slide-refrigerator.svg',
      imageMode: 'split',
    }
    const next = [...slides, newSlide]
    setSlides(next)
    setActiveSlideIndex(next.length - 1)
    branding.previewBranding({ heroSlides: next })
  }

  function removeCurrentSlide() {
    if (slides.length <= 1) {
      setErrorMessage('حداقل یک اسلاید باید در صفحه اصلی باقی بماند.')
      return
    }
    const next = slides.filter((_, idx) => idx !== activeSlideIndex)
    setSlides(next)
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))
    branding.previewBranding({ heroSlides: next })
  }

  async function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setErrorMessage(null)
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 360, 140, 0.9)
      setLogoUrl(dataUrl)
      branding.previewBranding({ logoUrl: dataUrl })
      setStatusMessage('لوگوی جدید بارگذاری شد. برای ثبت دائمی دکمه «ذخیره تغییرات ظاهر و اسلایدشو» را بزنید.')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'بارگذاری لوگو ناموفق بود.')
    } finally {
      event.target.value = ''
    }
  }

  async function handleSlideImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setErrorMessage(null)
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1100, 680, 0.84)
      updateCurrentSlide({
        image: dataUrl,
        imageMode: currentSlide.imageMode === 'icon' ? 'split' : (currentSlide.imageMode ?? 'split'),
      })
      setStatusMessage('عکس اسلاید آماده شد. برای ثبت دائمی دکمه «ذخیره تغییرات ظاهر و اسلایدشو» را بزنید.')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'بارگذاری عکس اسلاید ناموفق بود.')
    } finally {
      event.target.value = ''
    }
  }

  async function saveAllAppearance() {
    setPending(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const [generalRes, pagesRes] = await Promise.all([
        fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            group: 'general',
            values: {
              'site.brandName': brandName.trim() || 'نودهی',
              'site.tagline': tagline.trim() || 'لوازم خانگی مطمئن',
              'site.logoUrl': logoUrl.trim(),
              'site.primaryColor': primaryColor,
              'site.secondaryColor': secondaryColor,
              'site.accentColor': accentColor,
            },
          }),
        }),
        fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            group: 'pages',
            values: {
              'pages.hero.slides': JSON.stringify(slides),
              'pages.hero.eyebrow': slides[0]?.eyebrow ?? '',
              'pages.hero.title': slides[0]?.title ?? '',
              'pages.hero.subtitle': slides[0]?.description ?? '',
            },
          }),
        }),
      ])

      const generalJson = await generalRes.json()
      const pagesJson = await pagesRes.json()

      if (!generalRes.ok || !generalJson.ok) {
        setErrorMessage(generalJson?.error?.message ?? 'ذخیره تنظیمات لوگو و رنگ ناموفق بود.')
        return
      }
      if (!pagesRes.ok || !pagesJson.ok) {
        setErrorMessage(pagesJson?.error?.message ?? 'ذخیره تنظیمات اسلایدشو ناموفق بود.')
        return
      }

      window.dispatchEvent(new Event('nodehi:branding-updated'))
      await branding.refreshBranding()
      router.refresh()
      setStatusMessage('تم رنگی، لوگو و عکس‌های اسلایدشو با موفقیت ذخیره و در کل سایت اعمال شدند.')
    } catch {
      setErrorMessage('ارتباط با سرور برقرار نشد.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      id="appearance"
      className="rounded-2xl border-2 border-primary/20 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-bold text-primary">
            🎨 استودیو طراحی ظاهر و اسلایدشو
          </span>
          <h2 className="mt-2 text-base font-extrabold text-ink">
            تغییر لوگوی سایت، رنگ بصری اصلی و عکس‌های اسلایدشو صفحه اصلی
          </h2>
          <p className="mt-1 text-xs leading-6 text-ink-muted">
            هر تغییری که اینجا انجام دهید به صورت زنده پیش‌نمایش داده می‌شود و پس از ذخیره، بدون نیاز به کدنویسی در هدر، فوتر، دکمه‌ها و اسلایدشو صفحه اصلی اعمال می‌گردد.
          </p>
        </div>

        <Button type="button" variant="primary" size="md" disabled={pending} onClick={() => void saveAllAppearance()}>
          {pending ? 'در حال ذخیره…' : 'ذخیره تغییرات ظاهر و اسلایدشو'}
        </Button>
      </div>

      {errorMessage ? (
        <p role="alert" className="mt-4 rounded-xl bg-danger/[0.08] px-4 py-3 text-xs font-medium text-danger">
          {errorMessage}
        </p>
      ) : null}

      {statusMessage ? (
        <p role="status" className="mt-4 rounded-xl bg-success/[0.1] px-4 py-3 text-xs font-medium text-success">
          ✓ {statusMessage}
        </p>
      ) : null}

      {/* بخش ۱ و ۲: لوگو و رنگ بصری سایت */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ۱. لوگو و هویت برند */}
        <div className="rounded-2xl border border-surface-border bg-surface-muted/40 p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-ink">۱. لوگو و نام برند سایت</h3>
          <p className="mt-1 text-xs leading-6 text-ink-muted">
            می‌توانید فایل لوگوی خود (PNG، SVG، WebP یا JPG) را از کامپیوتر یا موبایل آپلود کنید یا لینک تصویر بدهید.
          </p>

          {/* پیش‌نمایش لوگو روی زمینه روشن و تیره */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-surface-border bg-white p-3">
              <span className="text-[10px] text-ink-subtle">پیش‌نمایش در هدر (زمینه روشن)</span>
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={brandName} className="h-9 w-auto max-w-[110px] object-contain" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                    {brandName.slice(0, 1) || 'ن'}
                  </span>
                )}
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-extrabold text-primary">{brandName || 'نودهی'}</span>
                  <span className="text-[10px] text-ink-subtle">{tagline || 'لوازم خانگی مطمئن'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-primary p-3 text-white">
              <span className="text-[10px] text-white/70">پیش‌نمایش در فوتر (زمینه تیره)</span>
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <span className="rounded-lg bg-white/95 px-1.5 py-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt={brandName} className="h-7 w-auto max-w-[100px] object-contain" />
                  </span>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-xs font-bold text-white">
                    {brandName.slice(0, 1) || 'ن'}
                  </span>
                )}
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-extrabold text-white">{brandName || 'نودهی'}</span>
                  <span className="text-[10px] text-white/75">{tagline || 'لوازم خانگی مطمئن'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="نام برند در هدر و فوتر" htmlFor="studio-brand-name">
              <Input
                id="studio-brand-name"
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value)
                  branding.previewBranding({ brandName: e.target.value })
                }}
                placeholder="نودهی"
              />
            </Field>
            <Field label="شعار کوتاه زیر لوگو" htmlFor="studio-tagline">
              <Input
                id="studio-tagline"
                value={tagline}
                onChange={(e) => {
                  setTagline(e.target.value)
                  branding.previewBranding({ tagline: e.target.value })
                }}
                placeholder="لوازم خانگی مطمئن"
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="آدرس تصویر لوگو یا آپلود مستقیم فایل" htmlFor="studio-logo-url">
              <Input
                id="studio-logo-url"
                dir="ltr"
                className="text-left"
                value={logoUrl.startsWith('data:') ? 'فایل تصویر آپلود شده از دستگاه' : logoUrl}
                onChange={(e) => {
                  const val = e.target.value
                  setLogoUrl(val)
                  branding.previewBranding({ logoUrl: val })
                }}
                placeholder="https://example.com/logo.png یا آپلود از دکمه زیر"
              />
            </Field>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-light">
                📤 انتخاب فایل لوگو از دستگاه
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => void handleLogoFileChange(e)}
                />
              </label>

              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl('')
                    branding.previewBranding({ logoUrl: '' })
                  }}
                  className="rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-medium text-ink-muted hover:border-danger/40 hover:text-danger"
                >
                  بازگردانی به لوگوی پیش‌فرض نودهی
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* ۲. رنگ بصری اصلی سایت */}
        <div className="rounded-2xl border border-surface-border bg-surface-muted/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-ink">۲. رنگ بصری اصلی سایت (تم رنگی)</h3>
            <button
              type="button"
              onClick={() =>
                applyColorLive(
                  DEFAULT_THEME_COLORS.primary,
                  DEFAULT_THEME_COLORS.secondary,
                  DEFAULT_THEME_COLORS.accent,
                )
              }
              className="text-[11px] font-medium text-primary hover:underline"
            >
              بازنشانی به رنگ پیش‌فرض
            </button>
          </div>
          <p className="mt-1 text-xs leading-6 text-ink-muted">
            یکی از پالت‌های آماده را انتخاب کنید یا رنگ دلخواه برندتان را با انتخابگر رنگ تنظیم کنید.
          </p>

          {/* پالت‌های پیشنهادی */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COLOR_PALETTE_PRESETS.map((preset) => {
              const isSelected =
                primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                secondaryColor.toLowerCase() === preset.secondary.toLowerCase()
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyColorLive(preset.primary, preset.secondary, preset.accent)}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-right transition-all',
                    isSelected
                      ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/20'
                      : 'border-surface-border bg-white hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <span className="text-xs font-bold text-ink">{preset.name}</span>
                  <span className="text-[10px] text-ink-subtle">{preset.description}</span>
                </button>
              )
            })}
          </div>

          {/* انتخابگر دستی رنگ */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-surface-border bg-white p-2.5">
              <label htmlFor="color-primary" className="block text-[11px] font-bold text-ink">
                رنگ اصلی برند
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="color-primary"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => applyColorLive(e.target.value, secondaryColor, accentColor)}
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={primaryColor}
                  onChange={(e) => applyColorLive(e.target.value, secondaryColor, accentColor)}
                  className="w-full text-left font-mono text-xs text-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-white p-2.5">
              <label htmlFor="color-secondary" className="block text-[11px] font-bold text-ink">
                رنگ مکمل (فرعی)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="color-secondary"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => applyColorLive(primaryColor, e.target.value, accentColor)}
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={secondaryColor}
                  onChange={(e) => applyColorLive(primaryColor, e.target.value, accentColor)}
                  className="w-full text-left font-mono text-xs text-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-white p-2.5">
              <label htmlFor="color-accent" className="block text-[11px] font-bold text-ink">
                رنگ تأکیدی (CTA)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="color-accent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => applyColorLive(primaryColor, secondaryColor, e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={accentColor}
                  onChange={(e) => applyColorLive(primaryColor, secondaryColor, e.target.value)}
                  className="w-full text-left font-mono text-xs text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بخش ۳: مدیریت اسلایدشو صفحه اصلی و عکس هر اسلاید */}
      <div className="mt-6 rounded-2xl border border-surface-border bg-surface-muted/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-ink">
              ۳. مدیریت اسلایدشو صفحه اصلی (با قابلیت گذاشتن عکس)
            </h3>
            <p className="mt-1 text-xs leading-6 text-ink-muted">
              برای هر اسلاید می‌توانید عکس دلخواه آپلود کنید، از بنرهای آماده استفاده کنید و حالت نمایش عکس (قاب تصویر کنار متن یا پس‌زمینه تمام‌صفحه) را انتخاب نمایید.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addNewSlide}>
              + افزودن اسلاید جدید
            </Button>
            {slides.length > 1 ? (
              <button
                type="button"
                onClick={removeCurrentSlide}
                className="rounded-xl border border-danger/30 bg-white px-3 py-2 text-xs font-medium text-danger hover:bg-danger/[0.06]"
              >
                حذف این اسلاید
              </button>
            ) : null}
          </div>
        </div>

        {/* تب‌های انتخاب اسلاید */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-surface-border pb-3">
          {slides.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                idx === activeSlideIndex
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-surface-border bg-white text-ink hover:border-primary/40',
              )}
            >
              <span>اسلاید {toPersianDigits(idx + 1)}:</span>
              <span className="max-w-[140px] truncate font-medium">{item.eyebrow || item.title}</span>
            </button>
          ))}
        </div>

        {currentSlide ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            {/* فرم ویرایش اسلاید فعال */}
            <div className="flex flex-col gap-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="روتیتر بالای اسلاید (Eyebrow)" htmlFor="slide-eyebrow">
                  <Input
                    id="slide-eyebrow"
                    value={currentSlide.eyebrow}
                    onChange={(e) => updateCurrentSlide({ eyebrow: e.target.value })}
                  />
                </Field>
                <Field label="نحوه نمایش عکس در اسلاید" htmlFor="slide-image-mode">
                  <Select
                    id="slide-image-mode"
                    value={currentSlide.imageMode ?? 'split'}
                    onChange={(e) =>
                      updateCurrentSlide({
                        imageMode: e.target.value as 'split' | 'cover' | 'icon',
                      })
                    }
                  >
                    <option value="split">قاب عکس بزرگ کنار متن (پیشنهادی)</option>
                    <option value="cover">تصویر تمام‌صفحه در پس‌زمینه اسلاید</option>
                    <option value="icon">فقط آیکون دسته‌بندی (بدون عکس)</option>
                  </Select>
                </Field>
              </div>

              <Field label="عنوان اصلی اسلاید" htmlFor="slide-title">
                <Input
                  id="slide-title"
                  value={currentSlide.title}
                  onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                />
              </Field>

              <Field label="توضیح زیر عنوان" htmlFor="slide-desc">
                <Textarea
                  id="slide-desc"
                  rows={2}
                  value={currentSlide.description}
                  onChange={(e) => updateCurrentSlide({ description: e.target.value })}
                />
              </Field>

              {/* بخش عکس اسلاید */}
              <div className="rounded-xl border border-primary/20 bg-white p-3.5">
                <span className="block text-xs font-extrabold text-ink">🖼️ تصویر اسلاید</span>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  فایل تصویر را از سیستم خود انتخاب کنید، لینک عکس وارد نمایید یا یکی از بنرهای آماده زیر را بزنید:
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-light">
                    📷 آپلود عکس اسلاید از دستگاه
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => void handleSlideImageFileChange(e)}
                    />
                  </label>

                  {SLIDE_PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => updateCurrentSlide({ image: preset.url, imageMode: 'split' })}
                      className={cn(
                        'rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                        currentSlide.image === preset.url
                          ? 'border-primary bg-primary/[0.08] font-bold text-primary'
                          : 'border-surface-border bg-surface-muted/50 text-ink hover:border-primary/40',
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5">
                  <Input
                    dir="ltr"
                    className="text-left"
                    value={
                      currentSlide.image?.startsWith('data:')
                        ? 'تصویر آپلود شده از دستگاه (Data URI)'
                        : (currentSlide.image ?? '')
                    }
                    onChange={(e) => updateCurrentSlide({ image: e.target.value })}
                    placeholder="https://example.com/banner.jpg یا /images/slides/slide-refrigerator.svg"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="رنگ پس‌زمینه اسلاید" htmlFor="slide-bg">
                  <Select
                    id="slide-bg"
                    value={currentSlide.background}
                    onChange={(e) => updateCurrentSlide({ background: e.target.value })}
                  >
                    {SLIDE_BACKGROUND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="آیکون جایگزین (در حالت بدون عکس)" htmlFor="slide-icon">
                  <Select
                    id="slide-icon"
                    value={currentSlide.icon}
                    onChange={(e) => updateCurrentSlide({ icon: e.target.value as CategorySlug })}
                  >
                    {CATEGORY_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="نکات کلیدی اسلاید (با کاما یا خط تیره جدا کنید)"
                htmlFor="slide-bullets"
              >
                <Input
                  id="slide-bullets"
                  value={currentSlide.bullets.join(' ، ')}
                  onChange={(e) =>
                    updateCurrentSlide({
                      bullets: e.target.value
                        .split(/[،,]/)
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="ارسال همان‌روز ، نصب رایگان ، گارانتی ۱۰ ساله"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="متن دکمه اول" htmlFor="slide-cta1-label">
                  <Input
                    id="slide-cta1-label"
                    value={currentSlide.primary.label}
                    onChange={(e) =>
                      updateCurrentSlide({
                        primary: { ...currentSlide.primary, label: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="لینک دکمه اول" htmlFor="slide-cta1-href">
                  <Input
                    id="slide-cta1-href"
                    dir="ltr"
                    className="text-left"
                    value={currentSlide.primary.href}
                    onChange={(e) =>
                      updateCurrentSlide({
                        primary: { ...currentSlide.primary, href: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            {/* پیش‌نمایش زنده اسلاید فعال */}
            <div className="flex flex-col justify-between rounded-2xl border border-surface-border bg-white p-4">
              <div>
                <span className="text-xs font-bold text-ink">پیش‌نمایش زنده اسلاید {toPersianDigits(activeSlideIndex + 1)}</span>
                <div
                  className={cn(
                    'relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-l p-5 text-white shadow-card',
                    currentSlide.background,
                  )}
                >
                  {currentSlide.image && currentSlide.imageMode === 'cover' ? (
                    <div className="pointer-events-none absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentSlide.image}
                        alt=""
                        className="h-full w-full object-cover opacity-40"
                      />
                      <div className="absolute inset-0 bg-slate-950/65" />
                    </div>
                  ) : null}

                  <div className="relative z-10 flex flex-col gap-4">
                    <div>
                      <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium">
                        {currentSlide.eyebrow}
                      </span>
                      <h4 className="mt-2 text-base font-extrabold leading-7">{currentSlide.title}</h4>
                      <p className="mt-1.5 text-xs leading-6 text-white/80 line-clamp-2">
                        {currentSlide.description}
                      </p>
                    </div>

                    {currentSlide.image && currentSlide.imageMode !== 'icon' && currentSlide.imageMode !== 'cover' ? (
                      <div className="overflow-hidden rounded-xl border border-white/20 bg-white/10 p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentSlide.image}
                          alt={currentSlide.title}
                          className="aspect-[16/10] w-full rounded-lg object-cover"
                        />
                      </div>
                    ) : null}

                    {(!currentSlide.image || currentSlide.imageMode === 'icon') ? (
                      <div className="flex h-36 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                        <ApplianceIcon category={currentSlide.icon} className="h-20 w-20 text-white/85" />
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-1.5">
                      {currentSlide.bullets.map((b) => (
                        <span key={b} className="rounded-md bg-white/15 px-2 py-0.5 text-[10px]">
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-3">
                <span className="text-[11px] text-ink-subtle">
                  تعداد کل اسلایدهای فعال: {toPersianDigits(slides.length)} اسلاید
                </span>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={pending}
                  onClick={() => void saveAllAppearance()}
                >
                  {pending ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
