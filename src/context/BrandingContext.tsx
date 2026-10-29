import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface HeroSlideItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  icon?: string;
  background: string;
  bullets: string[];
  image?: string;
  imageMode?: 'split' | 'cover' | 'icon';
}

export const DEFAULT_HERO_SLIDES_SPA: HeroSlideItem[] = [
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

export const COLOR_PRESETS_SPA = [
  {
    id: 'nodehi-navy',
    label: 'سرمه‌ای و فیروزه‌ای (پیش‌فرض)',
    primary: '#0F2A43',
    secondary: '#12B5A5',
    accent: '#FF6B35',
  },
  {
    id: 'ruby-crimson',
    label: 'یاقوتی و طلایی',
    primary: '#7F1D1D',
    secondary: '#D97706',
    accent: '#E11D48',
  },
  {
    id: 'emerald-luxury',
    label: 'زمردی و کهربایی',
    primary: '#064E3B',
    secondary: '#10B981',
    accent: '#F59E0B',
  },
  {
    id: 'royal-cobalt',
    label: 'آبی لاجوردی و نارنجی',
    primary: '#1E3A8A',
    secondary: '#0EA5E9',
    accent: '#F97316',
  },
  {
    id: 'amethyst-modern',
    label: 'بنفش مدرن و مرجانی',
    primary: '#3B0764',
    secondary: '#8B5CF6',
    accent: '#EC4899',
  },
  {
    id: 'obsidian-gold',
    label: 'ذغالی لوکس و طلایی',
    primary: '#18181B',
    secondary: '#CA8A04',
    accent: '#EA580C',
  },
];

function hexToRgbTriplet(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function adjustRgb([r, g, b]: [number, number, number], delta: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `${clamp(r + delta)} ${clamp(g + delta)} ${clamp(b + delta)}`;
}

export function applyThemeCssVars(primary: string, secondary: string, accent: string) {
  if (typeof document === 'undefined') return;
  const p = hexToRgbTriplet(primary) ?? [15, 42, 67];
  const s = hexToRgbTriplet(secondary) ?? [18, 181, 165];
  const a = hexToRgbTriplet(accent) ?? [255, 107, 53];

  const root = document.documentElement;
  root.style.setProperty('--color-primary', `${p[0]} ${p[1]} ${p[2]}`);
  root.style.setProperty('--color-primary-light', adjustRgb(p, 28));
  root.style.setProperty('--color-primary-dark', adjustRgb(p, -18));
  root.style.setProperty('--color-secondary', `${s[0]} ${s[1]} ${s[2]}`);
  root.style.setProperty('--color-secondary-light', adjustRgb(s, 32));
  root.style.setProperty('--color-secondary-dark', adjustRgb(s, -26));
  root.style.setProperty('--color-accent', `${a[0]} ${a[1]} ${a[2]}`);
  root.style.setProperty('--color-accent-light', adjustRgb(a, 28));
  root.style.setProperty('--color-accent-dark', adjustRgb(a, -24));
}

interface BrandingState {
  brandName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroSlides: HeroSlideItem[];
  supportPhone: string;
}

interface BrandingContextValue extends BrandingState {
  refreshBranding: () => Promise<void>;
  previewBranding: (patch: Partial<BrandingState>) => void;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BrandingState>({
    brandName: 'نودهی',
    tagline: 'لوازم خانگی اصیل',
    logoUrl: '',
    primaryColor: '#0F2A43',
    secondaryColor: '#12B5A5',
    accentColor: '#FF6B35',
    heroSlides: DEFAULT_HERO_SLIDES_SPA,
    supportPhone: '021-91000000',
  });

  const refreshBranding = useCallback(async () => {
    try {
      const res = await api.getPublicSettings();
      if (res.ok && res.settings) {
        const s = res.settings;
        let parsedSlides = DEFAULT_HERO_SLIDES_SPA;
        const rawSlides = s.hero_slides || s['pages.hero.slides'];
        if (rawSlides) {
          try {
            const arr = typeof rawSlides === 'string' ? JSON.parse(rawSlides) : rawSlides;
            if (Array.isArray(arr) && arr.length > 0) {
              parsedSlides = arr;
            }
          } catch {
            // fallback
          }
        }

        const next: BrandingState = {
          brandName: s.brand_name || s['site.brandName'] || 'نودهی',
          tagline: s.tagline || s['site.tagline'] || 'لوازم خانگی اصیل',
          logoUrl: s.logo_url || s['site.logoUrl'] || '',
          primaryColor: s.primary_color || s['site.primaryColor'] || '#0F2A43',
          secondaryColor: s.secondary_color || s['site.secondaryColor'] || '#12B5A5',
          accentColor: s.accent_color || s['site.accentColor'] || '#FF6B35',
          heroSlides: parsedSlides,
          supportPhone: s.phone || s['site.supportPhone'] || '021-91000000',
        };
        setState(next);
        applyThemeCssVars(next.primaryColor, next.secondaryColor, next.accentColor);
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    void refreshBranding();
  }, [refreshBranding]);

  const previewBranding = useCallback((patch: Partial<BrandingState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      applyThemeCssVars(next.primaryColor, next.secondaryColor, next.accentColor);
      return next;
    });
  }, []);

  return (
    <BrandingContext.Provider value={{ ...state, refreshBranding, previewBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    return {
      brandName: 'نودهی',
      tagline: 'لوازم خانگی اصیل',
      logoUrl: '',
      primaryColor: '#0F2A43',
      secondaryColor: '#12B5A5',
      accentColor: '#FF6B35',
      heroSlides: DEFAULT_HERO_SLIDES_SPA,
      supportPhone: '021-91000000',
      refreshBranding: async () => {},
      previewBranding: () => {},
    };
  }
  return ctx;
}
