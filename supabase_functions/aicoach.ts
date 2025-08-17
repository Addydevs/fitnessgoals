// Supabase Edge Function (Deno) example - aicoach
// This is a plain TypeScript handler you can adapt for the Supabase Functions layout.
// It expects an environment variable OPENAI_API_KEY set in the Supabase Project Settings -> Functions -> Env.

// eslint-disable-next-line import/no-unresolved
import { serve } from 'std/server';

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const text = body.text || '';
    const goal = body.goal || '';
    const previousPhoto = body.previousPhoto || null;
    const currentPhoto = body.currentPhoto || null;

    // If both photos are provided we don't analyze images here; return a placeholder.
    if (previousPhoto && currentPhoto) {
      return new Response(JSON.stringify({ feedback: 'Photo analysis not available in this Edge Function. Please enable Vision API integration or send text prompts.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No prompt provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Build prompt
    const prompt = `User goal: ${goal}\nQuestion: ${text}`;

    // Call OpenAI (use Responses API or chat completions depending on your plan)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are a helpful fitness coach.' }, { role: 'user', content: prompt }],
        max_tokens: 600,
      }),
    });

    if (!openaiRes.ok) {
      const txt = await openaiRes.text();
      return new Response(JSON.stringify({ error: 'OpenAI error', details: txt }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const openaiJson = await openaiRes.json();
    const reply = openaiJson?.choices?.[0]?.message?.content || openaiJson?.text || 'No response from OpenAI';

    return new Response(JSON.stringify({ feedback: reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Edge function error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
