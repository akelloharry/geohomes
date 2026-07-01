import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req) {
  const { property_id, tenant_id } = await req.json()
  if (!property_id || !tenant_id) {
    return NextResponse.json({ error: 'Missing property_id or tenant_id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('viewing_requests').insert({ property_id, tenant_id }).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
