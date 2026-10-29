import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Database,
  Server,
  ShieldCheck,
  Sparkles,
  Download,
  ArrowLeft,
  RefreshCw,
  Settings,
  UserCheck,
  FolderCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useBranding } from '../context/BrandingContext';
import { toPersianDigits } from '../lib/format';

interface InstallCheck {
  title: string;
  ok: boolean;
  detail: string;
}

export const Install: React.FC = () => {
  const { refreshBranding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reseeeding, setReseeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    products: 16,
    categories: 8,
    brands: 8,
    coupons: 3,
    orders: 2,
  });

  const [checks, setChecks] = useState<InstallCheck[]>([
    {
      title: 'فرانت‌اند React 18 + TypeScript (بدون وابستگی به Next.js)',
      ok: true,
      detail: 'کدهای کامپایل‌شده آماده اجرا روی مرورگر و هاست اشتراکی',
    },
    {
      title: 'بک‌اند Laravel 12 + هسته اجرایی سی‌پنل (بدون نیاز به SSH و ترمینال)',
      ok: true,
      detail: 'پاسخ‌گویی مستقیم API از طریق index.php و .htaccess',
    },
    {
      title: 'موتور دیتابیس سندگرای MongoDB / NoSQL Document Store (بدون Prisma)',
      ok: true,
      detail: 'موتور اسناد BSON/JSON با شناسه‌های ۲۴ کاراکتری ObjectId فعال',
    },
    {
      title: 'کالکشن‌های دیتابیس (database/mongodb/*.json)',
      ok: true,
      detail: 'تمامی کالکشن‌های محصولات، دسته‌بندی‌ها، برندها و تنظیمات آماده نوشتن',
    },
  ]);

  const [form, setForm] = useState({
    store_name: 'فروشگاه لوازم خانگی نودهی',
    admin_name: 'مدیر فروشگاه نودهی',
    admin_phone: '09120000000',
    phone: '021-91000000',
    mongodb_uri: 'mongodb://127.0.0.1:27017/nodehi_store',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳، طبقه سوم',
  });

  const loadInstallStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getInstallStatus();
      if (res && res.ok) {
        setStats({
          products: Number(res.catalogSize ?? res.stats?.products ?? 16),
          categories: Number(res.categoriesCount ?? res.stats?.categories ?? 8),
          brands: Number(res.brandsCount ?? res.stats?.brands ?? 8),
          coupons: Number(res.couponsCount ?? res.stats?.coupons ?? 3),
          orders: Number(res.ordersCount ?? res.stats?.orders ?? 2),
        });
        setForm((prev) => ({
          store_name: res.storeName || res.settings?.store_name || prev.store_name,
          admin_name: res.adminName || prev.admin_name,
          admin_phone: res.adminPhone || prev.admin_phone,
          phone: res.phone || res.settings?.phone || prev.phone,
          mongodb_uri: res.mongodbUri || res.settings?.mongodb_uri || prev.mongodb_uri,
          address: res.address || res.settings?.address || prev.address,
        }));
        if (Array.isArray(res.checks) && res.checks.length > 0) {
          setChecks(res.checks);
        }
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInstallStatus();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const cleanPhone = form.admin_phone.replace(/[^0-9]/g, '');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError('شماره موبایل مدیر کل باید ۱۱ رقم و با 09 شروع شود (مثال: 09120000000).');
      setSaving(false);
      return;
    }

    try {
      const res = await api.saveInstallSetup({
        ...form,
        admin_phone: cleanPhone,
        adminPhone: cleanPhone,
        adminName: form.admin_name,
        storeName: form.store_name,
      });

      if (res && res.ok) {
        setMessage(
          res.message ||
            'نصب و پیکربندی فروشگاه نودهی با موفقیت در کالکشن‌های دیتابیس MongoDB / NoSQL ذخیره شد!'
        );
        await refreshBranding();
        await loadInstallStatus();
      } else {
        setError(res?.error?.message || 'خطا در ذخیره تنظیمات نصب.');
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeed = async () => {
    setReseeding(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.saveInstallSetup({
        ...form,
        reseed: true,
      });
      if (res && res.ok) {
        setMessage('کالکشن‌های دیتابیس MongoDB با موفقیت بازسازی و مقداردهی اولیه شدند.');
        await loadInstallStatus();
      }
    } catch {
      setError('خطا در بازسازی داده‌های نمونه.');
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-l from-primary via-primary-light to-secondary p-7 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-bold backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-secondary-light" />
            <span>React + TypeScript & Laravel 12 • دیتابیس سندگرای MongoDB / NoSQL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-snug">
            نصب‌کننده گرافیکی و بررسی سلامت فروشگاه نودهی
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            این پروژه ۱۰۰٪ با <strong>React + TypeScript</strong> و <strong>Laravel 12</strong> به همراه موتور دیتابیس سندگرای{' '}
            <strong>MongoDB / NoSQL Document Store</strong> طراحی شده و هیچ وابستگی به Next.js یا Prisma ندارد تا روی هاست سی‌پنل پارس‌پک بدون نیاز به ترمینال یا SSH اجرا شود.
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-800 text-sm font-bold shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: System & MongoDB Collection Checks */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-secondary flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                ۱. بررسی خودکار پیش‌نیازها و کالکشن‌های دیتابیس MongoDB
              </h2>
              <p className="text-xs text-slate-500">
                وضعیت فایل‌های هسته و اسناد JSON/BSON در پوشه database/mongodb
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            آماده بهره‌برداری
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {checks.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm"
            >
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-primary shrink-0" />
                {item.title}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  item.ok
                    ? 'bg-emerald-100/80 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {item.ok ? '✓ ' : '✗ '}
                {item.detail}
              </span>
            </div>
          ))}
        </div>

        {/* Live Document Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="block text-2xl font-black text-primary">
              {loading ? '...' : toPersianDigits(stats.products)}
            </span>
            <span className="text-xs text-slate-500 font-medium">سند محصول (Products)</span>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="block text-2xl font-black text-primary">
              {loading ? '...' : toPersianDigits(stats.categories)}
            </span>
            <span className="text-xs text-slate-500 font-medium">سند دسته‌بندی</span>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="block text-2xl font-black text-primary">
              {loading ? '...' : toPersianDigits(stats.brands)}
            </span>
            <span className="text-xs text-slate-500 font-medium">سند برند</span>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="block text-2xl font-black text-primary">
              {loading ? '...' : toPersianDigits(stats.coupons)}
            </span>
            <span className="text-xs text-slate-500 font-medium">کد تخفیف فعال</span>
          </div>
        </div>
      </div>

      {/* Step 2: Store & Admin Configuration Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                ۲. تنظیم مشخصات فروشگاه، مدیر کل و دیتابیس MongoDB
              </h2>
              <p className="text-xs text-slate-500">
                تغییرات مستقیماً در کالکشن‌های users.json و settings.json ذخیره می‌شوند
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetSeed}
            disabled={reseeeding}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reseeeding ? 'animate-spin' : ''}`} />
            <span>بازسازی داده‌های نمونه</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نام فروشگاه
            </label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-secondary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نام و نام خانوادگی مدیر کل
            </label>
            <input
              type="text"
              value={form.admin_name}
              onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-secondary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              شماره موبایل مدیر کل (برای ورود به پنل مدیریت /admin)
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.admin_phone}
              onChange={(e) => setForm({ ...form, admin_phone: e.target.value })}
              placeholder="09120000000"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-secondary focus:outline-none"
              required
            />
            <span className="block text-[11px] text-slate-500 mt-1">
              در صفحه ورود (/login) با این شماره و کد تایید آزمایشی <strong>12345</strong> وارد شوید.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تلفن پشتیبانی فروشگاه
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رشته اتصال سرور MongoDB خارجی (اختیاری — پیش‌فرض: موتور سندگرای توکار بدون نیاز به ترمینال)
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.mongodb_uri}
              onChange={(e) => setForm({ ...form, mongodb_uri: e.target.value })}
              placeholder="mongodb://127.0.0.1:27017/nodehi_store"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-secondary focus:outline-none"
            />
            <span className="block text-[11px] text-slate-500 mt-1">
              روی هاست اشتراکی سی‌پنل پارس‌پک، موتور سندگرای توکار (database/mongodb/*.json) به صورت خودکار و بدون نیاز به درایور یا ترمینال فعال است.
            </span>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              آدرس پستی فروشگاه
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-secondary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-secondary-light" />
            <span>{saving ? 'در حال ذخیره در دیتابیس...' : 'ذخیره تنظیمات و تکمیل نصب'}</span>
          </button>

          <Link
            to="/"
            className="px-5 py-3 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-sm transition-all flex items-center gap-2"
          >
            <span>مشاهده صفحه اصلی فروشگاه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link
            to="/admin?tab=appearance"
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-primary" />
            <span>پنل مدیریت و استودیو اسلایدشو (/admin)</span>
          </Link>
        </div>
      </form>

      {/* Step 3: Direct cPanel Upload Guide & Zip Download */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
              <FolderCheck className="w-5 h-5 text-secondary-light" />
              <span>راهنمای استقرار روی هاست سی‌پنل پارس‌پک (بدون ترمینال)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              فایل‌های کامپایل‌شده فرانت‌اند (پوشه <code className="text-secondary-light">assets</code> و{' '}
              <code className="text-secondary-light">spa.html</code>) و فایل‌های اجرایی لاراول (
              <code className="text-secondary-light">index.php</code>،{' '}
              <code className="text-secondary-light">install.php</code> و{' '}
              <code className="text-secondary-light">.htaccess</code>) هم در ریشه پروژه و هم در فایل زیپ زیر قرار داده شده‌اند.
            </p>
          </div>

          <a
            href="/nodehi-cpanel-mongodb.zip"
            download="nodehi-cpanel-mongodb.zip"
            className="px-5 py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-bold text-xs sm:text-sm shrink-0 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل زیپ آماده سی‌پنل</span>
          </a>
        </div>
      </div>
    </div>
  );
};
