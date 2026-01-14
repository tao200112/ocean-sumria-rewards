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
            // 使用服务端 API route（绕过 Supabase 客户端问题）
            console.log('[Auth] Fetching profile from API route...');
            const response = await fetch('/api/profile');

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[Auth] API error:', errorData);
                throw new Error(errorData.error || 'Profile fetch failed');
            }

            const profileData = await response.json();
            console.log('[Auth] Profile data received:', profileData);

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

            console.log('[Auth] Profile loaded successfully:', profile.publicId);
            actions.setUser(profile);

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
