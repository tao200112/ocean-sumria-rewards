import { createClient } from '@/lib/supabase/server'
import { jsonResponse } from '@/lib/api'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonResponse(401, null, 'Unauthorized')

    // 2. Parse Body
    let body
    try {
        body = await request.json()
    } catch (e) {
        return jsonResponse(400, null, 'Invalid JSON')
    }
    const { spinsToBuy } = body

    if (!spinsToBuy || spinsToBuy < 1) {
        return jsonResponse(400, null, 'Invalid spins amount')
    }

    // 3. Call RPC (Customer Logic)
    const { data, error } = await supabase.rpc('rpc_customer_convert_points', {
        spins_to_buy: spinsToBuy
    })

    if (error) {
        // Handle specific business logic errors from PG if needed
        return jsonResponse(400, null, error.message)
    }

    return jsonResponse(200, data)
}
