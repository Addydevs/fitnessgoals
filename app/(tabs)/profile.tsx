import React, { useContext } from 'react';
import ProfileScreen from '@/components/ProfileScreen';
import { PhotoContext } from './_layout';

export default function ProfilePage() {
  const { photos } = useContext(PhotoContext);
  return <ProfileScreen photos={photos} />;
}
