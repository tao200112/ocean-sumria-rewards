import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, Reward, SpinResult } from '../../types';
import { useAppStore } from '../../services/store';
import { supabase } from '../../services/supabase';
import { BottomNav } from './BottomNav';
import { ActivityCard } from '../activities/ActivityCard';

interface CustomerProps {
    user: User;
    rewards: Reward[];
    onNavigate: (view: string) => void;
    currentView: string;
    onSpin: () => Promise<SpinResult>; // Kept for interface compatibility but not used in Hub
}

// --- View: Rewards ---
const RewardsView = ({ rewards, points }: { rewards: Reward[]; points: number }) => {
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const { actions } = useAppStore();

    useEffect(() => {
        return () => { actions.clearNewRewardFlag(); }
    }, []);

    return (
        <div className="px-6 pt-8 pb-24">
            <h1 className="text-3xl font-black text-white mb-2">My Rewards</h1>
            <div className="flex items-center gap-2 text-slate-400 mb-8">
                <span className="material-symbols-outlined text-gold-400">account_balance_wallet</span>
                <span>Balance: <strong className="text-white">{points.toLocaleString()} Points</strong></span>
            </div>

            <div className="flex border-b border-ocean-700 mb-6">
                <button className="pb-3 text-gold-400 font-bold text-sm border-b-2 border-gold-400 flex-1">Available</button>
                <button className="pb-3 text-slate-500 font-medium text-sm flex-1">History</button>
            </div>

            <div className="grid gap-4">
                {rewards.filter(r => !r.isUsed).length === 0 && (
                    <div className="text-slate-500 text-center py-10">No available rewards. Go spin!</div>
                )}
                {rewards.filter(r => !r.isUsed).map(reward => (
                    <div key={reward.id} onClick={() => setSelectedReward(reward)} className={`relative bg-ocean-800 rounded-xl overflow-hidden border active:scale-[0.98] transition-transform cursor-pointer ${reward.isNew ? 'border-gold-400 ring-2 ring-gold-400/30' : 'border-ocean-700'}`}>
                        {reward.isNew && (
                            <div className="absolute top-0 right-0 bg-gold-400 text-ocean-950 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-20 uppercase tracking-wide">
                                Just Won
                            </div>
                        )}
                        <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${reward.imageUrl})` }}>
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white border border-white/10">
                                {reward.expiryDate}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white text-lg">{reward.title}</h3>
                            <p className="text-slate-400 text-sm mt-1 mb-4 line-clamp-2">{reward.description}</p>
                            <button className="w-full py-2 bg-gold-400 text-ocean-950 font-bold text-sm rounded-lg">Use Reward</button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedReward && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-ocean-900 w-full max-w-sm rounded-2xl border border-ocean-700 overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setSelectedReward(null)} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white z-10">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${selectedReward.imageUrl})` }}></div>
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-white mb-1">{selectedReward.title}</h3>
                            <p className="text-slate-400 text-xs mb-6">Show this code to server</p>
                            <div className="bg-white p-4 rounded-xl mb-4 inline-block">
                                <QRCodeSVG value={selectedReward.code} size={128} level="H" />
                            </div>
                            <p className="text-2xl font-mono font-bold text-white tracking-widest mb-6">{selectedReward.code}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- View: Profile ---
const ProfileView = ({ user }: { user: User }) => {
    const { actions } = useAppStore();
    const [pointsToConvert, setPointsToConvert] = useState(1000);

    const handleConvert = async (spins: number) => {
        const result = await actions.convertPointsToSpins(user.id, spins);
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="px-6 pt-12 pb-24">
            <div className="flex items-center gap-4 mb-8">
                <div className="size-20 rounded-full bg-cover bg-center border-4 border-ocean-700" style={{ backgroundImage: `url(${user.avatarUrl})` }}></div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded">Member since {user.joinedDate}</span>
                </div>
            </div>

            {/* Public ID Card (QR Placeholder) */}
            <div className="bg-white rounded-xl p-6 mb-8 text-ocean-950 shadow-lg text-center relative overflow-hidden group">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">My Member ID</p>
                <div className="bg-white p-2 rounded-xl inline-block mx-auto border-4 border-ocean-950 mb-2">
                    <QRCodeSVG value={user.publicId || 'UNKNOWN'} size={128} level="H" />
                </div>
                <p className="text-4xl font-mono font-black tracking-wider text-ocean-900">{user.publicId}</p>
                <p className="text-[10px] font-medium mt-2 text-slate-500">Show to staff to earn points</p>
            </div>

            {/* Stats */}
            <div className="bg-ocean-800 rounded-xl p-4 flex justify-between items-center mb-8 border border-ocean-700">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                        <span className="material-symbols-outlined">casino</span>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Spins</p>
                        <p className="text-xl font-bold text-white">{user.spins}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gold-400/10 rounded-lg text-gold-400">
                        <span className="material-symbols-outlined">stars</span>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Points</p>
                        <p className="text-xl font-bold text-white">{user.points}</p>
                    </div>
                </div>
            </div>

            {/* Conversion UI */}
            <div className="bg-gradient-to-br from-ocean-800 to-ocean-900 rounded-xl p-6 mb-8 border border-gold-400/20 shadow-[0_0_15px_rgba(242,166,13,0.1)]">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-400">swap_horiz</span>
                    Convert Points
                </h3>
                <p className="text-xs text-slate-400 mb-4">1000 Points = 1 Lucky Spin</p>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleConvert(1)}
                        disabled={(user.points || 0) < 1000}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-ocean-700 hover:bg-ocean-600 disabled:opacity-50 disabled:hover:bg-ocean-700 border border-ocean-600 transition-colors"
                    >
                        <span className="text-white font-bold">1 Spin</span>
                        <span className="text-[10px] text-gold-400 font-bold">1000 pts</span>
                    </button>
                    <button
                        onClick={() => handleConvert(5)}
                        disabled={(user.points || 0) < 5000}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-ocean-700 hover:bg-ocean-600 disabled:opacity-50 disabled:hover:bg-ocean-700 border border-ocean-600 transition-colors"
                    >
                        <span className="text-white font-bold">5 Spins</span>
                        <span className="text-[10px] text-gold-400 font-bold">5000 pts</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <button
                    onClick={async () => {
                        console.log('[Logout] Clicked');
                        actions.setLoading(true);
                        try {
                            const { error } = await supabase.auth.signOut();
                            if (error) console.error('SignOut error:', error);
                            actions.setUser(null);
                            window.location.href = '/';
                        } catch (e) {
                            console.error('Logout failed', e);
                            actions.setLoading(false);
                        }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-ocean-800/50 hover:bg-ocean-800 rounded-xl text-white text-sm font-medium transition-colors border border-transparent hover:border-ocean-700"
                >
                    <span>Log Out</span>
                    <span className="material-symbols-outlined text-slate-500">logout</span>
                </button>
            </div>
        </div>
    );
}

// --- View: Activities Hub (Home) ---
const ActivitiesHubView = () => {
    const { state, actions } = useAppStore();

    useEffect(() => {
        actions.loadActivities();
    }, []);

    return (
        <div className="px-6 pt-6 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hello, <span className="text-gold-400">{state.currentUser?.name}</span></h1>
                    <p className="text-slate-400 text-sm">Welcome back to Ocean Samurai</p>
                </div>
                <div className="flex items-center gap-2 bg-ocean-800 rounded-full px-3 py-1 border border-ocean-700">
                    <span className="material-symbols-outlined text-gold-400 text-lg">stars</span>
                    <span className="text-white font-bold text-sm">{state.currentUser?.points}</span>
                </div>
            </div>

            {/* Activities List */}
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">sports_esports</span>
                Activities
            </h2>

            {state.activities.length === 0 ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-ocean-800/50 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                state.activities.map(activity => (
                    <ActivityCard key={activity.slug} activity={activity} />
                ))
            )}
        </div>
    );
};

export const CustomerApp: React.FC<CustomerProps> = ({ user, rewards, onNavigate, currentView, onSpin }) => {
    const { actions } = useAppStore();

    useEffect(() => {
        actions.loadRewards();
    }, []);

    return (
        <div className="min-h-screen bg-ocean-950 font-sans text-slate-200 relative max-w-md mx-auto shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-ocean-900/80 backdrop-blur-md border-b border-ocean-800 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-400">water_drop</span>
                    <span className="font-bold text-white uppercase tracking-wider text-sm">Ocean Samurai</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-cover bg-center border border-ocean-700" style={{ backgroundImage: `url(${user.avatarUrl})` }}></div>
                </div>
            </header>

            {/* Dynamic Content */}
            <main className="min-h-[calc(100vh-130px)]">
                {currentView === 'home' && <ActivitiesHubView />}
                {currentView === 'rewards' && <RewardsView rewards={rewards} points={user.points || 0} />}
                {currentView === 'profile' && <ProfileView user={user} />}
            </main>

            <BottomNav currentTab={currentView} />
        </div>
    );
};