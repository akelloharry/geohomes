import { NextResponse } from 'next/server'

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
    const { phoneNumber, amount } = body

    const consumerKey = process.env.NEXT_PUBLIC_DARAJA_CONSUMER_KEY
    const consumerSecret = process.env.NEXT_PUBLIC_DARAJA_CONSUMER_SECRET
    const passkey = process.env.NEXT_PUBLIC_DARAJA_PASSKEY
    const shortcode = process.env.NEXT_PUBLIC_DARAJA_SHORTCODE || '174379'
    const callbackUrl = process.env.NEXT_PUBLIC_DARAJA_CALLBACK_URL || (body.callbackUrl || null)
    const baseUrl = process.env.NEXT_PUBLIC_DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke'

    if (!passkey || passkey === 'N/A' || !shortcode) {
      console.log('Daraja STK Push (mock) payload:', body)
      return NextResponse.json({ status: 'mocked', message: 'STK Push simulated (credentials missing)', payload: body, checkoutRequestID: 'MOCK_DARAJA_123' })
    }

    const token = await getToken(baseUrl, consumerKey, consumerSecret)
    if (!token) {
      console.log('Daraja token not available; returning mock')
      return NextResponse.json({ status: 'mocked', message: 'Daraja token unavailable', payload: body })
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl || `${baseUrl}/api/daraja/callback`,
      AccountReference: body.accountReference || `GEOH${Date.now().toString().slice(-6)}`,
      TransactionDesc: body.description || 'GeoHome - Search Pass'
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })

    const json = await res.json()
    return NextResponse.json({ status: 'live', response: json })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
