import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { userId, qty = 1 } = await req.json();
        const COST = 500;
        const totalCost = COST * qty;

        // 1. Spend Points (RPC)
        const { data: newBalance, error: rpcError } = await supabase.rpc('spend_points', {
            p_user_id: userId,
            p_amount: totalCost,
            p_reason: 'tile_match_buy_play',
            p_ref_id: null
        });

        if (rpcError) {
            return NextResponse.json({ error: rpcError.message }, { status: 400 });
        }

        // 2. Add Plays
        const today = new Date().toISOString().split('T')[0];

        // Check if daily record exists first? RPC usually safe but let's be explicit
        // We assume record exists or we upsert logic
        // We can use an upsert hack (insert on conflict)

        // Fetch or create first to be safe
        const { data: current, error: fetchErr } = await supabase
            .from('tile_match_daily')
            .select('*')
            .eq('user_id', userId)
            .eq('day', today)
            .maybeSingle(); // Use maybeSingle to avoid 406 if not found

        let currentPaid = 0;
        if (fetchErr) throw fetchErr;

        if (!current) {
            await supabase.from('tile_match_daily').insert({
                user_id: userId,
                day: today,
                paid_remaining: qty
            });
            currentPaid = qty;
        } else {
            const { data: updated } = await supabase
                .from('tile_match_daily')
                .update({ paid_remaining: current.paid_remaining + qty })
                .eq('user_id', userId)
                .eq('day', today)
                .select()
                .single();
            currentPaid = updated.paid_remaining;
        }

        return NextResponse.json({
            success: true,
            points: newBalance,
            paidRemaining: currentPaid
        });

    } catch (e: any) {
        console.error('Buy Game Error:', e);
        return NextResponse.json({ error: e.message || 'Error processing purchase' }, { status: 500 });
    }
}
