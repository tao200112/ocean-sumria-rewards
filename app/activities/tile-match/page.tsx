'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '../../../services/store';
import { BottomNav } from '../../../components/customer/BottomNav';
import { GameScreen } from '../../../components/activities/tile-match/GameScreen';
import { TileMatchConfig, DailyStats } from '../../../types/tile-match';

export default function TileMatchPage() {
    const { state, actions } = useAppStore();
    const router = useRouter();

    // View State: 'lobby' | 'playing'
    const [view, setView] = useState<'lobby' | 'playing'>('lobby');

    // Game Session Data
    const [runId, setRunId] = useState<string | null>(null);
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [initialState, setInitialState] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Daily Stats
    const [stats, setStats] = useState<DailyStats>({ freeUsed: 0, paidRemaining: 0 });

    // Config (would come from DB/API in real app, hardcoded for now matches SQL seed)
    const config: TileMatchConfig = {
        dailyFreePlays: 3,
        playCost: 500,
        levels: [
            { level: 1, reward: 50, difficulty: 'Easy' },
            { level: 2, reward: 2000, difficulty: 'Hard' }
        ]
    };

    useEffect(() => {
        // Protected route
        if (!state.isLoading && !state.currentUser) {
            router.push('/login');
        }
        // Load initial daily stats if needed (could be separate API, but Start API returns it too)
        // For now start with 0 and update on play
    }, [state.isLoading, state.currentUser, router]);

    // --- Actions ---

    const handleStart = async (level: number) => {
        if (!state.currentUser) return;
        setLoading(true);

        try {
            const res = await fetch('/api/tile-match/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.currentUser.id, level })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 402) {
                    // Need payment
                    const confirmBuy = window.confirm(`No free plays left. Buy 1 play for ${config.playCost} points?`);
                    if (confirmBuy) {
                        await handleBuy();
                        // Retry start?
                        return;
                    }
                } else {
                    alert(data.error);
                }
                setLoading(false);
                return;
            }

            // Success
            setRunId(data.runId);
            setCurrentLevel(level);
            setInitialState(data.state);
            setStats(data.limits); // Update stats
            setView('playing');

        } catch (e) {
            console.error(e);
            alert('Failed to start game');
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async () => {
        if (!state.currentUser) return;
        setLoading(true);
        try {
            const res = await fetch('/api/tile-match/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.currentUser.id, qty: 1 })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
            } else {
                alert('Purchase successful! You can now play.');
                // Update local store points
                actions.setUser({ ...state.currentUser, points: data.points });
                setStats(prev => ({ ...prev, paidRemaining: data.paidRemaining }));
            }
        } catch (e) {
            alert('Purchase failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async (result: 'won' | 'lost') => {
        console.log('[TileMatch] handleFinish called:', { result, runId, userId: state.currentUser?.id });

        if (!runId || !state.currentUser) {
            console.error('[TileMatch] Missing runId or currentUser:', { runId, currentUser: state.currentUser });
            return;
        }

        try {
            console.log('[TileMatch] Calling finish API...');
            const res = await fetch('/api/tile-match/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.currentUser.id, runId, result })
            });
            const data = await res.json();
            console.log('[TileMatch] Finish API response:', data);

            if (data.success && result === 'won') {
                if (data.reward > 0) {
                    // Update points locally
                    console.log('[TileMatch] Updating points:', { old: state.currentUser.points, new: data.points });
                    actions.setUser({ ...state.currentUser, points: data.points });
                    alert(`Congratulations! You earned ${data.reward} points!`);
                } else if (data.limitReached) {
                    alert('Level complete! Daily reward limit reached for this level.');
                }
            } else if (!data.success) {
                console.error('[TileMatch] Finish failed:', data);
            }
        } catch (e) {
            console.error('[TileMatch] Error submitting result:', e);
        }
    };

    if (state.isLoading) return <div className="min-h-screen bg-ocean-950 flex items-center justify-center text-gold-400">Loading...</div>;

    return (
        <div className="min-h-screen bg-ocean-950 font-sans text-slate-200 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-ocean-900/80 backdrop-blur-md border-b border-ocean-800 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button onClick={() => view === 'playing' ? setView('lobby') : router.push('/')} className="flex items-center text-slate-400">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <span className="font-bold text-white tracking-wider">Tile Match</span>
                </div>
                <div className="flex items-center gap-2 bg-ocean-800 px-3 py-1 rounded-full border border-ocean-700">
                    <span className="material-symbols-outlined text-gold-400 text-sm">stars</span>
                    <span className="text-white font-bold text-xs">{state.currentUser?.points || 0}</span>
                </div>
            </header>

            <main className="p-6">
                {view === 'lobby' ? (
                    <div className="space-y-6">
                        {/* Hero / Stats */}
                        <div className="bg-ocean-800 rounded-3xl p-6 border border-ocean-700 text-center">
                            <div className="size-16 bg-ocean-700 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-ocean-600 shadow-inner">
                                <span className="material-symbols-outlined text-4xl text-gold-400">extension</span>
                            </div>
                            <h1 className="text-2xl font-black text-white mb-2">Tile Match</h1>
                            <p className="text-slate-400 text-sm mb-4">Clear all tiles to win rewards!</p>

                            <div className="flex justify-center gap-4 text-xs font-bold">
                                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-gold-400">FREE:</span> {Math.max(0, config.dailyFreePlays - stats.freeUsed)}/{config.dailyFreePlays}
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-blue-400">EXTRA:</span> {stats.paidRemaining}
                                </div>
                            </div>
                        </div>

                        {/* Level Select */}
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">grid_view</span>
                            Select Level
                        </h2>

                        <div className="grid gap-4">
                            {config.levels.map(lvl => (
                                <button
                                    key={lvl.level}
                                    onClick={() => handleStart(lvl.level)}
                                    disabled={loading}
                                    className="group relative bg-ocean-800 hover:bg-ocean-700 active:scale-[0.98] transition-all p-5 rounded-2xl border border-ocean-700 hover:border-gold-400/30 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-xl flex items-center justify-center font-black text-xl border ${lvl.level === 1 ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                                            {lvl.level}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white text-lg">Level {lvl.level}</h3>
                                                {lvl.difficulty === 'Hard' && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">Hard</span>}
                                            </div>
                                            <p className="text-gold-400 text-sm font-bold flex items-center gap-1">
                                                <span className="material-symbols-outlined text-base">emoji_events</span>
                                                Win {lvl.reward} pts
                                            </p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">play_arrow</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-ocean-800 text-center">
                            <p className="text-slate-500 text-sm mb-4">Run out of free plays?</p>
                            <button
                                onClick={handleBuy}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-700 hover:bg-ocean-600 rounded-xl text-white font-bold text-sm transition-colors"
                            >
                                <span className="material-symbols-outlined text-gold-400">shopping_cart</span>
                                Buy 1 Play ({config.playCost} pts)
                            </button>
                        </div>
                    </div>
                ) : (
                    initialState && runId && state.currentUser && (
                        <GameScreen
                            initialState={initialState}
                            runId={runId}
                            level={currentLevel}
                            userId={state.currentUser.id}
                            onFinish={handleFinish}
                        />
                    )
                )}
            </main>

            {view === 'lobby' && <BottomNav currentTab="home" />}
        </div>
    );
}
