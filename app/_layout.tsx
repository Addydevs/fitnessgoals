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
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const AuthContext = createContext({
  token: null as string | null,
  signIn: async (_t: string) => {},
  signOut: async () => {},
});

const lightTheme = {
  primary: "#A855F7",
  primaryDark: "#7C3AED",
  background: "#FFFFFF",
  surface: "#F9FAFB",
  card: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  error: "#EF4444",
};

const darkTheme = {
  primary: "#A855F7",
  primaryDark: "#7C3AED",
  background: "#111827",
  surface: "#1F2937",
  card: "#374151",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  border: "#4B5563",
  error: "#EF4444",
};

type Theme = typeof lightTheme;

interface ThemeContextType {
  isDarkMode: boolean;
  theme: Theme;
  toggleDarkMode: (next?: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        setToken(userToken);

        const storedDarkMode = await AsyncStorage.getItem("darkMode");
        setIsDarkMode(storedDarkMode ? JSON.parse(storedDarkMode) : false);
      } catch (error) {
        console.error("Failed to load initial settings:", error);
      } finally {
        setChecking(false);
      }
    };
    loadSettings();
  }, []);

  const authContext = useMemo(
    () => ({
      token,
      signIn: async (newToken: string) => {
        await AsyncStorage.setItem("userToken", newToken);
        setToken(newToken);
      },
      signOut: async () => {
        await AsyncStorage.removeItem("userToken");
        setToken(null);
      },
    }),
    [token],
  );

  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  const themeContext = useMemo(
    () => ({
      isDarkMode,
      theme,
      toggleDarkMode: async (next?: boolean) => {
        const value = typeof next === "boolean" ? next : !isDarkMode;
        setIsDarkMode(value);
        await AsyncStorage.setItem("darkMode", JSON.stringify(value));
      },
    }),
    [isDarkMode, theme],
  );

  if (!loaded || checking) {
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <ThemeContext.Provider value={themeContext}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.background },
              headerTintColor: theme.text,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            {token ? (
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            ) : (
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            )}
            <Stack.Screen name="(settings)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar
            style={isDarkMode ? "light" : "dark"}
            backgroundColor={theme.background}
          />
        </SafeAreaProvider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
