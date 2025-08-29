import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
      },
      async refreshSession() {
        throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
      },
    },
    from() {
      throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
    },
    functions: {
      async invoke() {
        throw new Error('Supabase not configured: SUPABASE_URL or SUPABASE_ANON_KEY missing');
      },
    },
  } as any;
  supabase = noop;
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  console.log('Supabase initialized with URL:', SUPABASE_URL);
}

// Helper to set access token for the client (used by app startup or after login)
async function setAccessToken(token: string | null) {
  if (!token) return;
  try {
    if (typeof supabase.auth.setSession === 'function') {
      await supabase.auth.setSession({ access_token: token });
    } else if (typeof supabase.auth.setAuth === 'function') {
      supabase.auth.setAuth(token);
    }
    console.log('Access token injected into Supabase client');
  } catch (err) {
    console.warn('setAccessToken failed:', err);
  }
}

// Upload photo using the upload-photo edge function
async function uploadPhotoViaFunction(photoUri: string, userId: string, fileNamePrefix: string = 'photo_') {
  const response = await fetch(photoUri);
  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const fileName = `${fileNamePrefix}${userId}_${Date.now()}.jpg`;
  const payload = { userId, fileName, fileBase64: base64, contentType };
  const { data, error } = await supabase.functions.invoke('upload-photo', {
    body: JSON.stringify(payload),
  });
  console.log('Upload photo response:', { data, error });
  if (error || data.error || !data.publicUrl) {
    throw new Error(error?.message || data.error || 'Failed to upload photo');
  }
  return data.publicUrl;
}

export { setAccessToken, supabase, uploadPhotoViaFunction };
export default supabase;