import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, Loader2 } from 'lucide-react';
import { fetchFeaturedNews } from '../services/newsService';
import { NewsItem } from '../types';

interface HeroNewsProps {
  onNavigate?: (page: 'home' | 'news' | 'fixtures' | 'profile' | 'admin' | 'article', articleId?: string) => void;
}

export const HeroNews: React.FC<HeroNewsProps> = ({ onNavigate }) => {
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFeaturedNews = async () => {
      setLoading(true);
      const featured = await fetchFeaturedNews();
      setFeaturedNews(featured);
      setLoading(false);
    };
    getFeaturedNews();
  }, []);

  if (loading) {
    return (
      <section className="relative w-full h-[600px] overflow-hidden flex items-center justify-center bg-rugby-900">
        <Loader2 className="animate-spin text-rugby-accent" size={40} />
      </section>
    );
  }

  const news = featuredNews || {
    id: 'default',
    title: 'Latest Rugby News',
    summary: 'Check back soon for the latest featured stories',
    imageUrl: 'https://picsum.photos/1920/1080?random=1',
    category: 'News',
    timestamp: 'Now',
    author: 'KBR'
  };

  const formatTimeAgo = (timestamp: string): string => {
    // If timestamp is already formatted like "27 Nov", return as is
    if (timestamp.includes(' ')) return timestamp;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return timestamp;
  };
  return (
    <section className="relative w-full h-[600px] overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform group-hover:scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: `url("${news.imageUrl}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-rugby-950 via-rugby-950/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
          <div className="max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 bg-rugby-accent text-white text-xs font-bold uppercase tracking-wider rounded-sm">
              {news.category}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
              {news.title}
            </h1>
            <p className="text-lg text-gray-300 line-clamp-3 drop-shadow-md">
              {news.summary}
            </p>
            
            <div className="flex items-center gap-6 pt-4">
              <button 
                onClick={() => {
                  if (onNavigate && news.id !== 'default') {
                    sessionStorage.setItem(`article_${news.id}`, JSON.stringify(news));
                    onNavigate('article', news.id);
                  }
                }}
                className="flex items-center gap-2 bg-white text-rugby-950 px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors"
              >
                Read Full Story <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={16} />
                <span>{formatTimeAgo(news.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
