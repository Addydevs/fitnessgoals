import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Your Stripe webhook secret
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');


function parseStripeSignatureHeader(sigHeader: string) {
  // Example: t=timestamp,v1=signature,v0=old_signature
  const parts = sigHeader.split(',');
  let timestamp = '';
  let signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }
  return { timestamp, signatures };
}

async function verifyStripeSignature(rawBody: Uint8Array, sigHeader: string, secret: string): Promise<boolean> {
  if (!sigHeader || !secret) return false;
  const { timestamp, signatures } = parseStripeSignatureHeader(sigHeader);
  if (!timestamp || signatures.length === 0) return false;
  const payload = `${timestamp}.${new TextDecoder().decode(rawBody)}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return signatures.some(sig => sig === expectedSignature);
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get('stripe-signature');

  // Stripe signature verification
  const valid = await verifyStripeSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(new TextDecoder().decode(rawBody));
    // ...removed console.log...

  if (event.type === 'setup_intent.succeeded') { // Changed to setup_intent.succeeded
    const setupIntent = event.data.object;
    const userId = setupIntent.metadata.userId;
    const subscriptionType = setupIntent.metadata.subscriptionType; // Get subscription type from metadata

    // Update payment status in Supabase
    const { data, error } = await supabase.from('payments').update({
      paid: true,
      updated_at: new Date().toISOString(),
      subscription_type: subscriptionType, // Ensure subscription type is updated
    }).eq('setup_intent_id', setupIntent.id); // Match by setup_intent_id

    if (error) {
      console.error('Error updating payment status in Supabase:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to update payment status' }), { status: 500 });
    }
      // ...removed console.log...
  } else if (event.type === 'payment_intent.succeeded') {
    // This block might still be useful if you also handle one-time payments
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.userId;
    const subscriptionType = paymentIntent.metadata.subscriptionType;

    const { data, error } = await supabase.from('payments').update({
      paid: true,
      updated_at: new Date().toISOString(),
      subscription_type: subscriptionType,
    }).eq('payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment status for payment_intent in Supabase:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to update payment status for payment intent' }), { status: 500 });
    }
      // ...removed console.log...
  } else {
      // ...removed console.log...
  }

  return new Response('Webhook received', { status: 200 });
});
