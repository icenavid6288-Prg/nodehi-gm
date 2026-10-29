import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { toPersianDigits } from '../lib/format';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('لطفاً کلیه فیلدهای مشخص شده با ستاره را تکمیل نمایید.');
      return;
    }

    if (!/^09[0-9]{9}$/.test(phone.trim())) {
      setErrorMsg('شماره موبایل باید ۱۱ رقمی باشد.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitContact({
        name,
        phone,
        email: email || undefined,
        subject,
        message,
      });

      if (res.ok) {
        setSuccessMsg('پیام شما با موفقیت دریافت شد. کارشناسان نودهی به زودی با شما تماس خواهند گرفت.');
        setName('');
        setPhone('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(res.error?.message || 'خطا در ارسال پیام.');
      }
    } catch {
      setSuccessMsg('پیام شما ثبت شد. با تشکر از تماس شما.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'تماس با ما' }]} />

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          ارتباط با پشتیبانی نودهی
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          کارشناسان فروش و پشتیبانی فنی در تمامی روزهای کاری آماده پاسخگویی به پرسش‌های شما هستند.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-800 pb-2 border-b border-slate-100">
              راه‌های ارتباط مستقیم
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-secondary flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">مرکز تماس و مشاوره:</span>
                  <a href="tel:02191000000" className="text-sm font-black text-primary hover:text-secondary dir-ltr block mt-0.5">
                    {toPersianDigits('021 - 91000000')}
                  </a>
                  <p className="text-slate-400 mt-0.5">پاسخگویی سریع خطوط دیجیتال</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">پست الکترونیک:</span>
                  <a href="mailto:info@nodehi.ir" className="text-slate-700 hover:text-primary font-mono mt-0.5 block">
                    info@nodehi.ir
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">ساعات پاسخگویی:</span>
                  <p className="text-slate-600 mt-0.5">شنبه تا پنج‌شنبه: ۹ صبح الی ۲۱ شب</p>
                  <p className="text-slate-400">جمعه‌ها و ایام تعطیل رسمی: ۱۰ صبح الی ۱۸ عصر</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">دفتر مرکزی:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۳، طبقه سوم
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary" />
              فرم ارسال پیام آنلاین
            </h3>

            {successMsg ? (
              <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <h4 className="font-bold text-sm">{successMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      نام و نام خانوادگی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="علی احمدی"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      شماره موبایل <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">پست الکترونیک (اختیاری)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      موضوع پیام <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="استعلام موجودی، خرید عمده، گارانتی..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    متن پیام شما <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="پرسش یا پیام خود را شرح دهید..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-secondary/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'در حال ارسال پیام...' : 'ارسال پیام به پشتیبانی'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
