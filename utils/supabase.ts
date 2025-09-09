// utils/supabase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient, type User, type Session } from "@supabase/supabase-js";

const supabaseUrl = "https://vpnitpweduycfmndmxsf.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbml0cHdlZHV5Y2ZtbmRteHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTU3MjksImV4cCI6MjA3MDg3MTcyOX0.LRVY6boXeixgCHJi1BelSdO6UHIePJYIJk-T7eWxY9s";

declare global {
  // survive Fast Refresh
  // eslint-disable-next-line no-var
  var __sb: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __sbHookInstalled: boolean | undefined;
}

export const supabase: SupabaseClient = (() => {
  if (global.__sb) return global.__sb!;
  const c = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  global.__sb = c;
  return c;
})();

// -------- cached user helpers --------
let cachedUser: User | null = null;
let inflightSession: Promise<Session | null> | null = null;

// keep cache in sync
if (!global.__sbHookInstalled) {
  supabase.auth.onAuthStateChange((_evt, session) => {
    cachedUser = session?.user ?? null;
  });
  global.__sbHookInstalled = true;
}

/** One-shot, deduped way to get the current user. */
export async function getCachedUser(): Promise<User | null> {
  if (cachedUser) return cachedUser;
  if (!inflightSession) {
    inflightSession = supabase.auth
        .getSession()
        .then(({ data }) => data.session ?? null)
        .finally(() => {
          inflightSession = null;
        });
  }
  const sess = await inflightSession;
  cachedUser = sess?.user ?? null;
  return cachedUser;
}

// -------- DEV: patch getUser to avoid /auth/v1/user floods (no stacks) --------
if (__DEV__) {
  const a: any = supabase.auth;
  const realGetUser = a.getUser.bind(a);

  // Deduplicate & serve from cache, but **do not** print stack traces
  let inflightUser: Promise<User | null> | null = null;

  a.getUser = async (...args: any[]) => {
    // Optional: minimal one-liner so you can still see calls without symbolication
    // console.warn("[TRACE] supabase.auth.getUser()");

    if (cachedUser) return { data: { user: cachedUser }, error: null };

    if (!inflightUser) {
      inflightUser = realGetUser(...args)
          .then((res: any) => res?.data?.user ?? null)
          .finally(() => {
            // let future calls fetch again if needed
            inflightUser = null;
          });
    }
    const user = await inflightUser;
    cachedUser = user;
    return { data: { user }, error: null };
  };

  // NOTE: we do **not** patch/trace getSession(), because supabase-js calls it
  // on every request to attach tokens, which is expected and noisy.
}

// -------- token setter used by app/layout --------
export async function setAccessToken(accessToken: string, refreshToken?: string) {
  if (!accessToken) return;
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || accessToken,
  });
  if (error) throw error;
}

// -------- your existing types & service ----------

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  file_name: string;
  file_size: number;
  created_at: string;
  analysis_data?: any;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message_type: "user" | "ai";
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  fitness_goal: string;
  fitness_level: string;
  age?: number;
  weight?: number;
  target_weight?: number;
  injuries?: string[];
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  static async getCurrentUser() {
    return getCachedUser();
  }

  static async uploadPhoto(file: File | Blob, filePath: string) {
    const anyFile = file as any;
    if (!anyFile || anyFile.size === 0) throw new Error("Invalid file");
    if (anyFile.size > 10 * 1024 * 1024) throw new Error("File too large");
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(anyFile.type)) throw new Error(`Invalid file type: ${anyFile.type}`);

    const { data, error } = await supabase.storage.from("photos").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return data;
  }

  static getPhotoUrl(filePath: string) {
    const { data } = supabase.storage.from("photos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  static async listUserPhotos(userId: string) {
    const { data, error } = await supabase.storage.from("photos").list(userId);
    if (error) throw error;
    return data;
  }

  static async deletePhoto(filePath: string) {
    const { error } = await supabase.storage.from("photos").remove([filePath]);
    if (error) throw error;
  }

  static async saveUserProfile(profile: Partial<UserProfile>, userId?: string) {
    const uid = userId ?? (await getCachedUser())?.id;
    if (!uid) throw new Error("User not authenticated");
    const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: uid, ...profile, updated_at: new Date().toISOString() })
        .select()
        .single();
    if (error) throw error;
    return data;
  }

  static async getUserProfile() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error && (error as any).code !== "PGRST116") throw error;
    return data;
  }

  static async saveChatMessage(messageType: "user" | "ai", content: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
        .from("chat_messages")
        .insert({ user_id: user.id, message_type: messageType, content })
        .select()
        .single();
    if (error) throw error;
    return data;
  }

  static async getChatHistory(limit = 50) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data;
  }

  static async invokeAICoach(payload: any) {
    const { data, error } = await supabase.functions.invoke("aicoach", { body: payload });
    if (error) throw error;
    return data;
  }

  static async getLatestUserPhoto(userId: string) {
    const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    if (error && (error as any).code !== "PGRST116") throw error;
    return data;
  }

  static async getUserPhotos(userId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
  }

  static async savePhotoWithAnalysis(userId: string, fileName: string, fileSize: number, analysisData?: any) {
    const { data, error } = await supabase
        .from("photos")
        .insert({
          user_id: userId,
          url: this.getPhotoUrl(fileName),
          file_name: fileName,
          file_size: fileSize,
          analysis_data: analysisData,
        })
        .select()
        .single();
    if (error) throw error;
    return data;
  }

  static async getUserPhotosWithAnalysis(userId: string, limit = 5) {
    const { data, error } = await supabase
        .from("photos")
        .select("*, analysis_data")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data;
  }
}
