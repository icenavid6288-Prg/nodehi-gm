import type { Metadata, Viewport } from 'next'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Toast } from '@/components/layout/toast'
import { CompareBar } from '@/components/product/compare-bar'
import { AuthProvider } from '@/components/providers/auth-provider'
import { BrandingProvider } from '@/components/providers/branding-provider'
import { CatalogMetaProvider } from '@/components/providers/catalog-provider'
import { StoreProvider } from '@/components/providers/store-provider'
import { ServiceWorkerRegistrar } from '@/components/pwa/service-worker-registrar'
import { JsonLd } from '@/components/seo/json-ld'
import { brand } from '@/config/brand'
import { organizationSchema, storeSchema, websiteSchema } from '@/lib/seo'
import { getCatalogMeta } from '@/lib/server/catalog'
import { getPublicSettings } from '@/lib/server/settings'
import { buildThemeCssVariables } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} | ${brand.tagline}`,
    /** قالب عنوان برای همه صفحات — برند همیشه در انتهای عنوان می‌آید */
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'لوازم خانگی',
    'خرید لوازم خانگی',
    'فروشگاه لوازم خانگی',
    'یخچال',
    'ماشین لباسشویی',
    'ماشین ظرفشویی',
    'تلویزیون',
    'کولر گازی',
    'جاروبرقی',
    'نودهی',
  ],
  authors: [{ name: brand.name, url: brand.url }],
  creator: brand.name,
  publisher: brand.name,
  formatDetection: { telephone: true, address: true, email: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: brand.name,
    url: brand.url,
    title: `${brand.name} | ${brand.tagline}`,
    description: brand.description,
    images: [{ url: '/og-default.svg', width: 1200, height: 630, alt: brand.name }],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F2A43' },
    { media: '(prefers-color-scheme: dark)', color: '#0F2A43' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // فرادادهٔ کاتالوگ و تنظیمات عمومی یک‌بار در پوسته خوانده می‌شوند
  const [catalogMeta, publicSettings] = await Promise.all([
    getCatalogMeta(),
    getPublicSettings(),
  ])

  const themeVars = buildThemeCssVariables({
    primary: publicSettings['site.primaryColor'],
    secondary: publicSettings['site.secondaryColor'],
    accent: publicSettings['site.accentColor'],
  })

  return (
    <html lang="fa" dir="rtl" style={themeVars as React.CSSProperties}>
      <body>
        {/* لینک پرش به محتوا — اولین عنصر قابل فوکوس برای کاربران کیبورد */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          پرش به محتوای اصلی
        </a>

        <JsonLd id="schema-organization" data={organizationSchema()} />
        <JsonLd id="schema-website" data={websiteSchema()} />
        <JsonLd id="schema-store" data={storeSchema()} />

        <BrandingProvider initialSettings={publicSettings}>
          <AuthProvider>
            <StoreProvider>
              <CatalogMetaProvider meta={catalogMeta}>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main id="main" className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </div>
                {/* نوار شناور مقایسه و پیام‌های کوتاه */}
                <CompareBar />
                <Toast />
              </CatalogMetaProvider>
              <ServiceWorkerRegistrar />
            </StoreProvider>
          </AuthProvider>
        </BrandingProvider>
      </body>
    </html>
  )
}
