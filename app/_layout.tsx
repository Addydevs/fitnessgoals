import { Colors } from "@/constants/Colors";
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

export const AuthContext = createContext({
  token: null as string | null,
  signIn: async (_t: string) => {},
  signOut: async () => {},
});

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
  const [checking, setChecking] = useState(true);
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        setToken(userToken);

        const storedDarkMode = await AsyncStorage.getItem("darkMode");
        if (storedDarkMode !== null) {
          setIsDarkMode(JSON.parse(storedDarkMode));
        } else {
          setIsDarkMode(systemColorScheme === "dark");
        }
      } catch (error) {
        console.error("Failed to load initial settings:", error);
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
      },
      signOut: async () => {
        await AsyncStorage.removeItem("userToken");
        setToken(null);
      },
    }),
    [token],
  );

  const themeContext = useMemo(
    () => ({
      isDarkMode,
      toggleDarkMode: async (value: boolean) => {
        setIsDarkMode(value);
        await AsyncStorage.setItem("darkMode", JSON.stringify(value));
      },
    }),
    [isDarkMode],
  );

  if (!loaded || checking) {
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <ThemeContext.Provider value={themeContext}>
        <SafeAreaProvider>
          <Stack>
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
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
        </SafeAreaProvider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
