import { createClient } from '@/lib/supabase/server'
import { jsonResponse } from '@/lib/api'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonResponse(401, null, 'Unauthorized')

    // 2. Role Check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['staff', 'admin'].includes(profile.role)) {
        return jsonResponse(403, null, 'Forbidden')
    }

    // 3. Body
    let body
    try {
        body = await request.json()
    } catch (e) {
        return jsonResponse(400, null, 'Invalid JSON')
    }
    const { code } = body

    if (!code) return jsonResponse(400, null, 'Missing coupon code')

    // 4. RPC
    const { data, error } = await supabase.rpc('rpc_staff_redeem_coupon', {
        code_query: code
    })

    if (error) {
        return jsonResponse(400, null, error.message)
    }

    return jsonResponse(200, data)
}
