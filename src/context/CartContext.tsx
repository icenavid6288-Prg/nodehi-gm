import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: number | string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  thumbnail?: string;
  quantity: number;
  color?: string;
  stock?: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  shippingCost: number;
  freeShippingProgress: number;
  discount: number;
  couponCode: string;
  total: number;
  addToCart: (product: any, quantity?: number, color?: string) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, qty: number) => void;
  clearCart: () => void;
  setCoupon: (code: string, discountAmount: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const FREE_SHIPPING_THRESHOLD = 5000000;
const DEFAULT_SHIPPING_FEE = 150000;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nodehi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem('nodehi_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = (product: any, quantity = 1, color?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => String(item.id) === String(product.id));
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + quantity;
        const maxStock = product.stock ?? 99;
        next[existingIdx].quantity = Math.min(newQty, maxStock);
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compare_price: product.compare_price,
          thumbnail: product.thumbnail || (product.images && product.images[0]) || '/icon.svg',
          quantity,
          color,
          stock: product.stock ?? 99,
        },
      ];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const updateQuantity = (id: number | string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          const maxStock = item.stock ?? 99;
          return { ...item, quantity: Math.min(qty, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setDiscount(0);
  };

  const setCoupon = (code: string, discountAmount: number) => {
    setCouponCode(code);
    setDiscount(discountAmount);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : DEFAULT_SHIPPING_FEE;
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const total = Math.max(0, subtotal - discount + shippingCost);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        shippingCost,
        freeShippingProgress,
        discount,
        couponCode,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
