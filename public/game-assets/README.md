# Tile Match Game Assets Configuration

To make the game look correct, please place your image files in the `public/game-assets/tiles/` directory.

## Directory Structure
Create the following folders in your project root:

```text
public/
  └── game-assets/
      └── tiles/
          ├── sushi.png
          ├── ramen.png
          ├── tempura.png
          ├── sake.png
          ├── tea.png
          ├── burger.png
          ├── pizza.png
          ├── donut.png
          ├── fries.png
          ├── hotdog.png
          ├── taco.png
          └── icecream.png
```

## Image Specs
- **Format**: PNG (transparent background recommended)
- **Size**: ~128x128px or 256x256px (High DPI)
- **Content**: Center the item. The game renders them in a 40x48px box.

## Testing with Fallbacks
If you don't add images immediately, the game will automatically fallback to Emoji icons (🍣, 🍜, etc.), so you can test the gameplay logic right away without assets.
