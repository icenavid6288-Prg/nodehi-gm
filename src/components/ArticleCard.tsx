import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';

interface ArticleCardProps {
  article: {
    id: number | string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image?: string;
    author?: string;
    read_time?: string;
    date?: string;
    category?: { name: string; slug: string };
  };
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <article className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col">
      <Link to={`/blog/${article.slug}`} className="block relative pt-[56.25%] overflow-hidden bg-slate-100">
        <img
          src={article.cover_image || 'https://picsum.photos/seed/article/600/350'}
          alt={article.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {article.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary/90 text-white text-[11px] font-semibold backdrop-blur-sm">
            {article.category.name}
          </span>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
            {article.read_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.read_time}
              </span>
            )}
            {article.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.date}
              </span>
            )}
          </div>

          <Link to={`/blog/${article.slug}`}>
            <h3 className="font-bold text-slate-800 text-base group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
              {article.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-secondary">
          <span>ادامه مطلب</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
};
