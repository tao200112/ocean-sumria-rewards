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
        }, 10000);

        try {
            // Step 1: Ensure profile exists (creates if missing - handles OAuth edge case)
            console.log('[Auth] Calling rpc_ensure_profile to create profile if needed...');
            const { data: ensureData, error: ensureError } = await supabase.rpc('rpc_ensure_profile');

            if (ensureError) {
                console.error('[Auth] rpc_ensure_profile error:', ensureError.message);
            } else if (ensureData?.created) {
                console.log('[Auth] New profile created via rpc_ensure_profile');
            } else if (ensureData?.error) {
                console.error('[Auth] rpc_ensure_profile returned error:', ensureData.error);
            } else {
                console.log('[Auth] Profile already exists');
            }

            // Step 2: Fetch the profile
            console.log('[Auth] Calling rpc_get_my_profile...');
            const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_get_my_profile');

            clearTimeout(timeout);
            console.log('[Auth] RPC result:', { data: rpcData, error: rpcError });

            if (rpcError) {
                console.error('[Auth] RPC error:', rpcError.message);
                // Try direct query as fallback
                console.log('[Auth] Trying direct query...');
                const { data: directData, error: directError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                console.log('[Auth] Direct query result:', { data: directData, error: directError });

                if (directData) {
                    const profile = {
                        id: directData.id,
                        publicId: directData.public_id,
                        name: directData.name || user.email?.split('@')[0],
                        email: directData.email || user.email,
                        role: normalizeRole(directData.role),
                        avatarUrl: `https://ui-avatars.com/api/?name=${directData.email}&background=random`,
                        points: directData.points || 0,
                        spins: directData.spins || 0,
                        joinedDate: new Date().toLocaleDateString()
                    };
                    console.log('[Auth] Profile loaded via direct query:', profile.publicId);
                    actions.setUser(profile);
                } else {
                    console.error('[Auth] No profile found after ensure!');
                    alert('Unable to create profile. Please try again or contact support.');
                    await supabase.auth.signOut();
                    actions.setUser(null);
                }
            } else if (rpcData && !rpcData.error) {
                const profile = {
                    id: rpcData.id,
                    publicId: rpcData.public_id,
                    name: rpcData.name || user.email?.split('@')[0],
                    email: rpcData.email || user.email,
                    role: normalizeRole(rpcData.role),
                    avatarUrl: `https://ui-avatars.com/api/?name=${rpcData.email}&background=random`,
                    points: rpcData.points || 0,
                    spins: rpcData.spins || 0,
                    joinedDate: new Date().toLocaleDateString()
                };
                console.log('[Auth] Profile loaded via RPC:', profile.publicId, profile.role);
                actions.setUser(profile);
            } else {
                console.error('[Auth] RPC returned error:', rpcData?.error);
                alert('Profile not found. Please try signing in again.');
                await supabase.auth.signOut();
                actions.setUser(null);
            }
        } catch (e) {
            console.error('[Auth] loadProfile exception:', e);
            clearTimeout(timeout);
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
