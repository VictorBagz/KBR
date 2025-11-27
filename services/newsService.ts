import { supabase } from './supabaseClient';
import { NewsItem } from '../types';

export interface NewsDBItem {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  category: string;
  author: string;
  created_at: string;
}

// Helper to format DB item to Frontend Item
const formatNewsItem = (item: NewsDBItem): NewsItem => ({
  id: item.id,
  title: item.title,
  summary: item.summary || '',
  imageUrl: item.image_url || '',
  category: item.category || 'General',
  author: item.author || 'Unknown',
  timestamp: new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
});

export const fetchNews = async (): Promise<NewsItem[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return (data as NewsDBItem[]).map(formatNewsItem);
};

export const createNews = async (news: Omit<NewsDBItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('news')
    .insert([news])
    .select();

  if (error) throw error;
  return data;
};

export const updateNews = async (id: string, news: Partial<NewsDBItem>) => {
  const { data, error } = await supabase
    .from('news')
    .update(news)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteNews = async (id: string) => {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);

  if (error) throw error;
};