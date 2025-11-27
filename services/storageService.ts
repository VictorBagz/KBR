import { supabase } from './supabaseClient';

export const uploadContentImage = async (file: File, folder: 'news' | 'teams'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // 1. Upload to 'content-images' bucket
    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(fileName, file, { 
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};