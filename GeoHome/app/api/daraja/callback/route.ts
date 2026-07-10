import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabaseAdmin';

function maskPhone(value?: string) {
  if (!value || value.length < 4) return '****';
  return `${value.slice(0, 4)}*****${value.slice(-3)}`;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (secret !== process.env.DARAJA_CALLBACK_SECRET) {
    console.warn('Daraja callback unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sessionId = url.searchParams.get('session_id');
  const stkCallback = body?.Body?.stkCallback;
  if (!stkCallback) {
    return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
  if (ResultCode === 0 || ResultCode === '0') {
    const metadata = CallbackMetadata?.Item || [];
    const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
    const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
    const transactionId = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;

    if (!transactionId) {
      console.error('Callback missing transaction ID');
      return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
    }

    const { data: existing, error: selectError } = await supabaseAdmin
      .from('search_passes')
      .select('id')
      .eq('payment_ref', transactionId)
      .maybeSingle();

    if (selectError) {
      console.error('Supabase select error:', selectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existing) {
      console.info(`Duplicate callback for ${transactionId}, ignoring.`);
      return NextResponse.json({ success: true, already_processed: true });
    }

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const insertPayload: any = {
      payment_ref: transactionId,
      paid_amount: amount,
      expires_at: expiresAt,
      session_id: sessionId || null
    };

    const { error: insertError } = await supabaseAdmin.from('search_passes').insert(insertPayload);

    if (insertError) {
      console.error('Failed to insert search pass:', insertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.info(`✅ Pass created for transaction ${transactionId}, phone ${maskPhone(String(phoneNumber))}`);
    return NextResponse.json({ success: true });
  }

  console.warn(`❌ Payment failed: ${ResultCode} - ${ResultDesc}`);
  return NextResponse.json({ success: false, error: ResultDesc });
}
