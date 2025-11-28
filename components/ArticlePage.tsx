import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, User, Share2, Loader2 } from 'lucide-react';
import { NewsItem } from '../types';
import { fetchNews } from '../services/newsService';

interface ArticlePageProps {
  articleId: string;
  onNavigate: (page: 'home' | 'news' | 'fixtures' | 'profile' | 'admin' | 'article', articleId?: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ articleId, onNavigate }) => {
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true);
      
      // First try to get from sessionStorage
      let storedArticle = sessionStorage.getItem(`article_${articleId}`);
      if (storedArticle) {
        const parsed = JSON.parse(storedArticle);
        setArticle(parsed);
      } else {
        // If not in sessionStorage, fetch from database
        const allNews = await fetchNews();
        const foundArticle = allNews.find(n => n.id === articleId);
        if (foundArticle) {
          setArticle(foundArticle);
          // Store it for future access
          sessionStorage.setItem(`article_${articleId}`, JSON.stringify(foundArticle));
        }
      }
      
      setLoading(false);
    };
    
    loadArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rugby-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-rugby-accent" size={40} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-rugby-950 pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => onNavigate('news')}
            className="flex items-center gap-2 text-rugby-accent hover:text-blue-400 mb-8 transition-colors"
          >
            <ArrowLeft size={20} /> Back to News
          </button>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
            <p className="text-gray-400 mb-8">The article you're looking for could not be loaded.</p>
            <button 
              onClick={() => onNavigate('news')}
              className="bg-rugby-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to News
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rugby-950 min-h-screen pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => onNavigate('news')}
          className="flex items-center gap-2 text-rugby-accent hover:text-blue-400 mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to News
        </button>

        <article className="bg-rugby-900 rounded-xl border border-rugby-800 overflow-hidden">
          <div className="relative h-96 overflow-hidden">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rugby-900 via-transparent to-transparent"></div>
            <span className="absolute top-4 left-4 bg-rugby-accent text-white px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm">
              {article.category}
            </span>
          </div>

          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-rugby-800 mb-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={16} />
                <span className="text-sm">{article.timestamp}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <User size={16} />
                <span className="text-sm">By {article.author}</span>
              </div>
              <button className="flex items-center gap-2 text-rugby-accent hover:text-blue-400 transition-colors ml-auto">
                <Share2 size={16} />
                <span className="text-sm">Share</span>
              </button>
            </div>

            <div className="mb-8">
              <p className="text-xl text-gray-300 leading-relaxed">
                {article.summary}
              </p>
            </div>

            <div className="space-y-6">
              {article.fullContent ? (
                <div
                  className="prose prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.fullContent }}
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                />
              ) : null}
            </div>

            <style>{`
              .prose h3 {
                font-size: 1.5rem;
                font-weight: bold;
                color: #f1f5f9;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              
              .prose p {
                font-size: 1.125rem;
                color: #a1a5ab;
                margin-bottom: 1rem;
                line-height: 1.75;
              }
              
              .prose ul {
                list-style: disc;
                margin-left: 1.5rem;
                margin-bottom: 1rem;
              }
              
              .prose li {
                color: #a1a5ab;
                margin-bottom: 0.5rem;
              }
              
              .prose strong {
                color: #f1f5f9;
                font-weight: 600;
              }
              
              .prose em {
                color: #cbd5e1;
                font-style: italic;
              }
              
              .prose div[style*="text-align: center"] {
                text-align: center;
                margin: 2rem 0;
              }
              
              .prose div[style*="text-align: center"] img {
                max-width: 100%;
                height: auto;
                border-radius: 0.5rem;
                display: inline-block;
              }
            `}</style>

            <div className="mt-12 pt-8 border-t border-rugby-800">
              <h3 className="text-2xl font-bold text-white mb-6">More News</h3>
              <button 
                onClick={() => onNavigate('news')}
                className="text-rugby-accent hover:text-blue-400 font-medium flex items-center gap-2 transition-colors"
              >
                View all articles →
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
