import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'

async function findMatchingPass(userId, sessionId, phoneNumber) {
  if (userId) {
    const { data } = await supabase.from('search_passes').select('*').eq('user_id', userId).order('purchased_at', { ascending: false }).limit(5)
    const match = (data || []).find((item) => !item.expires_at || new Date(item.expires_at) <= new Date()) || (data || [])[0]
    if (match) return match
  }

  if (sessionId) {
    const { data } = await supabase.from('search_passes').select('*').eq('session_id', sessionId).order('purchased_at', { ascending: false }).limit(5)
    const match = (data || []).find((item) => !item.expires_at || new Date(item.expires_at) <= new Date()) || (data || [])[0]
    if (match) return match
  }

  if (phoneNumber) {
    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('phone', phoneNumber).maybeSingle()
      if (profile?.id) {
        const { data } = await supabase.from('search_passes').select('*').eq('user_id', profile.id).order('purchased_at', { ascending: false }).limit(5)
        const match = (data || []).find((item) => !item.expires_at || new Date(item.expires_at) <= new Date()) || (data || [])[0]
        if (match) return match
      }
    } catch (e) {
      console.warn('Failed to lookup profile by phone', e)
    }
  }

  return null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const sessionId = url.searchParams.get('session_id')
    const result = body?.Body?.stkCallback
    if (!result) {
      console.warn('Daraja callback received unexpected payload', body)
      return NextResponse.json({ success: false, error: 'Unexpected payload' }, { status: 400 })
    }

    const resultCode = result.ResultCode
    const callbackItems = result.CallbackMetadata?.Item || []

    const amount = callbackItems.find((i) => i.Name === 'Amount')?.Value || null
    const phoneNumber = callbackItems.find((i) => i.Name === 'PhoneNumber')?.Value || null

    if (resultCode === 0) {
      const durationDays = userId ? 4 : 3
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      const updatePayload = {
        user_id: userId,
        session_id: sessionId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt,
        paid_amount: amount || 200
      }

      try {
        const existingPass = await findMatchingPass(userId, sessionId, phoneNumber)
        if (existingPass?.id) {
          const { error } = await supabase.from('search_passes').update(updatePayload).eq('id', existingPass.id)
          if (error) console.warn('Failed to update search_passes row', error)
        } else {
          const { error } = await supabase.from('search_passes').insert(updatePayload)
          if (error) console.warn('Failed to insert search_passes row', error)
        }
      } catch (e) {
        console.error('Error updating search_passes', e)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: result.ResultDesc || 'Payment failed' })
  } catch (err) {
    console.error('Daraja callback error', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
