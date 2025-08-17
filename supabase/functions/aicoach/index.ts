// @ts-nocheck
// Supabase Edge Function: aicoach
// Deploy path: supabase/functions/aicoach
// Expects OPENAI_API_KEY to be set in Supabase project secrets (Functions -> Environment Variables / Secrets)

// In Supabase Functions runtime, `serve` is available from Deno std. Locally we provide a no-op shim
const serve: (handler: (req: Request) => Response | Promise<Response>) => void = (globalThis as any).serve ?? function (_handler) {
  // Local dev: no-op - functions are executed in Supabase runtime when deployed
};

serve(async (req: Request) => {
  try {
    // parse incoming JSON
    const body = await req.json().catch(() => ({} as any));
    const text: string = body.text ?? '';
    const goal: string = body.goal ?? '';
    const previousPhoto: string | null = body.previousPhoto ?? null; // base64 or storage url
    const currentPhoto: string | null = body.currentPhoto ?? null;
          
    // If images are provided, forward them to OpenAI as data URLs for comparison
    // previousPhoto/currentPhoto are expected to be base64 data strings (no data: prefix) or full data URLs.
    if (previousPhoto && currentPhoto) {
      // Normalize: if input is raw base64, prefix with data URI
      const toDataUrl = (s: string) => (s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`);
      const prev = toDataUrl(previousPhoto as string);
      const curr = toDataUrl(currentPhoto as string);

      const goalContext = goal ? `User goal: ${goal}\n` : '';
      const prompt = `${goalContext}Compare these two progress photos and provide clear, concise, encouraging feedback focused on progress, posture, and suggestions.`;

      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'OpenAI key not configured on Supabase (set OPENAI_API_KEY secret)' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful, concise fitness coach who gives actionable photo-based feedback focused on progress and form.' },
            { role: 'user', content: prompt },
            // Include images as image_url typed objects (OpenAI may accept data URLs depending on model)
            { role: 'user', content: JSON.stringify({ type: 'image_url', image_url: { url: prev } }) },
            { role: 'user', content: JSON.stringify({ type: 'image_url', image_url: { url: curr } }) },
          ],
          max_tokens: 600,
        }),
      });

      if (!openaiRes.ok) {
        const txt = await openaiRes.text();
        console.error('OpenAI error (images)', txt);
        return new Response(JSON.stringify({ error: 'OpenAI error', details: txt }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }

      const openaiJson = await openaiRes.json();
      const reply = openaiJson?.choices?.[0]?.message?.content ?? openaiJson?.choices?.[0]?.text ?? 'No response from OpenAI';
      return new Response(JSON.stringify({ feedback: reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No prompt provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI key not configured on Supabase (set OPENAI_API_KEY secret)' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Build a concise prompt with user goal context
    const prompt = `User goal: ${goal}\nUser asks: ${text}`;

    // Call OpenAI Chat Completions API (adjust model as desired)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful, concise fitness coach who gives actionable advice.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
      }),
    });

    if (!openaiRes.ok) {
      const txt = await openaiRes.text();
      console.error('OpenAI error', txt);
      return new Response(JSON.stringify({ error: 'OpenAI error', details: txt }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const openaiJson = await openaiRes.json();
    const reply = openaiJson?.choices?.[0]?.message?.content ?? openaiJson?.choices?.[0]?.text ?? 'No response from OpenAI';

    return new Response(JSON.stringify({ feedback: reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Function error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
