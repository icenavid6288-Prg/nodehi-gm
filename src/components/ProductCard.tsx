import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Zap, ShieldCheck, Check } from 'lucide-react';
import { formatPrice, toPersianDigits } from '../lib/format';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: {
    id: number | string;
    name: string;
    slug: string;
    price: number;
    compare_price?: number | null;
    thumbnail?: string;
    images?: string[];
    brand?: { name: string; name_fa?: string };
    category?: { name_fa?: string };
    energy_grade?: string;
    warranty?: string;
    stock?: number;
    is_inverter?: boolean;
    has_installment?: boolean;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = React.useState(false);

  const discountPercent =
    product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const isOutOfStock = (product.stock ?? 1) <= 0;
  const imageSrc = product.thumbnail || (product.images && product.images[0]) || '/icon.svg';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-secondary/40 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Badges Overlay */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-1">
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[11px] font-bold shadow-sm">
              {toPersianDigits(discountPercent)}٪ تخفیف
            </span>
          )}
          {product.is_inverter && (
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-secondary text-[10px] font-bold border border-teal-200 shadow-sm flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              اینورتر
            </span>
          )}
        </div>

        {product.energy_grade && (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            {product.energy_grade}
          </span>
        )}
      </div>

      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block relative pt-[85%] bg-slate-50/50 overflow-hidden">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/icon.svg';
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-white text-xs font-bold">
              ناموجود
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
            <span>{product.brand?.name_fa || product.brand?.name || 'برند اصیل'}</span>
            {product.has_installment && (
              <span className="text-secondary font-medium">اقساطی</span>
            )}
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-secondary transition-colors min-h-[40px] leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Warranty tag */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{product.warranty || 'ضمانت اصالت و گارانتی معتبر'}</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {product.compare_price && product.compare_price > product.price ? (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(product.compare_price)}
              </span>
            ) : null}
            <span className="text-sm font-black text-primary">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-primary text-white hover:bg-secondary'
            }`}
            title="افزودن به سبد خرید"
            aria-label="افزودن به سبد خرید"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
