import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateLevel } from '../../../../../lib/tile-match/game-logic';

// Standard pattern for creating a client in API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { level, userId } = await req.json();

        if (!userId || ![1, 2].includes(level)) {
            return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
        }

        // 1. Check Daily Stats (Transaction preferred, but doing separate steps for simple logic)
        const today = new Date().toISOString().split('T')[0];

        // Get current daily
        let { data: daily, error: dailyError } = await supabase
            .from('tile_match_daily')
            .select('*')
            .eq('user_id', userId)
            .eq('day', today)
            .single();

        if (dailyError && dailyError.code === 'PGRST116') {
            // Create if not exists
            const { data: newDaily, error: createError } = await supabase
                .from('tile_match_daily')
                .insert({ user_id: userId, day: today, free_used: 0, paid_remaining: 0 })
                .select()
                .single();
            if (createError) throw createError;
            daily = newDaily;
        }

        // Config (should fetch from activities table, hardcoded for consistency with request)
        const DAILY_FREE = 3;

        let canPlay = false;
        let updateField = '';

        if (daily.free_used < DAILY_FREE) {
            canPlay = true;
            updateField = 'free_used';
        } else if (daily.paid_remaining > 0) {
            canPlay = true;
            updateField = 'paid_remaining';
        } else {
            return NextResponse.json({ error: 'No plays remaining', code: 'NEED_BUY' }, { status: 402 });
        }

        // 2. Deduct Play
        const updatePayload = updateField === 'free_used'
            ? { free_used: daily.free_used + 1 }
            : { paid_remaining: daily.paid_remaining - 1 };

        const { error: updateError } = await supabase
            .from('tile_match_daily')
            .update(updatePayload)
            .eq('user_id', userId)
            .eq('day', today);

        if (updateError) throw updateError;

        // 3. Generate Run
        const seed = Math.random().toString(36).substring(7);
        const tiles = generateLevel(level, seed);

        // Store minimal required state (just tiles list is enough to reconstruct validation if needed)
        // We store the full array to avoid regeneration drift
        const initialState = { tiles };

        const { data: run, error: runError } = await supabase
            .from('tile_match_runs')
            .insert({
                user_id: userId,
                level,
                seed,
                initial_state: initialState,
                status: 'started'
            })
            .select()
            .single();

        if (runError) throw runError;

        return NextResponse.json({
            success: true,
            runId: run.id,
            seed,
            state: initialState,
            limits: {
                freeUsed: updateField === 'free_used' ? daily.free_used + 1 : DAILY_FREE,
                freeTotal: DAILY_FREE,
                paidRemaining: updateField === 'paid_remaining' ? daily.paid_remaining - 1 : daily.paid_remaining
            }
        });

    } catch (e: any) {
        console.error('Start Game Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
    }
}
