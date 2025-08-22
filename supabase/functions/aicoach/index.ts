import { corsHeaders } from '../_shared/cors.ts'

// @ts-ignore: Deno remote import for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  // This is needed if you're deploying functions from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, previousPhotoUrl, currentPhotoUrl, goal } = await req.json()

    const fitnessInstruction =
      'You are a fitness and gym expert. Only provide answers, analysis, and advice related to fitness, exercise, gym routines, nutrition for athletes, and workout progress. Ignore or refuse any non-fitness topics.'

    let prompt = `${fitnessInstruction}\n${text}`
    if (previousPhotoUrl && currentPhotoUrl) {
      prompt = `${fitnessInstruction}\nCompare the two provided photos and describe the physical and fitness-related changes you observe. Focus on muscle definition, posture, body composition, and any visible progress. ${
        goal ? 'Goal: ' + goal : ''
      }`
    } else if (currentPhotoUrl) {
      prompt = `${fitnessInstruction}\nDescribe the fitness, physique, muscle definition, posture, and body composition of the person in this photo. ${
        goal ? 'Goal: ' + goal : ''
      }`
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    let messages: {
      role: 'user'
      content: (
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      )[]
    }[] = [{ role: 'user', content: [{ type: 'text', text: prompt }] }]

    if (previousPhotoUrl && currentPhotoUrl) {
      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: previousPhotoUrl } },
            { type: 'image_url', image_url: { url: currentPhotoUrl } },
          ],
        },
      ]
    } else if (currentPhotoUrl) {
      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: currentPhotoUrl } },
          ],
        },
      ]
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        stream: false, // Disable streaming
      }),
    })

    if (!openaiRes.ok) {
      const errorBody = await openaiRes.text()
      console.error('OpenAI API error:', errorBody)
      return new Response(JSON.stringify({ error: 'OpenAI API error', details: errorBody }), {
        status: openaiRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const openaiJson = await openaiRes.json()
    let reply =
      (openaiJson.choices && Array.isArray(openaiJson.choices) && openaiJson.choices[0]?.message?.content)
        ? openaiJson.choices[0].message.content
        : 'No response from OpenAI'
    return new Response(JSON.stringify({ feedback: reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Function error', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
