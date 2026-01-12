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

    // 3. Fetch Logs
    const { data: logs, error } = await supabase
        .from('logs')
        .select(`
      *,
      profiles:actor_id (name, email)
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) return jsonResponse(500, null, error.message)

    return jsonResponse(200, logs)
}
