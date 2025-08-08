import React, { useContext } from "react";
import HomeScreen from "@/components/HomeScreen";
import { PhotoContext } from "./_layout";

export default function HomePage() {
  const { photos, setPhotos, loading, setLoading } = useContext(PhotoContext);
  return (
    <HomeScreen
      photos={photos}
      setPhotos={setPhotos}
      loading={loading}
      setLoading={setLoading}
    />
  );
}

