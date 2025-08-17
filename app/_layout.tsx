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
import { useColorScheme } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setAccessToken, supabase } from '../utils/supabase';

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
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");

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
  await AsyncStorage.removeItem("userToken");
  await AsyncStorage.removeItem("user");
  // Do NOT remove progressPhotos so progress persists after logout
  // If you want to clear other keys, do so here, but never clear progressPhotos
  try {
    // clear auth on the Supabase client
    (supabase.auth as any).setAuth('');
  } catch {
    // ignore any errors while clearing client auth
  }
  setToken(null);
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
    return null;
  }

  return (
    <CustomThemeProvider>
      <AuthContext.Provider value={authContext}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {token ? (
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
          </Stack>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
        </SafeAreaProvider>
      </AuthContext.Provider>
    </CustomThemeProvider>
  );
}
