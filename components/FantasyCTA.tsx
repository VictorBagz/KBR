import React from 'react';
import { Trophy, Users, Shield, ArrowRight } from 'lucide-react';

export const FantasyCTA: React.FC = () => {
  return (
    <section id="fantasy" className="py-16 bg-gradient-to-r from-rugby-900 via-blue-950 to-rugby-900 relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-full px-4 py-1 text-blue-400 text-sm font-semibold">
              <Trophy size={16} /> Official Fantasy 2024
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Dream XV</span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Join over 2 million managers. Compete in private leagues, manage your salary cap, and prove you know more than the pundits.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center bg-rugby-950/40 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                 <Shield className="text-blue-400 mb-2" size={24} />
                 <span className="text-white font-bold">Pick Squad</span>
              </div>
              <div className="flex flex-col items-center bg-rugby-950/40 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                 <Users className="text-blue-400 mb-2" size={24} />
                 <span className="text-white font-bold">Join Leagues</span>
              </div>
              <div className="flex flex-col items-center bg-rugby-950/40 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                 <Trophy className="text-blue-400 mb-2" size={24} />
                 <span className="text-white font-bold">Win Prizes</span>
              </div>
            </div>

            <div className="pt-4">
              <button className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                Start Playing Now <ArrowRight size={20} />
              </button>
              <p className="mt-3 text-sm text-gray-400">Free to play. Terms and conditions apply.</p>
            </div>
          </div>

          {/* Visual Content - Abstract Field/Player Graphic */}
          <div className="relative h-[400px] bg-rugby-950/50 rounded-2xl border border-rugby-700 p-6 flex items-center justify-center overflow-hidden">
             {/* Abstract UI representation of fantasy selection */}
             <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://picsum.photos/800/800?random=10")' }}></div>
             
             <div className="relative z-10 w-full max-w-sm space-y-3">
               {/* Mock Player Card */}
               <div className="bg-rugby-800 border-l-4 border-green-500 p-3 rounded shadow-lg flex items-center justify-between transform translate-x-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                      <img src="https://picsum.photos/100/100?random=11" alt="Player" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Dupont (C)</div>
                      <div className="text-xs text-gray-400">Scrum Half</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">24 pts</div>
               </div>

               <div className="bg-rugby-800 border-l-4 border-blue-500 p-3 rounded shadow-lg flex items-center justify-between transform -translate-x-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                       <img src="https://picsum.photos/100/100?random=12" alt="Player" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Etzebeth</div>
                      <div className="text-xs text-gray-400">Lock</div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">18 pts</div>
               </div>

               <div className="bg-rugby-800 border-l-4 border-gray-500 p-3 rounded shadow-lg flex items-center justify-between transform translate-x-2 opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                       <img src="https://picsum.photos/100/100?random=13" alt="Player" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Russell</div>
                      <div className="text-xs text-gray-400">Fly Half</div>
                    </div>
                  </div>
                  <div className="text-gray-400 font-bold">--</div>
               </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};
