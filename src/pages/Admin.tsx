import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Package, 
  Save, 
  Server,
  Palette,
  Image as ImageIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useBranding,
  COLOR_PRESETS_SPA,
  DEFAULT_HERO_SLIDES_SPA,
  type HeroSlideItem,
} from '../context/BrandingContext';
import { api } from '../lib/api';
import { formatPrice, toPersianDigits } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';

async function compressImageFile(file: File, maxW: number, maxH: number): Promise<string> {
  if (file.type === 'image/svg+xml' && file.size < 250000) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('خطا در خواندن فایل SVG'));
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width || maxW;
        let h = img.height || maxH;
        const r = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * r);
        h = Math.round(h * r);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.85));
      };
      img.onerror = () => reject(new Error('فرمت تصویر معتبر نیست'));
      img.src = String(reader.result || '');
    };
    reader.onerror = () => reject(new Error('خطا در خواندن تصویر'));
    reader.readAsDataURL(file);
  });
}

export const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const branding = useBranding();

  const [stats, setStats] = useState<any>({
    totalOrders: 18,
    totalRevenue: 245000000,
    pendingOrders: 3,
    totalProducts: 23,
    outOfStock: 2,
    totalUsers: 42,
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const initialTab = searchParams.get('tab') === 'appearance' ? 'appearance' : 'appearance';
  const [activeTab, setActiveTab] = useState<'appearance' | 'overview' | 'products'>(initialTab);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Appearance Studio State
  const [brandName, setBrandName] = useState(branding.brandName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor);
  const [accentColor, setAccentColor] = useState(branding.accentColor);
  const [slides, setSlides] = useState<HeroSlideItem[]>(
    branding.heroSlides.length > 0 ? branding.heroSlides : DEFAULT_HERO_SLIDES_SPA
  );
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [appearanceMsg, setAppearanceMsg] = useState<string | null>(null);
  const [appearanceErr, setAppearanceErr] = useState<string | null>(null);

  useEffect(() => {
    setBrandName(branding.brandName);
    setTagline(branding.tagline);
    setLogoUrl(branding.logoUrl);
    setPrimaryColor(branding.primaryColor);
    setSecondaryColor(branding.secondaryColor);
    setAccentColor(branding.accentColor);
    if (branding.heroSlides.length > 0) setSlides(branding.heroSlides);
  }, [
    branding.brandName,
    branding.tagline,
    branding.logoUrl,
    branding.primaryColor,
    branding.secondaryColor,
    branding.accentColor,
    branding.heroSlides,
  ]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    async function loadAdminData() {
      try {
        const [dashRes, ordersRes, prodsRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getAdminOrders(),
          api.getProducts({ perPage: 24 }),
        ]);

        if (dashRes.ok && dashRes.stats) setStats(dashRes.stats);
        if (ordersRes.ok && ordersRes.orders) setOrders(ordersRes.orders);
        if (prodsRes.ok && prodsRes.products) setProducts(prodsRes.products);
      } catch (err) {
        console.error('Admin data load', err);
      }
    }

    loadAdminData();
  }, [isAdmin, navigate]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await api.updateAdminOrderStatus(orderId, newStatus);
      if (res.ok) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      }
    } catch {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } finally {
      setUpdatingId(null);
    }
  };

  const applyColorsLive = (p: string, s: string, a: string) => {
    setPrimaryColor(p);
    setSecondaryColor(s);
    setAccentColor(a);
    branding.previewBranding({ primaryColor: p, secondaryColor: s, accentColor: a });
  };

  const currentSlide = slides[activeSlideIdx] ?? slides[0];

  const updateSlide = (patch: Partial<HeroSlideItem>) => {
    const next = slides.map((item, i) => (i === activeSlideIdx ? { ...item, ...patch } : item));
    setSlides(next);
    branding.previewBranding({ heroSlides: next });
  };

  const handleSaveAppearance = async () => {
    setSavingAppearance(true);
    setAppearanceMsg(null);
    setAppearanceErr(null);
    try {
      const res = await api.updateAdminSettings({
        brand_name: brandName.trim() || 'نودهی',
        tagline: tagline.trim() || 'لوازم خانگی اصیل',
        logo_url: logoUrl.trim(),
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        hero_slides: JSON.stringify(slides),
      });
      if (!res.ok) {
        setAppearanceErr(res.error?.message || 'خطا در ذخیره تنظیمات');
        return;
      }
      await branding.refreshBranding();
      setAppearanceMsg('تم رنگی، لوگو و عکس‌های اسلایدشو با موفقیت در دیتابیس MongoDB ذخیره و در کل سایت اعمال شدند.');
    } catch {
      setAppearanceErr('خطا در ارتباط با سرور');
    } finally {
      setSavingAppearance(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs items={[{ label: 'پنل مدیریت فروشگاه نودهی' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            داشبورد مدیریت و استودیو طراحی فروشگاه
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تغییر لوگو، رنگ بصری اصلی سایت، عکس‌های اسلایدشو صفحه اصلی، مدیریت سفارش‌ها و موجودی کالاها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-secondary text-xs font-bold flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            بک‌اند Laravel ۱۲ + MongoDB (NoSQL) فعال
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>کل فروش</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-800">
            {formatPrice(stats.totalRevenue)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>کل سفارش‌ها</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-800">
            {toPersianDigits(stats.totalOrders)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>در انتظار پردازش</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600">
            {toPersianDigits(stats.pendingOrders)} سفارش
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>کالاهای فعال</span>
            <Package className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-xl font-black text-slate-800">
            {toPersianDigits(stats.totalProducts)} مدل
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'appearance'
              ? 'border-secondary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          طراحی ظاهر، لوگو، رنگ و اسلایدشو
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-secondary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          سفارش‌های جدید ({toPersianDigits(orders.length)})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'products'
              ? 'border-secondary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          مدیریت موجودی و قیمت ({toPersianDigits(products.length)})
        </button>
      </div>

      {/* Tab 0: Appearance Studio (Logo, Primary Color, Hero Slideshow Images) */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                تنظیمات لوگوی سایت، رنگ بصری اصلی و عکس‌های اسلایدشو صفحه اصلی
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                تغییرات به صورت زنده روی سایت پیش‌نمایش داده می‌شوند. پس از پایان، دکمه ذخیره را بزنید.
              </p>
            </div>
            <button
              type="button"
              disabled={savingAppearance}
              onClick={handleSaveAppearance}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingAppearance ? 'در حال ذخیره...' : 'ذخیره تغییرات ظاهر و اسلایدشو'}</span>
            </button>
          </div>

          {appearanceMsg && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700">
              ✓ {appearanceMsg}
            </div>
          )}
          {appearanceErr && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700">
              {appearanceErr}
            </div>
          )}

          {/* Row 1: Logo & Colors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-800">۱. لوگو و هویت برند</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام برند در هدر</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => {
                      setBrandName(e.target.value);
                      branding.previewBranding({ brandName: e.target.value });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شعار زیر لوگو</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => {
                      setTagline(e.target.value);
                      branding.previewBranding({ tagline: e.target.value });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">آدرس تصویر لوگو یا آپلود فایل</label>
                <input
                  type="text"
                  dir="ltr"
                  value={logoUrl.startsWith('data:') ? 'فایل تصویر آپلود شده از دستگاه' : logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    branding.previewBranding({ logoUrl: e.target.value });
                  }}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-left"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white hover:bg-primary-light">
                    📤 انتخاب فایل لوگو از دستگاه
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const dataUrl = await compressImageFile(f, 360, 140);
                        setLogoUrl(dataUrl);
                        branding.previewBranding({ logoUrl: dataUrl });
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        branding.previewBranding({ logoUrl: '' });
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      حذف و بازگشت به لوگوی پیش‌فرض
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Color Theme Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-800">۲. رنگ بصری اصلی سایت</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS_SPA.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyColorsLive(preset.primary, preset.secondary, preset.accent)}
                    className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-right hover:border-primary transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800">{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">رنگ اصلی</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => applyColorsLive(e.target.value, secondaryColor, accentColor)}
                      className="h-7 w-8 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[11px] font-mono">{primaryColor}</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">رنگ مکمل</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => applyColorsLive(primaryColor, e.target.value, accentColor)}
                      className="h-7 w-8 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[11px] font-mono">{secondaryColor}</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">رنگ تأکیدی</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => applyColorsLive(primaryColor, secondaryColor, e.target.value)}
                      className="h-7 w-8 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[11px] font-mono">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Hero Slideshow Image & Content Manager */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>۳. مدیریت اسلایدشو صفحه اصلی (با قابلیت گذاشتن عکس)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  برای هر اسلاید عکس دلخواه آپلود کنید یا لینک تصویر قرار دهید.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next: HeroSlideItem[] = [
                      ...slides,
                      {
                        id: `slide-${Date.now()}`,
                        eyebrow: 'پیشنهاد ویژه جدید',
                        title: 'عنوان اسلاید جدید',
                        description: 'توضیح کوتاه اسلاید تبلیغاتی صفحه اصلی',
                        primary: { href: '/shop', label: 'مشاهده محصولات' },
                        secondary: { href: '/loyalty', label: 'خرید اقساطی' },
                        background: 'from-primary via-primary-light to-primary-dark',
                        bullets: ['ضمانت اصالت', 'ارسال سریع'],
                        image: '/images/slides/slide-refrigerator.svg',
                        imageMode: 'split',
                      },
                    ];
                    setSlides(next);
                    setActiveSlideIdx(next.length - 1);
                    branding.previewBranding({ heroSlides: next });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-primary hover:border-primary flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن اسلاید</span>
                </button>
                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = slides.filter((_, i) => i !== activeSlideIdx);
                      setSlides(next);
                      setActiveSlideIdx(Math.max(0, activeSlideIdx - 1));
                      branding.previewBranding({ heroSlides: next });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف اسلاید</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    idx === activeSlideIdx
                      ? 'bg-primary text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  اسلاید {toPersianDigits(idx + 1)}: {s.eyebrow}
                </button>
              ))}
            </div>

            {currentSlide && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">روتیتر اسلاید</label>
                      <input
                        type="text"
                        value={currentSlide.eyebrow}
                        onChange={(e) => updateSlide({ eyebrow: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">حالت نمایش عکس</label>
                      <select
                        value={currentSlide.imageMode || 'split'}
                        onChange={(e) =>
                          updateSlide({ imageMode: e.target.value as 'split' | 'cover' | 'icon' })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        <option value="split">قاب عکس کنار متن (پیشنهادی)</option>
                        <option value="cover">تصویر تمام‌صفحه پس‌زمینه</option>
                        <option value="icon">بدون عکس (فقط آیکون)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عنوان اصلی اسلاید</label>
                    <input
                      type="text"
                      value={currentSlide.title}
                      onChange={(e) => updateSlide({ title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات اسلاید</label>
                    <textarea
                      rows={2}
                      value={currentSlide.description}
                      onChange={(e) => updateSlide({ description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-white p-3.5 space-y-2.5">
                    <span className="block text-xs font-bold text-slate-800">🖼️ تصویر اسلاید</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white hover:bg-primary-light">
                        📷 آپلود عکس اسلاید از دستگاه
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const dataUrl = await compressImageFile(f, 1100, 680);
                            updateSlide({ image: dataUrl, imageMode: 'split' });
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => updateSlide({ image: '/images/slides/slide-refrigerator.svg', imageMode: 'split' })}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px]"
                      >
                        بنر یخچال
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSlide({ image: '/images/slides/slide-washer.svg', imageMode: 'split' })}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px]"
                      >
                        بنر لباسشویی
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSlide({ image: '/images/slides/slide-kitchen.svg', imageMode: 'split' })}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px]"
                      >
                        بنر آشپزخانه
                      </button>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={
                        currentSlide.image?.startsWith('data:')
                          ? 'تصویر آپلود شده از دستگاه'
                          : currentSlide.image || ''
                      }
                      onChange={(e) => updateSlide({ image: e.target.value })}
                      placeholder="https://example.com/slide.jpg"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-left"
                    />
                  </div>
                </div>

                {/* Live Slide Preview */}
                <div className="rounded-2xl bg-gradient-to-l from-primary via-primary-light to-primary-dark text-white p-5 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2">
                    <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[10px]">
                      {currentSlide.eyebrow}
                    </span>
                    <h4 className="text-base font-black">{currentSlide.title}</h4>
                    <p className="text-xs text-white/80 line-clamp-2">{currentSlide.description}</p>
                  </div>
                  {currentSlide.image && currentSlide.imageMode !== 'icon' && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/20 bg-white/10 p-1.5">
                      <img
                        src={currentSlide.image}
                        alt={currentSlide.title}
                        className="aspect-[16/10] w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Orders Table */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">شماره سفارش</th>
                  <th className="p-4">خریدار</th>
                  <th className="p-4">موبایل</th>
                  <th className="p-4">مبلغ کل</th>
                  <th className="p-4">روش پرداخت</th>
                  <th className="p-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      سفارشی در سیستم موجود نیست.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary">{o.order_number}</td>
                      <td className="p-4 font-semibold text-slate-800">{o.customer_name}</td>
                      <td className="p-4 font-mono text-slate-600">{toPersianDigits(o.phone)}</td>
                      <td className="p-4 font-bold text-slate-800">{formatPrice(o.total)}</td>
                      <td className="p-4 text-slate-600">{o.payment_method}</td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          disabled={updatingId === o.id}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-secondary/20"
                        >
                          <option value="PENDING">در انتظار بررسی</option>
                          <option value="PROCESSING">در حال پردازش</option>
                          <option value="SHIPPED">ارسال شده</option>
                          <option value="DELIVERED">تحویل نهایی</option>
                          <option value="CANCELLED">لغو شده</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Products Quick Editor */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">کالا</th>
                  <th className="p-4">برند</th>
                  <th className="p-4">قیمت فعلی</th>
                  <th className="p-4">موجودی انبار</th>
                  <th className="p-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnail || '/icon.svg'}
                          alt=""
                          className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100 shrink-0"
                        />
                        <span className="font-bold text-slate-800 line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{p.brand?.name_fa || p.brand?.name}</td>
                    <td className="p-4 font-bold text-primary">{formatPrice(p.price)}</td>
                    <td className="p-4">
                      <span
                        className={`font-bold ${
                          (p.stock ?? 1) > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {toPersianDigits(p.stock ?? 10)} عدد
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        فعال در سایت
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
