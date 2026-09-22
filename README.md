# MATTBEAR – The Bear Cave

A browser-based collection of musical instruments, audio utilities, games, and practical creative tools. The site is static and published with GitHub Pages.

## Main areas

- **Make Music** — Pedalboard, Bearmin Theremin, Drum Machine, Kaoss Command, and 3xOSC.
- **Shape Sound** — Microphone Fiend, Stem Separator, and Guitar Tuner.
- **Play** — Jackpot Jukebox and Bearcade Blitz.
- **Professional Fun** — Focus Promo Studio, Verquinox, and Teta's Menu Trainer.
- **Studios & Experiments** — The Den, Kaoss FX Rack, Voice Arcade, and Voice Console.

## Project structure

- `index.html` — Bear Cave homepage and complete sitemap.
- `style.css` — homepage design system.
- `cave-shell.js` — shared return navigation and quick-start help for standalone tools.
- `*.html` — standalone tools that run directly in the browser.
- `assets/` — shared images and audio.
- `bearcade/`, `verquinox/`, `yard-sale/` — projects with their own local assets.

## Run locally

Most pages can be opened directly. Microphone, camera, MIDI, module imports, and some downloads work more reliably from a local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Browser and privacy notes

- Audio begins only after user interaction because of browser autoplay rules.
- Microphone, camera, and MIDI permissions are requested only by tools that need them.
- Media processing is performed locally in the browser unless a page clearly links to an outside service.
- Chrome or Edge is recommended for recording, Web MIDI, and media export.

## Publishing checklist

1. Open the homepage and every changed tool at desktop and mobile widths.
2. Check navigation, missing assets, browser console errors, and horizontal overflow.
3. Start audio at low volume and verify stop/panic controls.
4. Commit to `main`; GitHub Pages publishes from the repository.
