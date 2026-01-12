import { createClient } from '@/lib/supabase/server'
import { jsonResponse } from '@/lib/api'

export async function POST() {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonResponse(401, null, 'Unauthorized')

    // 2. Call RPC
    const { data, error } = await supabase.rpc('rpc_customer_spin_wheel')

    if (error) {
        return jsonResponse(400, null, error.message)
    }

    return jsonResponse(200, data)
}
