'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAppStore } from '@/services/store';
import { api } from '@/services/api';
import { UserRole, normalizeRole } from '@/types';

interface AuthContextType {
    loading: boolean;
    session: any;
}

const AuthContext = createContext<AuthContextType>({ loading: true, session: null });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { actions } = useAppStore();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // Single initialization effect
    useEffect(() => {
        if (initialized) return;
        setInitialized(true);

        console.log('[Auth] Initializing...');

        const initAuth = async () => {
            try {
                // 1. Get current session
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[Auth] getSession error:', error);
                    setLoading(false);
                    actions.setLoading(false);
                    return;
                }

                setSession(currentSession);

                if (currentSession?.user) {
                    console.log('[Auth] Session found, fetching profile for:', currentSession.user.id);
                    await loadProfile(currentSession.user);
                } else {
                    console.log('[Auth] No session');
                    actions.setUser(null);
                    setLoading(false);
                    actions.setLoading(false);
                }
            } catch (e) {
                console.error('[Auth] Init error:', e);
                setLoading(false);
                actions.setLoading(false);
            }
        };

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, newSession: any) => {
            console.log('[Auth] Event:', event);
            setSession(newSession);

            if (event === 'SIGNED_IN' && newSession?.user) {
                console.log('[Auth] SIGNED_IN, loading profile...');
                await loadProfile(newSession.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('[Auth] SIGNED_OUT');
                actions.setUser(null);
                setLoading(false);
                actions.setLoading(false);
            }
        });

        initAuth();

        return () => {
            subscription.unsubscribe();
        };
    }, [initialized, actions]);

    // Profile loader function
    const loadProfile = async (user: any) => {
        console.log('[Auth] loadProfile called for:', user.id, user.email);
        setLoading(true);
        actions.setLoading(true);

        // Hard timeout protection
        const timeout = setTimeout(() => {
            console.error('[Auth] Profile load timeout - unlocking UI');
            setLoading(false);
            actions.setLoading(false);
            alert("Profile load timeout. Please refresh the page or contact support.");
        }, 10000);

        try {
            // 方案：直接查询 profiles 表（绕过 RPC）
            console.log('[Auth] Querying profiles table directly...');
            const { data: profileData, error: queryError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            clearTimeout(timeout);

            if (queryError && queryError.code !== 'PGRST116') {
                // PGRST116 = no rows found，这是正常情况
                console.error('[Auth] Query error:', queryError.message);
                throw queryError;
            }

            if (profileData) {
                // Profile 存在，直接使用
                console.log('[Auth] Profile found:', profileData.public_id);
                const profile = {
                    id: profileData.id,
                    publicId: profileData.public_id,
                    name: profileData.name || user.email?.split('@')[0],
                    email: profileData.email || user.email,
                    role: normalizeRole(profileData.role),
                    avatarUrl: `https://ui-avatars.com/api/?name=${profileData.email}&background=random`,
                    points: profileData.points || 0,
                    spins: profileData.spins || 0,
                    joinedDate: new Date().toLocaleDateString()
                };
                actions.setUser(profile);
            } else {
                // Profile 不存在，需要创建
                console.log('[Auth] Profile not found, calling insert RPC...');

                // 使用新的简化 RPC 函数创建 profile
                const { data: insertData, error: insertError } = await supabase.rpc('create_profile_simple', {
                    p_user_id: user.id,
                    p_email: user.email,
                    p_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
                });

                if (insertError) {
                    console.error('[Auth] Insert error:', insertError.message);
                    throw insertError;
                }

                if (insertData && !insertData.error) {
                    console.log('[Auth] Profile created successfully');
                    const profile = {
                        id: insertData.id,
                        publicId: insertData.public_id,
                        name: insertData.name,
                        email: insertData.email,
                        role: normalizeRole(insertData.role),
                        avatarUrl: `https://ui-avatars.com/api/?name=${insertData.email}&background=random`,
                        points: insertData.points || 0,
                        spins: insertData.spins || 0,
                        joinedDate: new Date().toLocaleDateString()
                    };
                    actions.setUser(profile);
                } else {
                    console.error('[Auth] Profile creation failed:', insertData?.error);
                    throw new Error(insertData?.error || 'Profile creation failed');
                }
            }
        } catch (e) {
            console.error('[Auth] loadProfile exception:', e);
            clearTimeout(timeout);
            alert('Unable to load profile. Please try logging in again.');
            await supabase.auth.signOut();
            actions.setUser(null);
        } finally {
            setLoading(false);
            actions.setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ loading, session }}>
            {children}
        </AuthContext.Provider>
    );
}
