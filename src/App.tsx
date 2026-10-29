import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { Layout } from './components/Layout';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Track } from './pages/Track';
import { Login } from './pages/Login';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { Guides } from './pages/Guides';
import { Faq } from './pages/Faq';
import { Loyalty } from './pages/Loyalty';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Legal } from './pages/Legal';
import { Install } from './pages/Install';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'خطای غیرمنتظره در بارگذاری صفحه' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right" dir="rtl">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-lg space-y-4">
            <h1 className="text-xl font-black text-primary">فروشگاه اینترنتی لوازم خانگی نودهی</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              در بارگذاری این بخش خطایی رخ داد ({this.state.errorMessage}). می‌توانید به صفحه اصلی یا صفحه نصب‌کننده بروید.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
              >
                صفحه اصلی فروشگاه
              </a>
              <a
                href="/install"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="px-5 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold"
              >
                صفحه نصب و بررسی سلامت (/install)
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <BrandingProvider>
            <CartProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/index.html" element={<Home />} />
                  <Route path="/index.php" element={<Home />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/install.php" element={<Install />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/result" element={<Track />} />
                  <Route path="/track" element={<Track />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/account/*" element={<Account />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/loyalty" element={<Loyalty />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Legal />} />
                  <Route path="/privacy" element={<Legal />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </CartProvider>
          </BrandingProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
};

export default App;
