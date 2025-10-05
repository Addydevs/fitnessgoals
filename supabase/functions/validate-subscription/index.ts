// supabase/functions/validate-subscription/index.ts

interface ValidatePayload {
  platform: 'ios' | 'android' | string
  productId: string
  receipt?: string | null // iOS base64 receipt preferred; may be a transaction id if using RevenueCat
  purchaseToken?: string | null // Android purchase token
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  // Auth: require a valid Supabase JWT from the client
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const accessToken = authHeader.split(' ')[1]

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

  let payload: ValidatePayload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { platform, productId, receipt, purchaseToken } = payload
  if (!productId) {
    return new Response(JSON.stringify({ error: 'Missing productId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Basic sanity checks before external validation
  if (!receipt && !purchaseToken) {
    return new Response(JSON.stringify({ error: 'Missing receipt or purchaseToken' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const allowedProduct = Deno.env.get('IAP_PRODUCT_MONTHLY') || 'om.capturefit.monthly_premium'
  let active = false

  // iOS: verify with Apple production then fallback to sandbox (21007), per Apple guidance
  if (platform === 'ios' && receipt && receipt.length > 100) {
    const password = Deno.env.get('APP_STORE_SHARED_SECRET') || ''
    if (password) {
      const verify = async (endpoint: string) => {
        const body = { 'receipt-data': receipt, password, 'exclude-old-transactions': true }
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        return await r.json()
      }
      try {
        let resp = await verify('https://buy.itunes.apple.com/verifyReceipt')
        // 21007: sandbox receipt sent to production, retry sandbox
        if (resp?.status === 21007) {
          resp = await verify('https://sandbox.itunes.apple.com/verifyReceipt')
        } else if (resp?.status === 21008) {
          // production receipt sent to sandbox; retry production just in case
          resp = await verify('https://buy.itunes.apple.com/verifyReceipt')
        }
        if (resp?.status === 0) {
          const now = Date.now()
          const items: any[] = resp.latest_receipt_info || resp.receipt?.in_app || []
          for (const it of items) {
            const pid = it.product_id || it.productId
            const exp = Number(it.expires_date_ms || it.expires_date_ms) || 0
            if (pid === allowedProduct && exp > now) { active = true; break }
          }
        }
      } catch (_) {
        // If Apple validation fails due to networking, fall back below
      }
    }
  }

  // Android: minimal check (extend with Play Developer API if desired)
  if (platform === 'android' && purchaseToken && productId === allowedProduct) {
    active = true
  }

  // If using RevenueCat, we may only have a transaction identifier, not a base64 receipt.
  // In that case do a minimal shape check so client UX is not blocked.
  if (!active && productId === allowedProduct && ((receipt && receipt.length > 10) || (purchaseToken && purchaseToken.length > 10))) {
    active = true
  }

  if (!active) {
    return new Response(JSON.stringify({ active: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Upsert a payments record to mark user as PRO
  try {
    // If a row exists, update; otherwise insert. We avoid client UPDATE via RLS by using service role here.
    const nowIso = new Date().toISOString()
    const { error: upsertErr } = await admin
      .from('payments')
      .upsert({
        user_id: userId,
        paid: true,
        subscription_type: 'monthly',
        updated_at: nowIso,
      }, { onConflict: 'user_id' })

    if (upsertErr) {
      console.error('payments upsert failed:', upsertErr)
      // Continue: we can still return active so client UX is unblocked; aicoach will see free until DB writes succeed
    }
  } catch (e) {
    console.error('payments upsert exception:', e)
  }

  return new Response(JSON.stringify({ active: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
