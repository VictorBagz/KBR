
import React, { useEffect, useState } from 'react';
import { Match, MatchEvent } from '../types';
import { MapPin, Calendar, Activity, Info, Tv } from 'lucide-react';
import { getFeaturedLiveMatch, fetchAllMatches } from '../services/liveMatchService';
import { supabase } from '../services/supabaseClient';

interface MatchCenterProps {
  onNavigate?: (page: 'home' | 'news' | 'fixtures') => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ onNavigate }) => {
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [upcomingFixtures, setUpcomingFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLiveMatch = async () => {
    try {
      const data = await getFeaturedLiveMatch();
      if (data) {
        // Transform DB data to Match type
        setLiveMatch({
          id: data.id,
          homeTeam: data.home_team?.name || 'Home',
          awayTeam: data.away_team?.name || 'Away',
          homeTeamLogo: data.home_team?.logo_url,
          awayTeamLogo: data.away_team?.logo_url,
          homeScore: data.home_score,
          awayScore: data.away_score,
          status: data.status,
          time: data.match_time,
          date: 'Today',
          startTime: data.start_time,
          venue: data.venue,
          competition: data.competition,
          commentary: data.commentary,
          events: data.events || []
        });
      }

      // Fetch upcoming for sidebar
      const allMatches = await fetchAllMatches();
      const upcoming = allMatches
        .filter(m => m.status === 'UPCOMING' && m.id !== data?.id)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) // Sort by soonest first
        .slice(0, 5); // Take top 5
      setUpcomingFixtures(upcoming);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial Fetch
    loadLiveMatch();

    // Realtime Subscription
    const channel = supabase
      .channel('live_match_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_matches' },
        (payload) => {
          console.log('Live Match Updated:', payload);
          loadLiveMatch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events' },
        (payload) => {
          console.log('Match Event Updated:', payload);
          loadLiveMatch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to render events for a side
  const renderEvents = (side: 'home' | 'away') => {
    if (!liveMatch?.events) return null;
    // Sort events by match_time descending (newest/most recent first)
    const sortedEvents = [...liveMatch.events]
      .filter(e => e.team_side === side)
      .sort((a, b) => {
        // Parse time strings to compare numerically
        const timeA = parseInt(a.match_time?.split(':')[0] || '0');
        const timeB = parseInt(b.match_time?.split(':')[0] || '0');
        return timeB - timeA;
      });
    
    return sortedEvents.map(e => (
      <div key={e.id} className="text-xs text-gray-400 animate-in slide-in-from-bottom-1 max-w-full px-1">
         <span className="text-white font-medium truncate block">{e.player_name}</span> 
         <span className="opacity-70 text-[10px]">{e.match_time} ({e.event_type === 'CONVERSION' ? 'Con' : e.event_type === 'PENALTY' ? 'Pen' : 'Try'})</span>
      </div>
    ));
  };

  // Determine if the match is actually "Live" for the viewer
  const isMatchActive = liveMatch && (liveMatch.status === 'LIVE' || liveMatch.status === 'HALFTIME');

  return (
    <section id="match-center-section" className="py-12 bg-rugby-900 border-t border-rugby-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center space-x-2 mb-8">
           <div className="h-8 w-1 bg-rugby-accent rounded-full"></div>
           <h2 className="text-3xl font-bold text-white">Match Center</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live Match Preview */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-rugby-800 to-rugby-900 rounded-2xl p-6 border border-rugby-700 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center min-h-[400px]">
              <div className="absolute top-0 right-0 p-32 bg-rugby-accent/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              
              {loading ? (
                 <div className="flex items-center justify-center h-full text-gray-400 animate-pulse">Loading Live Match Data...</div>
              ) : isMatchActive ? (
                <>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                     <span className={`flex items-center gap-2 font-bold ${liveMatch.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                        <Activity size={18} /> {liveMatch.status} {liveMatch.time}
                     </span>
                     <span className="text-gray-400 text-sm uppercase tracking-widest font-semibold">{liveMatch.competition}</span>
                  </div>

                  {/* Scoreboard Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                    
                    {/* Home Team */}
                    <div className="flex flex-col items-center min-w-0">
                       <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center p-2 mb-4 shadow-lg transform hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                          {liveMatch.homeTeamLogo ? (
                             <img src={liveMatch.homeTeamLogo} alt={liveMatch.homeTeam} className="w-full h-full object-contain" />
                          ) : (
                             <span className="text-rugby-950 font-black text-lg md:text-2xl">{liveMatch.homeTeam.substring(0,3).toUpperCase()}</span>
                          )}
                       </div>
                       <h3 className="text-sm md:text-2xl font-bold text-white text-center line-clamp-2 w-full">{liveMatch.homeTeam}</h3>
                       
                       {/* Home Scorers List */}
                       <div className="mt-4 flex flex-col items-center gap-1 max-h-32 overflow-y-auto w-full custom-scrollbar">
                          {renderEvents('home')}
                       </div>
                    </div>
                    
                    {/* Scores */}
                    <div className="flex flex-col items-center justify-start pt-4">
                       <div className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg whitespace-nowrap">
                         {liveMatch.homeScore} - {liveMatch.awayScore}
                       </div>
                       {liveMatch.commentary && (
                         <div className="mt-6 px-3 py-2 bg-rugby-950/80 rounded-lg text-xs md:text-sm text-gray-300 border border-rugby-700 font-medium text-center w-full max-w-sm animate-in fade-in break-words whitespace-normal">
                            <span className="text-rugby-accent font-bold uppercase text-[10px] block mb-1">Live Update</span>
                            {liveMatch.commentary}
                         </div>
                       )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center min-w-0">
                       <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center p-2 mb-4 shadow-lg transform hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                          {liveMatch.awayTeamLogo ? (
                             <img src={liveMatch.awayTeamLogo} alt={liveMatch.awayTeam} className="w-full h-full object-contain" />
                          ) : (
                             <span className="text-rugby-950 font-black text-lg md:text-2xl">{liveMatch.awayTeam.substring(0,3).toUpperCase()}</span>
                          )}
                       </div>
                       <h3 className="text-sm md:text-2xl font-bold text-white text-center line-clamp-2 w-full">{liveMatch.awayTeam}</h3>
                       
                       {/* Away Scorers List */}
                       <div className="mt-4 flex flex-col items-center gap-1 max-h-32 overflow-y-auto w-full custom-scrollbar">
                          {renderEvents('away')}
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-2 text-gray-400 text-sm relative z-10 mt-auto">
                     <MapPin size={16} />
                     <span>{liveMatch.venue}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 relative z-10">
                   <div className="w-20 h-20 rounded-full bg-rugby-950/50 flex items-center justify-center mb-6 border border-rugby-800">
                      <Tv size={32} className="opacity-50 text-gray-400"/>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">No Live Match</h3>
                   <p className="text-sm text-gray-400 max-w-xs text-center">
                     There are currently no games in progress. Check the fixture list for upcoming kick-offs.
                   </p>
                   {liveMatch && liveMatch.status === 'UPCOMING' && (
                     <div className="mt-6 px-4 py-2 bg-rugby-950/80 rounded border border-rugby-800 text-xs text-gray-400">
                        Next Up: <span className="text-white font-bold">{liveMatch.homeTeam} vs {liveMatch.awayTeam}</span>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          {/* Fixtures List */}
          <div className="bg-rugby-800/30 rounded-2xl border border-rugby-800 p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-rugby-accent" /> Upcoming Fixtures
            </h3>
            
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {upcomingFixtures.length > 0 ? (
                upcomingFixtures.map((match) => (
                  <div 
                    key={match.id} 
                    onClick={() => {
                      // Load the clicked fixture into live match view (optional enhancement)
                      console.log('Fixture clicked:', match.id);
                    }}
                    className="bg-rugby-900/50 p-4 rounded-lg border border-rugby-800 hover:border-rugby-600 hover:bg-rugby-900 transition-all cursor-pointer group active:scale-95 transform"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span className="uppercase font-semibold">{match.competition}</span>
                      <span>{match.date}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                         {match.homeTeamLogo && <img src={match.homeTeamLogo} className="w-5 h-5 object-contain bg-white rounded-full p-0.5" alt={match.homeTeam} />}
                         <span className="text-gray-200 font-medium group-hover:text-white text-sm">{match.homeTeam}</span>
                      </div>
                      <span className="text-gray-500 text-xs mx-1">vs</span>
                      <div className="flex items-center gap-2 justify-end">
                         <span className="text-gray-200 font-medium text-right group-hover:text-white text-sm">{match.awayTeam}</span>
                         {match.awayTeamLogo && <img src={match.awayTeamLogo} className="w-5 h-5 object-contain bg-white rounded-full p-0.5" alt={match.awayTeam} />}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div className="px-2 py-1 bg-rugby-950 rounded text-xs text-gray-400 truncate max-w-[120px]">{match.venue}</div>
                      <div className="text-sm font-bold text-rugby-accent bg-blue-900/20 px-2 py-1 rounded group-hover:bg-blue-900/40 transition-colors">{match.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm py-10">
                  No upcoming fixtures scheduled.
                </div>
              )}
            </div>
            <button onClick={() => onNavigate && onNavigate('fixtures')} className="w-full mt-4 py-2 text-center text-sm text-gray-400 hover:text-white border border-rugby-700 rounded-lg hover:bg-rugby-800 transition-colors">View All Fixtures</button>
          </div>
        </div>
      </div>
    </section>
  );
};