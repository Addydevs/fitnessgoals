import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL = (Constants.expoConfig as any)?.extra?.SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = (Constants.expoConfig as any)?.extra?.SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

let supabase: any;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_ANON_KEY not found in app.json extras or env');
  const noop = {
    auth: {
      async signInWithPassword() {
        throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
      },
      async signUp() {
        throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
      },
      async getSession() {
        return { data: { session: null } };
      },
      async updateUser() {
        throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
      }
    },
    from() {
      throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
    },
    functions: {
      async invoke() {
        throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
      }
    }
  } as any;
  supabase = noop;
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

// Helper to set access token for the client (used by app startup to restore session)
async function setAccessToken(token: string | null) {
  if (!token) return;
  try {
    // supabase-js provides auth.setSession to restore access/refresh tokens, but it expects both tokens.
    // Many times we only store the access token; if setSession isn't available, try setAuth (internal).
    if (typeof (supabase.auth as any)?.setSession === 'function') {
      // We only have an access token; setSession expects an object with access_token and refresh_token
      // If refresh missing, setSession may still accept it depending on client version.
      await (supabase.auth as any).setSession({ access_token: token });
    } else if (typeof (supabase.auth as any)?.setAuth === 'function') {
      (supabase.auth as any).setAuth(token);
    }
  } catch (err) {
    console.warn('setAccessToken failed', err);
  }
}

export { setAccessToken, supabase };
export default supabase;
