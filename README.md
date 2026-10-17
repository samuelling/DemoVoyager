# DemoVoyager

A recreation of the 90s PC demoscene: software-rendered effects in a 320×200 buffer, stretched to 4:3 like mode 13h on a VGA monitor, synced to a tracker module played live in the browser.

## Phosphor (first demo)

`index.html` is a single self-contained page. Open it in a browser, or serve the repo with GitHub Pages.

**Scenes** (one per order in the order list, 7.68 s each at 125 BPM, speed 6):

| Order | Scene | Pattern |
|---|---|---|
| 00 | Title: starfield, copper bars, typed logo | 00 |
| 01 | Plasma with palette rotation | 01 |
| 02 | Tunnel (angle / inverse-distance lookup tables) | 02 |
| 03 | Rotozoomer (16.16 fixed point) | 03 |
| 04 | Fire with burning logo | 04 |
| 05 | Voxel landscape flight | 05 |
| 06 | Gouraud-shaded torus | 02 |
| 07 | Vector bobs + greetings | 03 |

**Music engine:** six channels (drums, hats, bass, arp, lead, echo), 64-row patterns of note / instrument / effect cells. Supported effects: `0xy` arpeggio, `4xy` vibrato, `Axy` volume slide, `Cxx` set volume. Samples are generated procedurally at 22,050 Hz and quantized to 8 bits, then played through Web Audio with a tick-accurate lookahead scheduler. The visuals read the scheduler's row queue, so effects sync to the current order and row.

Without sound the demo runs in a silent preview mode on the same timeline.
