
import { supabase } from './supabaseClient';
import { Team } from '../types';

export interface TeamDBItem {
  id: string;
  name: string;
  category: string;
  home_ground: string;
  logo_url: string;
  created_at: string;
}

const formatTeam = (item: TeamDBItem): Team => ({
  id: item.id,
  name: item.name,
  category: (item.category as 'Men' | 'Women') || 'Men',
  homeGround: item.home_ground,
  logoUrl: item.logo_url
});

export const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  return (data as TeamDBItem[]).map(formatTeam);
};

export const createTeam = async (team: Omit<TeamDBItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('teams')
    .insert([team])
    .select();

  if (error) throw error;
  return data;
};

export const updateTeam = async (id: string, team: Partial<TeamDBItem>) => {
  const { data, error } = await supabase
    .from('teams')
    .update(team)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteTeam = async (id: string) => {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
