import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ArticleCard } from '../components/ArticleCard';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const Blog: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const res = await api.getArticles({ category: selectedCat || undefined });
        if (res.ok) {
          setArticles(res.articles || []);
          if (res.categories) setCategories(res.categories);
        }
      } catch (err) {
        console.error('Error fetching articles', err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [selectedCat]);

  return (
    <div className="max-w-container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'وبلاگ و اخبار نودهی' }]} />

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          وبلاگ تخصصی لوازم خانگی نودهی
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          جدیدترین راهنماهای خرید، مقایسه فناوری موتورهای اینورتر و راهکارهای نگهداری بهینه لوازم خانگی
        </p>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedCat('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCat === ''
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            همه مقالات
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCat(c.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCat === c.slug
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">مقاله‌ای در این دسته‌بندی یافت نشد.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} />
          ))}
        </div>
      )}
    </div>
  );
};
