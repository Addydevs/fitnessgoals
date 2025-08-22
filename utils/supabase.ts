import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

// Helper to set access token for the client (used by app startup or after login)
async function setAccessToken(token: string | null) {
  if (!token) return;
  try {
    // supabase-js provides auth.setSession to restore access/refresh tokens, but it expects both tokens.
    // If you only have the access token, setSession may still accept it depending on client version.
    if (typeof (supabase.auth as any)?.setSession === 'function') {
      await (supabase.auth as any).setSession({ access_token: token });
    } else if (typeof (supabase.auth as any)?.setAuth === 'function') {
      (supabase.auth as any).setAuth(token);
    }
    console.log('Access token injected into Supabase client');
  } catch (err) {
    console.warn('setAccessToken failed', err);
  }
}

// Upload photo to Supabase Storage and return public URL
async function uploadPhotoToSupabase(photoUri: string, userId: string, prefix: string = "") {
  const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${prefix}${Date.now()}.${fileExt}`;
  const storagePath = `${userId}/${fileName}`;
  let contentType = 'image/*';
  if (["jpg", "jpeg"].includes(fileExt)) contentType = "image/jpeg";
  else if (fileExt === "png") contentType = "image/png";
  else if (fileExt === "gif") contentType = "image/gif";
  else if (fileExt === "webp") contentType = "image/webp";
  else if (fileExt === "bmp") contentType = "image/bmp";
  else if (fileExt === "svg") contentType = "image/svg+xml";
  else if (fileExt === "heic") contentType = "image/heic";

  // Check authentication/session before upload
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('Supabase session:', sessionData);
  if (!sessionData?.session) {
    throw new Error('User is not authenticated');
  }

  const response = await fetch(photoUri);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${photoUri}`);
  }
  const blob = await response.blob();
  console.log('Blob type:', blob.type);
console.log('Blob size:', blob.size);
console.log('Storage path:', storagePath);
console.log('Content type:', contentType);
  const { error: uploadError } = await supabase.storage.from('photos').upload(storagePath, blob, {
    contentType,
    upsert: true,
  });
  console.log('Upload error:', JSON.stringify(uploadError, null, 2));
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storagePath);
  return urlData?.publicUrl;
}

export { setAccessToken, uploadPhotoToSupabase, supabase };
export default supabase;
