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
  'You are a fitness progress coach. Compare the provided progress photos and describe observable differences in posture, muscle visibility, or overall shape using neutral, objective language. Focus on fitness-related observations only (such as visible muscle tone, symmetry, or posture). Do not make comments about attractiveness, beauty, or personal identity. Provide constructive workout and nutrition advice in a supportive and motivational tone.'

    let prompt = `${fitnessInstruction}\n${text}`
    if (previousPhotoUrl && currentPhotoUrl) {
  if (text && /compare|difference|progress|change/i.test(text)) {
    prompt = `${fitnessInstruction}\nCompare the two provided photos and:
 1. Describe the changes in physical appearance and fitness between the previous and current photo (muscle definition, posture, body composition, visible progress).
 2. Give advice on what the person should improve next, and which body parts need more work.
 3. Highlight which body parts look good and which need more attention.
 4. Give specific, actionable advice for their next steps and training focus.
 5. Be encouraging and constructive in your feedback.
${goal ? '\nGoal: ' + goal : ''}`
  } else {
    prompt = `${fitnessInstruction}\nAnalyze the person's physical appearance in this photo:
 1. Describe their fitness, physique, muscle definition, posture, and body composition.
 2. Highlight which body parts look good and which need more work.
 3. Give advice on what they should improve next and how.
 4. Give specific, actionable advice for their next steps and training focus.
 5. Be encouraging and constructive in your feedback.
${goal ? '\nGoal: ' + goal : ''}`
  }
    } else if (currentPhotoUrl) {
  prompt = `${fitnessInstruction}\nAnalyze the person's physical appearance in this photo:
 1. Describe their fitness, physique, muscle definition, posture, and body composition.
 2. Highlight which body parts look good and which need more work.
 3. Give advice on what they should improve next and how.
 4. Give specific, actionable advice for their next steps and training focus.
 5. Be encouraging and constructive in your feedback.
${goal ? '\nGoal: ' + goal : ''}`
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
        model: 'gpt-4o-mini',
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
