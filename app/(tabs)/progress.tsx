import React, { useContext } from "react";
import CameraScreen from "@/components/CameraScreen";
import { PhotoContext } from "./_layout";

export default function ProgressPage() {
  const { photos, setPhotos, loading, setLoading } = useContext(PhotoContext);
  return (
    <CameraScreen
      photos={photos}
      setPhotos={setPhotos}
      loading={loading}
      setLoading={setLoading}
    />
  );
}
