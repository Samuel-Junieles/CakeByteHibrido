import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lmejrryaroqniwemjgry.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_CjcbWfZJUJt3s2mgxo43rQ_7nkGuk6w';

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

