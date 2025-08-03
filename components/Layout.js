import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { styles } from '../constants/styles';

export default function Layout({ children }) {
  return (
    <SafeAreaView style={[styles.appBackground, { backgroundColor: '#fff' }]}>
      <View style={styles.appContainer}>{children}</View>
    </SafeAreaView>
  );
}
