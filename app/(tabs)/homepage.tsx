import HomeScreen from "@/components/HomeScreen";
import React, { useContext } from "react";
import { PhotoContext } from "./_layout";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "expo-router";

type RootStackParamList = {
  homepage: undefined;
  camera: undefined;
  aicoach: undefined;
  progress: undefined;
  profile: undefined;
  settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomePage() {
  const { photos, setPhotos, loading, setLoading } = useContext(PhotoContext);
  const navigation = useNavigation<NavigationProp>();
  return (
    <HomeScreen
      photos={photos}
      setPhotos={setPhotos}
      loading={loading}
      setLoading={setLoading}
      navigation={navigation}
    />
  );
}

