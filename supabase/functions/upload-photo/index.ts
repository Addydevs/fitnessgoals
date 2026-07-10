// Import Supabase client and base64 module
import { decode } from "https://deno.land/std@0.208.0/encoding/base64.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"


// --- CORS HEADERS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// --- ABUSE / COST GUARDS ---
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_BASE64_CHARS = Math.ceil(MAX_FILE_BYTES * 4 / 3) + 4
const DAILY_UPLOAD_LIMIT = 30
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]

// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

if (!supabaseUrl || !serviceRoleKey) {
  console.error("FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!)

// --- MAIN SERVER LOGIC ---
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Auth: the uploader is whoever the JWT says, never a userId from the body
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const { data: userRes, error: userErr } = await supabase.auth.getUser(authHeader.split(" ")[1])
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const userId = userRes.user.id

    const { fileName, fileBase64, contentType } = await req.json()

    if (!fileName || !fileBase64 || !contentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileName, fileBase64, contentType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    if (!ALLOWED_CONTENT_TYPES.includes(String(contentType).toLowerCase())) {
      return new Response(JSON.stringify({ error: "Only image uploads are allowed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (typeof fileBase64 !== "string" || fileBase64.length > MAX_BASE64_CHARS) {
      return new Response(JSON.stringify({ error: "File too large (max 10MB)." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Keep uploads inside the caller's own folder; strip any path segments from fileName
    const safeName = String(fileName).split("/").pop()!.split("\\").pop()!
    if (!safeName) {
      return new Response(JSON.stringify({ error: "Invalid file name." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Daily upload cap
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { count: todayCount, error: countErr } = await supabase
      .from("photos")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .gte("timestamp", startOfDay.toISOString())
    if (countErr) {
      console.error("Upload count check failed:", countErr)
      return new Response(JSON.stringify({ error: "Upload check unavailable. Please try again shortly." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    if ((todayCount ?? 0) >= DAILY_UPLOAD_LIMIT) {
      return new Response(JSON.stringify({ error: `Daily upload limit (${DAILY_UPLOAD_LIMIT}) reached.` }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const fileBuffer = decode(fileBase64)

    // Upload to storage
    const { error: uploadError } = await supabase.storage.from("photos").upload(`${userId}/${safeName}`, fileBuffer, {
      contentType,
      upsert: true,
    })

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError)
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(`${userId}/${safeName}`)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return new Response(JSON.stringify({ error: "File uploaded but failed to get public URL." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // --- Insert into photos table ---
    const { error: dbError } = await supabase.from("photos").insert({
      id: crypto.randomUUID(), // ensure unique id
      url: publicUrl,
      user_id: userId,
      timestamp: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Database insert error:", dbError)
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Unhandled Server Error:", err)
    return new Response(JSON.stringify({ error: (err as Error).message || "An unexpected error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
