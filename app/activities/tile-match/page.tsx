'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../../services/store';
import { BottomNav } from '../../../components/customer/BottomNav';

export default function TileMatchPage() {
    const { state } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        // Protected route
        if (!state.isLoading && !state.currentUser) {
            router.push('/login');
        }
    }, [state.isLoading, state.currentUser, router]);

    if (state.isLoading) return <div className="min-h-screen bg-ocean-950 flex items-center justify-center text-gold-400">Loading...</div>;

    return (
        <div className="min-h-screen bg-ocean-950 font-sans text-slate-200 pb-24">
            <header className="sticky top-0 z-40 bg-ocean-900/80 backdrop-blur-md border-b border-ocean-800 px-5 py-3 flex justify-between items-center">
                <button onClick={() => router.push('/')} className="flex items-center text-slate-400">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <span className="font-bold text-white tracking-wider">Tile Match</span>
                <div className="w-6"></div>
            </header>

            <main className="p-6">
                <div className="bg-ocean-800 rounded-3xl p-8 border border-ocean-700 text-center mb-8">
                    <div className="size-20 bg-ocean-700 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-ocean-600">
                        <span className="material-symbols-outlined text-4xl text-gold-400">extension</span>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Tile Match</h1>
                    <p className="text-slate-400 text-sm mb-6">Match 3 tiles to clear the board and earn points!</p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/20 rounded-full text-blue-400 font-bold text-sm mb-6">
                        <span className="material-symbols-outlined text-lg">stars</span>
                        Points: {state.currentUser?.points || 0}
                    </div>

                    <div className="w-full h-64 bg-ocean-950/50 rounded-xl border-2 border-dashed border-ocean-700 flex items-center justify-center flex-col gap-2">
                        <span className="material-symbols-outlined text-4xl text-ocean-600">construction</span>
                        <p className="text-ocean-500 font-bold uppercase tracking-widest">Game Canvas Placeholder</p>
                    </div>
                </div>

                <button
                    className="w-full py-4 bg-ocean-700 text-white/50 font-bold text-xl rounded-full cursor-not-allowed border border-ocean-600"
                    disabled
                >
                    Coming Soon
                </button>
            </main>

            <BottomNav currentTab="home" />
        </div>
    );
}
