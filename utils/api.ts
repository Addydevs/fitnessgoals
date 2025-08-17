// Centralized API utility for all backend calls
// Dynamically resolves the API base URL so a physical device (on same Wi‑Fi) can reach the dev machine.
// Priority:
// 1. explicit value in app.json -> expo.extra.API_URL
// 2. derive LAN host from Expo dev host (hostUri) + port 3000 (default backend)
// 3. fallback production placeholder

import Constants from 'expo-constants';
import { NativeModules } from 'react-native';
import { supabase } from './supabase';

// Set this to your computer's LAN IPv4 (same network as phone) e.g. '192.168.0.23'.
// Leave as '' to let auto-detection try to figure it out.
const MANUAL_LAN_IP = '192.168.1.2';

// Default backend port (adjust if your server uses another)
const BACKEND_PORT = 3000;

function resolveApiBase() {
  // 1. Manual override.
  if (MANUAL_LAN_IP && !/x|X/.test(MANUAL_LAN_IP)) {
    return `http://${MANUAL_LAN_IP}:${BACKEND_PORT}`;
  }

  // 2. extra.API_URL in app.json (optional convenience)
  const extraUrl = (Constants.expoConfig as any)?.extra?.API_URL as string | undefined;
  if (extraUrl && /^http/.test(extraUrl) && !/YOUR_LAN_IP/.test(extraUrl)) {
    return extraUrl.replace(/\/$/, '');
  }

  // 3. derive from hostUri while in dev (Expo dev server provides something like 192.168.x.x:19000)
  const hostUri: string | undefined = (Constants as any)?.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    if (/\d+\.\d+\.\d+\.\d+/.test(host)) {
      return `http://${host}:${BACKEND_PORT}`;
    }
  }

  // 4. derive from scriptURL (React Native packager script URL)
  const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
  if (__DEV__ && scriptURL) {
    try {
      const { hostname } = new URL(scriptURL);
      if (/\d+\.\d+\.\d+\.\d+/.test(hostname)) {
        return `http://${hostname}:${BACKEND_PORT}`;
      }
    } catch {}
  }

  // 5. Final fallback (will not work on device until you set something real)
  return 'http://127.0.0.1:3000';
}

export const API_URL = resolveApiBase();
if (__DEV__) {
  console.log('[api] Base URL resolved to', API_URL);
  if (API_URL.startsWith('http://127.0.0.1') || API_URL.includes('localhost')) {
    console.warn('[api] WARNING: 127.0.0.1/localhost is NOT reachable from a physical device. Set MANUAL_LAN_IP in utils/api.ts (e.g. 192.168.0.23).');
  }
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const cleanedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${cleanedPath}`;
  try {
  // attach supabase access token if present so backend can identify the user
  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;
  const headersWithAuth = token ? { ...(options.headers || {}), Authorization: `Bearer ${token}` } : (options.headers || {});
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    ...headersWithAuth,
      },
      ...options,
    });
    let data: any;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      throw new Error(text || 'API error: Non-JSON response');
    }
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'API error');
    }
    return data;
  } catch (error) {
    // Optionally log for debugging
    console.warn('apiRequest error', { url, error });
    throw error;
  }
}

// Usage example:
// await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
