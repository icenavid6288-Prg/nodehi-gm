import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { label: string; to?: string }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 py-3 overflow-x-auto">
      <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>خانه</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {item.to ? (
            <Link to={item.to} className="hover:text-primary transition-colors truncate">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800 truncate">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
