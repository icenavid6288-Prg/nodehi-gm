import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, FileText } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Legal: React.FC = () => {
  const location = useLocation();
  const isPrivacy = location.pathname.includes('privacy');

  const title = isPrivacy ? 'سیاست حریم خصوصی و امنیت اطلاعات' : 'قوانین و شرایط استفاده از خدمات';

  const termsSections = [
    {
      title: 'ماده ۱: شرایط عمومی و تعاریف',
      content:
        'ورود کاربران به وب‌سایت نودهی و ثبت سفارش به معنای آگاه بودن و پذیرفتن کامل کلیه قوانین و مقررات تجارت الکترونیک جمهوری اسلامی ایران و ضوابط این سامانه است. کلیه اصول و رویه‌های نودهی منطبق با قانون حمایت از حقوق مصرف‌کنندگان است.',
    },
    {
      title: 'ماده ۲: ثبت، پردازش و ارسال سفارش',
      content:
        'روز کاری به معنی روز شنبه تا پنج‌شنبه هر هفته به استثنای تعطیلات عمومی است. سفارش‌های ثبت‌شده ظرف ۲۴ ساعت در تهران و ۲ الی ۳ روز کاری در شهرستان‌ها ارسال می‌گردند. در صورت بروز هرگونه مشکل در پردازش نهایی سبد خرید مانند اتمام موجودی، مبلغ پرداخت‌شده ظرف حداکثر ۲۴ الی ۴۸ ساعت کاری به حساب خریدار عودت داده خواهد شد.',
    },
    {
      title: 'ماده ۳: خسارت در هنگام حمل و تحویل فیزیکی',
      content:
        'نودهی همواره نهایت تلاش خود را به‌کار می‌بندد تا کلیه سفارش‌ها در نهایت صحت و بدون آسیب‌دیدگی به دست مشتریان در سراسر کشور برسد. تحویل کالا منوط به امضای فرم تحویل سلامت فیزیکی توسط مشتری و تکنسین حمل است.',
    },
    {
      title: 'ماده ۴: ضمانت بازگشت ۷ روزه کالا',
      content:
        'در صورت وجود هرگونه مغایرت فنی یا ظاهری با مشخصات درج‌شده در سایت، خریدار موظف است حداکثر ظرف ۷ روز پس از دریافت، موضوع را به واحد پشتیبانی اطلاع دهد. بازگشت کالا منوط به حفظ جعبه اصلی و بسته‌بندی پلمپ کارخانه است.',
    },
  ];

  const privacySections = [
    {
      title: 'امنیت اطلاعات و حریم خصوصی کاربران',
      content:
        'فروشگاه نودهی به اطلاعات خصوصی اشخاصی که از خدمات سایت استفاده می‌کنند احترام گذاشته و از آن با استانداردهای رمزنگاری مدرن محافظت می‌نماید. شماره‌های تماس و آدرس‌های پستی صرفاً جهت پردازش و ارسال سفارش‌ها مورد استفاده قرار می‌گیرند.',
    },
    {
      title: 'ارتباطات الکترونیکی و پیامک',
      content:
        'هنگامی که شما از سرویس‌های نودهی استفاده می‌کنید یا سفارش اینترنتی خود را ثبت می‌نمایید، این ارتباطات به صورت الکترونیکی انجام می‌شود و کد رهگیری پستی و وضعیت سفارش به شماره موبایل شما پیامک خواهد شد.',
    },
  ];

  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs items={[{ label: title }]} />

      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-secondary flex items-center justify-center">
            {isPrivacy ? <Shield className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">{title}</h1>
            <p className="text-xs text-slate-400 mt-1">آخرین به‌روزرسانی: مهرماه ۱۴۰۳</p>
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="font-bold text-sm text-primary">{sec.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                {sec.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
