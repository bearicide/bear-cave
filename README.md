# The Basement (static)

Dusty shelves, swinging light, scattered boxes; drop files to spawn little message chips around the room.

## What's inside
- **index.html** – page layout and controls
- **style.css** – basement visuals (light glow, boxes, paint drip, papers)
- **script.js** – logic for drops, chips, and the "clear a little" mechanic
- Uses **TailwindCSS CDN** for convenience (no build step)

## How to use
1. Open `index.html` locally or host it (GitHub Pages is perfect).
2. Drag-and-drop files anywhere, or click the subtle round button at bottom-right to pick files.
3. Click **clear a little** to remove a small random subset of chips. It never wipes everything — just tidies a bit.
4. **export list** downloads a text list of current chips (ignores ghost notes).

## Notes
- Everything is client-side only. No uploads leave the browser.
- If you prefer darker or lighter walls, tweak `bg-gray-700` in `<body>` or edit `style.css` colors.
