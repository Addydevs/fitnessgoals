import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HomeScreen() {
  return <WebView source={require('../assets/homepage.html')} style={styles.container} originWhitelist={['*']} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
