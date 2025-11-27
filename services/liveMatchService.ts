
import { supabase } from './supabaseClient';
import { LiveMatchDB, MatchEvent, Match } from '../types';

export const getFeaturedLiveMatch = async (): Promise<LiveMatchDB | null> => {
  const { data, error } = await supabase
    .from('live_matches')
    .select(`
      *,
      home_team:teams!live_matches_home_team_id_fkey(name, logo_url),
      away_team:teams!live_matches_away_team_id_fkey(name, logo_url),
      events:match_events(*)
    `)
    .eq('status', 'LIVE')
    .limit(1)
    .maybeSingle();

  // If no LIVE match, fallback to the most recent one (or upcoming) to show in admin "Live" tab
  if (!data) {
     const { data: backup } = await supabase
      .from('live_matches')
      .select(`
        *,
        home_team:teams!live_matches_home_team_id_fkey(name, logo_url),
        away_team:teams!live_matches_away_team_id_fkey(name, logo_url),
        events:match_events(*)
      `)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
      
      if (backup && backup.events) {
        // Sort events by creation time, newest first
        backup.events.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
      return backup as LiveMatchDB;
  }

  // Sort events by creation time, newest first
  if (data && data.events) {
    data.events.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  return data as LiveMatchDB;
};

export const fetchAllMatches = async (): Promise<Match[]> => {
  const { data, error } = await supabase
    .from('live_matches')
    .select(`
      *,
      home_team:teams!live_matches_home_team_id_fkey(name, logo_url),
      away_team:teams!live_matches_away_team_id_fkey(name, logo_url)
    `)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    homeTeam: m.home_team?.name || 'TBC',
    awayTeam: m.away_team?.name || 'TBC',
    homeTeamLogo: m.home_team?.logo_url,
    awayTeamLogo: m.away_team?.logo_url,
    homeScore: m.home_score || 0,
    awayScore: m.away_score || 0,
    status: m.status,
    time: m.match_time,
    date: new Date(m.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    startTime: m.start_time,
    venue: m.venue || 'TBC',
    competition: m.competition || 'Friendly',
    events: []
  }));
};

export const createMatch = async (matchData: Partial<LiveMatchDB>) => {
  const { data, error } = await supabase
    .from('live_matches')
    .insert([matchData])
    .select();

  if (error) throw error;
  return data;
};

export const updateLiveMatch = async (id: string, updates: Partial<LiveMatchDB>) => {
  const { data, error } = await supabase
    .from('live_matches')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteMatch = async (id: string) => {
  // First delete events associated with match to handle foreign key constraints if not set to cascade
  await supabase.from('match_events').delete().eq('live_match_id', id);

  const { error } = await supabase
    .from('live_matches')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const addScoringEvent = async (
  matchId: string, 
  side: 'home' | 'away', 
  currentScore: number, 
  event: Omit<MatchEvent, 'id' | 'live_match_id' | 'team_side'>
) => {
  
  // 1. Insert the event with explicit team_side
  const { error: eventError } = await supabase
    .from('match_events')
    .insert([{
      live_match_id: matchId,
      team_side: side,
      player_name: event.player_name || 'Unknown',
      event_type: event.event_type,
      points: event.points || 0,
      match_time: event.match_time || '00:00'
    }]);

  if (eventError) throw eventError;

  // 2. Update the main score
  const newScore = currentScore + event.points;
  const updatePayload = side === 'home' ? { home_score: newScore } : { away_score: newScore };

  const { error: scoreError } = await supabase
    .from('live_matches')
    .update(updatePayload)
    .eq('id', matchId);

  if (scoreError) throw scoreError;
};

export const deleteMatchEvent = async (matchId: string, eventId: string, side: 'home' | 'away', points: number, currentTotalScore: number) => {
  // 1. Delete event
  const { error: delError } = await supabase
    .from('match_events')
    .delete()
    .eq('id', eventId);

  if (delError) throw delError;

  // 2. Revert score
  const newScore = Math.max(0, currentTotalScore - points);
  const updatePayload = side === 'home' ? { home_score: newScore } : { away_score: newScore };

  const { error: scoreError } = await supabase
    .from('live_matches')
    .update(updatePayload)
    .eq('id', matchId);
    
  if (scoreError) throw scoreError;
};

export const createLiveMatchEntry = async () => {
  const { data, error } = await supabase
    .from('live_matches')
    .insert([{ status: 'UPCOMING', match_time: '00:00', venue: 'TBC', competition: 'Friendly', start_time: new Date().toISOString() }])
    .select();
    
  if (error) throw error;
  return data[0];
};