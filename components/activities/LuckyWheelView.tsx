import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../services/store';
import { SpinResult, PrizeConfig } from '../../types';
import { useRouter } from 'next/navigation';

// --- Wheel Component (Internal) ---
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

// --- Main View ---

export const LuckyWheelView = () => {
    const { state, actions } = useAppStore();
    const router = useRouter();
    const [isSpinning, setIsSpinning] = useState(false);
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [result, setResult] = useState<SpinResult | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Initial load checks
    useEffect(() => {
        if (!state.currentUser) {
            // Handled by protected route mostly, but safe check
            // router.push('/login');
        }
        if (state.prizes.length === 0) {
            actions.loadPrizes();
        }
    }, [state.currentUser, state.prizes.length]);

    const activePrizes = state.prizes.filter(p => p.active);
    const spins = state.currentUser?.spins || 0;

    const handleSpinClick = async () => {
        if (spins <= 0 || isSpinning) return;
        if (!state.currentUser) return;

        const spinResult = await actions.spinWheel(state.currentUser.id);
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
            router.push('/?tab=rewards');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-ocean-950 px-6 pt-6 pb-24">
            <button onClick={() => router.push('/')} disabled={isSpinning} className="flex items-center text-slate-400 mb-6 disabled:opacity-50 w-fit">
                <span className="material-symbols-outlined">arrow_back</span> Back to Hub
            </button>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-white mb-2">Lucky Wheel</h1>
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

            {/* Win Modal */}
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
