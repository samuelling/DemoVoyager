# DemoVoyager

A game about building a tracker module inside a 90s PC demo.

## The game (`index.html`)

The demo is broken and silent. You walk its world, a low-res 3D maze of rooms behind force-field gates, and rebuild the soundtrack one machine at a time:

1. **Drum Reactor**: the DRUMS and HI-HATS channels. Goal: 4 kicks, 2 snares, 8 hi-hats.
2. **Bass Coil**: the BASS channel. Goal: 8 notes, 3 different pitches.
3. **Chord Crystals**: the ARP channel. Goal: 4 chord roots held by 16 rows of `0xy` arpeggio. The Minor, Major and Sus4 buttons fill it in.
4. **Lead Spire**: LEAD and ECHO. Goal: 8 lead notes and an echo. The Echo button copies the lead three rows late, the classic tracker trick.
5. **Arranger**: the camera rises to a top-down view of the whole world. Build the order list (pattern and demo scene per order), then **Premiere** plays your song under the 2D demo engine.

Each finished machine opens the next gate and lights its room. The machines react live to their channels: the reactor core pulses on kicks, coil rings ripple on bass notes, crystals step through the arpeggio, the spire beams on lead notes.

Controls: WASD or arrows to move, drag to look, E to use a machine, M toggles music, Esc closes. On touch screens there is a move stick, drag-to-look, and an on-screen keypad for the tracker.

Progress and the song autosave in the browser. **Sandbox** on the title screen opens every gate and loads the Phosphor song.

Rendering uses three.js r128 at a deliberately low internal resolution, scaled with nearest-neighbour.

## The standalone tracker (`tracker.html`)

The earlier page: a full six-channel tracker under the 320×200 demo screen, with the Phosphor song.

## Demoseed (`demoseed/`)

Generative 90s PC demos: each 32-bit seed unfolds into its own tracker song, demo group, credits and sequence of software-rendered effects, computed in the browser. The same seed always gives the same demo.

- **`demoseed/index.html`, Demoseed 40K** (32,358 bytes). Boots from a DOS prompt, types `DEMOSEED.EXE /S:<seed>`, prints the demo's real loading data, then plays. 19 scene types: a fleet of seed-generated spaceships, voxel flight, glenz vectors, mode 7, bump mapping, water, shadebobs, a dot landscape, plasma, tunnel, rotozoomer, fire, Gouraud objects, vector bobs, interference, metaballs, twister, kaleidoscope, plus a lens. Endless: each finished demo returns to `C:\DEMOS>` and runs the next seed. Tap to skip, F for fullscreen, seed in the hash (`#C0FFEE`).
- **`demoseed/4k/`**: the 4,039-byte size-coding original.
- **`demoseed/generator/`**: the full version with an .NFO, a section timeline and seed controls.

Build: `cd demoseed/40k && ./build.sh` (or `demoseed/4k`). Needs Node (`npx terser`) and Python 3. The 8×8 font is rasterized from Press Start 2P, © 2012 The Press Start 2P Project Authors, SIL Open Font License 1.1.

## Music engine

Six channels, 64-row patterns of note / instrument / effect cells. Effects: `0xy` arpeggio, `1xx`/`2xx` slide, `4xy` vibrato, `Axy` volume slide, `Bxx` jump, `Cxx` volume, `Dxx` break, `Fxx` speed/BPM. Samples are synthesized at 22,050 Hz and quantized to 8 bits, then played through Web Audio with a tick-accurate lookahead scheduler.
