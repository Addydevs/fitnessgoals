import { ThemeContext } from '@/app/_layout'
import { useTheme } from '@/contexts/ThemeContext'
import { SubscriptionContext } from '@/contexts/SubscriptionContext'
import { Ionicons } from '@expo/vector-icons'
import { Stack, router } from 'expo-router'
import React, { useContext, useMemo } from 'react'
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'

export default function SubscriptionScreen() {
  const themeContext = useContext(ThemeContext)
  const isDarkMode = themeContext?.isDarkMode ?? false
  const { theme } = useTheme()
  const sub = useContext(SubscriptionContext)

  const statusText = sub?.isSubscribed ? 'Active' : 'Inactive'
  const statusColor = sub?.isSubscribed ? '#22C55E' : theme.colors.subtitle

  const priceDisplay = useMemo(() => {
    const p = sub?.monthly?.price || '$4.99'
    return p.includes('/month') ? p : `${p}/month`
  }, [sub?.monthly?.price])

  const onManage = async () => {
    try {
      if (Platform.OS === 'ios') {
        // Open App Store Subscriptions
        await Linking.openURL('https://apps.apple.com/account/subscriptions')
      } else {
        const pkg = (Constants?.expoConfig as any)?.android?.package || 'com.addyde.capturefit'
        const sku = sub?.monthly?.productId || 'om.capturefit.monthly_premium'
        const url = `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(pkg)}`
        await Linking.openURL(url)
      }
    } catch (e) {}
  }

  const onSubscribe = async () => {
    if (!sub) return
    try { await sub.purchaseMonthly() } catch {}
  }

  const onRestore = async () => {
    if (!sub) return
    try { await sub.restore() } catch {}
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Subscription',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: 'white',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>CaptureFit Pro</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.subtitle }]}>Status</Text>
          <Text style={[styles.value, { color: statusColor }]}>{statusText}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.subtitle }]}>Plan</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{priceDisplay}</Text>
        </View>

        <View style={{ height: 10 }} />

        {sub?.isSubscribed ? (
          <TouchableOpacity onPress={onManage} style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.primaryText, { color: theme.colors.background }]}>Manage Subscription</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onSubscribe}
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: sub?.purchasing ? 0.7 : 1 }]}
            disabled={!!sub?.purchasing}
          >
            {sub?.purchasing ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={[styles.primaryText, { color: theme.colors.background }]}>Subscribe</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onRestore} style={styles.secondaryBtn} disabled={!!sub?.purchasing}>
          <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={[styles.help, { color: theme.colors.subtitle }]}>Cancel anytime in your {Platform.OS === 'ios' ? 'Apple ID Subscriptions' : 'Google Play Subscriptions'}.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: { fontSize: 14 },
  value: { fontSize: 16, fontWeight: '600' },
  primaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: { marginTop: 10, alignItems: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '600' },
  help: { fontSize: 12, textAlign: 'center', marginTop: 10 },
})
