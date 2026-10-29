import React from 'react';
import { ShieldCheck, Truck, Award, Sparkles, MapPin, Phone, Mail } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { toPersianDigits } from '../lib/format';

export const About: React.FC = () => {
  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'درباره فروشگاه نودهی' }]} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white p-8 sm:p-12 rounded-3xl shadow-lg space-y-4">
        <span className="px-3 py-1 rounded-full bg-secondary text-primary font-bold text-xs inline-block">
          بیش از ۱۵ سال سابقه درخشان
        </span>
        <h1 className="text-2xl sm:text-4xl font-black">
          درباره فروشگاه لوازم خانگی <span className="text-secondary">نودهـی</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
          فروشگاه اینترنتی نودهی با هدف تسهیل خرید و دسترسی مطمئن خانواده‌های ایرانی به لوازم خانگی اصل و باکیفیت جهانی پایه‌گذاری شد. صداقت در مشاوره، گارانتی واقعی و احترام به حقوق مصرف‌کننده، اصول خدشه‌ناپذیر ما هستند.
        </p>
      </div>

      {/* Mission & Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-secondary flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">تضمین ۱۰۰٪ اصالت کالا</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            کلیه محصولات مستقیماً از نمایندگی‌های رسمی و واردکنندگان دارای مجوز قانونی تأمین می‌شوند و دارای شناسه رهگیری وزارت صمت هستند.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">ارسال ایمن و تخصصی</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            لوازم سنگین نظیر ساید‌بای‌ساید و ماشین لباسشویی با بسته‌بندی ویژه و تکنسین‌های مجرب در محل مشتری حمل و نصب می‌گردند.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">خدمات پس از فروش معتبر</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            پشتیبانی تلفنی و حضوری برای نصب، راه‌اندازی و استفاده بهینه از کالا با حضور تکنسین‌های دارای گواهینامه فنی.
          </p>
        </div>
      </div>

      {/* Branches & Showrooms */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-slate-800">شعب و شوروم‌های فیزیکی نودهی</h2>
        <p className="text-xs text-slate-500">
          جهت مشاهده فیزیکی کالاها و تست کیفیت قبل از خرید، می‌توانید به شوروم‌های ما مراجعه فرمایید:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <span className="font-bold text-primary text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-secondary" />
              شعبه مرکزی تهران
            </span>
            <p className="text-slate-600">تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۳، ساختمان نودهی</p>
            <p className="text-slate-500">تلفن: {toPersianDigits('021-91000000')}</p>
            <p className="text-slate-400">ساعات کاری: شنبه تا پنجشنبه از ساعت ۹:۰۰ الی ۲۱:۰۰</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <span className="font-bold text-primary text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-secondary" />
              شعبه اصفهان
            </span>
            <p className="text-slate-600">اصفهان، خیابان چهارباغ بالا، مجتمع تجاری نگین، پلاک ۴۵</p>
            <p className="text-slate-500">تلفن: {toPersianDigits('031-36000000')}</p>
            <p className="text-slate-400">ساعات کاری: شنبه تا چهارشنبه از ساعت ۱۰:۰۰ الی ۲۰:۰۰</p>
          </div>
        </div>
      </div>
    </div>
  );
};
