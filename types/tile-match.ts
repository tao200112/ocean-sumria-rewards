export interface TileMatchState {
    runId: string | null;
    level: number;
    seed: string;
    status: 'idle' | 'playing' | 'paused' | 'won' | 'lost';
    score: number;
    moves: number;
    tiles: Tile[];
    slots: (Tile | null)[];
    history: GameHistory[];
    maxSlots: number;
}

export interface Tile {
    id: string; // unique instance id
    type: string; // 'sushi', 'ramen', etc.
    x: number; // grid x (0-100 scale or pixel)
    y: number; // grid y
    z: number; // layer index
    isClickable: boolean;
    isRemoved: boolean; // if true, it's matched and gone from board (or in slot)
    inSlotIndex: number | null; // -1 if on board, 0-6 if in slot
}

export interface GameHistory {
    action: 'pick';
    tileId: string;
    from: { x: number, y: number, z: number };
}

export interface TileMatchConfig {
    dailyFreePlays: number;
    playCost: number;
    levels: {
        level: number;
        reward: number;
        difficulty: string;
    }[];
}

export interface DailyStats {
    freeUsed: number;
    paidRemaining: number;
}
