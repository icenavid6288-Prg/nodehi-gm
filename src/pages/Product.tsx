import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Star, 
  Zap, 
  ShoppingCart, 
  Check, 
  Bell, 
  MessageSquare, 
  Clock, 
  Share2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { formatPrice, toPersianDigits } from '../lib/format';

export const Product: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');

  // Review form states
  const [authorName, setAuthorName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Stock alert modal
  const [alertPhone, setAlertPhone] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.getProduct(slug);
        if (res.ok && res.product) {
          setProduct(res.product);
          setRelated(res.related || []);
          setReviews(res.reviews || []);
          const firstImg = res.product.thumbnail || (res.product.images && res.product.images[0]) || '/icon.svg';
          setActiveImage(firstImg);
          if (res.product.colors && res.product.colors.length > 0) {
            setSelectedColor(res.product.colors[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching product', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">در حال بارگذاری مشخصات کالا...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">محصول مورد نظر یافت نشد</h2>
        <Link to="/shop" className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  const isOutOfStock = (product.stock ?? 1) <= 0;
  const discountPercent =
    product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : 0;

  const installmentAmount = Math.round(product.price / 4);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !reviewComment.trim()) return;

    try {
      const res = await api.submitReview(product.slug, {
        author_name: authorName,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.ok) {
        setReviewSuccess('دیدگاه شما با موفقیت ثبت شد و پس از تأیید مدیر نمایش داده خواهد شد.');
        setAuthorName('');
        setReviewComment('');
        setReviewTitle('');
      }
    } catch (err) {
      console.error('Submit review error', err);
    }
  };

  const handleStockAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertPhone.trim()) return;

    try {
      const res = await api.submitStockAlert({
        product_id: product.id,
        phone: alertPhone,
      });
      if (res.ok) {
        setAlertSuccess('شماره شما با موفقیت ثبت شد. به محض موجود شدن کالا، پیامک ارسال می‌شود.');
        setTimeout(() => setShowAlertModal(false), 2500);
      }
    } catch (err) {
      console.error('Stock alert error', err);
    }
  };

  const allImages = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...(Array.isArray(product.images) ? product.images : []),
  ];
  const uniqueImages = Array.from(new Set(allImages));

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-10">
      <Breadcrumbs
        items={[
          { label: 'فروشگاه لوازم خانگی', to: '/shop' },
          ...(product.category ? [{ label: product.category.name_fa || product.category.name, to: `/shop?category=${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
        {/* Gallery Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 p-6 flex items-center justify-center overflow-hidden">
            <img
              src={activeImage || '/icon.svg'}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-all"
              onError={(e) => { (e.target as HTMLImageElement).src = '/icon.svg'; }}
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                {toPersianDigits(discountPercent)}٪ تخفیف
              </span>
            )}
          </div>

          {uniqueImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {uniqueImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 p-1 bg-white shrink-0 transition-all ${
                    activeImage === img ? 'border-secondary shadow-md' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Box */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-primary">
                  برند: {product.brand?.name_fa || product.brand?.name || 'اصیل'}
                </span>
                {product.sku && <span>کد کالا: {toPersianDigits(product.sku)}</span>}
              </div>

              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-800 text-sm">
                  {toPersianDigits(product.rating_cache || 4.8)}
                </span>
                <span className="text-slate-400 text-xs">
                  ({toPersianDigits(product.reviews_count_cache || reviews.length)} نظر)
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
              {product.name}
            </h1>
            {product.name_en && (
              <p className="text-xs text-slate-400 font-sans tracking-wide">
                {product.name_en}
              </p>
            )}

            {/* Key feature badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {product.energy_grade && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  رتبه مصرف انرژی: {product.energy_grade}
                </span>
              )}
              {product.is_inverter && (
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-secondary text-xs font-bold border border-teal-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  موتور اینورتر خطی فوق‌العاده کم‌صدا
                </span>
              )}
              {product.is_ready_to_ship && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  آماده ارسال فوری
                </span>
              )}
            </div>

            {/* Warranty reassurance */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs text-slate-700">
              <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
              <span>{product.warranty || 'دارای ۲۴ ماه گارانتی رسمی و خدمات پس از فروش در سراسر ایران'}</span>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700">انتخاب رنگ:</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        selectedColor === c
                          ? 'border-secondary bg-teal-50 text-secondary ring-2 ring-secondary/20'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Installment teaser */}
            {product.has_installment && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <CreditCard className="w-4 h-4 text-secondary" />
                  <span>خرید در ۴ قسط اسنپ‌پی:</span>
                </div>
                <span className="font-extrabold text-secondary">
                  هر قسط {formatPrice(installmentAmount)} (بدون کارمزد)
                </span>
              </div>
            )}
          </div>

          {/* Pricing & CTA Controls */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">قیمت مصرف‌کننده:</span>
              <div className="text-left">
                {product.compare_price && product.compare_price > product.price && (
                  <span className="block text-xs text-slate-400 line-through">
                    {formatPrice(product.compare_price)}
                  </span>
                )}
                <span className="text-2xl font-black text-primary">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>

            {isOutOfStock ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs text-center font-bold border border-amber-200">
                  این کالا در حال حاضر ناموجود است.
                </div>
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-light flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  موجود شد به من اطلاع بده
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-600 hover:bg-white"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black text-sm text-slate-800">
                    {toPersianDigits(quantity)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-600 hover:bg-white"
                  >
                    +
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-emerald-500 text-white'
                      : 'bg-accent hover:bg-accent-light text-white shadow-accent/20'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>به سبد اضافه شد!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>افزودن به سبد خرید</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section: Specs, Description, Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-secondary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            مشخصات فنی و ویژگی‌ها
          </button>
          <button
            onClick={() => setActiveTab('desc')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'desc'
                ? 'border-secondary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            نقد و بررسی تخصصی
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-secondary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            نظرات خریداران ({toPersianDigits(reviews.length)})
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-800 mb-4">جدول مشخصات کالا</h3>
              {product.specs && Object.keys(product.specs).length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {Object.entries(product.specs).map(([key, val], idx) => (
                    <div key={idx} className="grid grid-cols-3 p-3.5 text-xs bg-white even:bg-slate-50/60">
                      <span className="text-slate-500 font-medium">{key}</span>
                      <span className="col-span-2 font-bold text-slate-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">مشخصات فنی به زودی کامل خواهد شد.</p>
              )}
            </div>
          )}

          {activeTab === 'desc' && (
            <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
              <p>{product.description || product.short_description || 'نقد و بررسی برای این محصول ثبت نشده است.'}</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Existing Reviews */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800">دیدگاه کاربران</h4>
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400">هنوز دیدگاهی برای این کالا ثبت نشده است.</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{rev.author_name}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{toPersianDigits(rev.rating)}</span>
                        </div>
                      </div>
                      {rev.title && <h5 className="font-semibold text-xs text-slate-700">{rev.title}</h5>}
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Form */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="font-bold text-sm text-slate-800 mb-4">ثبت نظر جدید</h4>
                {reviewSuccess ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    {reviewSuccess}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4 max-w-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">نام شما</label>
                        <input
                          type="text"
                          required
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">امتیاز (۱ تا ۵)</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-secondary/20"
                        >
                          <option value={5}>۵ - عالی</option>
                          <option value={4}>۴ - خیلی خوب</option>
                          <option value={3}>۳ - معمولی</option>
                          <option value={2}>۲ - ضعیف</option>
                          <option value={1}>۱ - بد</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان دیدگاه (اختیاری)</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="مثال: کیفیت ساخت و موتور عالی"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">متن دیدگاه</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="تجربه خود از کار با دستگاه را بنویسید..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-colors"
                    >
                      ارسال دیدگاه
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-800">محصولات مشابه و مرتبط</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Stock Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <Bell className="w-10 h-10 text-secondary mx-auto" />
            <h3 className="font-bold text-base text-slate-800">اطلاع‌رسانی موجودی کالا</h3>
            <p className="text-xs text-slate-500">
              شماره موبایل خود را وارد کنید تا به محض شارژ مجدد کالا در انبار، برای شما پیامک ارسال شود.
            </p>
            {alertSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl">
                {alertSuccess}
              </div>
            ) : (
              <form onSubmit={handleStockAlert} className="space-y-3">
                <input
                  type="tel"
                  required
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm focus:ring-2 focus:ring-secondary/20"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-secondary text-white font-bold text-xs rounded-xl hover:bg-secondary-dark transition-colors"
                  >
                    ثبت درخواست
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
