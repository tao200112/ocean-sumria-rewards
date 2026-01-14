import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    try {
        // 获取当前用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // 直接使用服务端查询（绕过客户端问题）
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile query error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        if (!profile) {
            // 创建 profile
            const newProfile = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
                role: 'customer',
                public_id: generatePublicId(),
                points: 0,
                spins: 0
            };

            const { data: created, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (createError) {
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }

            return NextResponse.json(created);
        }

        return NextResponse.json(profile);

    } catch (e: any) {
        console.error('API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

function generatePublicId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
