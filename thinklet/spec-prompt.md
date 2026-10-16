# Powder Rush - original Thinklet spec

The prompt this panel was built from (Thinklet panel id `jsu8wvbr`).

---

A playable, jaw-dropping 2D side-view downhill skiing game, built as a self-contained canvas app that runs right in the panel (keyboard + touch). Think Alto's Odyssey meets Trials with real physics and premium pixel/sprite art.

GRAPHICS (must look insane): multi-layer parallax mountains (5+ layers: distant peaks with snow caps, mid ridges, pine forests, foreground trees), dynamic sky with day/sunset/night/aurora cycle across runs, volumetric god rays, falling snow particles, wind gusts, powder spray and snow trails off the skis, sparkle on fresh powder, screen shake on hard landings, motion-blur speed lines at high speed, slow-mo on big air, bloom/glow on lights, smooth 60fps. A detailed animated skier sprite (procedurally drawn or pixel art: crouch, tuck, pole plant, jump, flips, grabs, wipeout ragdoll with tumbling limbs and lost skis). Night runs have headlamp light and lit lodges.

PHYSICS: procedurally generated endless mountain terrain (smooth spline slopes, cliffs, kickers, rails, cornices, moguls, ice patches, deep powder that slows you) with real gravity, momentum, slope-based acceleration, friction varying by snow type, air rotation with angular momentum, landing-angle checks (land clean = speed boost, land badly = ragdoll crash). Avalanche chase events that rumble up behind you.

GAMEPLAY: hold/tap to tuck and jump (space/up/tap), rotate in air for backflips/frontflips (left/right or hold), grab tricks (down). Trick combo system with multipliers and popups ("DOUBLE BACKFLIP x3"), coins/collectibles, obstacles (rocks, trees, snowmen, lodges, yetis), boost from clean landings. Score, distance, top speed in mph, best run saved in panel memory, unlockable skiers/outfits/skis with saved progress. Title screen, pause, game over screen with stats and instant retry.

AUDIO: generated with WebAudio: wind rush scaling with speed, carve swish, landing thud, combo chimes, and a chill synth soundtrack with a mute toggle.

Make it feel like a premium indie mobile game, polished UI with a frosty glass HUD.

Change requested 2026-10-12: Three changes:
1) GHOST TOGGLE: the ghost that replays your best run becomes an on/off toggle (a 👻 button on the title screen and in the HUD/pause menu, plus the G key). Remember the choice in saved memory. When it's off, hide the ghost and its "beat the ghost" bonus/line.
2) OBSTACLES TOO FAST: obstacles reach the rider too quickly to react. Give more reaction time: space obstacles further apart (especially early in a run), ease the speed ramp so top speed builds more gradually, and add a subtle look-ahead warning (small icon/glow at the right edge) before rocks, trees, snowmen, lodges and yetis come on screen. Keep the camera framed a bit further ahead of the rider at high speed so more of the upcoming slope is visible. Difficulty can still build over the run, just fairer.
3) FIRST-PERSON VIEW that's insanely cool: add a switchable first-person POV (V key or a view toggle on the title and pause screens, remembered in memory) using the same run, physics, terrain, obstacles, coins and scoring. Render it as a pseudo-3D/perspective downhill view: ski tips and pole hands in frame, the slope rushing toward you with pines, rocks, snowmen, lodges and yetis scaling up from the horizon, layered mountains and the day/sunset/night/aurora sky ahead, falling snow streaking past, powder spray kicking up, motion blur/speed lines and FOV widening as speed climbs, camera bob and lean into carves, the horizon tilting and dropping on jumps with a big airborne float and flips shown as the world rotating, hard-landing shake, a headlamp cone on night runs, and the avalanche roaring audibly with snow dust at the screen edges. Keep it at a smooth 60fps, with steering that feels responsive, and respect reduced motion by toning down shake, bob and rotation.
