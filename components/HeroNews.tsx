import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';

export const HeroNews: React.FC = () => {
  return (
    <section className="relative w-full h-[600px] overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform group-hover:scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: 'url("https://picsum.photos/1920/1080?random=1")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-rugby-950 via-rugby-950/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
          <div className="max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 bg-rugby-accent text-white text-xs font-bold uppercase tracking-wider rounded-sm">
              Featured Story
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
              Six Nations Decider: France's New Tactical Evolution Tested Against Ireland
            </h1>
            <p className="text-lg text-gray-300 md:line-clamp-2 drop-shadow-md">
              Ahead of the weekend's blockbuster clash in Paris, we analyze how the French back-row rotation could be the key to unlocking the rigid Irish defense.
            </p>
            
            <div className="flex items-center gap-6 pt-4">
              <button className="flex items-center gap-2 bg-white text-rugby-950 px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors">
                Read Full Story <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={16} />
                <span>2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
