import { serve } from "https://deno.land/std@0.168.0/http/server.ts"


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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { text, goal, userProfile, analysisData, streaming = false } = (await req.json()) as RequestPayload
  // Detect YouTube link in user text
  const youtubeRegex = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))/i
  const youtubeMatch = text.match(youtubeRegex)

    if (!text) {
      return new Response(JSON.stringify({ error: "Message text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    let systemMessage =
  "You are an expert AI fitness coach with deep knowledge in exercise science, nutrition, and body composition analysis. You provide:\n" +
  "🏋️‍♂️ Workout Programming: Create personalized routines based on goals, experience, and equipment\n" +
  "🥗 Nutrition Guidance: Macro calculations, meal planning, and dietary recommendations\n" +
  "📊 Progress Analysis: Interpret body composition changes and photo analysis data with specific insights\n" +
  "💪 Form & Technique: Detailed exercise instruction and safety tips\n" +
  "🎯 Goal Setting: SMART fitness goals and milestone tracking\n" +
  "🧠 Motivation: Encouraging, science-based advice that builds confidence\n" +
  "📈 Progress Tracking: Analyze trends, celebrate wins, and adjust strategies\n" +
  "\n" +
  "When analyzing progress photos:\n" +
  "Focus on specific metrics like muscle definition scores and regional changes\n" +
  "Provide actionable recommendations based on the data\n" +
  "Celebrate improvements and address areas needing attention\n" +
  "Suggest specific exercises for lagging body parts\n" +
  "Consider lighting and photo quality in your assessment\n" +
  "\n" +
  "Always be:\n" +
  "Encouraging and supportive while being realistic\n" +
  "Specific with sets, reps, weights, and progressions when relevant\n" +
  "Safety-conscious, especially with injuries or limitations\n" +
  "Evidence-based in your recommendations\n" +
  "Concise but comprehensive in your responses\n" +
  "\n" +
  "Use emojis to make responses engaging and easy to scan.";

  // Context-aware: if user sends a greeting, override systemMessage for a friendly intro
  const greetings = ["hi", "hello", "hey", "yo", "hai", "halo", "greetings", "good morning", "good afternoon", "good evening"];
  if (greetings.includes(text.trim().toLowerCase())) {
    systemMessage = "You are an AI fitness coach. If the user greets you, respond with a friendly greeting and a short intro about your capabilities (use emojis). Only provide fitness advice if the user asks a specific question.";
  }

    // YouTube link support: append instructions if detected
    if (youtubeMatch) {
      systemMessage +=
    "\n\nYouTube Video Link Detected: The user has sent a YouTube video link (" + youtubeMatch[1] + ")." +
    "\n- If the video is a workout, form check, or fitness advice, analyze and summarize the key points." +
    "\n- Give feedback, tips, or a summary based on the video content." +
    "\n- If possible, provide timestamped advice or highlight important sections." +
    "\n- If you cannot access the video, let the user know and suggest what info you need.";
    }

    if (userProfile) {
      systemMessage += `\n\n👤 User Profile:`
      systemMessage += `\n- Fitness Level: ${userProfile.fitnessLevel}`
      if (userProfile.age) {
        systemMessage += `\n- Age: ${userProfile.age}`
      }
      if (userProfile.injuries && userProfile.injuries.length > 0) {
        systemMessage += `\n- Injuries/Limitations: ${userProfile.injuries.join(", ")}`
      }
    }

    if (goal) {
      systemMessage += `\n- Primary Goal: ${goal}`
    }

    if (analysisData) {
      systemMessage += `\n\n📊 Latest Analysis Data Available - Use this to provide specific, data-driven coaching advice.`
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: streaming,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenAI API error:", response.status, errorData)
      throw new Error(`OpenAI API error: ${response.status}`)
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
    } else {
      const data = await response.json()
      const aiResponse =
        data.choices[0]?.message?.content ||
        "I'm having trouble generating a response right now. Let me try again! 🤔💪"

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("AI Coach function error:", error)

    const errorMessage = error.message.includes("API key")
      ? "AI Coach is temporarily unavailable. Please try again in a moment! 🔄"
      : "I encountered an issue processing your request. Please try again! 💪"

    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
