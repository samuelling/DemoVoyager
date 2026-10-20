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

## Orders of Magnitude (`magnitude/`)

One seed played as a demo at five size limits, each a step in time: **4K** (1995), **40K** (1997), **400K** (2003), **4M** (2012) and **40M** (2026). `magnitude/index.html` is a player with a tier selector on a logarithmic byte ruler, the song form for each tier, and a live meter.

- 4K, 40K and 400K: the file must fit the limit.
- 4M and 40M: the code is free, but everything the demo generates while it runs (textures, render targets, meshes, sample banks, impulse responses) must fit. Each demo reports what it builds and the player shows it against the limit.

From 40K up every tier starts from the same composition for a seed (`src/core.js`), and each larger limit buys more structure as well as sound:

- 40K plays the tracker module as written.
- 400K arranges it: every section twice, the repeat varied (passing tones, octave lifts, busier bass, new fills), voice-led pads and arpeggios, softsynth, hardware 3D scenes.
- 4M recomposes it from the raw material as a big-room track (intro, verse, build, drop, break, build, drop, outro) with risers, sidechain and supersaws; raymarched scenes chosen by section role; 800×450 targets to stay under 4 MB.
- 40M recomposes it in a sonata-like form (prelude, theme A, theme B in the relative key, development round the circle of fifths with a canon, build, climax, coda ending on a Picardy third) with a counter-melody, physically modelled plucks, harp, piano and drums, and GPU simulations: stable fluids, reaction-diffusion, a volumetric nebula and a 131,072-particle swarm that spells the title.

**Shared form / Free form.** The player has a switch. In Shared form every tier from 40K up follows the same song. In Free form the material (key, mode, motifs, progressions, groove) stays shared but each tier writes its own structure (`src/form.js`), as deep as its allowance permits: 400K one level over two themes; 4M parts and sections, three themes, related keys, builds and drops; 40M movements, sections and irregular phrases, five themes on a tonal plan, odd meters, and returns with up to three of fourteen transformations (inversion, retrograde, diminution, canon, modal mixture, counterpoint). The player draws each form (hierarchy, themes, arcs for returns, energy, key plan), shows a bar-by-bar self-similarity map of the notes actually played, and scores whether the form is audible as d′ (same-theme vs different-theme bars, lined up bar for bar, using melody intervals and scale degrees so transposed returns still count).

**Era idioms.** A third setting keeps Free form's allowance but gives each tier the structural habits of its era (`src/era.js`): 400K builds a 2003 trance form by layering (a part in or out every 8 bars, breakdown, roll, climax, strip-down); 4M writes 2012 EDM (call-and-answer hooks, build with a pre-drop gap, big-room or half-time drop, a switch-up or lifted second drop); 40M scores 2026 cinematic acts with leitmotifs that change mood, ostinatos, drones and hits. The player and dissection page measure each era's signature: layers per bar, share of repeated bars, and phrase length.

**Dissection** (`magnitude/dissect.html`, linked from the player): takes one song apart for any seed, tier and mode: form diagram, a piano roll of every note with estimated chords, the similarity map, the same-vs-different distributions behind d′, planned energy against notes played, instrument activity, each theme's motifs and appearances, and a section table with how recognisable each return is. A second tab, What this is, explains the project and its method.

Build: `sh magnitude/src/build.sh` (needs Node for terser) writes `magnitude/tiers/{400k,4m,40m}.html`; `python3 magnitude/shell/build.py` writes `magnitude/index.html`. The 4K and 40K files are copies of the Demoseed ones.
