#!/bin/sh
# Assemble Demoseed 40K: core generator (from Demoseed) + new 90s scenes + DOS prompt, then minify and pack.
set -e

{ sed -n '133,612p' ../generator/index.html | sed 's/^function buildFont(){/function buildFont0(){/'; cat tail.js main.js; echo '})();'; } > src.js
npx --yes terser src.js -c passes=3,unsafe=true,unsafe_arrows=true,unsafe_math=true,toplevel=true -m toplevel=true -o min.js
HEAD='<title>Demoseed 40K</title><style>body{margin:0;background:#000}canvas{position:fixed;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;cursor:pointer}</style><canvas id=scr width=320 height=200></canvas><script>'
B64=$(python3 -c "import zlib,base64;c=zlib.compressobj(9,8,-15);d=open('min.js','rb').read();print(base64.b64encode(c.compress(d)+c.flush()).decode())")
{ printf '%s' "$HEAD"; printf 'new Response(new Blob([Uint8Array.from(atob`%s`,c=>c.charCodeAt())]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text().then(t=>document.body.append(Object.assign(document.createElement("script"),{text:t})))</script>' "$B64"; } > demoseed40k.html
{ printf '%s' "$HEAD"; cat min.js; printf '</script>'; } > demoseed40k-plain.html
wc -c src.js min.js demoseed40k.html demoseed40k-plain.html
