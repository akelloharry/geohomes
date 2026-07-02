import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'

export async function POST(request) {
  try {
    const body = await request.json()
    const result = body?.Body?.stkCallback
    if (!result) {
      console.warn('Daraja callback received unexpected payload', body)
      return NextResponse.json({ success: false, error: 'Unexpected payload' }, { status: 400 })
    }

    const resultCode = result.ResultCode
    const checkoutRequestID = result.CheckoutRequestID
    const callbackItems = result.CallbackMetadata?.Item || []

    const amount = callbackItems.find((i) => i.Name === 'Amount')?.Value || null
    const phoneNumber = callbackItems.find((i) => i.Name === 'PhoneNumber')?.Value || null
    const mpesaReceipt = callbackItems.find((i) => i.Name === 'MpesaReceiptNumber')?.Value || null

    if (resultCode === 0) {
      // Successful payment: try to associate with a profile by phone
      let userId = null
      try {
        if (phoneNumber) {
          const { data: profile } = await supabase.from('profiles').select('id').eq('phone', phoneNumber).maybeSingle()
          if (profile?.id) userId = profile.id
        }
      } catch (e) {
        console.warn('Failed to lookup profile by phone', e)
      }

      // Determine duration: logged-in user -> 4 days, guest -> 3 days
      const durationDays = userId ? 4 : 3
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

      const insertPayload = {
        user_id: userId,
        session_id: null,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt,
        paid_amount: amount || null
      }

      try {
        const { error } = await supabase.from('search_passes').insert(insertPayload)
        if (error) console.warn('Failed to insert search_passes row', error)
      } catch (e) {
        console.error('Error inserting search_passes', e)
      }

      // Return success to Daraja
      return NextResponse.json({ success: true })
    }

    // Payment failed
    return NextResponse.json({ success: false, error: result.ResultDesc || 'Payment failed' })
  } catch (err) {
    console.error('Daraja callback error', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
