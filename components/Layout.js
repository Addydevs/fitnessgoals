import React from 'react';
import { SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../constants/styles';
import { theme } from '../constants/theme';

export default function Layout({ children }) {
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.appBackground}
    >
      <SafeAreaView style={styles.appContainer}>{children}</SafeAreaView>
    </LinearGradient>
  );
}
