'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { brand } from '@/config/brand'
import {
  buildThemeCssVariables,
  DEFAULT_HERO_SLIDES,
  DEFAULT_THEME_COLORS,
  normalizeHexColor,
  parseHeroSlides,
  type HeroSlide,
} from '@/lib/theme'

export interface BrandingState {
  brandName: string
  tagline: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  heroSlides: HeroSlide[]
}

interface BrandingContextValue extends BrandingState {
  refreshBranding: () => Promise<void>
  previewBranding: (partial: Partial<BrandingState>) => void
}

const DEFAULT_BRANDING: BrandingState = {
  brandName: brand.name,
  tagline: 'لوازم خانگی مطمئن',
  logoUrl: null,
  primaryColor: DEFAULT_THEME_COLORS.primary,
  secondaryColor: DEFAULT_THEME_COLORS.secondary,
  accentColor: DEFAULT_THEME_COLORS.accent,
  heroSlides: DEFAULT_HERO_SLIDES,
}

const BrandingContext = createContext<BrandingContextValue>({
  ...DEFAULT_BRANDING,
  refreshBranding: async () => undefined,
  previewBranding: () => undefined,
})

function extractBrandingFromSettings(raw: Record<string, string | null | undefined> | null | undefined): BrandingState {
  if (!raw) return DEFAULT_BRANDING

  const brandName = (raw['site.brandName'] ?? raw['store_name'] ?? '').trim() || brand.name
  const tagline = (raw['site.tagline'] ?? raw['tagline'] ?? '').trim() || 'لوازم خانگی مطمئن'
  const logoRaw = (raw['site.logoUrl'] ?? raw['site_logo'] ?? '').trim()
  const logoUrl = logoRaw.length > 0 ? logoRaw : null

  const primaryColor = normalizeHexColor(
    raw['site.primaryColor'] ?? raw['primary_color'],
    DEFAULT_THEME_COLORS.primary,
  )
  const secondaryColor = normalizeHexColor(
    raw['site.secondaryColor'] ?? raw['secondary_color'],
    DEFAULT_THEME_COLORS.secondary,
  )
  const accentColor = normalizeHexColor(
    raw['site.accentColor'] ?? raw['accent_color'],
    DEFAULT_THEME_COLORS.accent,
  )

  const heroSlides = parseHeroSlides(raw['pages.hero.slides'] ?? raw['hero_slides'])

  return {
    brandName,
    tagline,
    logoUrl,
    primaryColor,
    secondaryColor,
    accentColor,
    heroSlides,
  }
}

export function BrandingProvider({
  initialSettings,
  children,
}: {
  initialSettings?: Record<string, string | null>
  children: React.ReactNode
}) {
  const [state, setState] = useState<BrandingState>(() => extractBrandingFromSettings(initialSettings))

  // اعمال متغیرهای CSS رنگ برند روی تگ ریشه (<html>)
  useEffect(() => {
    const vars = buildThemeCssVariables({
      primary: state.primaryColor,
      secondary: state.secondaryColor,
      accent: state.accentColor,
    })
    const root = document.documentElement
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val)
    }
  }, [state.primaryColor, state.secondaryColor, state.accentColor])

  const refreshBranding = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/public', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      if (data?.settings) {
        setState(extractBrandingFromSettings(data.settings))
      }
    } catch {
      // در صورت خطا همان مقادیر فعلی حفظ می‌شود
    }
  }, [])

  useEffect(() => {
    void refreshBranding()

    const handleUpdated = () => {
      void refreshBranding()
    }
    window.addEventListener('nodehi:branding-updated', handleUpdated)
    return () => {
      window.removeEventListener('nodehi:branding-updated', handleUpdated)
    }
  }, [refreshBranding])

  const previewBranding = useCallback((partial: Partial<BrandingState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }, [])

  const value = useMemo<BrandingContextValue>(
    () => ({
      ...state,
      refreshBranding,
      previewBranding,
    }),
    [state, refreshBranding, previewBranding],
  )

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext)
}
