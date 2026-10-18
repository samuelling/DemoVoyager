#!/bin/sh
# 1) terser minifies src.js  2) raw-deflate + base64  3) a ~170-byte loader inflates it with
#    the browser's DecompressionStream and runs it as a script element (no eval needed).
set -e
N="npx --yes"
npx --yes terser src.js --toplevel -c passes=3,unsafe=true,unsafe_math=true -m -o min.js
HEAD='<title>Demoseed 4K</title><style>body{margin:0;background:#000}canvas{position:fixed;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;cursor:pointer}</style><canvas id=c width=320 height=200></canvas><script>'
B64=$(python3 -c "import zlib,base64;c=zlib.compressobj(9,8,-15);d=open('min.js','rb').read();print(base64.b64encode(c.compress(d)+c.flush()).decode())")
{ printf '%s' "$HEAD"; printf 'new Response(new Blob([Uint8Array.from(atob`%s`,c=>c.charCodeAt())]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text().then(t=>document.body.append(Object.assign(document.createElement("script"),{text:t})))</script>' "$B64"; } > demoseed4k.html
{ printf '%s' "$HEAD"; cat min.js; printf '</script>'; } > demoseed-plain.html
wc -c src.js min.js demoseed4k.html demoseed-plain.html
