'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useBranding } from '@/components/providers/branding-provider'
import { ApplianceIcon } from '@/components/ui/appliance-icon'
import { ButtonLink } from '@/components/ui/button'
import { DEFAULT_HERO_SLIDES } from '@/lib/theme'
import { cn } from '@/lib/utils/cn'
import { toPersianDigits } from '@/lib/utils/format'
import type { CategorySlug } from '@/types'

export function Hero() {
  const { heroSlides } = useBranding()
  const { user } = useAuth()
  const slides = heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const safeIndex = index % slides.length
  const slide = slides[safeIndex] ?? slides[0]

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  // چرخش خودکار اسلایدها، با توقف هنگام هاور (برای خوانایی)
  useEffect(() => {
    if (paused || slides.length <= 1) return
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      7000,
    )
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  const hasImage = Boolean(slide.image && slide.image.trim().length > 0)
  const imageMode = slide.imageMode ?? (hasImage ? 'split' : 'icon')
  const isCoverMode = hasImage && imageMode === 'cover'
  const isSplitImageMode = hasImage && imageMode === 'split'

  return (
    <section
      aria-roledescription="کاروسل"
      aria-label="پیشنهادهای ویژه نودهی"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-2xl border border-surface-border shadow-card"
    >
      <div
        className={cn(
          'relative bg-gradient-to-l p-6 transition-colors duration-500 sm:p-10 lg:p-14',
          slide.background,
        )}
      >
        {/* تصویر تمام‌صفحه پس‌زمینه در حالت cover */}
        {isCoverMode ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image ?? ''}
              alt=""
              className="h-full w-full object-cover object-center opacity-40 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-slate-950/85 via-slate-950/65 to-slate-950/40" />
          </div>
        ) : (
          /* بافت تزئینی پس‌زمینه */
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <span className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/[0.06]" />
            <span className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-white/5" />
          </div>
        )}

        {/* دکمه میانبر مدیریت اسلایدشو و ظاهر سایت */}
        {user?.isAdmin ? (
          <Link
            href="/admin/settings#appearance"
            className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/35 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <span>⚙️ ویرایش اسلایدشو، عکس و رنگ سایت</span>
          </Link>
        ) : null}

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div key={slide.id} className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.14] px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur">
              <span className="flex h-1.5 w-1.5 rounded-full bg-secondary-light" />
              {slide.eyebrow}
            </span>

            <h1 className="mt-4 text-2xl font-extrabold leading-[1.35] text-white sm:text-3xl lg:text-[2.45rem] lg:leading-[1.3]">
              {slide.title}
            </h1>

            <p className="mt-3.5 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              {slide.description}
            </p>

            {slide.bullets.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {slide.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/95 backdrop-blur"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      className="h-3.5 w-3.5 text-secondary-light"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={slide.primary.href}
                variant="accent"
                size="lg"
                className="!bg-white !text-primary hover:!bg-white/90"
              >
                {slide.primary.label}
              </ButtonLink>
              <ButtonLink
                href={slide.secondary.href}
                variant="outline"
                size="lg"
                className="!border-white/35 !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white"
              >
                {slide.secondary.label}
              </ButtonLink>
            </div>
          </div>

          {/* قاب عکس یا آیکون اسلاید */}
          <div className={cn('justify-center', isSplitImageMode ? 'flex' : 'hidden lg:flex')}>
            {isSplitImageMode ? (
              <div
                key={`img-${slide.id}`}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-2 shadow-float backdrop-blur animate-fade-up"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-900/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image ?? ''}
                    alt={slide.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-[1.02]"
                  />
                </div>
                {slide.bullets[0] ? (
                  <span className="absolute bottom-5 right-5 rounded-xl bg-white/95 px-3.5 py-1.5 text-[11px] font-bold text-primary shadow-sm">
                    ✓ {slide.bullets[0]}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="relative flex h-64 w-64 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur">
                <ApplianceIcon category={slide.icon} className="h-32 w-32 text-white/85" />
                {slide.bullets[0] ? (
                  <span className="absolute bottom-4 rounded-xl bg-white/95 px-3 py-1.5 text-[11px] font-bold text-primary">
                    {slide.bullets[0]}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* کنترل‌های اسلایدر */}
        <div className="relative z-10 mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="انتخاب اسلاید">
            {slides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={itemIndex === safeIndex}
                aria-label={item.eyebrow}
                onClick={() => goTo(itemIndex)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  itemIndex === safeIndex ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="اسلاید بعدی"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/15"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M14 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="اسلاید قبلی"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/15"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M10 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="mr-1 text-xs text-white/70 tabular-nums">
              {toPersianDigits(safeIndex + 1)} / {toPersianDigits(slides.length)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * نوار دسته‌بندی زیر هیرو — دسترسی سریع به پرتقاضاترین گروه‌ها.
 * تعداد کالاهای هر دسته از لایه داده محاسبه و نمایش داده می‌شود.
 */
export function CategoryStrip({ counts }: { counts: Record<CategorySlug, number> }) {
  return (
    <nav aria-label="دسته‌بندی کالاها" className="grid grid-cols-4 gap-2 lg:grid-cols-8">
      {categoryStripItems.map(({ slug, label, short }) => (
        <Link
          key={slug}
          href={`/shop?category=${slug}`}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-white px-2 py-4 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-float"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <ApplianceIcon category={slug} className="h-6 w-6" />
          </span>
          <span className="text-xs font-medium leading-5 text-ink">{short}</span>
          <span className="text-[10px] text-ink-subtle">
            {label} · {toPersianDigits(counts[slug] ?? 0)} کالا
          </span>
        </Link>
      ))}
    </nav>
  )
}

const categoryStripItems: { slug: CategorySlug; label: string; short: string }[] = [
  { slug: 'refrigerator', label: 'یخچال', short: 'یخچال و فریزر' },
  { slug: 'washer', label: 'لباسشویی', short: 'ماشین لباسشویی' },
  { slug: 'dishwasher', label: 'ظرفشویی', short: 'ماشین ظرفشویی' },
  { slug: 'tv', label: 'تلویزیون', short: 'تلویزیون' },
  { slug: 'air-conditioner', label: 'کولر گازی', short: 'کولر گازی' },
  { slug: 'vacuum', label: 'جاروبرقی', short: 'جاروبرقی' },
  { slug: 'oven', label: 'اجاق گاز', short: 'اجاق گاز و فر' },
  { slug: 'small-appliance', label: 'لوازم کوچک', short: 'لوازم خانگی کوچک' },
]
