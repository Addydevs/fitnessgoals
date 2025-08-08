import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    />
  );
}
