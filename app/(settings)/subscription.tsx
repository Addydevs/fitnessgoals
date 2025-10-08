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

  const policyUrl = (Constants?.expoConfig as any)?.extra?.PRIVACY_POLICY_URL || ''
  const termsUrl = (Constants?.expoConfig as any)?.extra?.TERMS_OF_USE_URL || ''
  const onOpen = async (url: string) => { try { if (url) await Linking.openURL(url) } catch {} }

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

        {/* What you get */}
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>What you get</Text>
          {[
            'Unlimited AI Coach chats',
            'Progress photo analysis with AI',
            'Personalized workout & nutrition tips',
            'Weekly plan suggestions and progress tracking',
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{f}</Text>
            </View>
          ))}
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

        <Text style={[styles.help, { color: theme.colors.subtitle }]}>Auto‑renewing monthly subscription. Payment is charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account'} at confirmation. Unless canceled at least 24 hours before the end of the trial or current period, your subscription renews automatically. Manage or cancel anytime in {Platform.OS === 'ios' ? 'Settings › Apple ID › Subscriptions' : 'Google Play › Payments & subscriptions'}.</Text>

        {(policyUrl || termsUrl) && (
          <View style={styles.linksRow}>
            {policyUrl ? (
              <TouchableOpacity onPress={() => onOpen(policyUrl)}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>Privacy Policy</Text>
              </TouchableOpacity>
            ) : null}
            {policyUrl && termsUrl ? <Text style={[styles.linkDivider, { color: theme.colors.subtitle }]}> • </Text> : null}
            {termsUrl ? (
              <TouchableOpacity onPress={() => onOpen(termsUrl)}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>Terms of Use</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
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
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4, marginBottom: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  featureIcon: { marginRight: 8, fontSize: 16 },
  featureText: { fontSize: 14 },
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
  linksRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontSize: 13, fontWeight: '600' },
  linkDivider: { fontSize: 13 },
})
