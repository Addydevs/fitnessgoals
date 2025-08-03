import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { styles } from '../constants/styles';

export default function Layout({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      style={[
        styles.appBackground,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      edges={['top', 'bottom']}
    >
      <View style={styles.appContainer}>{children}</View>
    </SafeAreaView>
  );
}
