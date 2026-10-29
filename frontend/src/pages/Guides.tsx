import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, ArrowLeft, Zap, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Guides: React.FC = () => {
  const guides = [
    {
      title: 'راهنمای جامع خرید یخچال و ساید بای ساید',
      desc: 'آشنایی با موتورهای کمپرسور اینورتر خطی، تفاوت ابعاد ساید بای ساید، ویژگی‌های نوفراست و نحوه محاسبه گنجایش بر اساس تعداد اعضای خانواده.',
      category: 'یخچال و فریزر',
      link: '/blog/refrigerator-buying-guide',
      tips: [
        'برای خانواده‌های ۳ الی ۴ نفره، گنجایش ۲۴ تا ۲۸ فوت ایده‌آل است.',
        'کمپرسورهای اینورتر خطی تا ۳۵٪ مصرف برق کمتری نسبت به مدل‌های معمولی دارند.',
        'به وجود فیلتر بهداشتی چندلایه جهت رفع بوی نامطبوع دقت فرمایید.',
      ],
    },
    {
      title: 'راهنمای خرید ماشین لباسشویی درب از جلو',
      desc: 'مزایای موتور Direct Drive بدون تسمه، برنامه‌های شستشوی با بخار (Steam Care)، رتبه انرژی A+++ و کنترل هوشمند از طریق تلفن همراه.',
      category: 'ماشین لباسشویی',
      link: '/blog/washing-machine-inverter-benefits',
      tips: [
        'دیگ‌های ۸ و ۹ کیلوگرمی برای شستشوی پتو و پرده مناسب‌ترین انتخاب هستند.',
        'دور خشک‌کن ۱۴۰۰ دور در دقیقه رطوبت لباس را تا ۸۰ درصد کاهش می‌دهد.',
        'موتورهای دایرکت درایو حداقل لرزش و صدای مزاحم را در زمان کار دارند.',
      ],
    },
    {
      title: 'راهنمای خرید کولر گازی و اسپلیت کم‌مصرف',
      desc: 'محاسبه دقیق ظرفیت BTU متناسب با متراژ واحد، سیستم‌های Dual Inverter با گاز R410a و عملکرد سرمایش و گرمایش ۴ فصل.',
      category: 'کولر گازی',
      link: '/shop?category=air-conditioner',
      tips: [
        'برای فضای ۳۰ تا ۴۵ متری ظرفیت ۱۲۰۰۰ و برای ۶۰ تا ۸۰ متری ظرفیت ۲۴۰۰۰ مناسب است.',
        'کولرهای گازی مجهز به کمپرسور T3 برای مناطق با اقلیم گرم و خشک الزامی هستند.',
      ],
    },
    {
      title: 'راهنمای خرید تلویزیون‌های هوشمند 4K',
      desc: 'تفاوت پنل‌های OLED و QLED، نرخ نوسازی تصویر ۱۲۰ هرتز برای بازی، پشتیبانی از HDR10+ و درگاه‌های HDMI 2.1.',
      category: 'تلویزیون',
      link: '/shop?category=tv',
      tips: [
        'برای فاصله ۲.۵ تا ۳ متر از مانیتور، ابعاد ۵۵ تا ۶۵ اینچ بهترین زاویه دید را فراهم می‌کند.',
        'سیستم‌عامل‌های اندروید تی‌وی و Google TV دسترسی آسان به فیلیمو، نماوا و یوتیوب را ممکن می‌سازند.',
      ],
    },
  ];

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'راهنمای خرید لوازم خانگی' }]} />

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          راهنماهای تخصصی انتخاب لوازم خانگی
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          نکات ضروری کارشناسی برای خریدی آگاهانه، باکیفیت و متناسب با بودجه شما
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((g, idx) => (
          <div
            key={idx}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-secondary transition-all"
          >
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-teal-50 text-secondary text-xs font-bold inline-block">
                {g.category}
              </span>
              <h2 className="text-lg font-bold text-slate-800">{g.title}</h2>
              <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700">نکات کلیدی این بخش:</span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {g.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                to={g.link}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-teal-700"
              >
                <span>مشاهده محصولات یا مقاله کامل</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
