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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
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
  );
};

