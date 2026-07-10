import React, { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

type Props = {
  visible: boolean
  priceText?: string
  annualPriceText?: string
  purchasing?: boolean
  onPurchase: () => void
  onPurchaseAnnual?: () => void
  onRestore: () => void
  onClose?: () => void
}

export default function Paywall({ visible, priceText = '$4.99/month', annualPriceText, purchasing = false, onPurchase, onPurchaseAnnual, onRestore, onClose }: Props) {
  const { isDarkMode, theme } = useTheme()
  const hasAnnual = !!(annualPriceText && onPurchaseAnnual)
  const [plan, setPlan] = useState<'monthly' | 'annual'>(hasAnnual ? 'annual' : 'monthly')

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)' }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {onClose ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.colors.subtitle }]}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.title, { color: theme.colors.text }]}>Unlock CaptureFit Pro</Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
            Get the full AI coach experience for your fitness journey.
          </Text>

          <View style={styles.features}>
            {[
              'Unlimited AI Coach chats tailored to your goals',
              'Advanced progress photo analysis with trends',
              'Personalized workout and habit suggestions',
            ].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={[styles.featureText, { color: theme.colors.text }]}>{f}</Text>
              </View>
            ))}
          </View>

          {hasAnnual ? (
            <View style={styles.planRow}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  { borderColor: plan === 'annual' ? theme.colors.primary : theme.colors.border },
                ]}
                onPress={() => setPlan('annual')}
                disabled={purchasing}
              >
                <Text style={[styles.planBadge, { color: theme.colors.primary }]}>Best value</Text>
                <Text style={[styles.planTitle, { color: theme.colors.text }]}>Annual</Text>
                <Text style={[styles.planPrice, { color: theme.colors.text }]}>{annualPriceText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  { borderColor: plan === 'monthly' ? theme.colors.primary : theme.colors.border },
                ]}
                onPress={() => setPlan('monthly')}
                disabled={purchasing}
              >
                <Text style={[styles.planBadge, { color: 'transparent' }]}> </Text>
                <Text style={[styles.planTitle, { color: theme.colors.text }]}>Monthly</Text>
                <Text style={[styles.planPrice, { color: theme.colors.text }]}>{priceText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.price, { color: theme.colors.text }]}>{priceText}</Text>
          )}
          <Text style={[styles.disclaimer, { color: theme.colors.subtitle }]}>
            Start with a 7‑day free trial. Cancel anytime before renewal to avoid charges.
          </Text>
          <Text style={[styles.disclaimer, { color: theme.colors.subtitle, marginTop: 2 }]}>
            Auto‑renewing subscription billed to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account. Manage or cancel in your device subscriptions settings.
          </Text>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.colors.primary, opacity: purchasing ? 0.7 : 1 }]}
            onPress={hasAnnual && plan === 'annual' ? onPurchaseAnnual : onPurchase}
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
          {onClose ? (
            <TouchableOpacity onPress={onClose} style={styles.secondaryBtn} disabled={purchasing}>
              <Text style={[styles.secondaryText, { color: theme.colors.subtitle }]}>Maybe later</Text>
            </TouchableOpacity>
          ) : null}
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
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    zIndex: 2,
  },
  closeText: { fontSize: 18 },
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
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  planOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  planBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 14,
    marginTop: 2,
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
  secondaryBtn: { marginTop: 6, alignItems: 'center' },
  secondaryText: { fontSize: 13, fontWeight: '500' },
})
