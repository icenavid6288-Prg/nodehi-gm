import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Award, 
  CheckCircle, 
  Calculator, 
  ArrowLeft, 
  Sparkles,
  Zap
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { formatPrice, toPersianDigits } from '../lib/format';

export const Loyalty: React.FC = () => {
  const [calcAmount, setCalcAmount] = useState(20000000);

  const installmentMonths = 4;
  const monthlyPayment = Math.round(calcAmount / installmentMonths);

  const tiers = [
    {
      name: 'سطح برنزی',
      points: '۰ تا ۵۰۰ امتیاز',
      cashback: '۱٪ کش‌بک نقدی',
      color: 'from-amber-700 to-amber-900',
      perks: ['بازگشت ۱٪ مبلغ خرید به کیف پول', 'پشتیبانی آنلاین'],
    },
    {
      name: 'سطح نقره‌ای',
      points: '۵۰۰ تا ۲۰۰۰ امتیاز',
      cashback: '۲٪ کش‌بک نقدی',
      color: 'from-slate-400 to-slate-600',
      perks: ['بازگشت ۲٪ مبلغ خرید به کیف پول', 'ارسال رایگان کلیه سفارش‌ها', 'اولویت در آماده‌سازی کالا'],
    },
    {
      name: 'سطح طلایی',
      points: 'بالای ۲۰۰۰ امتیاز',
      cashback: '۳٪ کش‌بک نقدی',
      color: 'from-amber-400 to-amber-600',
      perks: [
        'بازگشت ۳٪ مبلغ خرید به کیف پول',
        'ارسال رایگان اکسپرس',
        'کدهای تخفیف اختصاصی فصلی',
        'پشتیبانی اختصاصی VIP',
      ],
    },
  ];

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'خرید اقساطی و باشگاه مشتریان' }]} />

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-primary via-primary-dark to-slate-900 text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-lg space-y-4">
        <span className="px-3 py-1 rounded-full bg-secondary text-primary font-bold text-xs inline-block">
          بدون نیاز به چک یا ضامن
        </span>
        <h1 className="text-2xl sm:text-4xl font-black leading-tight">
          خرید اقساطی لوازم خانگی با <span className="text-secondary">اسنپ‌پی</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          در فروشگاه نودهی می‌توانید تمام تجهیزات خانه خود را در ۴ قسط مساوی و بدون ۱ ریال کارمزد یا بهره خریداری نمایید. قسط اول را در زمان خرید بپردازید و کالا را در همان روز تحویل بگیرید.
        </p>
      </div>

      {/* Installment Calculator */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-secondary flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">ماشین‌حساب اقساط اسنپ‌پی</h3>
            <p className="text-xs text-slate-500">مبلغ خرید مورد نظرتان را برای محاسبه اقساط وارد کنید</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">مبلغ کل سبد خرید:</span>
            <span className="font-black text-lg text-primary">{formatPrice(calcAmount)}</span>
          </div>

          <input
            type="range"
            min={2000000}
            max={50000000}
            step={1000000}
            value={calcAmount}
            onChange={(e) => setCalcAmount(Number(e.target.value))}
            className="w-full accent-secondary h-2 bg-slate-200 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>{toPersianDigits('2,000,000')} تومان</span>
            <span>{toPersianDigits('50,000,000')} تومان</span>
          </div>

          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="block text-[11px] text-slate-500">پیش‌پرداخت (قسط اول):</span>
              <span className="font-black text-base text-secondary">{formatPrice(monthlyPayment)}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">۳ قسط ماهانه بعدی:</span>
              <span className="font-black text-base text-primary">{formatPrice(monthlyPayment)}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <span>شروع خرید اقساطی از فروشگاه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3 Step Guide */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-800 text-center">
          مراحل خرید اقساطی در ۳ گام آسان
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-primary font-black text-lg flex items-center justify-center mx-auto">
              ۱
            </div>
            <h3 className="font-bold text-sm text-slate-800">انتخاب کالا و سبد خرید</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              کالای مورد نظر خود را به سبد خرید اضافه کرده و به صفحه تسویه حساب بروید.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-secondary font-black text-lg flex items-center justify-center mx-auto">
              ۲
            </div>
            <h3 className="font-bold text-sm text-slate-800">انتخاب درگاه اقساطی اسنپ‌پی</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              در مرحله پرداخت، روش «پرداخت اقساطی اسنپ‌پی» را انتخاب نموده و شماره موبایل خود را تأیید کنید.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent font-black text-lg flex items-center justify-center mx-auto">
              ۳
            </div>
            <h3 className="font-bold text-sm text-slate-800">تحویل فوری و پرداخت اقساط</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              سفارش شما همان‌روز ارسال می‌گردد و اقساط بعدی هر ماه از طریق اپلیکیشن اسنپ پرداخت می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* Loyalty Club Tiers */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-slate-800">سطوح عضویت باشگاه مشتریان نودهی</h2>
          <p className="text-xs text-slate-500">با هر خرید امتیاز بگیرید و از تخفیف‌ها و هدایای نقدی بهره‌مند شوید</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className={`p-6 bg-gradient-to-r ${t.color} text-white space-y-2`}>
                <span className="text-xs font-semibold opacity-90">{t.points}</span>
                <h3 className="text-xl font-black">{t.name}</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
                  {t.cashback}
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <ul className="space-y-2 text-xs text-slate-600">
                  {t.perks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
