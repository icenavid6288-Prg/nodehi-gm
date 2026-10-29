import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Calendar, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductCard } from '../components/ProductCard';

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.getArticle(slug);
        if (res.ok && res.article) {
          setArticle(res.article);
          setRelatedProducts(res.relatedProducts || []);
        }
      } catch (err) {
        console.error('Error fetching blog post', err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-xs">در حال بارگذاری مقاله...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">مقاله مورد نظر یافت نشد</h2>
        <Link to="/blog" className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl">
          بازگشت به وبلاگ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'وبلاگ', to: '/blog' },
          { label: article.title },
        ]}
      />

      <article className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-secondary" />
                {article.author}
              </span>
            )}
            {article.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.date}
              </span>
            )}
            {article.read_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                زمان مطالعه: {article.read_time}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">
            {article.title}
          </h1>
        </div>

        {article.cover_image && (
          <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100">
            <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-4 bg-teal-50 border-r-4 border-secondary rounded-xl text-xs sm:text-sm font-semibold text-teal-900 leading-relaxed">
          {article.excerpt}
        </div>

        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-loose text-slate-700 whitespace-pre-line">
          {article.content}
        </div>
      </article>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4 pt-6">
          <h3 className="font-bold text-base text-slate-800">کالاهای مرتبط با این مقاله</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
