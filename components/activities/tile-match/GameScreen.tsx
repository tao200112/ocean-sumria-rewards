import React, { useState, useEffect, useRef } from 'react';
import { Tile, TileMatchState, GameHistory } from '../../../types/tile-match';
import { calculateVisibility } from '../../../lib/tile-match/game-logic';
import { TileRenderer } from './TileRenderer';
import { useRouter } from 'next/navigation';

interface GameScreenProps {
    initialState: { tiles: Tile[] };
    runId: string;
    level: number;
    userId: string;
    onFinish: (result: 'won' | 'lost') => Promise<void>;
}

export const GameScreen: React.FC<GameScreenProps> = ({ initialState, runId, level, userId, onFinish }) => {
    const [tiles, setTiles] = useState<Tile[]>(initialState.tiles);
    const [slots, setSlots] = useState<Tile[]>([]);
    const [history, setHistory] = useState<GameHistory[]>([]);
    const [status, setStatus] = useState<'playing' | 'checking' | 'won' | 'lost'>('playing');
    const [hintTileId, setHintTileId] = useState<string | null>(null);

    // Initial Layout Check
    useEffect(() => {
        setTiles(prev => calculateVisibility(prev));
    }, []);

    // 1. Click Handler
    const handleTileClick = (clickedTile: Tile) => {
        if (status !== 'playing' || !clickedTile.isClickable) return;
        if (slots.length >= 7) return;

        // Move to slot
        const newSlots = [...slots, clickedTile];

        // Remove from board visually (mark removed)
        const newTiles = tiles.map(t =>
            t.id === clickedTile.id
                ? { ...t, isRemoved: true, inSlotIndex: -1 } // Logic removed, rendering handled by slots
                : t
        );

        // Update visibility of others
        const recalculatedTiles = calculateVisibility(newTiles);

        setTiles(recalculatedTiles);
        setSlots(newSlots);
        setHistory(prev => [...prev, { action: 'pick', tileId: clickedTile.id, from: { x: clickedTile.x, y: clickedTile.y, z: clickedTile.z } }]);

        // Check Matches
        setStatus('checking');
    };

    // 2. Match Logic (Effect when slots change)
    useEffect(() => {
        if (status !== 'checking') return;

        // Find match of 3
        const counts: Record<string, number> = {};
        slots.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });

        const matchedType = Object.keys(counts).find(type => counts[type] >= 3);

        if (matchedType) {
            // Remove 3 tiles of this type
            setTimeout(() => {
                const keep: Tile[] = [];
                let removed = 0;
                // We keep the order generally but filter out the triplets
                // Usually matching tiles slide together then pop.
                // Simple version: Filter out first 3 instances
                const newSlots = slots.filter(t => {
                    if (t.type === matchedType && removed < 3) {
                        removed++;
                        return false;
                    }
                    return true;
                });

                setSlots(newSlots);
                setStatus('playing');
            }, 300); // Small delay for visual "clink"
        } else {
            // Check Lose
            if (slots.length >= 7) {
                setStatus('lost');
                onFinish('lost');
            } else if (tiles.every(t => t.isRemoved)) {
                setStatus('won');
                onFinish('won');
            } else {
                setStatus('playing');
            }
        }
    }, [slots, status, tiles]);


    // 3. Tools Limits
    const [toolCounts, setToolCounts] = useState({ undo: 0, shuffle: 0, hint: 0, restart: 0 });
    const LIMIT = 1;

    const handleUndo = () => {
        if (toolCounts.undo >= LIMIT) return;
        if (history.length === 0 || slots.length === 0) return;

        const lastAction = history[history.length - 1];
        if (lastAction.action === 'pick') {
            const newSlots = slots.slice(0, -1);

            // Restore to board
            const newTiles = tiles.map(t =>
                t.id === lastAction.tileId
                    ? { ...t, isRemoved: false, isClickable: true }
                    : t
            );

            setSlots(newSlots);
            setTiles(calculateVisibility(newTiles));
            setHistory(prev => prev.slice(0, -1));
            setToolCounts(prev => ({ ...prev, undo: prev.undo + 1 }));
        }
    };

    const handleShuffle = () => {
        if (toolCounts.shuffle >= LIMIT) return;

        // Collect remaining board tiles
        const onBoard = tiles.filter(t => !t.isRemoved);
        const types = onBoard.map(t => t.type);

        // Shuffle types
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

        // Reassign types
        let typeIdx = 0;
        const newTiles = tiles.map(t => {
            if (!t.isRemoved) {
                return { ...t, type: types[typeIdx++] };
            }
            return t;
        });

        setTiles(newTiles);
        setToolCounts(prev => ({ ...prev, shuffle: prev.shuffle + 1 }));
    };

    const handleHint = () => {
        if (toolCounts.hint >= LIMIT) return;

        // Simple hint: find a clickable tile that matches something in slot
        const clickables = tiles.filter(t => t.isClickable);

        let match: Tile | undefined;

        // Priority logic (same as before)
        if (slots.length > 0) {
            const counts: Record<string, number> = {};
            slots.forEach(t => counts[t.type] = (counts[t.type] || 0) + 1);
            const twoType = Object.keys(counts).find(k => counts[k] === 2);
            if (twoType) match = clickables.find(t => t.type === twoType);

            if (!match) {
                const oneType = Object.keys(counts).find(k => counts[k] === 1);
                if (oneType) match = clickables.find(t => t.type === oneType);
            }
        }

        if (!match && clickables.length > 0) match = clickables[0];

        if (match) {
            setHintTileId(match.id);
            setTimeout(() => setHintTileId(null), 2000);
            setToolCounts(prev => ({ ...prev, hint: prev.hint + 1 }));
        }
    };

    const handleRestart = () => {
        if (toolCounts.restart >= LIMIT) return;
        setToolCounts(prev => ({ ...prev, restart: prev.restart + 1 }));
        window.location.reload(); // Simple reload for now
    };


    return (
        <div className="relative w-full max-w-sm mx-auto h-[600px] bg-ocean-900 rounded-3xl overflow-hidden border border-ocean-800 shadow-2xl flex flex-col">
            {/* Header / Stats */}
            <div className="h-12 flex items-center justify-between px-4 bg-ocean-800/80 backdrop-blur z-20">
                <span className="text-white font-bold text-xs">Level {level}</span>
                <span className="text-gold-400 font-bold text-xs">{tiles.filter(t => !t.isRemoved).length} Tiles Left</span>
            </div>

            {/* Game Canvas Board */}
            <div className="flex-1 relative bg-ocean-950/50 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[400px]">
                    {tiles.map(tile => (
                        !tile.isRemoved && (
                            <div key={tile.id} className={`${hintTileId === tile.id ? 'animate-bounce ring-4 ring-gold-400 rounded-lg' : ''}`}>
                                <TileRenderer
                                    tile={tile}
                                    onClick={handleTileClick}
                                />
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Slot Tray & Controls */}
            <div className="h-40 bg-ocean-800 border-t border-ocean-700 relative z-30 flex flex-col items-center justify-end pb-4 pt-2">
                {/* Tray Background Image */}
                <div className="relative w-[340px] h-[60px] flex items-center justify-center mb-2">
                    <img src="/game-assets/ui/slot-bg.png" className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="tray"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />

                    {/* Fallback Tray Styles only if img missing (handled by display none logic or manual check) */}
                    <div className="absolute inset-0 bg-black/20 rounded-xl border border-white/10 -z-10"></div>

                    {/* Slots Layer - Must align perfectly with background image holes */}
                    <div className="flex gap-[6px] relative z-10 px-1">
                        {/* We map fixed 7 slots to ensure alignment */}
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="size-10 flex items-center justify-center relative">
                                {slots[i] && (
                                    <TileRenderer tile={slots[i]} onClick={() => { }} slotIndex={i} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tools */}
                <div className="flex gap-4 w-full justify-center px-4">
                    <ToolBtn
                        icon="undo" label="Undo"
                        onClick={handleUndo}
                        disabled={toolCounts.undo >= LIMIT}
                        imgSrc="/game-assets/ui/btn-undo.png"
                        color="bg-yellow-500"
                    />
                    <ToolBtn
                        icon="shuffle" label="Shuffle"
                        onClick={handleShuffle}
                        disabled={toolCounts.shuffle >= LIMIT}
                        imgSrc="/game-assets/ui/btn-shuffle.png"
                        color="bg-blue-500"
                    />
                    <ToolBtn
                        icon="lightbulb" label="Hint"
                        onClick={handleHint}
                        disabled={toolCounts.hint >= LIMIT}
                        imgSrc="/game-assets/ui/btn-hint.png"
                        color="bg-yellow-500"
                    />
                    <ToolBtn
                        icon="refresh" label="Reset"
                        onClick={handleRestart}
                        disabled={toolCounts.restart >= LIMIT}
                        imgSrc="/game-assets/ui/btn-restart.png"
                        color="bg-red-500"
                    />
                </div>
            </div>

            {/* Overlays */}
            {/* ... (Existing overlays same as before) ... */}
            {status === 'won' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                    <img src="/game-assets/ui/bg-win.png" className="absolute inset-0 opacity-50 object-cover" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="relative z-10 text-center">
                        <span className="text-6xl mb-4 block">🎉</span>
                        <h2 className="text-3xl font-black text-gold-400 mb-2">CLEARED!</h2>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gold-400 text-ocean-950 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">Continue</button>
                    </div>
                </div>
            )}
            {status === 'lost' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                    <img src="/game-assets/ui/bg-loss.png" className="absolute inset-0 opacity-50 object-cover" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="relative z-10 text-center">
                        <span className="text-6xl mb-4 block">💀</span>
                        <h2 className="text-3xl font-black text-red-500 mb-2">GAME OVER</h2>
                        <div className="flex gap-3 justify-center">
                            <button onClick={handleUndo} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Revive</button>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 text-white font-bold rounded-xl">Give Up</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolBtn = ({ icon, label, onClick, disabled, imgSrc, color }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${disabled ? 'opacity-50 grayscale' : 'hover:scale-105'}`}
    >
        <div className={`size-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 overflow-hidden ${color ? '' : 'bg-ocean-700'}`}>
            {imgSrc ? (
                <img src={imgSrc} alt={label} className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to Icon
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.classList.add(color || 'bg-gray-500');
                        e.currentTarget.parentElement!.innerHTML = `<span class="material-symbols-outlined text-white text-xl">${icon}</span>`;
                    }}
                />
            ) : (
                <span className="material-symbols-outlined text-white text-xl">{icon}</span>
            )}
        </div>
    </button>
);
