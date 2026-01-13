import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Fetch Logs with User Details
    // Join with profiles to get user name/avatar
    const { data: logs, error } = await supabase
        .from('ledger')
        .select(`
            *,
            user:user_id (
                public_id,
                name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Transform for Frontend
    const formattedLogs = logs.map(log => {
        let action = 'UNKNOWN';
        let details = '';
        let probabilityTier = undefined;

        // Map ledger types to frontend log types
        switch (log.type) {
            case 'earn_points':
                action = 'EARN_POINTS';
                details = `Earned ${log.delta_points} pts`;
                if (log.metadata?.usd_cents) {
                    details += ` ($${(log.metadata.usd_cents / 100).toFixed(2)} spend)`;
                }
                break;
            case 'convert_points':
                action = 'CONVERT_POINTS';
                details = `Converted ${Math.abs(log.delta_points)} pts to ${log.delta_spins} spins`;
                break;
            case 'spend_spins':
                action = 'SPIN';
                if (log.metadata?.outcome === 'WIN') {
                    details = `Won ${log.metadata.prize_name}`;
                } else {
                    details = 'No Win';
                }
                break;
            case 'redeem_prize':
                action = 'REDEMPTION';
                details = `Redeemed: ${log.metadata.prize_name}`;
                break;
            case 'earn_spins':
                action = 'GRANT';
                details = `Granted ${log.delta_spins} spins`;
                break;
            default:
                action = log.type.toUpperCase();
                details = JSON.stringify(log.metadata);
        }

        return {
            id: log.id,
            timestamp: log.created_at,
            userId: log.user_id,
            publicId: log.user?.public_id || 'Unknown',
            userName: log.user?.name || log.user?.email || 'Unknown User',
            userAvatar: log.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.user?.name || 'U')}&background=random`,
            action,
            details,
            probabilityTier,
            metadata: log.metadata, // Keep raw metadata for advanced parsing
            deltaPoints: log.delta_points,
            deltaSpins: log.delta_spins
        };
    });

    return NextResponse.json({ logs: formattedLogs });
}
