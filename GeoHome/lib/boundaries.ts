import { supabase } from './supabaseClient';

export async function searchBoundaries(query: string, category?: string | null) {
  try {
    const { data, error } = await supabase.rpc('search_boundaries', {
      query_text: query,
      category_filter: category || null,
    });

    if (error) {
      console.error('Error searching boundaries:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Boundary search error:', err);
    return [];
  }
}

export interface Boundary {
  id: string;
  name: string;
  category: string;
  category_name: string;
  parent_name?: string;
  centroid_lat: number;
  centroid_lng: number;
}
