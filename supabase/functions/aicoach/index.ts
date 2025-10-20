// supabase/functions/aicoach/index.ts

interface RequestPayload {
  text: string
  goal?: string
  userProfile?: {
    fitnessLevel: string
    age?: number
    injuries?: string[]
  }
  analysisData?: any
  streaming?: boolean
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const MODEL = "gpt-4o-mini"
const TIMEOUT_MS = 20000 // abort OpenAI call after 20s to avoid hangs
const DEFAULT_STREAM = true // Enable streaming by default for faster perceived response

// Pre-build base system message for speed
const BASE_SYSTEM_MESSAGE =
    "You are an expert AI fitness coach with deep knowledge in exercise science, nutrition, and body composition analysis. You provide:\n" +
    "🏋️‍♂️ Workout Programming: Create personalized routines based on goals, experience, and equipment\n" +
    "🥗 Nutrition Guidance: Macro calculations, meal planning, and dietary recommendations\n" +
    "📊 Progress Analysis: Interpret body composition changes and photo analysis data with specific insights\n" +
    "💪 Form & Technique: Detailed exercise instruction and safety tips\n" +
    "🎯 Goal Setting: SMART fitness goals and milestone tracking\n" +
    "🧠 Motivation: Encouraging, science-based advice that builds confidence\n" +
    "📈 Progress Tracking: Analyze trends, celebrate wins, and adjust strategies\n\n" +
    "When analyzing progress photos:\n" +
    "Focus on specific metrics like muscle definition scores and regional changes\n" +
    "Provide actionable recommendations based on the data\n" +
    "Celebrate improvements and address areas needing attention\n" +
    "Suggest specific exercises for lagging body parts\n" +
    "Consider lighting and photo quality in your assessment\n\n" +
    "Always be:\n" +
    "Encouraging and supportive while being realistic\n" +
    "Specific with sets, reps, weights, and progressions when relevant\n" +
    "Safety-conscious, especially with injuries or limitations\n" +
    "Evidence-based in your recommendations\n" +
    "Concise but comprehensive in your responses\n\n" +
    "Use emojis to make responses engaging and easy to scan."

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // CORS / preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  // Cheap health endpoint (no OpenAI call)
  if (req.method === "GET" && url.pathname === "/health") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders })
  }

  // Auth: require a valid Supabase JWT
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const accessToken = authHeader.split(' ')[1]

  // Create admin client to verify token and query usage/payments
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: userRes, error: userErr } = await admin.auth.getUser(accessToken)
  if (userErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userId = userRes.user.id

  // Safer JSON parsing
  let body: RequestPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const { text, goal, userProfile, analysisData, streaming = DEFAULT_STREAM } = body
  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ error: "Message text is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: "Server is misconfigured (missing API key)" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Construct system message (using pre-built base for speed)
  let systemMessage = BASE_SYSTEM_MESSAGE

  const greetings = ["hi", "hello", "hey", "yo", "hai", "halo", "greetings", "good morning", "good afternoon", "good evening"]
  const isGreeting = greetings.includes(text.trim().toLowerCase())
  if (isGreeting) {
    // Short-circuit: instant local reply for a plain greeting (no LLM call)
    const reply =
        "👋 Hey! I'm your AI fitness coach. I can design workouts, dial in macros, analyze progress pics, and tweak form. Ask me anything to get started! 💪"
    return new Response(JSON.stringify({ response: reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // YouTube hint
  const youtubeRegex = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))/i
  const youtubeMatch = text.match(youtubeRegex)
  if (youtubeMatch) {
    systemMessage +=
        `\n\nYouTube Video Link Detected: The user has sent a YouTube video link (${youtubeMatch[1]}).` +
        "\n- If the video is a workout, form check, or fitness advice, analyze and summarize the key points." +
        "\n- Give feedback, tips, or a summary based on the video content." +
        "\n- If possible, provide timestamped advice or highlight important sections." +
        "\n- If you cannot access the video, let the user know and suggest what info you need."
  }

  if (userProfile) {
    systemMessage += `\n\n👤 User Profile:`
    systemMessage += `\n- Fitness Level: ${userProfile.fitnessLevel}`
    if (userProfile.age) systemMessage += `\n- Age: ${userProfile.age}`
    if (userProfile.injuries?.length) systemMessage += `\n- Injuries/Limitations: ${userProfile.injuries.join(", ")}`
  }
  if (goal) systemMessage += `\n- Primary Goal: ${goal}`
  if (analysisData) systemMessage += `\n\n📊 Latest Analysis Data Available - Use this to provide specific, data-driven coaching advice.`

  // Enforce usage limits before calling OpenAI
  // Determine plan; default to free. If payments table missing or query fails, keep free.
  let plan: 'free' | 'pro' = 'free'

  // Manual premium bypass via profiles table (treat as pro)
  try {
    const { data: prof } = await admin
      .from('profiles')
      .select('"Premium access"')
      .eq('id', userId)
      .single()
    const manualPremium = !!(prof && (prof as any)["Premium access"] === true)
    if (manualPremium) plan = 'pro'
  } catch (_) {
    // ignore
  }
  try {
    const { data: payRows } = await admin
      .from('payments')
      .select('paid, updated_at, subscription_type')
      .eq('user_id', userId)
      .eq('paid', true)
      .order('updated_at', { ascending: false })
      .limit(1)
    if (payRows && payRows.length) {
      const p = payRows[0] as any
      const start = new Date(p.updated_at).getTime()
      const nowMs = Date.now()
      const horizon = p.subscription_type === 'yearly' ? 365 : 30
      if (start + horizon * 24 * 60 * 60 * 1000 > nowMs) plan = 'pro'
    }
  } catch (e) {
    // ignore; plan stays 'free'
  }

  // If not PRO by our payments table, cross-check RevenueCat entitlements
  if (plan === 'free') {
    const RC_KEY = Deno.env.get('REVENUECAT_REST_API_KEY') || ''
    const ENT_ID = (Deno.env.get('RC_ENTITLEMENT_ID') || 'subscription')
    if (RC_KEY) {
      try {
        const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}` , {
          headers: { Authorization: `Bearer ${RC_KEY}` },
        })
        if (rcRes.ok) {
          const rc = await rcRes.json()
          const ents = rc?.subscriber?.entitlements || {}
          const keys = Object.keys(ents)
          // Case-insensitive match for entitlement key
          const entKey = keys.find(k => k.toLowerCase() === ENT_ID.toLowerCase())
          const ent = entKey ? ents[entKey] : null
          const expires = ent?.expires_date ? Date.parse(ent.expires_date) : 0
          if (expires && expires > Date.now()) {
            plan = 'pro'
            // Best-effort: mirror to payments table so other functions can rely on it
            try {
              await admin.from('payments').upsert({ user_id: userId, paid: true, subscription_type: 'monthly', updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
            } catch {}
          }
        }
      } catch (_) {
        // ignore RC failures and keep plan as free
      }
    }
  }

  // Limits
  const DAY = 24 * 60 * 60 * 1000
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    if (plan === 'free') {
      // Free: 10 chats/day
      const { count } = await admin
        .from('usage_events')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId)
        .eq('kind', 'ai_chat')
        .gte('created_at', startOfDay.toISOString())
      if ((count ?? 0) >= 10) {
        return new Response(JSON.stringify({ error: 'Daily free limit (10) reached. Try again tomorrow or upgrade.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Pro: 300 chats/month
      const { count } = await admin
        .from('usage_events')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId)
        .eq('kind', 'ai_chat')
        .gte('created_at', startOfMonth.toISOString())
      if ((count ?? 0) >= 300) {
        return new Response(JSON.stringify({ error: 'Monthly limit (300) reached. Please wait for the next period.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
  } catch (limitErr) {
    console.warn('Usage check failed:', limitErr)
    // Soft-fail to avoid breaking users if DB is down
  }

  // OpenAI call with hard timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(OPENAI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: text },
        ],
        max_tokens: 400, // Reduced from 800 for faster responses
        temperature: 0.7,
        stream: streaming,
      }),
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const timedOut = err && (err as any).name === "AbortError"
    const msg = timedOut
        ? "Upstream model took too long. Please try again in a moment. ⏳"
        : "Couldn't reach the AI service. Please try again. 🔄"
    return new Response(JSON.stringify({ error: msg }), {
      status: timedOut ? 504 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    console.error("OpenAI API error:", response.status, errText)
    return new Response(JSON.stringify({ error: "AI service error", status: response.status }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (streaming) {
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }

  const data = await response.json()
  const aiResponse =
      data.choices?.[0]?.message?.content ||
      "I'm having trouble generating a response right now. Let me try again! 🤔💪"

  // Log usage event (best effort)
  try {
    await admin.from('usage_events').insert({ user_id: userId, kind: 'ai_chat' })
  } catch {}

  return new Response(JSON.stringify({ response: aiResponse }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
