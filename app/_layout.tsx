import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { createContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import "react-native-reanimated";

import { ColorScheme, ColorSchemeContext } from "@/hooks/useColorScheme";

export const AuthContext = createContext({
  token: null as string | null,
  signIn: async (_t: string) => {},
  signOut: async () => {},
});

export default function RootLayout() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("userToken").then((t) => {
      setToken(t);
      setChecking(false);
    });
    const loadScheme = async () => {
      const saved = await AsyncStorage.getItem("colorScheme");
      if (saved === "light" || saved === "dark") {
        setColorScheme(saved);
      } else {
        const system = Appearance.getColorScheme();
        setColorScheme(system === "dark" ? "dark" : "light");
      }
    };
    loadScheme();
  }, []);

  const authContext = {
    token,
    signIn: async (newToken: string) => {
      await AsyncStorage.setItem("userToken", newToken);
      setToken(newToken);
    },
    signOut: async () => {
      await AsyncStorage.removeItem("userToken");
      setToken(null);
    },
  };

  if (!loaded || checking) {
    // Async font loading only occurs in development.
    return null;
  }

  const changeScheme = async (scheme: ColorScheme) => {
    setColorScheme(scheme);
    await AsyncStorage.setItem("colorScheme", scheme);
  };

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme: changeScheme }}>
      <AuthContext.Provider value={authContext}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            {token ? (
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            ) : (
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            )}
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </AuthContext.Provider>
    </ColorSchemeContext.Provider>
  );
}
