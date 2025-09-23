
import { supabase } from './supabase'; // Assuming supabase client is exported from here

export async function createPaymentIntent(userId: string, amount: number, currency: string, subscriptionType: 'monthly' | 'yearly') {
	try {
		const url = 'https://vpnitpweduycfmndmxsf.supabase.co/functions/v1/create-payment-intent';
		const requestBody = { userId, amount, currency, subscriptionType };
		console.log('Attempting to call Supabase Edge Function:', url, 'with body:', requestBody);

		const { data: { session } } = await supabase.auth.getSession();
		const accessToken = session?.access_token;

		if (!accessToken) {
			throw new Error('User not authenticated. Missing access token.');
		}

		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!res.ok) {
			const errorText = await res.text();
			console.error('Supabase Edge Function response not OK:', res.status, errorText);
			return { error: `Supabase function error: ${res.status} - ${errorText}` };
		}

		const data = await res.json();
		console.log('Received response from Supabase Edge Function:', data);
		return {
			paymentIntentClientSecret: data.paymentIntentClientSecret,
			ephemeralKeySecret: data.ephemeralKeySecret,
			customerId: data.customerId,
		};
	} catch (error: any) {
		console.error('Error in createPaymentIntent:', error.message);
		return { error: error.message };
	}
}
