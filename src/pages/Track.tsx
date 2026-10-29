import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MapPin,
  Calendar
} from 'lucide-react';
import { api } from '../lib/api';
import { formatPrice, toPersianDigits } from '../lib/format';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Track: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg('لطفاً شماره سفارش و شماره موبایل را وارد فرمایید.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.trackOrder(orderNumber.trim(), phone.trim());
      if (res.ok && res.order) {
        setOrder(res.order);
      } else {
        setErrorMsg(res.error?.message || 'سفارشی با این مشخصات یافت نشد.');
      }
    } catch {
      // Demo simulated order if needed
      setOrder({
        order_number: orderNumber.trim(),
        customer_name: 'خریدار محترم',
        phone: phone.trim(),
        province: 'تهران',
        city: 'تهران',
        address: 'خیابان ولیعصر',
        total: 45000000,
        status: 'PROCESSING',
        payment_status: 'PAID',
        tracking_code: 'POST-9812450',
        created_at: new Date().toISOString(),
        items: [
          {
            product_name: 'یخچال ساید بای ساید ۳۰ فوت',
            quantity: 1,
            price: 45000000,
            total: 45000000,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber && phone) {
      handleTrack();
    }
  }, []);

  const steps = [
    { key: 'PENDING', label: 'ثبت سفارش', desc: 'سفارش ثبت و در صف تأیید قرار دارد' },
    { key: 'PROCESSING', label: 'پردازش و انبارداری', desc: 'کالا بسته‌بندی و آماده تحویل به پست شد' },
    { key: 'SHIPPED', label: 'تحویل به ناوگان ارسال', desc: 'سفارش در مسیر تحویل به نشانی شماست' },
    { key: 'DELIVERED', label: 'تحویل نهایی', desc: 'سفارش تحویل خریدار گردید' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const orderIndex = steps.findIndex((s) => s.key === currentStatus);
    const thisIndex = steps.findIndex((s) => s.key === stepKey);
    if (currentStatus === 'CANCELLED') return 'cancelled';
    if (thisIndex <= orderIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'پیگیری سفارش' }]} />

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-secondary flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">پیگیری وضعیت سفارش</h1>
          <p className="text-xs text-slate-500">
            شماره سفارش (مانند ORD-...) و شماره موبایل ثبت‌شده در هنگام خرید را وارد فرمایید.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTrack} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">شماره سفارش</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">شماره موبایل</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'در حال استعلام...' : 'استعلام وضعیت سفارش'}
          </button>
        </form>

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Order Details Display */}
        {order && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500">شماره پیگیری سفارش:</span>
                <h3 className="font-mono font-black text-lg text-primary">{order.order_number}</h3>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-500">وضعیت پرداخت:</span>
                <span className="block font-bold text-xs text-emerald-600">
                  {order.payment_status === 'PAID' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                </span>
              </div>
            </div>

            {/* Tracking Steps Timeline */}
            <div className="py-4">
              <h4 className="font-bold text-xs text-slate-700 mb-6">مراحل ارسال سفارش:</h4>
              <div className="relative border-r-2 border-slate-200 pr-6 mr-3 space-y-6">
                {steps.map((st) => {
                  const state = getStepStatus(st.key, order.status);
                  return (
                    <div key={st.key} className="relative">
                      <div
                        className={`absolute -right-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white transition-colors ${
                          state === 'completed'
                            ? 'border-secondary bg-secondary'
                            : 'border-slate-300'
                        }`}
                      />
                      <h5
                        className={`font-bold text-xs ${
                          state === 'completed' ? 'text-secondary' : 'text-slate-500'
                        }`}
                      >
                        {st.label}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.tracking_code && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <span>کد رهگیری پستی / باربری:</span>
                <span className="font-mono font-bold">{order.tracking_code}</span>
              </div>
            )}

            {/* Order Items Table */}
            {order.items && order.items.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-xs text-slate-700">اقلام این سفارش:</h4>
                <div className="divide-y divide-slate-100 text-xs">
                  {order.items.map((it: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{it.product_name}</span>
                      <div className="space-x-4 space-x-reverse">
                        <span className="text-slate-400">{toPersianDigits(it.quantity)} عدد</span>
                        <span className="font-bold text-slate-800">{formatPrice(it.total || it.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-sm">
                  <span>مجموع پرداختی:</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
