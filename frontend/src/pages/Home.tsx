import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  CreditCard, 
  Flame, 
  CheckCircle2,
  Settings
} from 'lucide-react';
import { api } from '../lib/api';
import { useBranding, DEFAULT_HERO_SLIDES_SPA } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { ArticleCard } from '../components/ArticleCard';
import { toPersianDigits } from '../lib/format';

export const Home: React.FC = () => {
  const { heroSlides } = useBranding();
  const { isAdmin } = useAuth();
  const slides = heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES_SPA;

  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, discRes, brandRes, artRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ perPage: 8, sort: 'popular' }),
          api.getProducts({ perPage: 4, discounted: 1 }),
          api.getBrands(),
          api.getArticles({ limit: 3 }),
        ]);

        if (catRes.ok) setCategories(catRes.categories || []);
        if (prodRes.ok) setFeaturedProducts(prodRes.products || []);
        if (discRes.ok) setDiscountedProducts(discRes.products || []);
        if (brandRes.ok) setBrands(brandRes.brands || []);
        if (artRes.ok) setArticles(artRes.articles || []);
      } catch (err) {
        console.error('Home load error', err);
      }
    }
    loadData();
  }, []);

  const defaultCategories = [
    { name_fa: 'یخچال و ساید بای ساید', slug: 'refrigerator', icon: '❄️', count: '۱۲ مدل' },
    { name_fa: 'ماشین لباسشویی', slug: 'washer', icon: '🧺', count: '۸ مدل' },
    { name_fa: 'ماشین ظرفشویی', slug: 'dishwasher', icon: '🍽️', count: '۶ مدل' },
    { name_fa: 'تلویزیون و صوتی', slug: 'tv', icon: '📺', count: '۹ مدل' },
    { name_fa: 'کولر گازی و اسپلیت', slug: 'air-conditioner', icon: '💨', count: '۷ مدل' },
    { name_fa: 'جاروبرقی و نظافت', slug: 'vacuum', icon: '🧹', count: '۵ مدل' },
    { name_fa: 'فر، هود و اجاق گاز', slug: 'oven', icon: '🍳', count: '۴ مدل' },
    { name_fa: 'لوازم خرد آشپزخانه', slug: 'small-appliance', icon: '☕', count: '۱۵ مدل' },
  ];

  const displayCats = categories.length > 0 ? categories : defaultCategories;
  const safeIdx = slideIndex % slides.length;
  const activeSlide = slides[safeIdx] ?? slides[0];
  const hasImage = Boolean(activeSlide?.image && activeSlide.image.trim().length > 0);
  const imageMode = activeSlide?.imageMode ?? (hasImage ? 'split' : 'icon');

  const goToSlide = (next: number) => {
    setSlideIndex(((next % slides.length) + slides.length) % slides.length);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Interactive Hero Slideshow Section with Image Support */}
      <div className="max-w-container mx-auto px-4 pt-6">
        <section
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-l ${
            activeSlide.background || 'from-primary via-primary-light to-primary-dark'
          } text-white p-6 sm:p-10 lg:p-14 shadow-xl transition-colors duration-500`}
        >
          {/* Full-bleed cover image mode */}
          {hasImage && imageMode === 'cover' ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <img
                src={activeSlide.image}
                alt=""
                className="h-full w-full object-cover object-center opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-slate-950/85 via-slate-950/65 to-slate-950/40" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          )}

          {isAdmin && (
            <Link
              to="/admin?tab=appearance"
              className="absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-xl bg-black/35 hover:bg-black/55 border border-white/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ویرایش اسلایدشو، عکس و رنگ سایت</span>
            </Link>
          )}

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs text-white font-semibold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-secondary-light" />
                <span>{activeSlide.eyebrow}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[2.5rem] font-black tracking-tight leading-[1.35]">
                {activeSlide.title}
              </h1>

              <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-xl">
                {activeSlide.description}
              </p>

              {activeSlide.bullets && activeSlide.bullets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeSlide.bullets.map((b) => (
                    <span
                      key={b}
                      className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-white/95 backdrop-blur"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-secondary-light" />
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={activeSlide.primary?.href || '/shop'}
                  className="px-6 py-3.5 rounded-xl bg-white text-primary hover:bg-white/90 font-bold text-sm shadow-lg flex items-center gap-2 transition-all"
                >
                  <span>{activeSlide.primary?.label || 'مشاهده محصولات'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link
                  to={activeSlide.secondary?.href || '/loyalty'}
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/30 backdrop-blur-md flex items-center gap-2 transition-all"
                >
                  <CreditCard className="w-4 h-4 text-secondary-light" />
                  <span>{activeSlide.secondary?.label || 'خرید اقساطی'}</span>
                </Link>
              </div>
            </div>

            {/* Slide Image / Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              {hasImage && imageMode !== 'cover' ? (
                <div className="relative w-full max-w-md rounded-3xl bg-white/10 p-2.5 border border-white/20 backdrop-blur-md shadow-2xl">
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-900/30">
                    <img
                      src={activeSlide.image}
                      alt={activeSlide.title}
                      className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                  {activeSlide.bullets?.[0] && (
                    <div className="absolute bottom-5 right-5 bg-white/95 text-primary px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md">
                      ✓ {activeSlide.bullets[0]}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-64 h-64 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col justify-center items-center text-center shadow-2xl">
                  <span className="text-7xl">❄️</span>
                  {activeSlide.bullets?.[0] && (
                    <span className="mt-4 bg-white/95 text-primary px-3 py-1 rounded-xl text-xs font-bold">
                      {activeSlide.bullets[0]}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Slideshow Controls */}
          <div className="relative z-10 mt-8 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={s.eyebrow}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === safeIdx ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToSlide(safeIdx + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 text-white hover:bg-white/15 transition-colors"
                aria-label="اسلاید بعدی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(safeIdx - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 text-white hover:bg-white/15 transition-colors"
                aria-label="اسلاید قبلی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/75 mr-1">
                {toPersianDigits(safeIdx + 1)} / {toPersianDigits(slides.length)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Category Grid Section */}
      <section className="max-w-container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">دسته‌بندی‌های لوازم خانگی</h2>
            <p className="text-xs text-slate-500 mt-1">تجهیزات مدرن متناسب با نیاز هر خانه</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-secondary hover:text-teal-700 flex items-center gap-1">
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {displayCats.map((cat, idx) => (
            <Link
              key={cat.slug || idx}
              to={`/shop?category=${cat.slug}`}
              className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-secondary hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-2xl transition-colors">
                {cat.icon || '📦'}
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-primary line-clamp-1 transition-colors">
                {cat.name_fa || cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Special Offers Section */}
      {discountedProducts.length > 0 && (
        <section className="max-w-container mx-auto px-4">
          <div className="bg-gradient-to-r from-accent/10 via-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-accent/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800">پیشنهادات شگفت‌انگیز نودهی</h2>
                  <p className="text-xs text-slate-600 mt-0.5">تخفیف‌های استثنایی با موجودی محدود</p>
                </div>
              </div>
              <Link
                to="/shop?discounted=1"
                className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-light transition-colors"
              >
                مشاهده همه تخفیف‌ها
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {discountedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="max-w-container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">محبوب‌ترین کالاهای بازار</h2>
            <p className="text-xs text-slate-500 mt-1">برترین مدل‌های منتخب خریداران نودهی</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-secondary hover:text-teal-700 flex items-center gap-1">
            مشاهده همه محصولات
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Installment Banner */}
      <section className="max-w-container mx-auto px-4">
        <div className="bg-primary text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-right max-w-xl">
            <span className="px-3 py-1 rounded-full bg-secondary text-primary font-bold text-xs inline-block">
              طرح ویژه اقساطی
            </span>
            <h3 className="text-2xl font-black">خرید اقساطی لوازم خانگی بدون چک و ضامن</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              با همکاری سرویس اسنپ‌پی، می‌توانید لوازم خانگی مورد نظرتان را در ۴ قسط بدون سود و کارمزد خریداری کنید. قسط اول را امروز بپردازید و مابقی را در ماه‌های آینده تسویه نمایید.
            </p>
          </div>
          <Link
            to="/loyalty"
            className="px-6 py-3.5 bg-secondary text-primary font-bold text-sm rounded-xl hover:bg-secondary-light transition-all shrink-0"
          >
            مشاهده شرایط و محاسبه اقساط
          </Link>
        </div>
      </section>

      {/* Brands Strip */}
      <section className="max-w-container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-slate-800">برندهای برتر جهانی و داخلی</h2>
          <p className="text-xs text-slate-500 mt-1">تضمین اصالت کالا و تأمین قطعات از نمایندگی‌های مجاز</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {(brands.length > 0 ? brands : [
            { name: 'سامسونگ', name_fa: 'سامسونگ', slug: 'samsung' },
            { name: 'ال‌جی', name_fa: 'ال‌جی', slug: 'lg' },
            { name: 'بوش', name_fa: 'بوش', slug: 'bosch' },
            { name: 'دوو', name_fa: 'دوو', slug: 'daewoo' },
            { name: 'اسنوا', name_fa: 'اسنوا', slug: 'snowa' },
            { name: 'فیلیپس', name_fa: 'فیلیپس', slug: 'philips' },
            { name: 'پاناسونیک', name_fa: 'پاناسونیک', slug: 'panasonic' },
            { name: 'سونی', name_fa: 'سونی', slug: 'sony' },
          ]).map((b, idx) => (
            <Link
              key={b.slug || idx}
              to={`/shop?brand=${b.slug}`}
              className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-secondary hover:shadow-sm text-center flex flex-col items-center justify-center gap-1 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-primary text-xs">
                {b.name_fa ? b.name_fa[0] : 'B'}
              </div>
              <span className="text-xs font-semibold text-slate-700">{b.name_fa || b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Blog & Guides */}
      {articles.length > 0 && (
        <section className="max-w-container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">راهنماهای تخصصی و مقالات</h2>
              <p className="text-xs text-slate-500 mt-1">نکات کلیدی برای انتخاب دقیق‌تر لوازم خانه</p>
            </div>
            <Link to="/blog" className="text-xs font-bold text-secondary hover:text-teal-700 flex items-center gap-1">
              مشاهده وبلاگ
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
