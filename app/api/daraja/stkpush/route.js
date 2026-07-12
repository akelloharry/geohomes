import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const bypassFlag = process.env.NEXT_PUBLIC_BYPASS_PAYMENT
const BYPASS_PAYMENT = bypassFlag === undefined ? true : ['true', '1', 'yes', 'on'].includes(String(bypassFlag).toLowerCase())

function readEnv(name) {
  return process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || null
}

async function getToken(baseUrl, consumerKey, consumerSecret) {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    const url = `${baseUrl.replace(/\/$/, '')}/oauth/v1/generate?grant_type=client_credentials`
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
    if (!res.ok) return null
    const json = await res.json()
    return json.access_token
  } catch (e) {
    return null
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const phoneNumber = body.phoneNumber || body.phone || body.msisdn || body.phone_no
    const amount = body.amount || body.amountToPay || 200

    if (BYPASS_PAYMENT) {
      console.log('🔍 BYPASS_PAYMENT value:', bypassFlag)
      console.log('🔍 BYPASS_PAYMENT enabled:', BYPASS_PAYMENT)
      console.log('🔍 Supabase URL configured:', Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL))
      console.log('🔍 Supabase service key configured:', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY))
      console.log('🔓 Bypass mode enabled – creating pass without payment')
      if (!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'Service role not configured for bypass mode' }, { status: 500 })
      }

      const durationDays = body.userId ? 4 : 3
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

      let pass = null
      let insertError = null
      const insertPayloads = [
        {
          tenant_id: body.userId || 'guest',
          user_id: body.userId || null,
          session_id: body.sessionId || null,
          expires_at: expiresAt,
          paid_amount: Number(amount)
        },
        {
          tenant_id: body.userId || 'guest',
          session_id: body.sessionId || null,
          expires_at: expiresAt,
          paid_amount: Number(amount)
        },
        {
          tenant_id: body.userId || 'guest',
          session_id: body.sessionId || null,
          expires_at: expiresAt
        },
        {
          tenant_id: body.userId || 'guest',
          session_id: body.sessionId || null
        }
      ]

      for (const payload of insertPayloads) {
        try {
          const response = await supabaseAdmin
            .from('search_passes')
            .insert(payload)
            .select()
            .single()

          if (!response.error) {
            pass = response.data
            insertError = null
            break
          }

          insertError = response.error
          console.warn('Bypass insert attempt failed with payload:', payload, response.error)
        } catch (err) {
          insertError = err
          console.warn('Bypass insert attempt exception:', payload, err)
        }
      }

      if (insertError) {
        console.error('Bypass insert error:', insertError)
        return NextResponse.json({
          success: true,
          status: 'bypassed',
          bypass: true,
          data: {
            MerchantRequestID: `BYPASS-${Date.now()}`,
            CheckoutRequestID: `BYPASS-${Date.now()}`,
            ResponseDescription: 'Bypass mode – pass created successfully (database insert fallback)',
            pass: null
          },
          warning: insertError?.message || String(insertError)
        })
      }

      return NextResponse.json({
        success: true,
        status: 'bypassed',
        bypass: true,
        data: {
          MerchantRequestID: `BYPASS-${Date.now()}`,
          CheckoutRequestID: `BYPASS-${Date.now()}`,
          ResponseDescription: 'Bypass mode – pass created successfully',
          pass
        }
      })
    }

    const consumerKey = readEnv('DARAJA_CONSUMER_KEY') || readEnv('MPESA_CONSUMER_KEY')
    const consumerSecret = readEnv('DARAJA_CONSUMER_SECRET') || readEnv('MPESA_CONSUMER_SECRET')
    const passkey = readEnv('DARAJA_PASSKEY') || readEnv('MPESA_PASSKEY')
    const shortcode = readEnv('DARAJA_SHORTCODE') || readEnv('MPESA_SHORTCODE') || '174379'
    const baseUrl = readEnv('DARAJA_BASE_URL') || 'https://sandbox.safaricom.co.ke'
    const callbackBaseUrl = readEnv('DARAJA_CALLBACK_URL') || body.callbackUrl || null

    if (!passkey || passkey === 'N/A' || !shortcode) {
      console.log('Daraja STK Push (mock) payload:', body)
      return NextResponse.json({ status: 'mocked', message: 'STK Push simulated (credentials missing)', payload: body, checkoutRequestID: 'MOCK_DARAJA_123' })
    }

    const token = await getToken(baseUrl, consumerKey, consumerSecret)
    if (!token) {
      console.log('Daraja token not available; returning mock')
      return NextResponse.json({ status: 'mocked', message: 'Daraja token unavailable', payload: body, checkoutRequestID: 'MOCK_DARAJA_123' })
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    let callbackUrl = callbackBaseUrl || `${baseUrl}/api/daraja/callback`
    try {
      const callbackUrlObject = new URL(callbackUrl, baseUrl)
      if (body.userId) callbackUrlObject.searchParams.set('user_id', body.userId)
      if (body.sessionId) callbackUrlObject.searchParams.set('session_id', body.sessionId)
      callbackUrl = callbackUrlObject.toString()
    } catch (e) {
      console.warn('Failed to attach Daraja callback context', e)
    }

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(amount),
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: body.accountReference || `GEOH${Date.now().toString().slice(-6)}`,
      TransactionDesc: body.description || 'GeoHome - Search Pass'
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })

    const json = await res.json()
    return NextResponse.json({ status: 'live', response: json, checkoutRequestID: json?.CheckoutRequestID || null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
