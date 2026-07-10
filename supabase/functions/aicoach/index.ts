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
  conversationHistory?: Array<{ role: string; content: string }> // For context
  imageBase64?: string // For progress photo analysis
  imageUrl?: string // Alternative: URL to progress photo
  previousImageUrl?: string // Optional baseline photo for before/after comparison
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

// AI Provider Configuration
const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "claude" // "claude" or "openai"  
const CLAUDE_URL = "https://api.anthropic.com/v1/messages"
const CLAUDE_MODEL = "claude-sonnet-5" // claude-3-5-sonnet-20241022 was retired Oct 2025
const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = "gpt-4o" // Upgraded from mini for better quality
const TIMEOUT_MS = 30000 // Increased timeout for better responses
const DEFAULT_STREAM = false // Disable streaming for more reliable responses
const MAX_TOKENS = 1500 // Increased for comprehensive coaching responses

// Abuse / cost guards — every value bounds the maximum spend per request or per day
const MAX_TEXT_CHARS = 8000
const MAX_HISTORY_ENTRY_CHARS = 4000
const MAX_IMAGE_BASE64_CHARS = 7_000_000 // ~5MB decoded, Claude's per-image cap
const FREE_DAILY_LIMIT = 10
const PRO_MONTHLY_LIMIT = 300
// Hard ceiling on model calls per day across ALL users — the kill switch if
// someone scripts mass account creation. Tune via env without redeploying.
const GLOBAL_DAILY_LIMIT = Number(Deno.env.get("AI_GLOBAL_DAILY_LIMIT") || "1000")

// Structured-output schema used when a progress photo is attached: the model
// returns the coaching prose plus numeric scores we persist for trend charts.
// Structured outputs forbid numeric min/max constraints, so ranges live in the
// descriptions.
const PHOTO_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    coaching_message: {
      type: "string",
      description: "The full coaching response shown to the user, following the response structure from the system prompt.",
    },
    scores: {
      type: "object",
      description: "Visual assessment of the CURRENT photo. Every score is an integer from 0 to 100.",
      properties: {
        overall_progress: { type: "integer", description: "0-100 overall physique progress versus the previous photo; use 50 as the baseline when there is no previous photo." },
        leanness: { type: "integer", description: "0-100 visible leanness (higher = leaner)." },
        muscle_definition: { type: "integer", description: "0-100 visible muscle definition." },
        posture: { type: "integer", description: "0-100 posture quality in the photo." },
        photo_quality: { type: "integer", description: "0-100 lighting/framing/sharpness for progress-tracking purposes." },
        focus_areas: { type: "array", items: { type: "string" }, description: "1-3 short labels for muscle groups or habits to prioritize next." },
      },
      required: ["overall_progress", "leanness", "muscle_definition", "posture", "photo_quality", "focus_areas"],
      additionalProperties: false,
    },
  },
  required: ["coaching_message", "scores"],
  additionalProperties: false,
}

// Enhanced system message for better coaching
const BASE_SYSTEM_MESSAGE =
    "You are CaptureFit's expert AI fitness coach with elite-level expertise in exercise science, nutrition, body recomposition, and behavioral psychology.\n\n" +
    "YOUR CORE CAPABILITIES:\n" +
    "🏋️‍♂️ Workout Programming: Design progressive, evidence-based training plans tailored to equipment, schedule, and experience level\n" +
    "🥗 Nutrition Strategy: Calculate precise macros, create meal frameworks, and optimize nutrition timing for goals\n" +
    "📊 Progress Analysis: Interpret body composition data, photo analysis metrics, and trend patterns with actionable insights\n" +
    "💪 Exercise Technique: Provide detailed form cues, common mistakes, and injury prevention strategies\n" +
    "🎯 Goal Architecture: Help set SMART goals, create milestone checkpoints, and adjust strategy based on progress\n" +
    "🧠 Behavioral Coaching: Build sustainable habits, overcome plateaus, and maintain motivation through science-based psychology\n" +
    "📈 Data-Driven Adjustments: Analyze weekly/monthly trends to optimize training and nutrition protocols\n\n" +
    "WHEN ANALYZING PROGRESS PHOTOS (with vision):\n" +
    "• Identify visible changes in muscle mass, definition, and body composition\n" +
    "• Reference specific metrics (muscle definition scores, regional analysis) when available\n" +
    "• Note posture, lighting, and photo angle differences that may affect perception\n" +
    "• Celebrate visible wins (vascularity, muscle separation, striations, overall leanness)\n" +
    "• Identify lagging muscle groups and suggest targeted exercises\n" +
    "• Provide honest, constructive feedback with specific next steps\n" +
    "• Consider the timeline - realistic expectations for 1 week vs 1 month vs 3 months\n\n" +
    "COACHING PRINCIPLES:\n" +
    "✅ Be specific: Give exact sets/reps/weights, macro numbers, exercise progressions\n" +
    "✅ Be personal: Reference their goals, past conversations, and current progress\n" +
    "✅ Be encouraging: Celebrate every win, reframe setbacks as learning opportunities\n" +
    "✅ Be safe: Always prioritize injury prevention and proper progression\n" +
    "✅ Be evidence-based: Ground advice in exercise science and nutrition research\n" +
    "✅ Be actionable: Provide clear next steps they can implement immediately\n" +
    "✅ Be engaging: Use emojis strategically, break up text, ask questions to drive engagement\n\n" +
    "RESPONSE STRUCTURE:\n" +
    "1. Acknowledge their message/progress with enthusiasm\n" +
    "2. Provide specific analysis or answer their question\n" +
    "3. Give actionable recommendations (2-3 concrete steps)\n" +
    "4. End with motivation and an open door for follow-up questions\n\n" +
    "Remember: You're their personal coach who knows their journey. Make every interaction feel personalized, supportive, and valuable."

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

  const { text, goal, userProfile, analysisData, streaming = DEFAULT_STREAM, conversationHistory = [], imageBase64, imageUrl, previousImageUrl } = body
  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ error: "Message text is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  if (text.length > MAX_TEXT_CHARS) {
    return new Response(JSON.stringify({ error: `Message too long (max ${MAX_TEXT_CHARS} characters).` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return new Response(JSON.stringify({ error: "Image too large (max ~5MB)." }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  // Only analyze photos stored in this project — blocks feeding arbitrary external URLs to the model
  for (const url of [imageUrl, previousImageUrl]) {
    if (url && !url.startsWith(`${SUPABASE_URL}/storage/v1/object/`)) {
      return new Response(JSON.stringify({ error: "Image URLs must reference an uploaded progress photo." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
  }

  // Get API key based on provider
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("CLAUDE_API_KEY")
  
  if (AI_PROVIDER === "claude" && !claudeApiKey) {
    return new Response(JSON.stringify({ error: "Claude API key not configured. Please add ANTHROPIC_API_KEY or CLAUDE_API_KEY to environment." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  
  if (AI_PROVIDER === "openai" && !openaiApiKey) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Construct system message (using pre-built base for speed)
  let systemMessage = BASE_SYSTEM_MESSAGE

  const greetings = ["hi", "hello", "hey", "yo", "hai", "halo", "greetings", "good morning", "good afternoon", "good evening"]
  const isGreeting = greetings.includes(text.trim().toLowerCase()) && !conversationHistory.length
  if (isGreeting) {
    // Short-circuit: instant local reply for first-time greeting (no LLM call)
    const reply =
        "👋 Hey there! I'm your personal AI fitness coach, powered by advanced AI to help you reach your goals.\n\n" +
        "I can help you with:\n" +
        "💪 Custom workout plans tailored to your equipment and experience\n" +
        "🥗 Precise nutrition guidance and meal planning\n" +
        "📸 Detailed progress photo analysis with specific insights\n" +
        "🎯 Goal setting and progress tracking\n" +
        "🔬 Science-based training and recovery advice\n\n" +
        "What would you like to work on today?"
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
      .select('premium_access')
      .eq('id', userId)
      .single()
    const manualPremium = !!((prof as any)?.premium_access === true)
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
    // Default must match the client's EXPO_PUBLIC_RC_ENTITLEMENT_ID fallback ('pro')
    const ENT_ID = (Deno.env.get('RC_ENTITLEMENT_ID') || 'pro')
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
    // Global circuit breaker: hard daily ceiling on model calls across ALL users
    const { count: globalCount, error: globalErr } = await admin
      .from('usage_events')
      .select('id', { head: true, count: 'exact' })
      .eq('kind', 'ai_chat')
      .gte('created_at', startOfDay.toISOString())
    if (globalErr) throw globalErr
    if ((globalCount ?? 0) >= GLOBAL_DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'The coach is at capacity today. Please try again tomorrow. 🙏' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log the attempt BEFORE calling the model so concurrent requests can't race past the limit.
    // The count below includes this row, hence the strict > comparison.
    const { error: insertErr } = await admin.from('usage_events').insert({ user_id: userId, kind: 'ai_chat' })
    if (insertErr) throw insertErr

    if (plan === 'free') {
      const { count, error } = await admin
        .from('usage_events')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId)
        .eq('kind', 'ai_chat')
        .gte('created_at', startOfDay.toISOString())
      if (error) throw error
      if ((count ?? 0) > FREE_DAILY_LIMIT) {
        return new Response(JSON.stringify({ error: `Daily free limit (${FREE_DAILY_LIMIT}) reached. Try again tomorrow or upgrade.` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      const { count, error } = await admin
        .from('usage_events')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId)
        .eq('kind', 'ai_chat')
        .gte('created_at', startOfMonth.toISOString())
      if (error) throw error
      if ((count ?? 0) > PRO_MONTHLY_LIMIT) {
        return new Response(JSON.stringify({ error: `Monthly limit (${PRO_MONTHLY_LIMIT}) reached. Please wait for the next period.` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
  } catch (limitErr) {
    console.error('Usage check failed:', limitErr)
    // Fail closed: if we cannot verify limits, do not spend on a model call
    return new Response(JSON.stringify({ error: 'Usage check unavailable. Please try again shortly.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Prepare messages with conversation history. Entries are size-capped and
  // role-validated since the client payload is untrusted. Claude also requires
  // messages[0] to be a user turn, so drop any leading assistant entries
  // (e.g. the client's canned welcome message).
  const history = conversationHistory
    .slice(-10)
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_ENTRY_CHARS) }))
  while (history.length && history[0].role !== "user") history.shift()
  const messages = [
    ...history,
    { role: "user", content: text },
  ]

  // Add image(s) to the user message if provided (for vision models).
  // With a previousImageUrl the model sees a labeled before/after pair.
  const hasImage = !!(imageBase64 || imageUrl)
  if (hasImage) {
    let userContent: any
    if (AI_PROVIDER === "claude") {
      const currentImage = imageBase64
        ? { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } }
        : { type: "image", source: { type: "url", url: imageUrl } }
      userContent = [
        { type: "text", text },
        ...(previousImageUrl
          ? [
              { type: "text", text: "Previous progress photo (baseline):" },
              { type: "image", source: { type: "url", url: previousImageUrl } },
              { type: "text", text: "Current progress photo:" },
            ]
          : []),
        currentImage,
      ]
    } else {
      // OpenAI format for images
      userContent = [
        { type: "text", text },
        ...(previousImageUrl ? [{ type: "image_url", image_url: { url: previousImageUrl } }] : []),
        { type: "image_url", image_url: { url: imageUrl || `data:image/jpeg;base64,${imageBase64}` } },
      ]
    }
    messages[messages.length - 1].content = userContent
  }

  // Call appropriate AI provider
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    if (AI_PROVIDER === "claude") {
      // Claude API call
      response = await fetch(CLAUDE_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claudeApiKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemMessage,
          messages: messages,
          // Photo analyses come back as JSON (prose + numeric scores) so the
          // scores can be persisted and charted over time
          ...(hasImage ? { output_config: { format: { type: "json_schema", schema: PHOTO_ANALYSIS_SCHEMA } } } : {}),
        }),
      })
    } else {
      // OpenAI API call (fallback)
      response = await fetch(OPENAI_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemMessage },
            ...messages,
          ],
          max_tokens: MAX_TOKENS,
          temperature: 0.7,
        }),
      })
    }
  } catch (err) {
    clearTimeout(timeoutId)
    const timedOut = err && (err as any).name === "AbortError"
    const msg = timedOut
        ? "The AI is taking longer than usual. Please try again in a moment. ⏳"
        : "Couldn't reach the AI service. Please check your connection and try again. 🔄"
    return new Response(JSON.stringify({ error: msg }), {
      status: timedOut ? 504 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    console.error(`${AI_PROVIDER.toUpperCase()} API error:`, response.status, errText)
    return new Response(JSON.stringify({ error: "AI service error", status: response.status, details: errText.substring(0, 200) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const data = await response.json()
  const FALLBACK_REPLY = "I'm having trouble generating a response right now. Let me try again! 🤔💪"
  let aiResponse: string
  let scores: Record<string, unknown> | null = null

  if (AI_PROVIDER === "claude") {
    const raw = data.content?.find((b: any) => b.type === "text")?.text || ""
    if (hasImage && raw) {
      // Structured output: a JSON document with coaching prose + scores
      try {
        const parsed = JSON.parse(raw)
        aiResponse = parsed.coaching_message || raw
        scores = parsed.scores ?? null
      } catch {
        aiResponse = raw
      }
    } else {
      aiResponse = raw || FALLBACK_REPLY
    }
  } else {
    aiResponse = data.choices?.[0]?.message?.content || FALLBACK_REPLY
  }

  // Persist scores on the photo row so the Progress tab can chart trends (best effort)
  if (scores && imageUrl) {
    try {
      await admin
        .from('photos')
        .update({ ai_scores: scores, analysis: aiResponse })
        .eq('user_id', userId)
        .eq('url', imageUrl)
    } catch (e) {
      console.warn('Failed to persist photo scores:', e)
    }
  }

  // Usage event was already logged before the model call (race-safe accounting)

  return new Response(JSON.stringify({ response: aiResponse, scores }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
