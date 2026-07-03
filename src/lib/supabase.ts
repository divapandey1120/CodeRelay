import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side / Public Supabase Client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Admin client
export const getSupabaseServerClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServerClient must only be called on the server');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
