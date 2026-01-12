import { createClient } from '@/lib/supabase/server'
import { jsonResponse } from '@/lib/api'

export async function GET() {
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

    if (!profile || profile.role !== 'admin') {
        return jsonResponse(403, null, 'Forbidden: Admin only')
    }

    // 3. Aggregates (Simplified for demo, in prod use optimized SQL queries or materialized views)

    // Today's Logs count by type
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: logs } = await supabase
        .from('logs')
        .select('type, created_at')
        .gte('created_at', todayStart.toISOString())

    const stats = {
        points_issued_today: 0, // Need parsing metadata, difficult without optimized query. Using proxies.
        spins_today: 0,
        coupons_redeemed_today: 0,
        total_coupons_active: 0
    }

    // Count raw types
    logs?.forEach((l: any) => {
        if (l.type === 'SPIN') stats.spins_today++
        if (l.type === 'REDEMPTION') stats.coupons_redeemed_today++
    })

    // Get active coupons count
    const { count: activeCoupons } = await supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

    stats.total_coupons_active = activeCoupons || 0

    return jsonResponse(200, stats)
}
