import { Tile } from '../../types/tile-match';

// Standard 12 tile types matching the sprite sheet (4x3 grid)
export const TILE_TYPES = [
    'sushi', 'sashimi', 'chicken', 'tempura',
    'ramen', 'dumplings', 'beer', 'cocktail',
    'sake', 'soda', 'boba', 'coin'
];

// Map for sprite sheet index
export const TILE_SPRITE_INDEX: Record<string, number> = {
    'sushi': 0, 'sashimi': 1, 'chicken': 2, 'tempura': 3,
    'ramen': 4, 'dumplings': 5, 'beer': 6, 'cocktail': 7,
    'sake': 8, 'soda': 9, 'boba': 10, 'coin': 11
};

// board dimensions (virtual 8x8 grid for simplified overlapping)
const GRID_W = 8;
const GRID_H = 8;

/**
 * Deterministic Random Number Generator
 */
export class Random {
    private seed: number;
    constructor(seedStr: string) {
        // Simple hash to number
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    next(): number {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Range [min, max)
    range(min: number, max: number) {
        return Math.floor(this.next() * (max - min)) + min;
    }
}

/**
 * Generate Level Logic
 */
export function generateLevel(level: number, seed: string): Tile[] {
    const rng = new Random(seed);
    const tiles: Tile[] = [];

    // Configuration
    const numTypes = level === 1 ? 6 : 12; // Level 1 uses subset
    const totalTriplets = level === 1 ? 12 : 30; // 36 tiles vs 90 tiles
    const totalTiles = totalTriplets * 3;

    // 1. Generate Type Pool
    let typePool: string[] = [];
    const availableTypes = TILE_TYPES.slice(0, numTypes);

    for (let i = 0; i < totalTriplets; i++) {
        // Pick a type
        const type = availableTypes[rng.range(0, numTypes)];
        typePool.push(type, type, type);
    }

    // Shuffle Pool
    for (let i = typePool.length - 1; i > 0; i--) {
        const j = rng.range(0, i + 1);
        [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
    }

    // 2. Lay them out in layers
    // Simple spiral or random cluster strategy
    // We place tiles on a virtual grid.
    // Overlap rule: A tile at (x,y,z) covers (x,y,z-1). 
    // We also shift positions slightly for visual "messy" look.

    const layerCount = level === 1 ? 3 : 7;

    let usedPositions: Set<string> = new Set();

    for (let i = 0; i < totalTiles; i++) {
        const type = typePool[i];

        // Attempt to place
        let boxX = 0, boxY = 0, z = 0;

        // For Level 2, we want some structure but also randomness
        // e.g. Pyramid shape
        // Or just simple random placement within bounds

        // Simplified placement for demo:
        // Random select layer 0 to layerCount-1
        // Fill bottom first?
        // Actually, "Sheep a Sheep" is usually pre-defined patterns.
        // We will generate random patterns here for simplicity.

        // Try to place in center-ish
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            z = rng.range(0, layerCount);
            // Center bias
            boxX = rng.range(1, GRID_W - 1);
            boxY = rng.range(1, GRID_H - 1);

            // Add slight float offset for rendering variety (not logic)

            const key = `${boxX},${boxY},${z}`;
            if (!usedPositions.has(key)) {
                usedPositions.add(key);
                placed = true;
            }
            attempts++;
        }

        // Fallback if full (shouldn't happen with these params)
        if (!placed) {
            // Just stack somewhere
            z = rng.range(0, layerCount);
            boxX = rng.range(0, GRID_W);
            boxY = rng.range(0, GRID_H);
        }

        tiles.push({
            id: `t-${i}`,
            type,
            x: boxX * 44 + rng.range(-5, 5), // 44px grid step + jitter
            y: boxY * 50 + rng.range(-5, 5),
            z,
            isClickable: true, // will calc later
            isRemoved: false,
            inSlotIndex: null
        });
    }

    // 3. Sort by Z for rendering
    tiles.sort((a, b) => a.z - b.z);

    return calculateVisibility(tiles);
}

/**
 * Recalculate which tiles are clickable (top of stack)
 */
export function calculateVisibility(tiles: Tile[]): Tile[] {
    // A tile A covers tile B if:
    // A.z > B.z 
    // AND A overlaps B visually.
    // For simplicity, we assume strict grid overlap.
    // If rects intersect > threshold?

    // Using simple box model: width 40, height 48
    const W = 40;
    const H = 48;

    return tiles.map(target => {
        if (target.isRemoved || target.inSlotIndex !== null) {
            return { ...target, isClickable: false };
        }

        let isCovered = false;

        for (const other of tiles) {
            if (other.id === target.id) continue;
            if (other.isRemoved || other.inSlotIndex !== null) continue;

            if (other.z > target.z) {
                // Check overlap
                // Center-to-center distance check might be easier and sufficient
                const dx = Math.abs(other.x - target.x);
                const dy = Math.abs(other.y - target.y);

                // If overlap is significant (e.g. covering > 20%?)
                // Let's say if centers are within 30px
                if (dx < W && dy < H) {
                    isCovered = true;
                    break;
                }
            }
        }

        return { ...target, isClickable: !isCovered };
    });
}
