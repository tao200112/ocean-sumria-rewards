'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const [message, setMessage] = useState('Completing sign in...');

    useEffect(() => {
        const handleCallback = async () => {
            console.log('[AuthCallback] Processing callback...');
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('[AuthCallback] Error:', error);
                setMessage('Authentication failed. Please try again.');
            } else if (session) {
                console.log('[AuthCallback] Session found. Redirecting...');
                // Optional: manually set cookie if needed, but supabase-js handles client session
                // The middleware loop will eventually pick it up if we refresh or route
                router.push('/');
            } else {
                console.log('[AuthCallback] No session found (yet). Might be code exchange delay or implicit flow.');
                // Sometimes the URL hash needs to be processed. 
                // In modern Supabase PKCE, it might be auto-handled.
                // We'll give it a moment or check if the URL has params.
                const hash = window.location.hash;
                const search = window.location.search;
                if (!hash && !search) {
                    setMessage('No credentials found.');
                }
                // Supabase-js auto-detects code/hash. If session is null, it failed.
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-ocean-950 flex items-center justify-center flex-col gap-4">
            <div className="size-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white font-medium">{message}</p>
            {message.includes('failed') || message.includes('No credentials') && (
                <button onClick={() => router.push('/login')} className="text-gold-400 underline">Return to Login</button>
            )}
        </div>
    );
}
