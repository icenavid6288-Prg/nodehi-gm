import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  ArrowLeft, 
  ShoppingBag, 
  Tag, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { formatPrice, toPersianDigits } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Cart: React.FC = () => {
  const {
    cart,
    cartCount,
    subtotal,
    shippingCost,
    freeShippingProgress,
    discount,
    couponCode,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon(inputCoupon.trim(), subtotal);
      if (res.ok && res.discount !== undefined) {
        setCoupon(inputCoupon.trim(), res.discount);
      } else {
        setCouponError(res.error?.message || 'کد تخفیف معتبر نیست.');
      }
    } catch {
      // Fallback local check for demo coupons
      if (inputCoupon.trim().toUpperCase() === 'NODEHI1403') {
        const disc = Math.min(Math.round((subtotal * 10) / 100), 500000);
        setCoupon(inputCoupon.trim(), disc);
      } else {
        setCouponError('کد تخفیف نامعتبر است.');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">سبد خرید شما خالی است</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            می‌توانید برای مشاهده محصولات و کالاهای تخفیف‌دار، به فروشگاه نودهی مراجعه فرمایید.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-light transition-colors"
          >
            <span>مشاهده فروشگاه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs items={[{ label: 'سبد خرید' }]} />

      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">
          سبد خرید شما ({toPersianDigits(cartCount)} قلم)
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
        >
          خالی کردن سبد
        </button>
      </div>

      {/* Free Shipping Progress Alert */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-teal-900">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-secondary shrink-0" />
          {freeShippingProgress >= 100 ? (
            <span className="font-bold text-secondary">
              سفارش شما شامل ارسال رایگان گردید!
            </span>
          ) : (
            <span>
              با افزودن <span className="font-bold">{formatPrice(5000000 - subtotal)}</span> دیگر به سبد، سفارش شما رایگان ارسال می‌شود.
            </span>
          )}
        </div>
        <div className="w-full sm:w-48 bg-teal-200/60 h-2 rounded-full overflow-hidden">
          <div
            className="bg-secondary h-full rounded-full transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Item Rows */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Link to={`/product/${item.slug}`} className="w-20 h-20 rounded-xl bg-slate-50 p-2 shrink-0 border border-slate-100">
                  <img src={item.thumbnail || '/icon.svg'} alt={item.name} className="w-full h-full object-contain" />
                </Link>
                <div className="space-y-1 flex-1">
                  <Link to={`/product/${item.slug}`} className="font-bold text-sm text-slate-800 hover:text-secondary line-clamp-2">
                    {item.name}
                  </Link>
                  {item.color && (
                    <span className="inline-block text-[11px] text-slate-500">
                      رنگ: {item.color}
                    </span>
                  )}
                  <div className="text-xs font-semibold text-primary">
                    {formatPrice(item.price)}
                  </div>
                </div>
              </div>

              {/* Counter & Action */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-white"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-xs text-slate-800">
                    {toPersianDigits(item.quantity)}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-white"
                  >
                    +
                  </button>
                </div>

                <div className="text-left font-black text-sm text-slate-800 min-w-[100px]">
                  {formatPrice(item.price * item.quantity)}
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                  title="حذف از سبد"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-black text-base text-slate-800 pb-3 border-b border-slate-100">
              خلاصه صورت‌حساب
            </h3>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">کد تخفیف</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: NODEHI1403"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-secondary/20"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                >
                  {couponLoading ? '...' : 'اعمال'}
                </button>
              </div>
              {couponCode && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  کد تخفیف {couponCode} اعمال شد.
                </p>
              )}
              {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}
            </form>

            {/* Breakdown */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>مجموع قیمت کالاها:</span>
                <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-accent font-bold">
                  <span>سود شما از خرید:</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-semibold text-slate-800">
                  {shippingCost === 0 ? (
                    <span className="text-secondary font-bold">رایگان</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-black text-sm text-slate-800">مبلغ قابل پرداخت:</span>
                <span className="font-black text-xl text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-accent hover:bg-accent-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2"
            >
              <span>ادامه فرایند خرید و ثبت آدرس</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>خرید امن با تضمین نودهی</span>
            </div>
            <p className="leading-relaxed">
              تمامی کالاها قبل از ارسال توسط کارشناسان تست اولیه شده و دارای گارانتی رسمی می‌باشند.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
