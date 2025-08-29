import { serve } from "https://deno.land/std@0.168.0/http/server.ts"


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (req.url.endsWith("/health")) {
      return new Response(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { text, imageUrls, goal, userProfile } = await req.json()

    // Handle ping requests
    if (text === "ping") {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable")
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "AI service not properly configured. Please check environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Check if client requests streaming
    const accept = req.headers.get("accept")
    const isStreaming = accept?.includes("text/event-stream")

    // Build AI prompt with context
    const contextPrompt = buildAIPrompt(text, goal, userProfile, imageUrls)

    if (isStreaming) {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()

          const simulateAIResponse = async () => {
            try {
              const response = await generateAIResponse(contextPrompt, OPENAI_API_KEY, imageUrls)
              const words = response.split(" ")

              for (let i = 0; i < words.length; i++) {
                const chunk = i === 0 ? words[i] : " " + words[i]
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))

                const delay = Math.max(30, Math.min(150, chunk.length * 15 + Math.random() * 80))
                await new Promise((resolve) => setTimeout(resolve, delay))
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            } catch (error) {
              console.error("AI response error:", error)
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: "Sorry, I encountered an error processing your request. Please try again.",
                  })}\n\n`,
                ),
              )
              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            }
          }

          simulateAIResponse()
        },
      })

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...corsHeaders,
        },
      })
    }

    const response = await generateAIResponse(contextPrompt, OPENAI_API_KEY, imageUrls)
    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: error.stack, // Added stack trace for debugging
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    )
  }
})

function buildAIPrompt(text: string, goal?: string, userProfile?: any, imageUrls?: string[]): string {
  let prompt = `You are an AI fitness coach specializing in exercise form analysis and motivational coaching. `

  if (goal) {
    prompt += `The user's fitness goal is: ${goal}. `
  }

  if (userProfile) {
    prompt += `User profile - Fitness level: ${userProfile.fitnessLevel || "beginner"}`
    if (userProfile.age) {
      prompt += `, Age: ${userProfile.age}`
    }
    if (userProfile.injuries && userProfile.injuries.length > 0) {
      prompt += `, Injuries/limitations: ${userProfile.injuries.join(", ")}`
    }
    prompt += ". "
  }

  if (imageUrls && imageUrls.length > 0) {
    prompt += `IMPORTANT: The user has shared ${imageUrls.length} fitness photo(s) for coaching feedback. 
    
    Please provide motivational fitness coaching based on what you observe. Focus on:
    - Exercise form and technique improvements
    - Workout environment and setup
    - General fitness progress and achievements
    - Motivational encouragement and next steps
    - Specific exercise recommendations
    - Form corrections if applicable
    
    Provide supportive, encouraging feedback that helps with their fitness journey. Keep the tone positive and motivational. `
  }

  prompt += `User message: ${text}`

  return prompt
}

async function generateAIResponse(prompt: string, apiKey: string, imageUrls?: string[]): Promise<string> {
  try {
    console.log("[v0] Image URLs provided:", imageUrls)

    const hasImages = imageUrls && imageUrls.length > 0
    console.log("[v0] Has images:", hasImages, "Image URLs:", imageUrls)

    const messages = []

    if (hasImages && imageUrls.length > 0) {
      messages.push({
        role: "system",
        content: `You are an expert AI fitness coach specializing in exercise form analysis and motivational coaching. When analyzing fitness photos, focus on:

- Exercise technique and form improvements
- Workout setup and environment
- General fitness progress and achievements  
- Motivational encouragement and support
- Specific exercise recommendations
- Safety considerations and form corrections

Provide supportive, encouraging feedback that helps users improve their fitness journey. Keep responses positive, motivational, and focused on actionable fitness advice. Avoid detailed body analysis and instead focus on exercise technique, form, and general progress encouragement.

IMPORTANT: Use plain text formatting only. Do not use markdown characters like #, *, -, or other special formatting symbols. Write in clear, simple sentences with natural paragraph breaks.`,
      })

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          ...imageUrls.map((url) => ({
            type: "image_url",
            image_url: {
              url: url,
              detail: "high",
            },
          })),
        ],
      })
    } else {
      messages.push({
        role: "system",
        content: `You are an expert AI fitness coach. Provide personalized, motivational, and scientifically-backed fitness advice. Be encouraging and format responses clearly. Keep responses concise, strong, and direct. 

IMPORTANT: Use plain text formatting only. Do not use markdown characters like #, *, -, bullet points, or other special formatting symbols. Write in clear, simple sentences with natural paragraph breaks. Avoid any symbols or characters that could be interpreted as formatting.`,
      })

      messages.push({
        role: "user",
        content: prompt,
      })
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: hasImages ? 800 : 500,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again."
  } catch (error) {
    console.error("OpenAI API error:", error)

    return `AI Coach Temporarily Unavailable

I'm experiencing technical difficulties right now, but don't let that stop your progress! 

Quick Motivation:
Your dedication to fitness is already paying off. Every workout brings you closer to your goals. Consistency is the key to transformation. You're stronger than you think!

Please try again in a moment for detailed analysis and personalized coaching!`
  }
}
