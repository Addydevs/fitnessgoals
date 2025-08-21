// @ts-ignore: Deno remote import for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  try {
  const body = await req.json().catch(() => ({} as any));
    const text: string = body.text ?? '';
    const previousPhoto: string = body.previousPhoto ?? '';
    const currentPhoto: string = body.currentPhoto ?? '';
    const goal: string = body.goal ?? '';
    // Compose prompt for comparison
    // Always prefix prompt with fitness-only instruction
    const fitnessInstruction = "You are a fitness and gym expert. Only provide answers, analysis, and advice related to fitness, exercise, gym routines, nutrition for athletes, and workout progress. Ignore or refuse any non-fitness topics.";
    let prompt = `${fitnessInstruction}\n${text}`;
    if (previousPhoto && currentPhoto) {
      prompt = `${fitnessInstruction}\nCompare the two provided photos and describe the physical and fitness-related changes you observe. Focus on muscle definition, posture, body composition, and any visible progress. ${goal ? 'Goal: ' + goal : ''}`;
    } else if (currentPhoto) {
      prompt = `${fitnessInstruction}\nDescribe the fitness, physique, muscle definition, posture, and body composition of the person in this photo. ${goal ? 'Goal: ' + goal : ''}`;
    }
    if (!prompt || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No prompt provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Use the OpenAI API key from Supabase secrets
    // @ts-ignore: Deno global for Supabase Edge Functions
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
   // Debug: log the key
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  // Start OpenAI request
    // Add timeout logic for fetch
    const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
    let openaiRes;
    // Build OpenAI Vision message for one or two images
    let messages: { role: 'user'; content: ({ type: 'text'; text: string; } | { type: 'image_url'; image_url: { url: string; }; })[] }[] = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];
    if (previousPhoto && currentPhoto) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: previousPhoto } },
          { type: 'image_url', image_url: { url: currentPhoto } }
        ]
      }];
    } else if (currentPhoto) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: currentPhoto } }
        ]
      }];
    }
    try {
      openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err && ((err as any).name === 'AbortError' || (err as any).message?.includes('aborted'))) {
        return new Response(JSON.stringify({ error: 'OpenAI timeout', details: 'OpenAI API did not respond in time.' }), { status: 504, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'OpenAI fetch error', details: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    } finally {
      clearTimeout(timeout);
    }
    let openaiJson;
    let txt = '';
    if (!openaiRes.ok) {
      txt = await openaiRes.text();
      try {
        openaiJson = JSON.parse(txt);
      } catch {
        openaiJson = {};
      }
      if (openaiJson.error?.code === 'insufficient_quota') {
        return new Response(JSON.stringify({ error: 'Quota exceeded', details: openaiJson.error.message }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'OpenAI error', details: txt }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    openaiJson = await openaiRes.json();
    let reply =
      (openaiJson.choices && Array.isArray(openaiJson.choices) && openaiJson.choices[0]?.message?.content)
        ? openaiJson.choices[0].message.content
        : (openaiJson.output && Array.isArray(openaiJson.output) && openaiJson.output[0]?.content?.[0]?.text)
        ? openaiJson.output[0].content[0].text
        : 'No response from OpenAI';
    return new Response(JSON.stringify({ feedback: reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    console.error('Function error', err);
    let details = '';
    if (typeof err === 'string') {
      details = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      details = String((err as { message?: string; stack?: string }).message ?? '') + ((err as { stack?: string }).stack ? '\n' + (err as { stack?: string }).stack : '');
    } else {
      details = JSON.stringify(err);
    }
    return new Response(JSON.stringify({ error: 'Server error', details }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
