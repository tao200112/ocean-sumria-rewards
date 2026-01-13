import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { userId, runId, result } = await req.json();

        if (!userId || !runId || !['won', 'lost'].includes(result)) {
            return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
        }

        // 1. Fetch Run
        const { data: run, error: runError } = await supabase
            .from('tile_match_runs')
            .select('*')
            .eq('id', runId)
            .eq('user_id', userId)
            .single();

        if (runError || !run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

        if (run.status !== 'started') {
            return NextResponse.json({ error: 'Run already finished', code: 'ALREADY_FINISHED' });
        }

        // 2. Validate (Optional: strict replay or timestamp check)
        // For now, trust client but strictly enforce reward limits

        let reward = 0;
        let rewardGranted = false;
        let limitReached = false;

        if (result === 'won') {
            reward = run.level === 1 ? 50 : 2000;

            // Check Limits: Limit 1 reward per level per day
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('tile_match_runs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('level', run.level)
                .eq('reward_granted', true)
                .gte('finished_at', todayStart.toISOString());

            if (count && count >= 1) {
                limitReached = true;
                reward = 0; // No reward if limit reached
            } else {
                // Grant Reward
                const { error: grantError } = await supabase.rpc('grant_points', {
                    p_user_id: userId,
                    p_amount: reward,
                    p_reason: `tile_match_level${run.level}_win`,
                    p_ref_id: runId
                });
                if (grantError) throw grantError;
                rewardGranted = true;
            }
        }

        // 3. Update Run
        const { error: updateError } = await supabase
            .from('tile_match_runs')
            .update({
                status: result,
                finished_at: new Date().toISOString(),
                reward_points: reward,
                reward_granted: rewardGranted
            })
            .eq('id', runId);

        if (updateError) throw updateError;

        // 4. Return
        // Fetch updated points
        const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();

        return NextResponse.json({
            success: true,
            points: profile?.points || 0,
            reward,
            limitReached
        });

    } catch (e: any) {
        console.error('Finish Game Error:', e);
        return NextResponse.json({ error: e.message || 'Error finishing game' }, { status: 500 });
    }
}
