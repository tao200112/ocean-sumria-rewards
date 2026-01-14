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
                let removed = 0;
                // Filter out first 3 instances
                const newSlots = slots.filter(t => {
                    if (t.type === matchedType && removed < 3) {
                        removed++;
                        return false;
                    }
                    return true;
                });

                setSlots(newSlots);

                // CRITICAL FIX: Check Win Condition immediately after clearing slots
                if (newSlots.length === 0 && tiles.every(t => t.isRemoved)) {
                    setStatus('won');
                    onFinish('won');
                } else {
                    setStatus('playing');
                }
            }, 300);
        } else {
            // Check Lose logic (only if not waiting for timeout)
            if (slots.length >= 7) {
                setStatus('lost');
                onFinish('lost');
            } else if (tiles.every(t => t.isRemoved)) {
                // This covers winning without a final match (rare but possible)
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

        // Simple hint
        const clickables = tiles.filter(t => t.isClickable);

        let match: Tile | undefined;

        // Priority logic
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
        window.location.reload();
    };

    return (
        <div className="relative w-full max-w-sm mx-auto h-[600px] overflow-hidden border border-ocean-800 shadow-2xl flex flex-col">
            {/* Main Background */}
            <div className="absolute inset-0 z-0">
                <img src="/game-assets/ui/bg-sunburst.png" className="w-full h-full object-cover" alt="bg" />
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
            </div>

            {/* Header / Stats */}
            <div className="h-12 flex items-center justify-between px-4 bg-ocean-800/40 backdrop-blur-md z-20 border-b border-white/10">
                <div className="px-3 py-1 bg-black/30 rounded-full border border-white/10">
                    <span className="text-white font-bold text-xs shadow-black drop-shadow-md">Level {level}</span>
                </div>
                <div className="px-3 py-1 bg-black/30 rounded-full border border-white/10">
                    <span className="text-gold-300 font-bold text-xs shadow-black drop-shadow-md">{tiles.filter(t => !t.isRemoved).length} Left</span>
                </div>
            </div>

            {/* Game Canvas Board */}
            <div className="flex-1 relative overflow-hidden z-10">
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
            <div className="h-40 bg-white/10 backdrop-blur-md border-t border-white/20 relative z-30 flex flex-col items-center justify-end pb-4 pt-2">
                {/* Tray Background Image - Updated with proper scaling and blend mode */}
                <div className="relative w-[340px] h-[60px] flex items-center justify-center mb-2">
                    <img src="/game-assets/ui/ui-tray-gen.png" className="absolute inset-0 w-full h-full object-fill mix-blend-multiply pointer-events-none drop-shadow-lg" alt="tray"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />

                    {/* Fallback Tray Styles */}
                    <div className="absolute inset-0 bg-black/20 rounded-xl border border-white/10 -z-10"></div>

                    {/* Slots Layer - Align with generated image */}
                    <div className="flex gap-[5px] relative z-10 pl-[8px]">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="size-10 flex items-center justify-center relative">
                                {slots[i] && (
                                    <TileRenderer tile={slots[i]} onClick={() => { }} slotIndex={i} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tools - Using Sprite Sheet */}
                <div className="flex gap-6 w-full justify-center px-4">
                    <ToolBtn
                        label="Undo"
                        onClick={handleUndo}
                        disabled={toolCounts.undo >= LIMIT}
                        spriteIndex={0}
                    />
                    <ToolBtn
                        label="Shuffle"
                        onClick={handleShuffle}
                        disabled={toolCounts.shuffle >= LIMIT}
                        spriteIndex={1}
                    />
                    <ToolBtn
                        label="Hint"
                        onClick={handleHint}
                        disabled={toolCounts.hint >= LIMIT}
                        spriteIndex={2}
                    />
                    <ToolBtn
                        label="Reset"
                        onClick={handleRestart}
                        disabled={toolCounts.restart >= LIMIT}
                        spriteIndex={3}
                    />
                </div>
            </div>

            {/* Overlays (Win/Loss) - Ensure z-index is highest */}
            {status === 'won' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                    <div className="relative z-10 text-center p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
                        <span className="text-6xl mb-4 block animate-bounce">🎉</span>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-yellow-500 mb-2">CLEARED!</h2>
                        <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 bg-gradient-to-r from-gold-400 to-orange-500 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform">Continue</button>
                    </div>
                </div>
            )}
            {status === 'lost' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                    <div className="relative z-10 text-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-red-500/30 shadow-2xl">
                        <span className="text-6xl mb-4 block">💀</span>
                        <h2 className="text-3xl font-black text-red-500 mb-2">GAME OVER</h2>
                        <div className="flex gap-4 justify-center mt-6">
                            <button onClick={handleUndo} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">Revive Pair</button>
                            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Give Up</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Updated ToolBtn to use Sprite Sheet with Blend Mode
const ToolBtn = ({ label, onClick, disabled, spriteIndex }: { label: string, onClick: () => void, disabled: boolean, spriteIndex: number }) => {
    // Sprite calc: 5 items. Positions: 0, 25, 50, 75, 100%
    const xPos = spriteIndex * 25;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
        >
            <div className="size-14 rounded-full shadow-lg border-2 border-white/40 overflow-hidden bg-white/10 relative">
                <div
                    className="absolute inset-0 mix-blend-multiply" // Added blend mode to remove white bg
                    style={{
                        backgroundImage: 'url(/game-assets/sprites/ui-buttons-gen.png)',
                        backgroundSize: '500% 100%',
                        backgroundPosition: `${xPos}% 0%`,
                        backgroundRepeat: 'no-repeat'
                    }}
                />
            </div>
            {/* Label Shadow */}
            <span className="text-[10px] font-black uppercase text-white tracking-wider drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                {label}
            </span>
        </button>
    );
};
