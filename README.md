# Powder Rush

A downhill skiing game, built as a Thinklet (Cabinet Next) panel. It started as a 2D side-view physics skier (Alto's Odyssey meets Trials: procedural slopes, kickers, rails, flips and grabs, clean-landing speed boosts, ragdoll crashes, avalanche chases, multi-layer parallax mountains and a day/sunset/night cycle). It grew a first-person view that is now a full three.js 3D valley with lit snow, sun shadows, spruce forests, 3D ranges and your own skis, poles and gloves. It also has unlockable riders, a best-run ghost, coins and a daily challenge. The last saved build is version 32.

Built with Claude: Thinklet's builder on claude-opus-5-5, then mostly Claude Code, 2026-10-12 to 2026-10-13.

## How to run

- **Inside Thinklet:** it's the "Powder Rush" panel (id `jsu8wvbr`, space "Fun").
- **Standalone:** open `index.html` in a browser, or better, serve the folder (`python3 -m http.server`) and open it. Tested headless on 2026-10-16: the title screen and side view render without Thinklet. Notes:
  - The first-person 3D view loads three.js 0.170.0 from `cdn.jsdelivr.net`, so it needs an internet connection.
  - Inside Thinklet the photoreal textures (snow, granite, spruce, panorama band) come from Thinklet's Creations folder through `cabinet.file(...)`. Copies are in `assets/creations/`. Standalone, `cabinet.file` doesn't exist and the game falls back to its procedural look.
  - Without Thinklet, progress isn't saved between sessions.
- Controls: hold to tuck, release to jump, hold in the air to flip, Down or swipe to carve or grab, V for view, G for ghost, M for mute.

## What's in here

| Path | What it is |
|------|-----------|
| `index.html`, `js/` | The game as it runs in the panel (2D `render-*.js`, first-person `render-fp*.js`, 3D view in `js/fp3d/`) |
| `assets/creations/*.png` | The 5 AI-generated textures the game loads via `cabinet.file()` (from `~/Documents/Cabinet Next/Creations`) |
| `thinklet/spec-prompt.md` | The original spec prompt the panel was built from |
| `thinklet/panel.json` | The full panel entry from Thinklet's `Panels.json`: title, prompt, version log, panel commands, memory keys, build costs |
| `thinklet/memory.json` | Saved game state from Thinklet (best runs, coins, unlocked riders, ghost) |
| `thinklet/poster.jpg` | The panel's poster thumbnail |
| `history/versions/*.json` | The last 20 saved versions from Thinklet. Each one holds the full source of every file (`files`) plus the panel state at that point. File names are millisecond timestamps |

## Original location

`~/Library/Application Support/Cabinet Next/Panels/Panels/jsu8wvbr` (versions in `.../Panels/Panels/versions/jsu8wvbr`). Backed up on 2026-10-16.
