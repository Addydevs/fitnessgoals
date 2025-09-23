import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { userId, amount, currency, subscriptionType } = await req.json();
    console.log('Received payload for payment intent:', { userId, amount, currency, subscriptionType });

    // TODO: Check trial status from your DB here
    // If trial expired, proceed to payment
    // 1. Create a Customer (or retrieve existing)
    let customerId;
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (customerError && customerError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching existing customer:', customerError.message);
      throw new Error('Failed to retrieve customer information.');
    }

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id;
      console.log('Retrieved existing Stripe customer:', customerId);
    } else {
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = customer.id;
      await supabase.from('customers').insert({
        user_id: userId,
        stripe_customer_id: customerId,
      });
      console.log('Created new Stripe customer:', customerId);
    }

    // 2. Create an Ephemeral Key for the Customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2022-11-15' }
    );
    console.log('Created Ephemeral Key for customer:', customerId);

    // 3. Create a Payment Intent for immediate charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId, // Associate with customer
      setup_future_usage: 'off_session', // Optional: save card for future use
      metadata: { userId, subscriptionType },
    });
    console.log('Created Payment Intent:', paymentIntent.id);

    // Store payment intent in Supabase payments table
    await supabase.from('payments').upsert({
      user_id: userId,
      paid: false, // Will be updated by webhook
      payment_intent_id: paymentIntent.id, // Store payment_intent_id
      subscription_type: subscriptionType,
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        paymentIntentClientSecret: paymentIntent.client_secret, // Return paymentIntentClientSecret
        ephemeralKeySecret: ephemeralKey.secret,
        customerId: customerId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating payment intent:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
