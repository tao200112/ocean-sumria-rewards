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

    if (!profile || profile.role !== 'admin') {
        return jsonResponse(403, null, 'Forbidden: Admin only')
    }

    // 3. Body
    let body
    try {
        body = await request.json()
    } catch (e) {
        return jsonResponse(400, null, 'Invalid JSON')
    }
    const { poolVersionId } = body

    if (!poolVersionId) return jsonResponse(400, null, 'Missing poolVersionId')

    // 4. Action: Update status to published
    // We can do this via direct DB update since we are admin (RLS allows)
    // But strictly speaking, the user requirement said "server-side write operations". 
    // RLS for prize_pool_versions "Staff/Admin can manage pools" allows ALL.

    const { error } = await supabase
        .from('prize_pool_versions')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', poolVersionId)

    if (error) {
        return jsonResponse(500, null, error.message)
    }

    // Log it
    await supabase.from('logs').insert({
        type: 'PUBLISH_POOL',
        actor_id: user.id,
        metadata: { pool_version_id: poolVersionId }
    })

    return jsonResponse(200, { success: true })
}
