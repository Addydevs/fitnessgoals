import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { styles } from '../constants/styles';

export default function Layout({ children }) {
  return (
    <SafeAreaView
      style={[styles.appBackground, { backgroundColor: '#fff' }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.appContainer}>{children}</View>
    </SafeAreaView>
  );
}
