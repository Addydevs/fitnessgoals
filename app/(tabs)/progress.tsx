import React, { useContext } from 'react';
import ProgressScreen from '@/components/ProgressScreen';
import { PhotoContext } from './_layout';

export default function ProgressPage() {
  const { photos, setPhotos } = useContext(PhotoContext);
  return <ProgressScreen photos={photos} setPhotos={setPhotos} />;
}
