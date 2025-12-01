
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Save, Image, Loader2, ArrowLeft, LayoutDashboard, Shield, FileText, MapPin, Activity, Play, Pause, Square, UserPlus, Undo2, Upload, Camera, Clock, CheckCircle2, AlertCircle, StopCircle, Calendar } from 'lucide-react';
import { fetchNews, createNews, updateNews, deleteNews } from '../services/newsService';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '../services/teamService';
import { getFeaturedLiveMatch, updateLiveMatch, createLiveMatchEntry, addScoringEvent, deleteMatchEvent, fetchAllMatches, createMatch, deleteMatch } from '../services/liveMatchService';
import { uploadContentImage } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { NewsItem, Team, LiveMatchDB, MatchEvent, Match } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface AdminDashboardProps {
  onNavigate: (page: 'home' | 'news' | 'fixtures' | 'profile' | 'admin' | 'article') => void;
}

type Tab = 'news' | 'teams' | 'live' | 'fixtures';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingLive, setSavingLive] = useState(false); 
  
  // Data State
  const [news, setNews] = useState<NewsItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]); // For Fixtures Tab
  const [liveMatch, setLiveMatch] = useState<LiveMatchDB | null>(null);

  // Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // File Refs
  const newsFileRef = useRef<HTMLInputElement>(null);
  const teamFileRef = useRef<HTMLInputElement>(null);

  // Forms
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    image_url: '',
    category: 'Uganda Cup',
    author: 'Admin',
    featured: false,
    fullContent: ''
  });
  const [newsFile, setNewsFile] = useState<File | null>(null);

  const [teamForm, setTeamForm] = useState({
    name: '',
    category: 'Men',
    home_ground: '',
    logo_url: ''
  });
  const [teamFile, setTeamFile] = useState<File | null>(null);

  // Fixture Form
  const [fixtureForm, setFixtureForm] = useState({
    home_team_id: '',
    away_team_id: '',
    venue: '',
    competition: 'URC',
    status: 'UPCOMING',
    match_time: '15:00', // Display time e.g. 15:00
    fixture_date: '', // ISO date string
    home_score: 0,
    away_score: 0
  });

  // Live Match Setup Form (Specifically for the Live Controller tab)
  const [liveSetupForm, setLiveSetupForm] = useState({
    home_team_id: '',
    away_team_id: '',
    venue: '',
    competition: '',
  });

  // Live Controls Inputs
  const [matchTime, setMatchTime] = useState('00:00');
  const [commentary, setCommentary] = useState('');
  const [scorerName, setScorerName] = useState(''); 
  const [matchPeriod, setMatchPeriod] = useState('First Half'); 

  // --- Helpers for Time ---
  const parseSeconds = (timeStr: string) => {
    if (!timeStr) return 0;
    // Handle both MM:SS and HH:MM formats
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 2) {
      const [mins, secs] = parts;
      return (mins * 60) + (secs || 0);
    }
    // Fallback for non-formatted input
    return parseInt(timeStr) || 0;
  };

  const formatSeconds = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const loadData = async () => {
    if (activeTab === 'news' && news.length === 0) setLoading(true);
    if (activeTab === 'teams' && teams.length === 0) setLoading(true);
    if (activeTab === 'fixtures') setLoading(true);
    if (activeTab === 'live' && !liveMatch) setLoading(true);

    if (activeTab === 'news') {
      const data = await fetchNews();
      setNews(data);
      setLoading(false);
    } else if (activeTab === 'teams') {
      const data = await fetchTeams();
      setTeams(data);
      setLoading(false);
    } else if (activeTab === 'fixtures') {
      const t = await fetchTeams();
      setTeams(t);
      const m = await fetchAllMatches();
      setAllMatches(m);
      setLoading(false);
    } else if (activeTab === 'live') {
      let teamsData = teams;
      if (teamsData.length === 0) {
        teamsData = await fetchTeams();
        setTeams(teamsData);
      }
      
      const liveData = await getFeaturedLiveMatch();
      
      if (liveData) {
        setLiveMatch(liveData);
        // Only prepopulate setup if empty to avoid overwriting user edits if they switch tabs briefly
        if (!liveSetupForm.home_team_id) {
           setLiveSetupForm({
             home_team_id: liveData.home_team_id,
             away_team_id: liveData.away_team_id,
             venue: liveData.venue,
             competition: liveData.competition,
           });
           setMatchTime(liveData.match_time);
           setTimerSeconds(parseSeconds(liveData.match_time));
           setCommentary(liveData.commentary);
        }
      } else {
        const newItem = await createLiveMatchEntry();
        setLiveMatch(newItem);
        setLiveSetupForm({ home_team_id: '', away_team_id: '', venue: '', competition: '' });
      }
      setLoading(false);
    }
  };

  const refreshLiveMatch = async () => {
    const liveData = await getFeaturedLiveMatch();
    if (liveData) setLiveMatch(liveData);
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // --- Timer Logic ---
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev + 1;
          setMatchTime(formatSeconds(next));
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && timerSeconds % 10 === 0 && timerSeconds > 0) {
      if(liveMatch) {
         updateLiveMatch(liveMatch.id, { match_time: formatSeconds(timerSeconds) });
      }
    }
  }, [timerSeconds, timerRunning, liveMatch]);

  // --- Handlers: Live Match Control ---

  const handleStartMatch = async () => {
    setTimerRunning(true);
    if (liveMatch) {
       await updateLiveMatch(liveMatch.id, { status: 'LIVE' });
       setLiveMatch({...liveMatch, status: 'LIVE'});
    }
  };

  const handlePauseMatch = async () => {
    setTimerRunning(false);
    if (liveMatch) {
       await updateLiveMatch(liveMatch.id, { match_time: formatSeconds(timerSeconds) });
    }
  };

  const handleEndMatch = async () => {
    setTimerRunning(false);
    if (liveMatch) {
      setSavingLive(true);
      try {
        // Save match as FINISHED with final scores and time
        await updateLiveMatch(liveMatch.id, { 
          status: 'FINISHED', 
          match_time: formatSeconds(timerSeconds),
          home_score: liveMatch.home_score,
          away_score: liveMatch.away_score
        });
        
        // Update UI to show match finished
        setLiveMatch({...liveMatch, status: 'FINISHED'});
        
        // Reset timer and controls for next match
        setTimerSeconds(0);
        setMatchTime('00:00');
        setCommentary('');
        setScorerName('');
        setMatchPeriod('First Half');
        setLiveSetupForm({ home_team_id: '', away_team_id: '', venue: '', competition: '' });
        
        alert('Match finished! Results saved.');
      } catch (e) {
        console.error(e);
        alert('Failed to end match');
      } finally {
        setSavingLive(false);
      }
    }
  };

  const handleUpdatePeriod = async (period: string) => {
    setMatchPeriod(period);
  };

  const handleResetMatch = async () => {
    if (!liveMatch) return;
    if (!window.confirm('Are you sure? This will reset all scores and events for this match.')) return;

    setSavingLive(true);
    try {
      // Reset match data in database
      await updateLiveMatch(liveMatch.id, {
        status: 'UPCOMING',
        match_time: '00:00',
        home_score: 0,
        away_score: 0,
        commentary: ''
      });

      // Delete all events associated with this match
      const { error } = await supabase
        .from('match_events')
        .delete()
        .eq('live_match_id', liveMatch.id);

      if (error) throw error;

      // Reset UI state
      setLiveMatch({
        ...liveMatch,
        status: 'UPCOMING',
        match_time: '00:00',
        home_score: 0,
        away_score: 0,
        commentary: '',
        events: []
      });

      // Reset all controls
      setTimerRunning(false);
      setTimerSeconds(0);
      setMatchTime('00:00');
      setCommentary('');
      setScorerName('');
      setMatchPeriod('First Half');

      alert('Match reset successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to reset match');
    } finally {
      setSavingLive(false);
    }
  };

  // --- Handlers: Live Match Scoring ---
  const handleScore = async (side: 'home' | 'away', type: 'TRY' | 'CONVERSION' | 'PENALTY' | 'DROP_GOAL' | 'YELLOW_CARD' | 'RED_CARD', points: number) => {
    if (!liveMatch) return;
    if (!scorerName) {
      alert("Please enter a player name first.");
      return;
    }

    const newHomeScore = side === 'home' ? liveMatch.home_score + points : liveMatch.home_score;
    const newAwayScore = side === 'away' ? liveMatch.away_score + points : liveMatch.away_score;
    
    const optimisticEvent: MatchEvent = {
      id: 'temp-' + Date.now(),
      live_match_id: liveMatch.id,
      team_side: side,
      player_name: scorerName,
      event_type: type,
      points: points,
      match_time: matchTime
    };

    setLiveMatch({
      ...liveMatch,
      home_score: newHomeScore,
      away_score: newAwayScore,
      events: [optimisticEvent, ...(liveMatch.events || [])]
    });

    const nameToSave = scorerName;
    setScorerName(''); 

    try {
      await addScoringEvent(liveMatch.id, side, side === 'home' ? liveMatch.home_score : liveMatch.away_score, {
        player_name: nameToSave,
        event_type: type,
        points: points,
        match_time: matchTime
      });
      refreshLiveMatch();
    } catch (e) {
      console.error(e);
      alert('Failed to save score. Please refresh.');
    }
  };

  const handleUndoEvent = async (event: MatchEvent) => {
    if (!liveMatch) return;
    if(!window.confirm(`Remove ${event.event_type} by ${event.player_name}?`)) return;

    setSavingLive(true);
    const currentTotal = event.team_side === 'home' ? liveMatch.home_score : liveMatch.away_score;
    try {
      await deleteMatchEvent(liveMatch.id, event.id, event.team_side, event.points, currentTotal);
      await refreshLiveMatch();
    } catch(e) {
      alert("Failed to undo");
    } finally {
      setSavingLive(false);
    }
  }

  const saveLiveDetails = async () => {
    if (!liveMatch) return;
    setSavingLive(true);
    try {
      await updateLiveMatch(liveMatch.id, {
        match_time: matchTime,
        commentary: commentary
      });
      alert("Time & Commentary Saved");
    } catch (e) {
      alert("Failed to update");
    } finally {
      setSavingLive(false);
    }
  };

  const saveMatchSetup = async () => {
    if (!liveMatch) return;
    setSavingLive(true);
    try {
      await updateLiveMatch(liveMatch.id, liveSetupForm);
      await refreshLiveMatch();
      alert('Match Setup Saved');
    } catch (e) {
      console.error(e);
      alert('Failed to save setup');
    } finally {
      setSavingLive(false);
    }
  };

  // --- Modal Logic (News/Teams/Fixtures) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (activeTab === 'news') {
        let finalImageUrl = newsForm.image_url;
        if (newsFile) {
           finalImageUrl = await uploadContentImage(newsFile, 'news');
        }
        const payload = { ...newsForm, image_url: finalImageUrl };
        if (currentId) await updateNews(currentId, payload);
        else await createNews(payload);

      } else if (activeTab === 'teams') {
        let finalLogoUrl = teamForm.logo_url;
        if (teamFile) {
          finalLogoUrl = await uploadContentImage(teamFile, 'teams');
        }
        const payload = { ...teamForm, logo_url: finalLogoUrl };
        if (currentId) await updateTeam(currentId, payload);
        else await createTeam(payload);
      
      } else if (activeTab === 'fixtures') {
        // Construct payload for match
        const payload = {
          home_team_id: fixtureForm.home_team_id,
          away_team_id: fixtureForm.away_team_id,
          venue: fixtureForm.venue,
          competition: fixtureForm.competition,
          status: fixtureForm.status,
          match_time: fixtureForm.match_time,
          home_score: fixtureForm.home_score,
          away_score: fixtureForm.away_score,
          start_time: fixtureForm.fixture_date ? new Date(fixtureForm.fixture_date).toISOString() : new Date().toISOString()
        };

        if (currentId) await updateLiveMatch(currentId, payload);
        else await createMatch(payload);
      }

      setIsEditing(false);
      setCurrentId(null);
      resetForms();
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to save');
    } finally {
      setUploading(false);
    }
  };

  const resetForms = () => {
    setNewsForm({ title: '', summary: '', image_url: '', category: 'Ugandas Cup', author: 'Admin', featured: false, fullContent: '' });
    setNewsFile(null);
    setTeamForm({ name: '', category: 'Men', home_ground: '', logo_url: '' });
    setTeamFile(null);
    setFixtureForm({ home_team_id: '', away_team_id: '', venue: '', competition: 'URC', status: 'UPCOMING', match_time: '15:00', fixture_date: '', home_score: 0, away_score: 0 });
  }

  const openNewModal = () => {
    setIsEditing(true);
    setCurrentId(null);
    resetForms();
  };

  const handleEditNews = (item: NewsItem) => {
    setNewsForm({ title: item.title, summary: item.summary, image_url: item.imageUrl, category: item.category, author: item.author, featured: item.featured || false, fullContent: item.fullContent || '' });
    setNewsFile(null);
    setCurrentId(item.id);
    setIsEditing(true);
  };
  const handleDeleteNews = async (id: string) => { if (window.confirm('Sure?')) { await deleteNews(id); loadData(); } };
  
  const handleEditTeam = (item: Team) => {
    setTeamForm({ name: item.name, category: item.category, home_ground: item.homeGround, logo_url: item.logoUrl });
    setTeamFile(null);
    setCurrentId(item.id);
    setIsEditing(true);
  };
  const handleDeleteTeam = async (id: string) => { if (window.confirm('Sure?')) { await deleteTeam(id); loadData(); } };

  const handleEditFixture = (item: Match) => {
    const homeTeamObj = teams.find(t => t.name === item.homeTeam);
    const awayTeamObj = teams.find(t => t.name === item.awayTeam);
    
    setFixtureForm({
      home_team_id: homeTeamObj?.id || '',
      away_team_id: awayTeamObj?.id || '',
      venue: item.venue,
      competition: item.competition,
      status: item.status,
      match_time: item.time, // e.g. "15:00" or "80'"
      fixture_date: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      home_score: item.homeScore || 0,
      away_score: item.awayScore || 0
    });
    setCurrentId(item.id);
    setIsEditing(true);
  };

  const handleDeleteFixture = async (id: string) => {
    if (window.confirm('Delete this fixture?')) {
      await deleteMatch(id);
      loadData();
    }
  };

  const handleNewsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setNewsFile(e.target.files[0]); };
  const handleTeamFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setTeamFile(e.target.files[0]); };

  return (
    <div className="bg-rugby-950 min-h-screen pb-12">
      {/* Navbar */}
      <div className="bg-rugby-900 border-b border-rugby-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-white">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <LayoutDashboard className="text-rugby-accent" /> Admin Dashboard
              </h1>
           </div>
           
           <div className="flex bg-rugby-950 rounded-lg p-1 border border-rugby-800 overflow-x-auto">
              <button onClick={() => setActiveTab('news')} className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap flex gap-2 ${activeTab === 'news' ? 'bg-rugby-800 text-white' : 'text-gray-400'}`}>
                <FileText size={16} /> News
              </button>
              <button onClick={() => setActiveTab('teams')} className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap flex gap-2 ${activeTab === 'teams' ? 'bg-rugby-800 text-white' : 'text-gray-400'}`}>
                <Shield size={16} /> Clubs
              </button>
              <button onClick={() => setActiveTab('fixtures')} className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap flex gap-2 ${activeTab === 'fixtures' ? 'bg-rugby-800 text-white' : 'text-gray-400'}`}>
                <Calendar size={16} /> Fixtures
              </button>
              <button onClick={() => setActiveTab('live')} className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap flex gap-2 ${activeTab === 'live' ? 'bg-rugby-800 text-white' : 'text-gray-400'}`}>
                <Activity size={16} /> Live Match
              </button>
           </div>

           {activeTab !== 'live' && (
             <button onClick={openNewModal} className="bg-rugby-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
               <Plus size={18} /> Add
             </button>
           )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rugby-accent" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             
             {/* --- NEWS --- */}
             {activeTab === 'news' && (
               news.map((item) => (
                   <div key={item.id} className="bg-rugby-900 border border-rugby-800 rounded-xl p-4 flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-full md:w-32 h-20 bg-rugby-950 rounded overflow-hidden shrink-0">
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-white font-bold">{item.title}</h3>
                        <p className="text-gray-400 text-xs">{item.category}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditNews(item)} className="p-2 bg-rugby-800 rounded text-gray-300"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteNews(item.id)} className="p-2 bg-rugby-800 rounded text-red-400"><Trash2 size={18} /></button>
                      </div>
                   </div>
               ))
             )}

             {/* --- TEAMS --- */}
             {activeTab === 'teams' && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {teams.map((item) => (
                    <div key={item.id} className="bg-rugby-900 border border-rugby-800 rounded-xl p-6 relative group">
                       <div className="flex justify-between items-start mb-4">
                          <img src={item.logoUrl || 'https://via.placeholder.com/50'} className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-md" />
                          <div className="flex gap-1">
                             <button onClick={() => handleEditTeam(item)} className="p-1.5 bg-rugby-950 rounded text-gray-300 hover:text-white"><Edit2 size={14} /></button>
                             <button onClick={() => handleDeleteTeam(item.id)} className="p-1.5 bg-rugby-950 rounded text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                          </div>
                       </div>
                       <h3 className="text-white font-bold">{item.name}</h3>
                       <p className="text-gray-500 text-sm">{item.homeGround}</p>
                       <span className="absolute bottom-4 right-4 text-xs font-semibold bg-rugby-950 text-gray-400 px-2 py-0.5 rounded border border-rugby-800">{item.category}</span>
                    </div>
                 ))}
               </div>
             )}

             {/* --- FIXTURES --- */}
             {activeTab === 'fixtures' && (
               <div className="bg-rugby-900 border border-rugby-800 rounded-xl overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-gray-400">
                     <thead className="bg-rugby-950 text-xs uppercase font-bold text-gray-500">
                       <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Home</th>
                         <th className="px-6 py-4 text-center">Score</th>
                         <th className="px-6 py-4">Away</th>
                         <th className="px-6 py-4">Venue</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-rugby-800">
                       {allMatches.map((match) => (
                         <tr key={match.id} className="hover:bg-rugby-800/50 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-white font-medium">{match.date}</div>
                             <div className="text-xs">{match.time}</div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                               match.status === 'LIVE' ? 'bg-red-900 text-red-400 animate-pulse' :
                               match.status === 'FINISHED' ? 'bg-gray-800 text-gray-400' :
                               'bg-blue-900 text-blue-400'
                             }`}>
                               {match.status}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-right font-medium text-white">{match.homeTeam}</td>
                           <td className="px-6 py-4 text-center font-bold font-mono text-lg text-white">
                             {match.status === 'UPCOMING' ? 'v' : `${match.homeScore} - ${match.awayScore}`}
                           </td>
                           <td className="px-6 py-4 font-medium text-white">{match.awayTeam}</td>
                           <td className="px-6 py-4 whitespace-nowrap">{match.venue}</td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {match.status !== 'UPCOMING' && (
                                 <button 
                                   onClick={() => handleEditFixture(match)}
                                   className="px-2 py-1 text-xs bg-green-900/30 hover:bg-green-900/60 text-green-300 border border-green-700 rounded font-medium transition-colors"
                                   title="Edit results"
                                 >
                                   Results
                                 </button>
                               )}
                               <button onClick={() => handleEditFixture(match)} className="p-1.5 hover:bg-rugby-700 rounded text-gray-400 hover:text-white"><Edit2 size={16} /></button>
                               <button onClick={() => handleDeleteFixture(match.id)} className="p-1.5 hover:bg-rugby-700 rounded text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                             </div>
                           </td>
                         </tr>
                       ))}
                       {allMatches.length === 0 && (
                         <tr>
                           <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                             No fixtures found. Add one to get started.
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {/* --- LIVE MATCH CONTROL --- */}
             {activeTab === 'live' && liveMatch && (
               <div className="space-y-6">
                  
                  {/* Status Bar */}
                  <div className="bg-rugby-900 border border-rugby-800 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-lg">
                      <div className="flex items-center gap-6">
                         
                         {/* Live Indicator */}
                         <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-inner ${liveMatch.status === 'LIVE' ? 'bg-red-900/40 text-red-500 border border-red-900 animate-pulse' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${liveMatch.status === 'LIVE' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                            {liveMatch.status}
                         </div>
                         
                         {/* Timer Display */}
                         <div className="flex items-center gap-3 bg-rugby-950 px-4 py-2 rounded-lg border border-rugby-800 shadow-inner">
                            <Clock size={18} className="text-rugby-accent"/>
                            <input 
                              className="bg-transparent border-none text-white w-20 font-mono text-xl font-bold focus:outline-none text-center" 
                              value={matchTime} 
                              onChange={(e) => {
                                setMatchTime(e.target.value);
                                setTimerSeconds(parseSeconds(e.target.value));
                              }}
                              placeholder="00:00"
                            />
                         </div>
                      </div>

                      {/* Main Controls */}
                      <div className="flex gap-2 items-center">
                        <div className="mr-4 flex bg-rugby-950 rounded-lg p-1 border border-rugby-800">
                           {['First Half', 'Second Half', 'Extra Time'].map(p => (
                             <button 
                                key={p}
                                onClick={() => handleUpdatePeriod(p)} 
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${matchPeriod === p ? 'bg-rugby-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                               {p}
                             </button>
                           ))}
                        </div>

                        {!timerRunning ? (
                          <button onClick={handleStartMatch} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                             <Play size={18} fill="currentColor" /> Start Match
                          </button>
                        ) : (
                          <button onClick={handlePauseMatch} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-yellow-900/20 active:scale-95 transition-all">
                             <Pause size={18} fill="currentColor" /> Pause
                          </button>
                        )}
                        
                        <button onClick={handleEndMatch} className="flex items-center gap-2 bg-rugby-800 hover:bg-red-900/50 hover:text-red-400 text-gray-300 border border-rugby-700 hover:border-red-900 px-4 py-2 rounded-lg font-bold ml-2 transition-all">
                           <Square size={18} fill="currentColor" /> End
                        </button>

                        <button 
                          disabled={savingLive}
                          onClick={handleResetMatch} 
                          className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 px-4 py-2 rounded-lg font-bold ml-2 transition-all disabled:opacity-50"
                          title="Reset all scores and events"
                        >
                           <Undo2 size={18} /> Reset
                        </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: Scoreboard & Config */}
                      <div className="lg:col-span-2 space-y-6">
                          
                          {/* Scoreboard Control */}
                          <div className="bg-rugby-900 border border-rugby-800 rounded-xl overflow-hidden shadow-xl">
                              <div className="bg-rugby-950 p-4 border-b border-rugby-800 flex justify-between items-center">
                                 <h3 className="text-white font-bold flex items-center gap-2"><Activity size={18} className="text-rugby-accent"/> Match Controller</h3>
                                 <button 
                                   disabled={savingLive}
                                   onClick={saveLiveDetails} 
                                   className="text-xs bg-rugby-800 hover:bg-rugby-700 text-white px-3 py-1 rounded flex items-center gap-1 transition-colors disabled:opacity-50 border border-rugby-700"
                                 >
                                   {savingLive ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Time & Info
                                 </button>
                              </div>
                              
                              <div className="p-6">
                                 {/* Teams Display */}
                                 <div className="flex justify-between items-center mb-8 bg-rugby-950/50 p-6 rounded-2xl border border-rugby-800/50">
                                    <div className="text-center w-1/3">
                                       <div className="text-5xl font-black text-white mb-2 tracking-tighter">{liveMatch.home_score}</div>
                                       <div className="text-lg font-bold text-gray-200">{liveMatch.home_team?.name || 'Home Team'}</div>
                                    </div>
                                    <div className="text-gray-600 font-bold text-2xl opacity-50">VS</div>
                                    <div className="text-center w-1/3">
                                       <div className="text-5xl font-black text-white mb-2 tracking-tighter">{liveMatch.away_score}</div>
                                       <div className="text-lg font-bold text-gray-200">{liveMatch.away_team?.name || 'Away Team'}</div>
                                    </div>
                                 </div>

                                 {/* Commentary Input */}
                                 <div className="mb-6">
                                    <label className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">Broadcast Message / Commentary</label>
                                    <div className="relative">
                                       <input 
                                         className="w-full bg-rugby-950 border border-rugby-800 rounded-lg p-3 text-white focus:border-rugby-accent focus:ring-1 focus:ring-rugby-accent outline-none transition-all"
                                         placeholder="e.g. Kick-off in Paris! The atmosphere is electric."
                                         value={commentary}
                                         onChange={(e) => setCommentary(e.target.value)}
                                       />
                                       <div className="absolute right-3 top-3 text-gray-500"><Activity size={18}/></div>
                                    </div>
                                 </div>

                                 {/* Scoring Actions */}
                                 <div className="bg-rugby-950/50 rounded-xl p-4 border border-rugby-800 relative">
                                     {savingLive && (
                                       <div className="absolute inset-0 bg-rugby-950/60 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
                                         <Loader2 className="animate-spin text-rugby-accent" size={32} />
                                       </div>
                                     )}

                                     <div className="mb-4">
                                        <label className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">Action Player</label>
                                        <div className="relative">
                                          <input 
                                            className="w-full bg-rugby-900 border border-rugby-700 rounded-lg p-3 pl-10 text-white focus:border-rugby-accent focus:outline-none placeholder-gray-600 transition-all focus:ring-1 focus:ring-rugby-accent"
                                            placeholder="Enter player name..."
                                            value={scorerName}
                                            onChange={(e) => setScorerName(e.target.value)}
                                          />
                                          <UserPlus className="absolute left-3 top-3.5 text-gray-500" size={18}/>
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-2 gap-8 relative">
                                        <div className="absolute inset-y-0 left-1/2 w-px bg-rugby-800 -translate-x-1/2 hidden md:block"></div>
                                        
                                        {/* Home Actions */}
                                        <div className="space-y-3">
                                           <div className="text-xs font-bold text-center text-gray-500 uppercase">Home Actions</div>
                                           <button onClick={() => handleScore('home', 'TRY', 5)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all border border-blue-500/50">TRY (+5)</button>
                                           <div className="grid grid-cols-3 gap-2">
                                              <button onClick={() => handleScore('home', 'CONVERSION', 2)} className="bg-blue-900/30 hover:bg-blue-800 text-blue-200 text-xs font-bold py-2 rounded-lg border border-blue-800 transition-colors">CON (+2)</button>
                                              <button onClick={() => handleScore('home', 'PENALTY', 3)} className="bg-blue-900/30 hover:bg-blue-800 text-blue-200 text-xs font-bold py-2 rounded-lg border border-blue-800 transition-colors">PEN (+3)</button>
                                              <button onClick={() => handleScore('home', 'DROP_GOAL', 3)} className="bg-blue-900/30 hover:bg-blue-800 text-blue-200 text-xs font-bold py-2 rounded-lg border border-blue-800 transition-colors">DG (+3)</button>
                                           </div>
                                           <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-800">
                                              <button onClick={() => handleScore('home', 'YELLOW_CARD', 0)} className="bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300 text-xs font-bold py-2 rounded-lg border border-yellow-700 transition-colors">🟨 YC</button>
                                              <button onClick={() => handleScore('home', 'RED_CARD', 0)} className="bg-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-bold py-2 rounded-lg border border-red-700 transition-colors">🟥 RC</button>
                                           </div>
                                        </div>

                                        {/* Away Actions */}
                                        <div className="space-y-3">
                                           <div className="text-xs font-bold text-center text-gray-500 uppercase">Away Actions</div>
                                           <button onClick={() => handleScore('away', 'TRY', 5)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-all border border-emerald-500/50">TRY (+5)</button>
                                           <div className="grid grid-cols-3 gap-2">
                                              <button onClick={() => handleScore('away', 'CONVERSION', 2)} className="bg-emerald-900/30 hover:bg-emerald-800 text-emerald-200 text-xs font-bold py-2 rounded-lg border border-emerald-800 transition-colors">CON (+2)</button>
                                              <button onClick={() => handleScore('away', 'PENALTY', 3)} className="bg-emerald-900/30 hover:bg-emerald-800 text-emerald-200 text-xs font-bold py-2 rounded-lg border border-emerald-800 transition-colors">PEN (+3)</button>
                                              <button onClick={() => handleScore('away', 'DROP_GOAL', 3)} className="bg-emerald-900/30 hover:bg-emerald-800 text-emerald-200 text-xs font-bold py-2 rounded-lg border border-emerald-800 transition-colors">DG (+3)</button>
                                           </div>
                                           <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-800">
                                              <button onClick={() => handleScore('away', 'YELLOW_CARD', 0)} className="bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300 text-xs font-bold py-2 rounded-lg border border-yellow-700 transition-colors">🟨 YC</button>
                                              <button onClick={() => handleScore('away', 'RED_CARD', 0)} className="bg-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-bold py-2 rounded-lg border border-red-700 transition-colors">🟥 RC</button>
                                           </div>
                                        </div>
                                     </div>
                                 </div>
                              </div>
                          </div>
                      </div>

                      {/* Right: Feed & Setup */}
                      <div className="space-y-6">
                          
                          {/* Event Log */}
                          <div className="bg-rugby-900 border border-rugby-800 rounded-xl overflow-hidden h-96 flex flex-col shadow-lg">
                             <div className="bg-rugby-950 p-3 border-b border-rugby-800 font-bold text-white text-sm flex items-center gap-2">
                               <FileText size={16} className="text-gray-400"/> Match Events Feed
                             </div>
                             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {liveMatch.events && liveMatch.events.length > 0 ? (
                                   liveMatch.events.map(ev => (
                                     <div key={ev.id} className="bg-rugby-950 p-3 rounded-lg border border-rugby-800 flex justify-between items-center group hover:border-rugby-700 transition-colors">
                                        <div>
                                           <div className={`text-xs font-bold mb-0.5 ${ev.team_side === 'home' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                              {ev.match_time}' {ev.event_type === 'YELLOW_CARD' ? '🟨 YC' : ev.event_type === 'RED_CARD' ? '🟥 RC' : ev.event_type} {ev.points > 0 ? `(+${ev.points})` : ''}
                                           </div>
                                           <div className="text-white text-sm font-medium">{ev.player_name}</div>
                                        </div>
                                        <button onClick={() => handleUndoEvent(ev)} disabled={savingLive} className="p-2 text-gray-500 hover:text-red-400 hover:bg-rugby-900 rounded-lg transition-colors disabled:opacity-50" title="Undo Event">
                                           <Undo2 size={16}/>
                                        </button>
                                     </div>
                                   ))
                                ) : (
                                   <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm">
                                      <Activity size={24} className="mb-2 opacity-50"/>
                                      No events yet
                                   </div>
                                )}
                             </div>
                          </div>

                          {/* Quick Config */}
                          <div className="bg-rugby-900 border border-rugby-800 rounded-xl p-4 space-y-3 shadow-lg">
                             <h4 className="text-xs font-bold text-gray-400 uppercase border-b border-rugby-800 pb-2 mb-2">Match Configuration</h4>
                             
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase block mb-1">Home Team</label>
                                  <select 
                                    className="w-full bg-rugby-950 border border-rugby-800 rounded p-1.5 text-xs text-white focus:border-rugby-accent outline-none"
                                    value={liveSetupForm.home_team_id || ''}
                                    onChange={(e) => setLiveSetupForm({...liveSetupForm, home_team_id: e.target.value})}
                                  >
                                    <option value="">Select...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase block mb-1">Away Team</label>
                                  <select 
                                    className="w-full bg-rugby-950 border border-rugby-800 rounded p-1.5 text-xs text-white focus:border-rugby-accent outline-none"
                                    value={liveSetupForm.away_team_id || ''}
                                    onChange={(e) => setLiveSetupForm({...liveSetupForm, away_team_id: e.target.value})}
                                  >
                                    <option value="">Select...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                </div>
                             </div>
                             
                             <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Venue</label>
                                <input className="w-full bg-rugby-950 border border-rugby-800 rounded p-1.5 text-xs text-white focus:border-rugby-accent outline-none" value={liveSetupForm.venue} onChange={(e) => setLiveSetupForm({...liveSetupForm, venue: e.target.value})} />
                             </div>
                             <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Competition</label>
                                <input className="w-full bg-rugby-950 border border-rugby-800 rounded p-1.5 text-xs text-white focus:border-rugby-accent outline-none" value={liveSetupForm.competition} onChange={(e) => setLiveSetupForm({...liveSetupForm, competition: e.target.value})} />
                             </div>
                             
                             <button disabled={savingLive} onClick={saveMatchSetup} className="w-full py-2 bg-rugby-800 hover:bg-rugby-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 border border-rugby-700">Update Setup</button>
                          </div>
                      </div>
                  </div>
               </div>
             )}

          </div>
        )}
      </div>

      {/* --- MODAL (News/Teams/Fixtures) --- */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
           <div className="bg-rugby-900 border border-rugby-800 rounded-2xl w-full max-w-2xl h-[70vh] shadow-2xl overflow-hidden flex flex-col my-8">
              <div className="p-6 border-b border-rugby-800 flex justify-between items-center bg-rugby-950/50 shrink-0">
                 <h2 className="text-xl font-bold text-white capitalize">{currentId ? 'Edit' : 'Add'} {activeTab === 'news' ? 'Article' : activeTab === 'fixtures' ? 'Fixture' : 'Team'}</h2>
                 <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                 {activeTab === 'news' && (
                   <>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Title</label>
                        <input className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="Title" value={newsForm.title} onChange={e=>setNewsForm({...newsForm, title: e.target.value})} required/>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Summary</label>
                        <textarea className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="Summary" value={newsForm.summary} onChange={e=>setNewsForm({...newsForm, summary: e.target.value})} required/>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Category</label>
                        <select className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" value={newsForm.category} onChange={e=>setNewsForm({...newsForm, category: e.target.value})}><option value="Ugandas Cup">Ugandas Cup</option><option value="URU">URU</option><option value="International">International</option><option value="National 7s">National 7s</option><option value="National team">National team</option><option value="Transfers">Transfers</option><option value="Pre-season">Pre-season</option></select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Header Image</label>
                        <div 
                           onClick={() => newsFileRef.current?.click()}
                           className="w-full h-32 bg-rugby-950 border-2 border-dashed border-rugby-800 hover:border-rugby-600 rounded-lg flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all"
                        >
                           {newsFile ? (
                              <img src={URL.createObjectURL(newsFile)} className="w-full h-full object-cover opacity-50" />
                           ) : newsForm.image_url ? (
                              <img src={newsForm.image_url} className="w-full h-full object-cover opacity-50" />
                           ) : null}
                           
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-white">
                              <Upload size={24} className="mb-2" />
                              <span className="text-xs font-medium">{newsFile ? 'Change File' : newsForm.image_url ? 'Replace Image' : 'Click to Upload'}</span>
                           </div>
                           <input type="file" ref={newsFileRef} onChange={handleNewsFileSelect} accept="image/*" className="hidden" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Author</label>
                        <input className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="Author" value={newsForm.author} onChange={e=>setNewsForm({...newsForm, author: e.target.value})}/>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-rugby-950/50 rounded border border-rugby-800">
                        <input 
                          type="checkbox" 
                          id="featured" 
                          checked={newsForm.featured || false}
                          onChange={e=>setNewsForm({...newsForm, featured: e.target.checked})}
                          className="w-4 h-4 rounded accent-rugby-accent cursor-pointer"
                        />
                        <label htmlFor="featured" className="text-xs text-gray-400 cursor-pointer flex-1">
                          Mark as Featured (will appear as hero on home page)
                        </label>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Full Article Content</label>
                        <RichTextEditor 
                          value={newsForm.fullContent} 
                          onChange={(content) => setNewsForm({...newsForm, fullContent: content})}
                          onImageUpload={async (file) => {
                            // Upload image using your storage service
                            return await uploadContentImage(file, 'news');
                          }}
                        />
                     </div>
                   </>
                 )}

                 {activeTab === 'teams' && (
                   <>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Team Name</label>
                        <input className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="e.g. Leinster Rugby" value={teamForm.name} onChange={e=>setTeamForm({...teamForm, name: e.target.value})} required/>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Category</label>
                        <select className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" value={teamForm.category} onChange={e=>setTeamForm({...teamForm, category: e.target.value})}><option value="Men">Men</option><option value="Women">Women</option></select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Home Ground</label>
                        <input className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="e.g. RDS Arena" value={teamForm.home_ground} onChange={e=>setTeamForm({...teamForm, home_ground: e.target.value})}/>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Team Logo</label>
                        <div className="flex gap-4 items-center">
                           <div 
                              onClick={() => teamFileRef.current?.click()}
                              className="w-24 h-24 bg-rugby-950 border-2 border-dashed border-rugby-800 hover:border-rugby-600 rounded-lg flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group shrink-0"
                           >
                              {teamFile ? (
                                 <img src={URL.createObjectURL(teamFile)} className="w-full h-full object-contain p-2" />
                              ) : teamForm.logo_url ? (
                                 <img src={teamForm.logo_url} className="w-full h-full object-contain p-2" />
                              ) : (
                                 <Shield size={24} className="text-gray-500" />
                              )}
                              <input type="file" ref={teamFileRef} onChange={handleTeamFileSelect} accept="image/*" className="hidden" />
                           </div>
                           <div className="flex-1 text-xs text-gray-500">
                              <p>Click the box to upload a high-quality transparent PNG logo.</p>
                              <button type="button" onClick={() => teamFileRef.current?.click()} className="mt-2 text-rugby-accent hover:underline">Select File</button>
                           </div>
                        </div>
                     </div>
                   </>
                 )}

                 {activeTab === 'fixtures' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs text-gray-400">Home Team</label>
                            <select 
                              className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800 focus:border-rugby-accent outline-none" 
                              value={fixtureForm.home_team_id} 
                              onChange={e=>setFixtureForm({...fixtureForm, home_team_id: e.target.value})} 
                              required
                            >
                              <option value="">Select Home Team</option>
                              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-gray-400">Away Team</label>
                            <select 
                              className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800 focus:border-rugby-accent outline-none" 
                              value={fixtureForm.away_team_id} 
                              onChange={e=>setFixtureForm({...fixtureForm, away_team_id: e.target.value})} 
                              required
                            >
                              <option value="">Select Away Team</option>
                              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <label className="text-xs text-gray-400">Date & Time (Kick-off)</label>
                           <input 
                             type="datetime-local" 
                             className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800 focus:border-rugby-accent outline-none"
                             value={fixtureForm.fixture_date}
                             onChange={e => setFixtureForm({...fixtureForm, fixture_date: e.target.value})}
                             required
                           />
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs text-gray-400">Display Time (e.g. 15:00)</label>
                           <input 
                             type="text" 
                             className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800 focus:border-rugby-accent outline-none"
                             value={fixtureForm.match_time}
                             onChange={e => setFixtureForm({...fixtureForm, match_time: e.target.value})}
                             placeholder="15:00"
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Venue</label>
                            <input className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="Stadium" value={fixtureForm.venue} onChange={e=>setFixtureForm({...fixtureForm, venue: e.target.value})} required/>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-gray-400">Competition</label>
                            <input className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" placeholder="e.g. URC" value={fixtureForm.competition} onChange={e=>setFixtureForm({...fixtureForm, competition: e.target.value})} required/>
                         </div>
                      </div>

                      <div className="space-y-1">
                         <label className="text-xs text-gray-400">Status</label>
                         <select className="w-full bg-rugby-950 p-2 rounded text-white border border-rugby-800" value={fixtureForm.status} onChange={e=>setFixtureForm({...fixtureForm, status: e.target.value})}>
                            <option value="UPCOMING">Upcoming</option>
                            <option value="LIVE">Live</option>
                            <option value="HALFTIME">Halftime</option>
                            <option value="FINISHED">Finished</option>
                         </select>
                      </div>

                      {(fixtureForm.status === 'FINISHED' || fixtureForm.status === 'LIVE' || fixtureForm.status === 'HALFTIME') && (
                         <div className="grid grid-cols-2 gap-4 p-6 bg-rugby-950/50 rounded-lg border-2 border-rugby-accent/30 shadow-lg">
                            <div className="text-center">
                               <label className="text-xs text-gray-400 block mb-2 font-bold uppercase">Home Score</label>
                               <input 
                                 type="number" 
                                 min="0"
                                 className="w-full bg-rugby-900 border-2 border-blue-600 p-3 text-center rounded text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                 value={fixtureForm.home_score} 
                                 onChange={e=>setFixtureForm({...fixtureForm, home_score: parseInt(e.target.value) || 0})} 
                               />
                            </div>
                            <div className="text-center">
                               <label className="text-xs text-gray-400 block mb-2 font-bold uppercase">Away Score</label>
                               <input 
                                 type="number" 
                                 min="0"
                                 className="w-full bg-rugby-900 border-2 border-emerald-600 p-3 text-center rounded text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                                 value={fixtureForm.away_score} 
                                 onChange={e=>setFixtureForm({...fixtureForm, away_score: parseInt(e.target.value) || 0})} 
                               />
                            </div>
                         </div>
                      )}
                    </div>
                 )}

                 <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-rugby-800 sticky bottom-0 bg-rugby-900 shrink-0">
                    <button type="button" onClick={()=>setIsEditing(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button type="submit" disabled={uploading} className="px-4 py-2 bg-rugby-accent text-white rounded font-bold hover:bg-blue-600 transition-colors flex items-center gap-2">
                      {uploading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                      {uploading ? 'Saving...' : 'Save'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};