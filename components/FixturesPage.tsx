
import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { Calendar, MapPin, Filter, ChevronLeft, ChevronRight, Trophy, Loader2 } from 'lucide-react';
import { fetchAllMatches } from '../services/liveMatchService';

const COMPETITIONS = ['All', 'Uganda Cup', 'National League', 'National 7s', 'National Friendlies', 'Off-season Friendly', 'Victoria Cup', 'Elgon Cup', 'Coronation 7s', 'University League'];

export const FixturesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'results'>('fixtures');
  const [selectedCompetition, setSelectedCompetition] = useState('All');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      const data = await fetchAllMatches();
      setMatches(data);
      setLoading(false);
    };
    loadMatches();
  }, []);

  // Filter data based on tab and sort properly
  const data = matches
    .filter(m => {
      if (activeTab === 'fixtures') {
        return m.status === 'UPCOMING' || m.status === 'LIVE' || m.status === 'HALFTIME';
      } else {
        return m.status === 'FINISHED';
      }
    })
    .sort((a, b) => {
      if (activeTab === 'fixtures') {
        // Ascending for upcoming
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      } else {
        // Descending for results
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }
    });

  const filteredData = data.filter(match => 
    selectedCompetition === 'All' || match.competition === selectedCompetition
  );

  return (
    <div className="bg-rugby-950 min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 border-b border-rugby-800 pb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">Match Center</h1>
          <p className="text-gray-400">Comprehensive fixtures, live scores, and historical results across all major competitions.</p>
        </div>

        {/* Controls: Tabs & Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          
          {/* Tabs */}
          <div className="bg-rugby-900 p-1 rounded-lg inline-flex border border-rugby-800">
            <button 
              onClick={() => setActiveTab('fixtures')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === 'fixtures' 
                  ? 'bg-rugby-accent text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upcoming Fixtures
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === 'results' 
                  ? 'bg-rugby-accent text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Recent Results
            </button>
          </div>

          {/* Competition Filter */}
          <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
            <span className="text-gray-500 text-sm font-medium whitespace-nowrap hidden md:block">Filter by:</span>
            {COMPETITIONS.map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedCompetition(comp)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedCompetition === comp
                    ? 'bg-white text-rugby-950 border-white'
                    : 'bg-transparent text-gray-400 border-rugby-700 hover:border-gray-400 hover:text-white'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-rugby-accent" size={32} />
          </div>
        )}

        {/* Match List */}
        {!loading && (
          <div className="space-y-4">
            {filteredData.length > 0 ? (
              filteredData.map((match) => (
                <div 
                  key={match.id} 
                  className="bg-rugby-900 hover:bg-rugby-800 border border-rugby-800 hover:border-rugby-700 rounded-xl p-0 overflow-hidden transition-all duration-200 group shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-stretch">
                    
                    {/* Date & Comp Column */}
                    <div className="bg-rugby-950/50 md:w-48 p-4 flex flex-col justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-rugby-800">
                      <span className="text-rugby-accent font-bold text-xs uppercase tracking-wider mb-1">{match.competition}</span>
                      <span className="text-white font-semibold flex items-center gap-2">
                         <Calendar size={14} className="text-gray-500" /> {match.date}
                      </span>
                      <span className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                        <MapPin size={12} /> {match.venue}
                      </span>
                    </div>

                    {/* Teams & Score Column */}
                    <div className="flex-grow p-4 md:p-6 flex items-center justify-between relative">
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                      {/* Home Team */}
                      <div className="flex-1 flex flex-col md:flex-row items-center md:justify-end gap-3 text-center md:text-right">
                        <span className="text-white font-bold text-lg md:text-xl order-2 md:order-1">{match.homeTeam}</span>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rugby-950 font-black text-xs shadow-lg order-1 md:order-2 overflow-hidden p-1">
                          {match.homeTeamLogo ? (
                            <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-full h-full object-contain" />
                          ) : (
                            match.homeTeam.substring(0,3).toUpperCase()
                          )}
                        </div>
                      </div>

                      {/* Score / Time */}
                      <div className="px-6 md:px-12 flex flex-col items-center justify-center shrink-0">
                        {match.status === 'FINISHED' ? (
                          <div className="flex flex-col items-center">
                            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                              {match.homeScore} - {match.awayScore}
                            </span>
                            <span className="text-xs text-gray-500 font-medium uppercase mt-1 bg-rugby-950 px-2 py-0.5 rounded">Full Time</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-3xl font-bold text-gray-200 bg-rugby-950/80 px-4 py-2 rounded-lg border border-rugby-700/50 font-mono">
                              {match.time}
                            </span>
                            <span className={`text-xs font-medium uppercase mt-2 ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-rugby-accent'}`}>
                              {match.status}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex flex-col md:flex-row items-center md:justify-start gap-3 text-center md:text-left">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rugby-950 font-black text-xs shadow-lg overflow-hidden p-1">
                          {match.awayTeamLogo ? (
                            <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-full h-full object-contain" />
                          ) : (
                            match.awayTeam.substring(0,3).toUpperCase()
                          )}
                        </div>
                        <span className="text-white font-bold text-lg md:text-xl">{match.awayTeam}</span>
                      </div>

                    </div>
                    
                    {/* Action Column */}
                    <div className="bg-rugby-950/30 w-full md:w-24 border-t md:border-t-0 md:border-l border-rugby-800 flex items-center justify-center p-2">
                       <button className="w-full h-full min-h-[40px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-rugby-800 rounded transition-colors group-hover:text-rugby-accent">
                          <ChevronRight size={24} />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-rugby-900/50 rounded-xl border border-rugby-800 border-dashed">
                <Trophy className="mx-auto h-12 w-12 text-rugby-700 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-white">No matches found</h3>
                <p className="text-gray-500">There are no {activeTab} matches for {selectedCompetition}.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination dummy */}
        {!loading && filteredData.length > 0 && (
          <div className="mt-12 flex justify-center items-center gap-4 text-sm text-gray-400">
             <button disabled className="opacity-50 flex items-center gap-1"><ChevronLeft size={16}/> Previous</button>
             <span className="text-white font-medium">Page 1</span>
             <button className="hover:text-white flex items-center gap-1">Next <ChevronRight size={16}/></button>
          </div>
        )}

      </div>
    </div>
  );
};