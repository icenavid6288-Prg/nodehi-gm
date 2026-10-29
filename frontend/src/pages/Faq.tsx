import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { api } from '../lib/api';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Faq: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await api.getFaqs();
        if (res.ok && res.categories) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('FAQ load error', err);
      }
    }
    fetchFaqs();
  }, []);

  const defaultFaqs = [
    {
      id: 1,
      cat: 'گارانتی و اصالت',
      q: 'آیا کالاهای نودهی دارای ضمانت اصالت و گارانتی معتبر شرکتی هستند؟',
      a: 'بله، کلیه محصولات ارائه شده در نودهی دارای شناسه اصالت کالا و گارانتی رسمی شرکت‌های معتبر (مانند گلدیران، سام سرویس، بوش سرویس و ...) هستند و هیچ کالای فاقد گارانتی عرضه نمی‌گردد.',
    },
    {
      id: 2,
      cat: 'ارسال و تحویل',
      q: 'سفارش‌ها چگونه و در چه بازه زمانی به دست مشتری می‌رسند؟',
      a: 'در شهر تهران سفارش‌ها توسط ناوگان اختصاصی نودهی ظرف ۲۴ ساعت تحویل و تست سلامت فیزیکی می‌شوند. برای سایر استان‌ها ارسال از طریق باربری‌های ویژه با بسته‌بندی ضدضربه ۲ الی ۳ روز کاری زمان می‌برد.',
    },
    {
      id: 3,
      cat: 'پرداخت و اقساط',
      q: 'شرایط خرید اقساطی اسنپ‌پی در نودهی چگونه است؟',
      a: 'شما می‌توانید بدون نیاز به چک یا ضامن، مبلغ سفارش را در ۴ قسط بدون سود پرداخت نمایید. قسط اول در زمان ثبت سفارش کسر شده و ۳ قسط دیگر در ماه‌های متوالی پرداخت می‌شوند.',
    },
    {
      id: 4,
      cat: 'بازگشت کالا',
      q: 'شرایط بازگشت کالا تا ۷ روز پس از خرید به چه صورت است؟',
      a: 'در صورتی که کالا دارای نقص فنی کارخانه‌ای باشد یا مغایرتی با مشخصات درج‌شده در سایت داشته باشد، تا ۷ روز پس از دریافت می‌توانید درخواست تعویض یا عودت وجه ثبت فرمایید.',
    },
  ];

  const allFaqs =
    categories.length > 0
      ? categories.flatMap((c) =>
          (c.faqs || []).map((f: any) => ({
            id: f.id,
            cat: c.name,
            q: f.question,
            a: f.answer,
          }))
        )
      : defaultFaqs;

  const filtered = allFaqs.filter((item) => {
    const matchSearch =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const toggleOpen = (id: number) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'پرسش‌های متداول' }]} />

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          پرسش‌های متداول مشتریان
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          پاسخ به پرتکرارترین سؤالات درباره خرید، ارسال، گارانتی و نحوه تسویه حساب
        </p>

        {/* Search */}
        <div className="relative pt-4 max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی پرسش..."
            className="w-full bg-white border border-slate-200 rounded-full py-2.5 pr-10 pl-4 text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-[27px]" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {filtered.map((item) => {
          const isOpen = openItems[item.id] ?? false;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => toggleOpen(item.id)}
                className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-800 hover:text-secondary transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-secondary' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
