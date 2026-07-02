import { NextResponse } from 'next/server'

function readEnv(name) {
  return process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || null
}

export async function GET() {
  try {
    const consumerKey = readEnv('DARAJA_CONSUMER_KEY') || readEnv('MPESA_CONSUMER_KEY')
    const consumerSecret = readEnv('DARAJA_CONSUMER_SECRET') || readEnv('MPESA_CONSUMER_SECRET')
    const baseUrl = readEnv('DARAJA_BASE_URL') || 'https://sandbox.safaricom.co.ke'

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'Daraja credentials not configured' }, { status: 500 })
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    const url = `${baseUrl.replace(/\/$/, '')}/oauth/v1/generate?grant_type=client_credentials`

    const res = await fetch(url, {
      method: 'GET',
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
