import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if env vars are missing (for development)
let supabase: any;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. Using mock client.');
  console.warn('📝 Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  
  // Create a mock implementation that won't crash the app
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signUp: async () => ({ 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your .env file.' } 
      }),
      signInWithPassword: async () => ({ 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your .env file.' } 
      }),
      signOut: async () => {},
      onAuthStateChange: () => ({ 
        data: { subscription: { unsubscribe: () => {} } } 
      }),
    },
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
        }),
        gte: () => ({ then: (callback: any) => Promise.resolve(callback({ data: [], error: null })) }),
        order: () => ({ 
          limit: () => ({ then: (callback: any) => Promise.resolve(callback({ data: [], error: null })) }),
          then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
        }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (callback: any) => Promise.resolve(callback({ data: [], error: null }))
      }),
      insert: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured. Please set up your .env file.' } 
      }),
      update: () => ({ 
        eq: () => Promise.resolve({ data: null, error: null }) 
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ data: null, error: null }) 
      }),
    }),
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
