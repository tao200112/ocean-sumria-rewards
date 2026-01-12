import { createClient } from '@/lib/supabase/server'
import { jsonResponse } from '@/lib/api'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return jsonResponse(401, null, 'Unauthorized')
    }

    // Fetch profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .eq('id', user.id)
        .maybeSingle()

    return jsonResponse(200, { user, profile })
}
