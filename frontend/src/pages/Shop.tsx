import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Search, 
  SlidersHorizontal, 
  Check, 
  Zap, 
  Truck, 
  CreditCard, 
  Percent 
} from 'lucide-react';
import { api } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { toPersianDigits, formatPrice } from '../lib/format';

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, lastPage: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Read URL query params
  const q = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inverter = searchParams.get('inverter') === '1';
  const installment = searchParams.get('installment') === '1';
  const ready = searchParams.get('ready') === '1';
  const instock = searchParams.get('instock') === '1';
  const discounted = searchParams.get('discounted') === '1';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Load Categories & Brands once
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.getCategories(),
          api.getBrands(),
        ]);
        if (catRes.ok) setCategories(catRes.categories || []);
        if (brandRes.ok) setBrands(brandRes.brands || []);
      } catch (err) {
        console.error('Filter meta error', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch products whenever params change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await api.getProducts({
          q: q || undefined,
          category: currentCategory || undefined,
          brand: currentBrand || undefined,
          sort: currentSort,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          inverter: inverter ? 1 : undefined,
          installment: installment ? 1 : undefined,
          ready: ready ? 1 : undefined,
          instock: instock ? 1 : undefined,
          discounted: discounted ? 1 : undefined,
          page,
          perPage: 12,
        });

        if (res.ok) {
          setProducts(res.products || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        console.error('Error fetching products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === '0') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // reset to page 1 on filter change
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const toggleBooleanParam = (key: string) => {
    const isSet = searchParams.get(key) === '1';
    updateParam(key, isSet ? null : '1');
  };

  const resetAllFilters = () => {
    setSearchParams({});
  };

  const sortOptions = [
    { id: 'newest', label: 'جدیدترین' },
    { id: 'popular', label: 'محبوب‌ترین' },
    { id: 'price-asc', label: 'ارزان‌ترین' },
    { id: 'price-desc', label: 'گران‌ترین' },
    { id: 'rating', label: 'بیشترین امتیاز' },
  ];

  return (
    <div className="max-w-container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: 'فروشگاه لوازم خانگی' },
          ...(currentCategory ? [{ label: currentCategory }] : []),
        ]}
      />

      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            فهرست لوازم خانگی
            {q && <span className="text-sm font-normal text-slate-500 mr-2">(جستجو: «{q}»)</span>}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            نمایش {toPersianDigits(products.length)} کالا از مجموع {toPersianDigits(pagination.total)} کالا
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 text-primary" />
            <span>فیلترها</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">مرتب‌سازی:</span>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                فیلترهای پیشرفته
              </span>
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-500 hover:underline font-medium"
              >
                پاک کردن همه
              </button>
            </div>

            {/* Quick Switch Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-secondary" />
                  فقط کالاهای آماده ارسال
                </span>
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={() => toggleBooleanParam('ready')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  امکان خرید اقساطی
                </span>
                <input
                  type="checkbox"
                  checked={installment}
                  onChange={() => toggleBooleanParam('installment')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-accent" />
                  فقط کالاهای تخفیف‌دار
                </span>
                <input
                  type="checkbox"
                  checked={discounted}
                  onChange={() => toggleBooleanParam('discounted')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  موتور اینورتر کم‌مصرف
                </span>
                <input
                  type="checkbox"
                  checked={inverter}
                  onChange={() => toggleBooleanParam('inverter')}
                  className="rounded text-secondary focus:ring-secondary h-4 w-4"
                />
              </label>
            </div>

            {/* Categories Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-800 mb-3">دسته‌بندی‌ها</h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <button
                  onClick={() => updateParam('category', null)}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !currentCategory
                      ? 'bg-primary text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  همه دسته‌بندی‌ها
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => updateParam('category', c.slug)}
                    className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      currentCategory === c.slug
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {c.name_fa || c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-800 mb-3">برندهای سازنده</h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <button
                  onClick={() => updateParam('brand', null)}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !currentBrand
                      ? 'bg-primary text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  همه برندها
                </button>
                {brands.map((b) => (
                  <button
                    key={b.slug}
                    onClick={() => updateParam('brand', b.slug)}
                    className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      currentBrand === b.slug
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {b.name_fa || b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">کالایی با این مشخصات یافت نشد</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                لطفاً کلمات جستجو را تغییر دهید یا برخی از فیلترهای اعمال‌شده را حذف فرمایید.
              </p>
              <button
                onClick={resetAllFilters}
                className="mt-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-light"
              >
                مشاهده همه محصولات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
              {[...Array(pagination.lastPage)].map((_, idx) => {
                const pageNum = idx + 1;
                const active = page === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateParam('page', String(pageNum))}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                      active
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {toPersianDigits(pageNum)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
