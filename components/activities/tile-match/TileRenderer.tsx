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
            // Slot layout: Centered at bottom
            // Slot is 308px wide (44 * 7) roughly
            // We position relative to slot container
            return {
                left: slotIndex * 44 + 4, // 4px padding
                top: 4,
                zIndex: 100,
                transform: 'none',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            };
        } else {
            // Board layout
            return {
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

    // Image Path
    // Assuming user put images in public/game-assets/tiles/{type}.png
    const imgPath = `/game-assets/tiles/${tile.type}.png`;

    return (
        <div
            onClick={() => tile.isClickable && onClick(tile)}
            className={`absolute rounded-md border-2 overflow-hidden flex items-center justify-center select-none ${slotIndex !== undefined ? 'size-10' : 'size-10'}`}
            style={{
                width: 40,
                height: 48,
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1',
                ...style
            }}
        >
            {/* Fallback to emoji if image fails (using simple check or just render both and hide err) */}
            <img
                src={imgPath}
                alt={tile.type}
                className="w-8 h-8 object-contain pointer-events-none"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerText = FALLBACK_ICONS[tile.type] || '?';
                }}
            />

            {/* Overlay for depth effect (simple gradient) */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/5 pointer-events-none"></div>
        </div>
    );
};
