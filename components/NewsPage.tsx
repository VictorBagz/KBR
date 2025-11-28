import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { PlayCircle, Clock, Filter, Search, ChevronRight, Loader2 } from 'lucide-react';
import { fetchNews } from '../services/newsService';

interface NewsPageProps {
  onNavigate?: (page: 'home' | 'news' | 'fixtures' | 'profile' | 'admin' | 'article', articleId?: string) => void;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Smith ruled out of Premiership final after training injury',
    summary: 'The Harlequins fly-half suffered a hamstring setback during Tuesday\'s session, leaving the coaching staff scrambling for a replacement ahead of the big game.',
    imageUrl: 'https://picsum.photos/600/400?random=2',
    category: 'National team',
    timestamp: '4h ago',
    author: 'Tom Fordyce'
  },
  {
    id: '2',
    title: 'All Blacks squad announcement: 3 shock inclusions',
    summary: 'Scott Robertson has named his first squad for the Rugby Championship with some surprises, including a debutant prop from the Crusaders.',
    imageUrl: 'https://picsum.photos/600/400?random=3',
    category: 'International',
    timestamp: '6h ago',
    author: 'Rugby Pass'
  },
  {
    id: '3',
    title: 'Video: The try of the century? Watch stunning solo effort',
    summary: 'From his own try line, the winger beat 7 defenders to score what is being hailed as the greatest solo try in URU history.',
    imageUrl: 'https://picsum.photos/600/400?random=4',
    category: 'URU',
    timestamp: '8h ago',
    author: 'Staff Writer'
  }
];

const CATEGORIES = ['All', 'Ugandas Cup', 'URU', 'International', 'National 7s', 'National team', 'Transfers', 'Pre-season'];

export const NewsPage: React.FC<NewsPageProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allNews, setAllNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleArticleClick = (articleId: string) => {
    if (onNavigate) {
      sessionStorage.setItem(`article_${articleId}`, JSON.stringify(allNews.find(n => n.id === articleId)));
      onNavigate('article', articleId);
    }
  };

  useEffect(() => {
    const getNews = async () => {
      setLoading(true);
      const data = await fetchNews();
      if (data && data.length > 0) {
        setAllNews(data);
      }
      setLoading(false);
    };
    getNews();
  }, []);

  const filteredNews = allNews.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="bg-rugby-950 min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-rugby-800 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">Rugby News Hub</h1>
            <p className="text-gray-400">Breaking stories, expert analysis, and exclusive interviews.</p>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search news..." 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-rugby-900 border border-rugby-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rugby-accent w-full md:w-64 placeholder-gray-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category 
                  ? 'bg-rugby-accent text-white shadow-lg shadow-blue-900/50' 
                  : 'bg-rugby-900 text-gray-400 hover:bg-rugby-800 hover:text-white border border-rugby-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
           <div className="flex justify-center py-20">
             <Loader2 className="animate-spin text-rugby-accent" size={32} />
           </div>
        )}

        {/* News Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedNews.length > 0 ? (
              paginatedNews.map((item) => (
                <article key={item.id} className="group flex flex-col bg-rugby-900 rounded-xl overflow-hidden border border-rugby-800 hover:border-rugby-600 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300">
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rugby-900 via-transparent to-transparent opacity-60"></div>
                    <span className="absolute top-3 left-3 bg-rugby-950/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white rounded-sm uppercase tracking-wide border-l-2 border-rugby-accent">
                      {item.category}
                    </span>
                    {item.title.startsWith('Video') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <PlayCircle size={48} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-xs text-rugby-muted mb-3">
                      <Clock size={12} />
                      <span>{item.timestamp}</span>
                      <span className="w-1 h-1 bg-rugby-700 rounded-full"></span>
                      <span className="text-rugby-accent">{item.author}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3 leading-snug group-hover:text-rugby-accent transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
                      {item.summary}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-rugby-800 flex items-center text-rugby-accent text-sm font-semibold group-hover:translate-x-1 transition-transform cursor-pointer" onClick={() => handleArticleClick(item.id)}>
                      Read Article <ChevronRight size={16} className="ml-1" />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <Filter className="mx-auto h-12 w-12 text-rugby-700 mb-4" />
                <h3 className="text-xl font-medium text-white">No articles found</h3>
                <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                <button 
                  onClick={() => {setActiveCategory('All'); setSearchQuery('');}}
                  className="mt-6 text-rugby-accent hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredNews.length > itemsPerPage && (
          <div className="mt-16 flex justify-center">
            <nav className="flex gap-2">
              {/* Previous Button */}
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-rugby-900 text-gray-400 hover:bg-rugby-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    currentPage === page
                      ? 'bg-rugby-accent text-white shadow-lg shadow-blue-900/50'
                      : 'bg-rugby-900 text-gray-400 hover:bg-rugby-800 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-rugby-900 text-gray-400 hover:bg-rugby-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};