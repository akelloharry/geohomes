import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.MPESA_CONSUMER_KEY
    const secret = process.env.MPESA_CONSUMER_SECRET
    if (!key || !secret) return NextResponse.json({ error: 'Credentials not configured' }, { status: 400 })

    const auth = Buffer.from(`${key}:${secret}`).toString('base64')
    const res = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    })
    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ error: 'Token request failed', detail: txt }, { status: 502 })
    }
    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
