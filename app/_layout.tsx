import { Colors } from "@/constants/Colors";
import { CustomThemeProvider } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
    createContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Linking, useColorScheme, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setAccessToken, supabase } from '../utils/supabase';
import {SubscriptionProvider} from "@/contexts/SubscriptionContext";

export interface AuthContextType {
  token: string | null;
  signIn: (t: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: (value: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [token, setToken] = useState<string | null>(null);
  const [, setChecking] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const systemColorScheme = useColorScheme();
  // Start the app in dark mode so the initial background is black and fits the logo.
  // Stored preference (if any) will be loaded in useEffect and override this.
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        setToken(userToken);
        // If we have a stored token, configure the Supabase client to use it so
        // server-side auth calls (updateUser, profiles upsert) succeed.
        if (userToken) {
          try {
            await setAccessToken(userToken);
          } catch (err) {
            console.warn('Failed to set supabase auth from stored token', err);
          }
        }

        const storedDarkMode = await AsyncStorage.getItem("darkMode");
        if (storedDarkMode !== null) {
          setIsDarkMode(JSON.parse(storedDarkMode));
        } else {
          setIsDarkMode(systemColorScheme === "dark");
        }
        } catch {
          console.error("Failed to load initial settings:");
        } finally {
          setChecking(false);
        }
    };
    loadSettings();
  }, [systemColorScheme]);

  // Handle deep linking for password reset
  useEffect(() => {
    // Handle the initial URL if the app was opened via a deep link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle subsequent deep links while the app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('=== DEEP LINK RECEIVED ===');
    console.log('URL:', url);

    // Check if this is a password reset link
    if (url.includes('reset-password') || url.includes('type=recovery')) {
      console.log('🔐 Password reset link detected');

      try {
        // Extract the tokens from the URL - handle both exp:// and capturefit:// schemes
        let urlObj: URL;
        if (url.startsWith('exp://')) {
          urlObj = new URL(url.replace('exp://', 'https://'));
        } else if (url.startsWith('capturefit://')) {
          urlObj = new URL(url.replace('capturefit://', 'https://dummy.com/'));
        } else {
          urlObj = new URL(url);
        }

        const access_token = urlObj.searchParams.get('access_token') || urlObj.hash.match(/access_token=([^&]+)/)?.[1];
        const refresh_token = urlObj.searchParams.get('refresh_token') || urlObj.hash.match(/refresh_token=([^&]+)/)?.[1];
        const type = urlObj.searchParams.get('type') || urlObj.hash.match(/type=([^&]+)/)?.[1];

        // Also check if the original URL contains type=recovery anywhere
        const isRecovery = url.includes('type=recovery') || type === 'recovery';

        console.log('Extracted params:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          type,
          isRecovery,
        });

        // If we have the tokens from the URL, set the session
        if (access_token && refresh_token && isRecovery) {
          console.log('Setting session from password reset link...');

          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('❌ Error setting session from deep link:', error);
          } else {
            console.log('✅ Session set successfully!');
            console.log('User:', data.session?.user?.email);
            // The onAuthStateChange listener below will handle the PASSWORD_RECOVERY event
          }
        } else {
          console.warn('⚠️ Missing required parameters in password reset link');
        }
      } catch (err) {
        console.error('❌ Error processing password recovery link:', err);
      }
    }
  };

  // Listen for Supabase auth state changes to detect password recovery
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset password link in their email
        // Supabase has automatically authenticated them with a temporary session
        // Store a flag to redirect them to reset password screen
        console.log('Password recovery mode - setting flag');
        await AsyncStorage.setItem('passwordRecovery', 'true');

        // Set recovery mode flag to prevent routing to authenticated screens
        setIsPasswordRecovery(true);

        // DO NOT set token here - keep user in auth flow
        // The session is handled by Supabase internally for password reset
      }

      // Update token when session changes (but not during password recovery)
      if (session?.access_token && event !== 'PASSWORD_RECOVERY') {
        setToken(session.access_token);
        await AsyncStorage.setItem('userToken', session.access_token);
      }

      // Clear recovery mode when signed in successfully
      if (event === 'SIGNED_IN') {
        setIsPasswordRecovery(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const authContext = useMemo(
    () => ({
      token,
      signIn: async (newToken: string) => {
        await AsyncStorage.setItem("userToken", newToken);
        setToken(newToken);
        try {
          await setAccessToken(newToken);
        } catch (err) {
          console.warn('Failed to set supabase auth on signIn', err);
        }
      },
      signOut: async () => {
  try {
    // clear only auth-related keys; preserve progressPhotos and other local data
    // Keep hasEverLoggedIn and lastUsedEmail to maintain smart routing for returning users
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((k) => 
      k === 'userToken' || 
      k === 'user' || 
      k === 'session'
    );
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    // clear auth on the Supabase client
    try {
      (supabase.auth as any).setAuth('');
    } catch {}
  } catch (err) {
    console.warn('Error during signOut cleanup:', err);
  } finally {
    setToken(null);
  }
      },
      resetProgress: async () => {
  await AsyncStorage.removeItem("progressPhotos");
      },
    }),
    [token],
  );

  // theme state persisted in AsyncStorage and applied to contentStyle
  useMemo(() => {
    // keep memoization to avoid unnecessary updates in children
    return {
      isDarkMode,
      toggleDarkMode: async (value: boolean) => {
        setIsDarkMode(value);
        await AsyncStorage.setItem('darkMode', JSON.stringify(value));
      },
    };
  }, [isDarkMode]);

  if (!loaded) {
    // Render a simple black background while fonts and settings load so the app opens on black.
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <CustomThemeProvider>
      <AuthContext.Provider value={authContext}>
        <SubscriptionProvider>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
            {token && !isPasswordRecovery ? (
              <>
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: isDarkMode
                        ? Colors.dark.background
                        : Colors.light.background,
                    },
                  }}
                />
                <Stack.Screen
                  name="(settings)"
                  options={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: isDarkMode
                        ? Colors.dark.background
                        : Colors.light.background,
                    },
                  }}
                />
                <Stack.Screen name="+not-found" options={{ headerShown: false }} />
              </>
            ) : (
              <Stack.Screen
                name="(auth)"
                options={{
                  headerShown: false,
                  title: "",
                  contentStyle: {
                    backgroundColor: isDarkMode
                      ? Colors.dark.background
                      : Colors.light.background,
                  },
                }}
              />
            )}
            </Stack>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
          </SafeAreaProvider>
        </SubscriptionProvider>
      </AuthContext.Provider>
    </CustomThemeProvider>
  );
}
