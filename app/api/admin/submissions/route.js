import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET() {
  const { data, error } = await supabaseAdmin.from('agent_submissions').select('*').eq('status', 'pending_review')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req) {
  const { id, status } = await req.json()
  if (status === 'approved') {
    const { data: submission, error: fetchError } = await supabaseAdmin.from('agent_submissions').select('*').eq('id', id).single()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const propertyPayload = {
      title: submission.property_type ? `${submission.property_type} listing` : 'Submitted property',
      address: submission.notes || null,
      property_type: submission.property_type,
      price: submission.rent,
      deposit: submission.deposit,
      bedrooms: submission.bedrooms,
      bathrooms: submission.bathrooms,
      furnished: submission.furnished,
      water_supply: submission.water_supply,
      electricity: submission.electricity,
      parking: submission.parking,
      security: submission.security,
      backup_power: submission.backup_power,
      internet: submission.internet,
      location: submission.lng && submission.lat ? `POINT(${submission.lng} ${submission.lat})` : null,
      verification_status: 'verified',
      available: true
    }

    const { data: propertyData, error: propertyError } = await supabaseAdmin.from('properties').insert(propertyPayload).select('id').single()
    if (propertyError) return NextResponse.json({ error: propertyError.message }, { status: 500 })

    // if submission included photos, write them after insert to avoid schema errors
    if (submission.photos && submission.photos.length) {
      await supabaseAdmin.from('properties').update({ photos: submission.photos }).eq('id', propertyData.id)
    }

    const { data, error } = await supabaseAdmin.from('agent_submissions').update({ status: 'approved', property_id: propertyData.id }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabaseAdmin.from('agent_submissions').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
