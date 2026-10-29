import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  User as UserIcon, 
  Search, 
  Menu, 
  X, 
  Phone, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  FileText,
  HelpCircle,
  Award
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { toPersianDigits } from '../lib/format';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartCount } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { brandName, tagline, logoUrl, supportPhone } = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'صفحه اصلی', to: '/' },
    { label: 'فروشگاه لوازم خانگی', to: '/shop' },
    { label: 'آماده ارسال', to: '/shop?ready=1' },
    { label: 'خرید اقساطی', to: '/loyalty' },
    { label: 'راهنمای خرید', to: '/guides' },
    { label: 'وبلاگ', to: '/blog' },
    { label: 'پرسش‌های متداول', to: '/faq' },
    { label: 'درباره ما', to: '/about' },
    { label: 'تماس با ما', to: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* Top Trust Bar */}
      <div className="bg-primary text-white text-xs py-2 px-4 border-b border-primary-light">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              ارسال سریع و رایگان برای خریدهای بالای ۵ میلیون تومان
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              ضمانت ۱۰۰٪ اصالت و گارانتی رسمی شرکتی
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-200">
            <a href="tel:02191000000" className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-secondary" />
              <span>پشتیبانی: {toPersianDigits(supportPhone || '021-91000000')}</span>
            </a>
            <Link to="/track" className="hover:text-white transition-colors">
              پیگیری سفارش
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-container mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="منوی سایت"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              {logoUrl ? (
                <div className="h-10 min-w-10 rounded-xl bg-white border border-slate-200 px-1.5 flex items-center justify-center shadow-sm overflow-hidden">
                  <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-xl text-primary tracking-tight">{brandName || 'نودهی'}</span>
                <span className="text-[10px] text-slate-500 font-medium">{tagline || 'لوازم خانگی اصیل'}</span>
              </div>
            </Link>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در بین یخچال، ماشین لباسشویی، تلویزیون و..."
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-secondary rounded-full py-2.5 pr-11 pl-24 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-light transition-colors"
            >
              جستجو
            </button>
          </form>

          {/* User & Cart CTA Actions */}
          <div className="flex items-center gap-3">
            {/* User Account Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-primary" />
                  <span className="max-w-[100px] truncate">{user.name || 'حساب من'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 text-right animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                      شماره: {toPersianDigits(user.phone)}
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      داشبورد سفارش‌ها
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary font-semibold hover:bg-teal-50"
                      >
                        پنل مدیریت فروشگاه
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-right flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      خروج از حساب
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-slate-100 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>ورود / ثبت‌نام</span>
              </Link>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light shadow-sm hover:shadow transition-all relative"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">سبد خرید</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-white text-accent font-bold text-xs shadow">
                  {toPersianDigits(cartCount)}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:block border-t border-slate-100 bg-white">
          <div className="max-w-container mx-auto px-4 flex items-center gap-1 overflow-x-auto text-sm">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2.5 font-medium transition-colors whitespace-nowrap border-b-2 ${
                    active
                      ? 'border-secondary text-primary font-bold'
                      : 'border-transparent text-slate-600 hover:text-primary hover:border-slate-300'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col p-5 z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-primary text-lg">فروشگاه نودهی</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Mobile search */}
            <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="mt-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در محصولات..."
                className="w-full bg-slate-100 rounded-lg py-2 pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="mt-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 my-2 pt-2">
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-secondary hover:bg-teal-50 text-sm font-semibold flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  پیگیری آنلاین سفارش
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1">{children}</main>

      {/* Value Proposition Features Banner */}
      <section className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-secondary flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">ارسال فوق سریع</h4>
              <p className="text-xs text-slate-500 mt-0.5">تحویل اکسپرس در سراسر کشور</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">ضمانت اصالت کالا</h4>
              <p className="text-xs text-slate-500 mt-0.5">گارانتی معتبر رسمی شرکتی</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">خرید اقساطی</h4>
              <p className="text-xs text-slate-500 mt-0.5">بدون ضامن با اسنپ‌پی</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">۷ روز ضمانت بازگشت</h4>
              <p className="text-xs text-slate-500 mt-0.5">در صورت عدم مغایرت مشخصات</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-slate-300 pt-12 pb-8 border-t border-slate-800 text-sm">
        <div className="max-w-container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary text-primary flex items-center justify-center font-black">
                ن
              </div>
              <span className="font-black text-xl text-white">فروشگاه لوازم خانگی نودهی</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              فروشگاه اینترنتی نودهی، مرجع تخصصی خرید آنلاین لوازم خانگی از برترین برندهای بین‌المللی و داخلی با ضمانت اصالت فیزیکی، ارسال فوری و تضمین بهترین قیمت در سراسر ایران.
            </p>
            <div className="mt-4 text-xs text-slate-400 space-y-1">
              <p>تلفن پشتیبانی: <span className="text-white font-semibold">{toPersianDigits('021-91000000')}</span></p>
              <p>ساعات کاری: شنبه تا پنج‌شنبه، ۹ الی ۲۱</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">دسته‌بندی‌های اصلی</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/shop?category=refrigerator" className="hover:text-secondary transition-colors">یخچال فریزر و ساید بای ساید</Link></li>
              <li><Link to="/shop?category=washer" className="hover:text-secondary transition-colors">ماشین لباسشویی درب از جلو</Link></li>
              <li><Link to="/shop?category=dishwasher" className="hover:text-secondary transition-colors">ماشین ظرفشویی مبله و رومیزی</Link></li>
              <li><Link to="/shop?category=tv" className="hover:text-secondary transition-colors">تلویزیون‌های هوشمند 4K</Link></li>
              <li><Link to="/shop?category=air-conditioner" className="hover:text-secondary transition-colors">کولر گازی و اسپلیت اینورتر</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">خدمات مشتریان</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/track" className="hover:text-secondary transition-colors">پیگیری سفارش</Link></li>
              <li><Link to="/loyalty" className="hover:text-secondary transition-colors">طرح‌های اقساطی اسنپ‌پی</Link></li>
              <li><Link to="/faq" className="hover:text-secondary transition-colors">پرسش‌های متداول</Link></li>
              <li><Link to="/terms" className="hover:text-secondary transition-colors">قوانین و مقررات</Link></li>
              <li><Link to="/privacy" className="hover:text-secondary transition-colors">حریم خصوصی</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">نمادها و اعتبار</h4>
            <div className="bg-primary-dark/80 p-4 rounded-2xl border border-primary-light flex items-center justify-around gap-2">
              <div className="text-center">
                <ShieldCheck className="w-8 h-8 text-secondary mx-auto mb-1" />
                <span className="text-[10px] text-slate-300">ضمانت اصالت</span>
              </div>
              <div className="text-center">
                <Truck className="w-8 h-8 text-secondary mx-auto mb-1" />
                <span className="text-[10px] text-slate-300">ارسال مطمئن</span>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 text-secondary mx-auto mb-1" />
                <span className="text-[10px] text-slate-300">مجوز رسمی</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              تمامی حقوق برای فروشگاه لوازم خانگی نودهی محفوظ است.
            </p>
          </div>
        </div>

        <div className="max-w-container mx-auto px-4 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>طراحی شده با React + TypeScript و بک‌اند Laravel برای استقرار بر هاست PHP</span>
          <span>نسخه ۱.۰.۰ — ۱۴۰۳</span>
        </div>
      </footer>
    </div>
  );
};
