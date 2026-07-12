import { NextResponse } from 'next/server';
import { rateLimiter } from '../../../../lib/rateLimiter';
import supabaseAdmin from '../../../../lib/supabaseAdmin';

const allowedAmounts = [200, 500, 1000];
const phoneRegex = /^254[0-9]{9}$/;

function maskPhone(value?: string) {
  if (!value || value.length < 4) return '****';
  return `${value.slice(0, 4)}*****${value.slice(-3)}`;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  return forwarded.split(',')[0].trim() || 'unknown';
}

function getTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

export async function POST(request: Request) {
  // ============================================================
  // LOG ENVIRONMENT AT REQUEST START FOR DEBUGGING
  // ============================================================
  const bypassFlag = process.env.NEXT_PUBLIC_BYPASS_PAYMENT;
  const bypassEnabled = bypassFlag === undefined
    ? true
    : ['true', '1', 'yes', 'on'].includes(String(bypassFlag).toLowerCase());

  console.log('🔍 STK Push route called');
  console.log('🔍 NEXT_PUBLIC_BYPASS_PAYMENT env:', bypassFlag);
  console.log('🔍 BYPASS_PAYMENT enabled:', bypassEnabled);
  console.log('🔍 SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const ip = getClientIp(request);
  if (!rateLimiter.check(ip, 3, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phoneNumber = payload?.phoneNumber || payload?.phone || payload?.PartyA;
  const amount = payload?.amount ?? payload?.Amount;
  const userId = payload?.userId || payload?.user_id || null;
  const sessionId = payload?.sessionId || payload?.session_id || null;

  // ============================================================
  // BYPASS MODE – Check FIRST, before any validation
  // ============================================================
  if (bypassEnabled) {
    console.log('🔓 Bypass mode ENABLED – creating pass without payment');
    console.log('📦 Request details:', {
      userId,
      sessionId,
      phoneNumber: maskPhone(String(phoneNumber || '')),
      amount
    });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Bypass mode enabled but SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
      console.error('❌ Bypass mode enabled but Supabase URL is not configured');
      return NextResponse.json({ error: 'Supabase URL is not configured' }, { status: 500 });
    }

    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client could not be initialized');
      return NextResponse.json({ error: 'Supabase admin client is not available' }, { status: 500 });
    }

    const durationDays = userId ? 4 : 3;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const numericAmount = Number(amount ?? 200) || 200;
    const paymentRef = `BYPASS-${Date.now()}`;

    console.log(`⏱️ Creating pass with ${durationDays} day expiry, expires at:`, expiresAt.toISOString());

    const { data: pass, error: insertError } = await supabaseAdmin
      .from('search_passes')
      .insert({
        tenant_id: userId || null,
        user_id: userId || null,
        session_id: sessionId || null,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        paid_amount: numericAmount,
        payment_ref: paymentRef
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Bypass pass creation FAILED:', insertError);
      return NextResponse.json({ error: 'Failed to create pass' }, { status: 500 });
    }

    console.log('✅ Bypass pass created successfully:', { passId: pass?.id, expiresAt: pass?.expires_at });

    return NextResponse.json({
      success: true,
      bypass: true,
      status: 'bypassed',
      data: {
        MerchantRequestID: paymentRef,
        CheckoutRequestID: paymentRef,
        ResponseDescription: 'Bypass mode – pass created successfully',
        pass
      }
    });
  }

  // ============================================================
  // NORMAL MODE – Validation + Daraja call
  // ============================================================
  console.log('ℹ️ Bypass mode disabled – proceeding with normal Daraja STK push');

  if (!phoneNumber || amount == null) {
    console.warn('⚠️ Missing required fields:', { phoneNumber: !!phoneNumber, amount: amount !== null });
    return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 });
  }

  if (!phoneRegex.test(String(phoneNumber))) {
    console.warn('⚠️ Invalid phone format:', maskPhone(String(phoneNumber)));
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
  }

  const numericAmount = Number(amount);
  if (!Number.isInteger(numericAmount) || !allowedAmounts.includes(numericAmount)) {
    console.warn('⚠️ Invalid amount:', amount);
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  const passkey = process.env.DARAJA_PASSKEY;
  const shortcode = process.env.DARAJA_SHORTCODE || '174379';
  const baseUrl = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';
  const callbackUrl = process.env.DARAJA_CALLBACK_URL;
  const callbackSecret = process.env.DARAJA_CALLBACK_SECRET;

  if (!consumerKey || !consumerSecret || !passkey || !callbackUrl || !callbackSecret) {
    return NextResponse.json({ error: 'Daraja credentials and callback configuration must be set' }, { status: 500 });
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` }
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Daraja token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to authenticate with Daraja' }, { status: 500 });
    }

    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);
    const callbackUrlObject = new URL(callbackUrl);
    callbackUrlObject.searchParams.set('secret', callbackSecret);
    if (payload?.sessionId) {
      callbackUrlObject.searchParams.set('session_id', String(payload.sessionId));
    }

    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: String(numericAmount),
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrlObject.toString(),
        AccountReference: `GEOH${Date.now().toString().slice(-6)}`,
        TransactionDesc: 'GeoHome Kenya - Search Pass'
      })
    });

    const data = await response.json().catch(() => ({ status: response.status }));
    console.info('STK Push attempt', { ip, phone: maskPhone(String(phoneNumber)), amount: numericAmount, result: data?.ResponseDescription || data });

    if (data.ResponseCode === '0' || data.responseCode === '0') {
      return NextResponse.json({
        success: true,
        data: {
          MerchantRequestID: data.MerchantRequestID,
          CheckoutRequestID: data.CheckoutRequestID,
          ResponseCode: data.ResponseCode || data.responseCode,
          ResponseDescription: data.ResponseDescription || data.responseDescription,
          CustomerMessage: data.CustomerMessage
        }
      });
    }

    return NextResponse.json({ success: false, error: data.ResponseDescription || data.error || 'Payment initiation failed', code: data.ResponseCode || data.responseCode }, { status: 400 });
  } catch (error) {
    console.error('STK Push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
