import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET() {
  const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const users = (profiles || []).map((profile) => {
    const authUser = (authUsers?.users || []).find((user) => user.id === profile.id)
    return {
      ...profile,
      email: authUser?.email,
      user_metadata: authUser?.user_metadata || {}
    }
  })

  return NextResponse.json(users)
}

export async function PUT(req) {
  const { id, role, verified } = await req.json()
  const updates = {}
  if (role) updates.role = role
  if (verified !== undefined) updates.verified = verified

  const { error: profileError } = await supabaseAdmin.from('profiles').update(updates).eq('id', id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  let authResponse = null
  if (role) {
    const { data, error: userError } = await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { role } })
    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })
    authResponse = data
  }

  return NextResponse.json({ ok: true, authResponse })
}
