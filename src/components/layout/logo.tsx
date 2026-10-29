'use client'

import Link from 'next/link'
import { useBranding } from '@/components/providers/branding-provider'
import { brand } from '@/config/brand'
import { cn } from '@/lib/utils/cn'

/**
 * لوگو و لوگوتایپ نودهی با پشتیبانی از لوگوی سفارشی و نام برند پویا از تنظیمات پنل مدیریت.
 * `tone="inverse"` برای زمینه‌های تیره (مانند سربرگ کشوی موبایل و فوتر) است.
 */
export function Logo({
  className,
  showTagline = false,
  tone = 'default',
}: {
  className?: string
  showTagline?: boolean
  tone?: 'default' | 'inverse'
}) {
  const { brandName, tagline, logoUrl } = useBranding()
  const inverse = tone === 'inverse'
  const displayName = brandName || brand.name
  const displayTagline = tagline || 'لوازم خانگی مطمئن'

  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)} aria-label={`${displayName} — صفحه اصلی`}>
      {logoUrl ? (
        <span
          className={cn(
            'flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-xl px-1.5 shadow-sm',
            inverse ? 'bg-white/95 ring-1 ring-white/25' : 'bg-white ring-1 ring-surface-border',
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={displayName}
            className="h-8 w-auto max-w-[120px] object-contain"
          />
        </span>
      ) : (
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-colors',
            inverse ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-primary text-white',
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path
              d="M4 18V8.5a1.5 1.5 0 011.5-1.5h13A1.5 1.5 0 0120 8.5V18"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
            />
            <path d="M4 13h16" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
            <circle cx="8" cy="10.5" r="0.9" fill="currentColor" />
            <path d="M2.5 20.5h19" stroke="rgb(var(--color-secondary, 18 181 165))" strokeWidth={2.2} strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className={cn('text-lg font-extrabold transition-colors', inverse ? 'text-white' : 'text-primary')}>
          {displayName}
        </span>
        {showTagline ? (
          <span className={cn('text-[11px]', inverse ? 'text-white/70' : 'text-ink-subtle')}>
            {displayTagline}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
