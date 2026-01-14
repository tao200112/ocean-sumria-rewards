import React, { useMemo } from 'react';
import { Tile } from '../../../types/tile-match';

// Map tile types to icon names or emojis if images are missing
const FALLBACK_ICONS: Record<string, string> = {
    'sushi': '🍣',
    'ramen': '🍜',
    'tempura': '🍤',
    'sake': '🍶',
    'tea': '🍵',
    'burger': '🍔',
    'pizza': '🍕',
    'donut': '🍩',
    'fries': '🍟',
    'hotdog': '🌭',
    'taco': '🌮',
    'icecream': '🍦'
};

interface TileRendererProps {
    tile: Tile;
    onClick: (tile: Tile) => void;
    slotIndex?: number; // If defined, tile is in slot (0-6)
}

export const TileRenderer: React.FC<TileRendererProps> = ({ tile, onClick, slotIndex }) => {

    // Position Calculation
    const style = useMemo(() => {
        if (slotIndex !== undefined) {
            // Slot layout: Static position to fit inside flex container
            return {
                position: 'relative' as const,
                zIndex: 100,
                transform: 'none',
                // Center in the size-11 slot
                margin: 'auto'
            };
        } else {
            // Board layout (Absolute)
            return {
                position: 'absolute' as const,
                left: tile.x,
                top: tile.y,
                zIndex: tile.z,
                // Add "shadow" based on layer
                boxShadow: tile.isClickable ? '0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 4px rgba(0,0,0,0.5) inset',
                filter: tile.isClickable ? 'brightness(100%)' : 'brightness(40%) contrast(80%)',
                cursor: tile.isClickable ? 'pointer' : 'default',
                transition: 'filter 0.2s, transform 0.2s'
            };
        }
    }, [tile.x, tile.y, tile.z, tile.isClickable, slotIndex]);

    // Image Paths (Sprite Sheet)
    const spritePath = `/game-assets/sprites/tiles-gen.png`;
    // const uiSpritePath = `/game-assets/sprites/ui-buttons-gen.png`; 

    // Map type to index
    const TILE_SPRITE_INDEX: Record<string, number> = {
        'sushi': 0, 'sashimi': 1, 'chicken': 2, 'tempura': 3,
        'ramen': 4, 'dumplings': 5, 'beer': 6, 'cocktail': 7,
        'sake': 8, 'soda': 9, 'boba': 10, 'coin': 11
    };

    // Calculate Sprite Position
    const idx = TILE_SPRITE_INDEX[tile.type] ?? 0;
    // 4 Columns, 3 Rows
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const xPos = col * (100 / 3);
    const yPos = row * (100 / 2);

    return (
        <div
            onClick={() => tile.isClickable && onClick(tile)}
            className={`${slotIndex !== undefined ? 'relative' : 'absolute'} flex items-center justify-center select-none ${slotIndex !== undefined ? 'size-10' : 'size-10'}`}
            style={{
                width: 40,
                height: 48,
                ...style // style includes zIndex, left, top, boxshadow etc.
            }}
        >
            {/* Card Background Layer (Simple White CSS) */}
            <div className="absolute inset-0 z-0 bg-white rounded-md border-2 border-slate-300 overflow-hidden shadow-sm">
                {/* Removed generic IMG, using solid white to match tile sprite bg */}
            </div>

            {/* Content Layer (Sprite) */}
            <div className="relative z-10 w-8 h-8 rounded overflow-hidden">
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${spritePath})`,
                        backgroundSize: '400% 300%',
                        backgroundPosition: `${xPos}% ${yPos}%`,
                        backgroundRepeat: 'no-repeat'
                        // No mix-blend-mode needed if both backgrounds are white
                    }}
                />
            </div>

            {/* Overlay for inactive/depth effect */}
            {!tile.isClickable && (
                <div className="absolute inset-0 bg-black/40 rounded-md z-20 pointer-events-none"></div>
            )}
        </div>
    );
};
