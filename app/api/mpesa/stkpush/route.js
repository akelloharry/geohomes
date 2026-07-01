import { NextResponse } from 'next/server'

// STK Push endpoint: tries to use token endpoint if credentials available,
// otherwise returns a mock response.
async function getToken() {
  try {
    const res = await fetch('/api/mpesa/token')
    if (!res.ok) return null
    const json = await res.json()
    return json.access_token
  } catch (err) {
    return null
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    // body should include phone, amount, account

    // If passkey/shortcode not configured, return mocked response.
    const passkey = process.env.MPESA_PASSKEY
    const shortcode = process.env.MPESA_SHORTCODE

    if (!passkey || passkey === 'N/A' || !shortcode || shortcode === 'N/A') {
      // Log incoming request server-side (console) for later processing
      console.log('MPESA STK PUSH (mock) payload:', body)
      return NextResponse.json({ status: 'mocked', message: 'STK Push simulated (credentials missing)', payload: body, checkoutRequestID: 'MOCK123456789' })
    }

    // attempt to obtain token
    const token = await getToken()
    if (!token) {
      console.log('MPESA token unavailable; falling back to mock')
      return NextResponse.json({ status: 'mocked', message: 'STK Push simulated (token failure)', payload: body, checkoutRequestID: 'MOCK123456789' })
    }

    // Build STK push payload (Daraja)
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: body.amount,
      PartyA: body.phone,
      PartyB: shortcode,
      PhoneNumber: body.phone,
      CallBackURL: body.callback_url || 'https://example.com/mpesa/callback',
      AccountReference: body.account || 'GeoHome',
      TransactionDesc: body.description || 'GeoHome search pass'
    }

    const res = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(stkPayload)
    })

    const json = await res.json()
    return NextResponse.json({ status: 'live', response: json })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
