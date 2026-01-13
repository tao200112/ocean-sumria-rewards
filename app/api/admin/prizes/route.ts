'use server';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: 获取所有奖品
export async function GET() {
    const supabase = await createClient();

    // 获取 published 的 pool
    const { data: pool, error: poolError } = await supabase
        .from('prize_pool_versions')
        .select('id')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

    if (poolError || !pool) {
        return NextResponse.json({ error: 'No published pool found' }, { status: 404 });
    }

    // 获取该 pool 的所有奖品
    const { data: prizes, error: prizesError } = await supabase
        .from('prizes')
        .select('*')
        .eq('pool_version_id', pool.id)
        .order('weight', { ascending: false });

    if (prizesError) {
        return NextResponse.json({ error: prizesError.message }, { status: 500 });
    }

    return NextResponse.json({ prizes, poolId: pool.id });
}

// PUT: 更新奖品
export async function PUT(request: NextRequest) {
    const supabase = await createClient();

    // 检查用户权限
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

    const body = await request.json();
    const { id, name, weight, active, total_available, icon, color, value_description } = body;

    if (!id) {
        return NextResponse.json({ error: 'Prize ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('prizes')
        .update({
            name,
            weight,
            active,
            total_available,
            icon,
            color,
            value_description
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prize: data });
}

// POST: 创建新奖品
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // 检查用户权限
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

    const body = await request.json();
    const { pool_version_id, name, type, weight, active, icon, color, value_description } = body;

    const { data, error } = await supabase
        .from('prizes')
        .insert({
            pool_version_id,
            name,
            type: type || 'discount',
            weight: weight || 10,
            active: active ?? true,
            icon: icon || 'stars',
            color: color || '#f2a60d',
            value_description
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prize: data });
}

// DELETE: 删除奖品
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();

    // 检查用户权限
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Prize ID required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('prizes')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
