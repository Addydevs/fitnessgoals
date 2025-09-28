import React from 'react'
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

type Props = {
  visible: boolean
  priceText?: string
  purchasing?: boolean
  onPurchase: () => void
  onRestore: () => void
}

export default function Paywall({ visible, priceText = '$4.99/month', purchasing = false, onPurchase, onRestore }: Props) {
  const { isDarkMode, theme } = useTheme()

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)' }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Unlock CaptureFit Pro</Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>Your 7‑day free trial has ended.</Text>

          <View style={styles.features}>
            {[
              'Unlimited AI Coach chats',
              'Progress photo analysis',
              'Personalized plans & tips',
            ].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={[styles.featureText, { color: theme.colors.text }]}>{f}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.price, { color: theme.colors.text }]}>{priceText}</Text>
          <Text style={[styles.disclaimer, { color: theme.colors.subtitle }]}>
            Cancel anytime in {Platform.OS === 'ios' ? 'Settings > Apple ID > Subscriptions' : 'Google Play > Payments & subscriptions'}.
          </Text>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.colors.primary, opacity: purchasing ? 0.7 : 1 }]}
            onPress={onPurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={[styles.ctaText, { color: theme.colors.background }]}>Start Subscription</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRestore} style={styles.restoreBtn} disabled={purchasing}>
            <Text style={[styles.restoreText, { color: theme.colors.primary }]}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  features: {
    marginTop: 16,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  featureIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  featureText: {
    fontSize: 15,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  cta: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  restoreBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
})

