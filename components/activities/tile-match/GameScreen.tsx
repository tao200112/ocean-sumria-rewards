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
                ? { ...t, isRemoved: true, inSlotIndex: -1 }
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

                // Check Win Condition
                if (newSlots.length === 0 && tiles.every(t => t.isRemoved)) {
                    setStatus('won');
                    onFinish('won');
                } else {
                    setStatus('playing');
                }
            }, 300);
        } else {
            // Check Lose logic
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
        const onBoard = tiles.filter(t => !t.isRemoved);
        const types = onBoard.map(t => t.type);

        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

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
        const clickables = tiles.filter(t => t.isClickable);
        let match: Tile | undefined;
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
            <div className="h-12 flex items-center justify-between px-4 bg-ocean-800/40 backdrop-blur-md z-20 border-b border-white/10 shrink-0">
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
            <div className="h-44 bg-white/10 backdrop-blur-md border-t border-white/20 relative z-30 flex flex-col items-center justify-end pb-4 pt-2 shrink-0">

                {/* CSS Based Tray - Guarantees Alignment */}
                <div className="relative w-[340px] h-16 flex items-center justify-center mb-3 bg-[#eecfa1] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] border-b-4 border-[#dbb080]">
                    {/* Inner Slots Layer */}
                    <div className="flex gap-[4px] relative z-10 justify-center w-full items-center">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="size-11 flex items-center justify-center relative bg-black/10 rounded-lg shadow-inner border border-black/5">
                                {slots[i] && (
                                    <TileRenderer tile={slots[i]} onClick={() => { }} slotIndex={i} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tools */}
                <div className="flex w-[340px] justify-between px-2">
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

            {/* Overlays (Win/Loss) */}
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

const ToolBtn = ({ label, onClick, disabled, spriteIndex }: { label: string, onClick: () => void, disabled: boolean, spriteIndex: number }) => {
    // Sprite calc: 5 items. 
    const xPos = spriteIndex * 25;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-1 active:scale-95 transition-all shrink-0 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
        >
            <div className="size-14 rounded-full shadow-lg border-2 border-white/40 overflow-hidden bg-white/10 relative shrink-0">
                <div
                    className="absolute inset-0 mix-blend-multiply"
                    style={{
                        backgroundImage: 'url(/game-assets/sprites/ui-buttons-gen.png)',
                        backgroundSize: '500% auto', // Fix aspect ratio (Auto height)
                        backgroundPosition: `${xPos}% center`,
                        backgroundRepeat: 'no-repeat'
                    }}
                />
            </div>
            <span className="text-[10px] font-black uppercase text-white tracking-wider drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] pb-1">
                {label}
            </span>
        </button>
    );
};
