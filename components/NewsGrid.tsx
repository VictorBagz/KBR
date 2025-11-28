import React, { useEffect, useState } from 'react';
import { NewsItem } from '../types';
import { PlayCircle, Clock } from 'lucide-react';
import { fetchNews } from '../services/newsService';

// Fallback data if DB is empty
const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Smith ruled out of Premiership final after training injury',
    summary: 'The Harlequins fly-half suffered a hamstring setback during Tuesday\'s session.',
    imageUrl: 'https://picsum.photos/600/400?random=2',
    category: 'Premiership',
    timestamp: '4h ago',
    author: 'Tom Fordyce'
  },
  {
    id: '2',
    title: 'All Blacks squad announcement: 3 shock inclusions',
    summary: 'Scott Robertson has named his first squad for the Rugby Championship with some surprises.',
    imageUrl: 'https://picsum.photos/600/400?random=3',
    category: 'Internationals',
    timestamp: '6h ago',
    author: 'Rugby Pass'
  },
  {
    id: '3',
    title: 'Video: The try of the century? Watch stunning solo effort',
    summary: 'From his own try line, the winger beat 7 defenders to score.',
    imageUrl: 'https://picsum.photos/600/400?random=4',
    category: 'URC',
    timestamp: '8h ago',
    author: 'Staff Writer'
  },
  {
    id: '4',
    title: 'Transfer Rumors: Top 10 potential moves this summer',
    summary: 'Tracking the biggest names in the sport as contracts expire across Europe.',
    imageUrl: 'https://picsum.photos/600/400?random=5',
    category: 'Transfers',
    timestamp: '12h ago',
    author: 'The Analyst'
  }
];

export const NewsGrid: React.FC<{ onNavigate: (page: 'home' | 'news' | 'fixtures' | 'profile' | 'admin') => void }> = ({ onNavigate }) => {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);

  useEffect(() => {
    const getNews = async () => {
      const data = await fetchNews();
      if (data && data.length > 0) {
        setNews(data.slice(0, 4)); // Only show top 4 on home grid
      }
    };
    getNews();
  }, []);

  return (
    <section className="py-12 bg-rugby-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-white">Latest Headlines</h2>
          <span onClick={() => onNavigate('news')} className="text-rugby-accent text-sm font-medium cursor-pointer hover:underline transition-all">View All News &rarr;</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {news.map((item) => (
            <article key={item.id} className="group flex flex-col bg-rugby-900 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-rugby-900/50 transition-all duration-300 border border-rugby-800 hover:border-rugby-700">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 bg-rugby-950/80 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-white rounded">
                  {item.category}
                </span>
                {item.title.startsWith('Video') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <PlayCircle size={40} className="text-white opacity-80 group-hover:opacity-100" />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-rugby-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
                  {item.summary}
                </p>
                <div className="flex items-center text-xs text-rugby-muted mt-auto">
                  <Clock size={12} className="mr-1" />
                  <span className="mr-3">{item.timestamp}</span>
                  <span className="text-gray-500 border-l border-rugby-700 pl-3">By {item.author}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};