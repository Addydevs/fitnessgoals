import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createPaymentIntent } from '../utils/api';
import { supabase } from '../utils/supabase';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SAA5714WgUKrMLeLqPe1L5RAsQhdfWWAGcvysh8QN40xabcuSBYBdkxgPLO1zMuTF3uyw0ofzxh3CifdxhvehSW00esb3YmId';

type SubscriptionType = 'monthly' | 'yearly';

const getStyles = () => StyleSheet.create({
  gradientBackground: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 500,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#007AFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#c2e9fb',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subscriptionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 18,
    width: '100%',
    gap: 16,
  },
  buttonSpacer: {
    width: 0,
  },
  subscriptionCard: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 2,
    position: 'relative',
    minWidth: 140,
    transition: 'all 0.2s',
  },
  selectedSubscriptionCard: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.08)',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
  },
  subscriptionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  subscriptionPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 6,
    textShadowColor: '#c2e9fb',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subscriptionDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  payButton: {
    width: '100%',
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: '#007AFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    elevation: 2,
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a1c4fd',
  },
  errorMessage: {
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default function StripePayment({ userId, onPaymentSuccess }: { userId: string; onPaymentSuccess: () => void }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('monthly');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const styles = getStyles();

  useEffect(() => {
    const fetchUserEmail = async () => {
      setIsEmailLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
      setIsEmailLoading(false);
    };
    fetchUserEmail();
  }, []);

  const getAmount = () => (subscriptionType === 'monthly' ? 500 : 5000);

  const handlePayPress = async () => {
    setIsProcessingPayment(true);

    const { paymentIntentClientSecret, ephemeralKeySecret, customerId, error: paymentDetailsError } = await createPaymentIntent(userId, getAmount(), 'usd', subscriptionType);
    if (paymentDetailsError || !paymentIntentClientSecret || !ephemeralKeySecret || !customerId) {
      Alert.alert('Error', paymentDetailsError || 'Unable to get payment details');
      setIsProcessingPayment(false);
      return;
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'CaptureFit',
      customerId: customerId,
      customerEphemeralKeySecret: ephemeralKeySecret,
      paymentIntentClientSecret: paymentIntentClientSecret,
      allowsDelayedPaymentMethods: false,
      returnURL: 'stripe-redirect',
    });

    if (initError) {
      Alert.alert('Error', `Payment sheet initialization failed: ${initError.message}`);
      setIsProcessingPayment(false);
      return;
    }

    const { error: paymentError } = await presentPaymentSheet();

    if (paymentError) {
      Alert.alert('Payment failed', paymentError.message);
    } else {
      onPaymentSuccess();
    }
    setIsProcessingPayment(false);
  };

  if (isEmailLoading) {
    return (
      <LinearGradient colors={['#a1c4fd', '#c2e9fb']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ color: '#333', marginTop: 10 }}>Loading user data...</Text>
      </LinearGradient>
    );
  }

  if (!userEmail) {
    return (
      <LinearGradient colors={['#a1c4fd', '#c2e9fb']} style={styles.gradientBackground}>
        <View style={styles.container}>
          <Text style={styles.errorMessage}>
            Unable to retrieve user email. Please ensure you are logged in.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradientBackground}>
        <View style={styles.container}>
          <Text style={styles.title}>Choose your Subscription</Text>
          <View style={styles.subscriptionButtons}>
            <TouchableOpacity
              style={[
                styles.subscriptionCard,
                subscriptionType === 'monthly' && styles.selectedSubscriptionCard,
              ]}
              onPress={() => setSubscriptionType('monthly')}
              disabled={isProcessingPayment}
              activeOpacity={0.85}
            >
              {subscriptionType === 'monthly' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                </View>
              )}
              <Ionicons name="calendar" size={32} color="#007AFF" style={{ marginBottom: 6 }} />
              <Text style={styles.subscriptionTitle}>Monthly</Text>
              <Text style={styles.subscriptionPrice}>$5</Text>
              <Text style={styles.subscriptionDescription}>Billed monthly</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity
              style={[
                styles.subscriptionCard,
                subscriptionType === 'yearly' && styles.selectedSubscriptionCard,
              ]}
              onPress={() => setSubscriptionType('yearly')}
              disabled={isProcessingPayment}
              activeOpacity={0.85}
            >
              {subscriptionType === 'yearly' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                </View>
              )}
              <Ionicons name="medal" size={32} color="#007AFF" style={{ marginBottom: 6 }} />
              <Text style={styles.subscriptionTitle}>Yearly</Text>
              <Text style={styles.subscriptionPrice}>$50</Text>
              <Text style={styles.subscriptionDescription}>Billed annually <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>(Save $10!)</Text></Text>
            </TouchableOpacity>
          </View>
          <View style={styles.payButton}>
            <TouchableOpacity
              onPress={handlePayPress}
              disabled={isProcessingPayment}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#007AFF", "#00C6FB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Ionicons name="card" size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>
                  {isProcessingPayment ? 'Processing...' : (subscriptionType === 'monthly' ? 'Pay $5' : 'Pay $50')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </StripeProvider>
  );
}
