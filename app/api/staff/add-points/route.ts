import { createClient } from '@/lib/supabase/server'
import { jsonResponse } from '@/lib/api'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonResponse(401, null, 'Unauthorized')

    // 2. Role Check (Staff/Admin)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['staff', 'admin'].includes(profile.role)) {
        return jsonResponse(403, null, 'Forbidden: Staff access required')
    }

    // 3. Parse Body
    let body
    try {
        body = await request.json()
    } catch (e) {
        return jsonResponse(400, null, 'Invalid JSON')
    }

    const { publicId, billAmountCents, receiptRef } = body

    if (!publicId || !billAmountCents || !receiptRef) {
        return jsonResponse(400, null, 'Missing required fields')
    }

    // 4. Call RPC
    const { data, error } = await supabase.rpc('rpc_staff_add_points', {
        public_id_query: publicId,
        bill_amount_cents: billAmountCents,
        receipt_ref: receiptRef
    })

    if (error) {
        console.error('RPC Error:', error)
        return jsonResponse(500, null, error.message)
    }

    return jsonResponse(200, { new_points: data })
}
