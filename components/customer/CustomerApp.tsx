import React, { useState, useEffect, useRef } from 'react';
import { User, Reward, SpinResult, PrizeConfig } from '../../types';
import { useAppStore } from '../../services/store';
import { supabase } from '../../services/supabase';

interface CustomerProps {
    user: User;
    rewards: Reward[];
    onNavigate: (view: string) => void;
    currentView: string;
    onSpin: () => Promise<SpinResult>;
}

// --- Components ---

const BottomNav = ({ currentView, onNavigate }: { currentView: string; onNavigate: (v: string) => void }) => {
    const navItems = [
        { id: 'home', icon: 'home', label: 'Home' },
        { id: 'rewards', icon: 'local_activity', label: 'Rewards' },
        { id: 'profile', icon: 'person', label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-ocean-900 border-t border-gray-200 dark:border-ocean-800 pb-safe z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === item.id ? 'text-gold-400' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const WheelComponent = ({
    isSpinning,
    prizes,
    targetPrizeIndex,
    onSpinEnd
}: {
    isSpinning: boolean,
    prizes: PrizeConfig[],
    targetPrizeIndex: number | null,
    onSpinEnd: () => void
}) => {
    const [rotation, setRotation] = useState(0);
    const activePrizes = prizes.filter(p => p.active);
    const segmentAngle = 360 / activePrizes.length;

    useEffect(() => {
        if (isSpinning && targetPrizeIndex !== null) {
            const extraSpins = 360 * 5;
            const targetRotation = extraSpins + (360 - (targetPrizeIndex * segmentAngle)) - (segmentAngle / 2);
            const randomOffset = (Math.random() * segmentAngle * 0.8) - (segmentAngle * 0.4);

            setRotation(prev => prev + targetRotation + randomOffset);

            const timer = setTimeout(() => {
                onSpinEnd();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, targetPrizeIndex]);

    return (
        <div className="relative aspect-square max-w-[340px] mx-auto mb-10">
            <div
                className="w-full h-full rounded-full border-[8px] border-ocean-800 bg-ocean-950 relative shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
            >
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    {activePrizes.map((prize, i) => (
                        <div
                            key={prize.id}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                                transform: `rotate(${i * segmentAngle}deg)`,
                            }}
                        >
                            <div
                                className="absolute top-0 left-1/2 w-full h-full origin-left flex items-center justify-center"
                                style={{
                                    transform: `rotate(${90 - (segmentAngle / 2)}deg) skewY(-${90 - segmentAngle}deg)`,
                                    background: prize.color || '#334155',
                                }}
                            >
                            </div>
                        </div>
                    ))}
                    <div className="absolute inset-0 rounded-full" style={{
                        background: `conic-gradient(
                            ${activePrizes.map((p, i) => `${p.color || '#334155'} ${i * (360 / activePrizes.length)}deg ${(i + 1) * (360 / activePrizes.length)}deg`).join(', ')}
                        )`
                    }}></div>
                </div>

                {activePrizes.map((prize, i) => (
                    <div
                        key={`icon-${prize.id}`}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1/2 origin-bottom flex flex-col justify-start pt-6 items-center z-10"
                        style={{ transform: `rotate(${i * segmentAngle + (segmentAngle / 2)}deg)` }}
                    >
                        <span className="material-symbols-outlined text-white drop-shadow-md text-2xl font-bold">{prize.icon}</span>
                        <span className="text-[10px] font-bold text-white drop-shadow-md max-w-[60px] text-center leading-tight mt-1">{prize.name}</span>
                    </div>
                ))}
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full bg-gradient-to-br from-gold-400 to-amber-600 border-[6px] border-ocean-800 shadow-inner z-20 flex items-center justify-center">
                <span className="material-symbols-outlined text-ocean-950 text-4xl">stars</span>
            </div>

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white z-30 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                <span className="material-symbols-outlined text-6xl fill-current text-white">arrow_drop_down</span>
            </div>
        </div>
    );
};

// --- View: Game Hub ---
const GameView = ({ spins, onBack, onSpin }: { spins: number; onBack: () => void; onSpin: () => Promise<SpinResult> }) => {
    const { state } = useAppStore();
    const [isSpinning, setIsSpinning] = useState(false);
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [result, setResult] = useState<SpinResult | null>(null);
    const [showModal, setShowModal] = useState(false);

    const activePrizes = state.prizes.filter(p => p.active);

    const handleSpinClick = async () => {
        if (spins <= 0 || isSpinning) return;

        const spinResult = await onSpin();
        if (!spinResult.ok || !spinResult.prize) {
            alert(spinResult.error || "Error spinning");
            return;
        }

        const index = activePrizes.findIndex(p => p.id === spinResult.prize?.id);

        setResult(spinResult);
        setTargetIndex(index !== -1 ? index : 0);
        setIsSpinning(true);
    };

    const handleSpinEnd = () => {
        setIsSpinning(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        if (result?.outcome === 'WIN') {
            onBack();
        }
    };

    return (
        <div className="flex flex-col h-full px-6 pt-6 pb-24 bg-ocean-950">
            <button onClick={onBack} disabled={isSpinning} className="flex items-center text-slate-400 mb-6 disabled:opacity-50">
                <span className="material-symbols-outlined">arrow_back</span> Back
            </button>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-white mb-2">Game Hub</h1>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-400/10 border border-gold-400/20 rounded-full text-gold-400 font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">sync</span>
                    REMAINING SPINS: {spins}
                </div>
            </div>

            <WheelComponent
                isSpinning={isSpinning}
                prizes={activePrizes}
                targetPrizeIndex={targetIndex}
                onSpinEnd={handleSpinEnd}
            />

            <button
                disabled={spins === 0 || isSpinning}
                onClick={handleSpinClick}
                className="w-full py-4 bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-950 font-black text-xl rounded-full shadow-[0_0_30px_rgba(242,166,13,0.3)] hover:shadow-[0_0_50px_rgba(242,166,13,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
                <span className={`material-symbols-outlined text-3xl ${isSpinning ? 'animate-spin' : ''}`}>casino</span>
                {isSpinning ? 'SPINNING...' : (spins > 0 ? 'START SPIN' : 'NO SPINS')}
            </button>

            {showModal && result && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-ocean-900 w-full max-w-sm rounded-3xl border border-gold-400/50 p-8 text-center shadow-2xl relative overflow-hidden">
                        {result.outcome === 'WIN' && (
                            <div className="absolute inset-0 bg-gold-400/10 animate-pulse"></div>
                        )}

                        <div className="relative z-10">
                            <div className="size-20 bg-ocean-800 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-ocean-700">
                                <span className="material-symbols-outlined text-5xl text-gold-400">
                                    {result.prize?.icon || 'stars'}
                                </span>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2 uppercase italic">
                                {result.outcome === 'WIN' ? 'You Won!' : 'So Close!'}
                            </h2>
                            <p className="text-lg text-gold-400 font-bold mb-6">{result.prize?.name}</p>

                            {result.outcome === 'WIN' && (
                                <p className="text-slate-400 text-sm mb-8">This reward has been added to your wallet.</p>
                            )}

                            <button
                                onClick={closeModal}
                                className="w-full py-3 bg-white text-ocean-950 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                {result.outcome === 'WIN' ? 'Awesome!' : 'Try Again'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- View: Home ---
const HomeView = ({ onPlayGame }: { onPlayGame: () => void }) => (
    <div className="px-6 pt-6 pb-24">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Active <span className="text-gold-400">Events</span></h2>
                <p className="text-slate-400 text-sm mt-1">Play, dine, and earn rewards</p>
            </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-5 pb-8 -mx-6 px-6">
            <div className="relative flex-none w-[85%] snap-center rounded-3xl overflow-hidden aspect-[4/5] bg-ocean-800 border border-gold-400/30 shadow-[0_0_25px_rgba(242,166,13,0.15)] group">
                <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-gold-400 text-ocean-950 uppercase">Daily</span>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-white uppercase border border-white/10">Game</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white leading-tight mb-2">Lucky Wheel<br /><span className="text-gold-400 italic">1.0</span></h3>
                        <p className="text-slate-400 text-sm">Spin for a chance to win exclusive Wagyu upgrades.</p>
                    </div>
                    <div className="flex flex-col items-center gap-6 mt-auto">
                        <span className="material-symbols-outlined text-7xl text-gold-400 drop-shadow-[0_0_15px_rgba(242,166,13,0.6)]">cyclone</span>
                        <button
                            onClick={onPlayGame}
                            className="w-full py-4 bg-gold-400 hover:bg-gold-500 text-ocean-950 font-bold text-lg rounded-xl shadow-lg shadow-gold-400/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">play_circle</span>
                            Go Spin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

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
                                <span className="material-symbols-outlined text-8xl text-black">qr_code_2</span>
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
                    <span className="material-symbols-outlined text-9xl text-ocean-950">qr_code_2</span>
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
                            // Store update handled by onAuthStateChange mostly, but force clear here too
                            actions.setUser(null);
                            window.location.href = '/'; // Hard reload to clear all state
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


export const CustomerApp: React.FC<CustomerProps> = ({ user, rewards, onNavigate, currentView, onSpin }) => {
    return (
        <div className="min-h-screen bg-ocean-950 font-sans text-slate-200 relative max-w-md mx-auto shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-ocean-900/80 backdrop-blur-md border-b border-ocean-800 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-400">water_drop</span>
                    <span className="font-bold text-white uppercase tracking-wider text-sm">Ocean Sumria</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-cover bg-center border border-ocean-700" style={{ backgroundImage: `url(${user.avatarUrl})` }}></div>
                </div>
            </header>

            {/* Dynamic Content */}
            <main className="min-h-[calc(100vh-130px)]">
                {currentView === 'home' && <HomeView onPlayGame={() => onNavigate('game')} />}
                {currentView === 'game' && <GameView spins={user.spins || 0} onBack={() => onNavigate('home')} onSpin={onSpin} />}
                {currentView === 'rewards' && <RewardsView rewards={rewards} points={user.points || 0} />}
                {currentView === 'profile' && <ProfileView user={user} />}
            </main>

            <BottomNav currentView={currentView === 'game' ? 'home' : currentView} onNavigate={onNavigate} />
        </div>
    );
};