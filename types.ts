
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  category: string;
  timestamp: string;
  author: string;
}

export interface MatchEvent {
  id: string;
  live_match_id: string;
  team_side: 'home' | 'away';
  player_name: string;
  event_type: 'TRY' | 'CONVERSION' | 'PENALTY' | 'DROP_GOAL';
  points: number;
  match_time: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'HALFTIME';
  time: string; // "80'" or "14:00"
  date: string;
  startTime: string; // ISO String for sorting
  venue: string;
  competition: string;
  commentary?: string;
  events?: MatchEvent[];
}

export interface PlayerStats {
  name: string;
  team: string;
  points: number;
  image: string;
}

export interface Team {
  id: string;
  name: string;
  category: 'Men' | 'Women';
  homeGround: string;
  logoUrl: string;
}

export interface LiveMatchDB {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'HALFTIME';
  match_time: string;
  venue: string;
  competition: string;
  commentary: string;
  start_time: string;
  home_team?: { name: string, logo_url: string };
  away_team?: { name: string, logo_url: string };
  events?: MatchEvent[];
}