// Import Supabase client and base64 module from Deno's standard library
import { decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- CORS HEADERS ---
// These are necessary for the browser (and React Native) to allow requests from your app.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- SUPABASE CLIENT SETUP ---
// It's good practice to ensure your environment variables are set.
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error("FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  // In a real app, you'd want to handle this more gracefully.
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!);


// --- MAIN SERVER LOGIC ---
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from the incoming request.
    const { userId, fileName, fileBase64, contentType } = await req.json();

    // Validate that all required fields are present.
    if (!userId || !fileName || !fileBase64 || !contentType) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, fileName, fileBase64, contentType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Decode the base64 string into a file buffer.
    const fileBuffer = decode(fileBase64);

    // 3. Upload the file to Supabase Storage.
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(`${userId}/${fileName}`, fileBuffer, {
        contentType,
        upsert: true, // Overwrite the file if it already exists.
      });

    if (uploadError) {
      console.error('Supabase Storage Error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Retrieve the public URL of the uploaded file.
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(`${userId}/${fileName}`);

    if (!urlData || !urlData.publicUrl) {
      console.error('Could not get public URL for:', `${userId}/${fileName}`);
      return new Response(JSON.stringify({ error: 'File uploaded but failed to get public URL.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Return the public URL in the response.
    return new Response(JSON.stringify({ publicUrl: urlData.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    // Catch any unexpected errors.
    console.error('Unhandled Server Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'An unexpected error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


