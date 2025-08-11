import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";

export default function AuthLayout() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("onboarded").then((val) => {
      setOnboarded(!!val);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <Stack
      initialRouteName={onboarded ? "login" : "index"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
