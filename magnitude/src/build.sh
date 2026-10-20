#!/bin/sh
# Build each Orders of Magnitude tier from the shared sources into a standalone HTML file in ../tiers/.
set -e
cd "$(dirname "$0")"
mkdir -p ../tiers
HEAD='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TITLE</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#w{position:fixed;inset:0;cursor:pointer}canvas{position:absolute}</style></head><body><div id="w"><canvas id="c"></canvas><canvas id="o"></canvas></div><script>'
build(){ name=$1; title=$2; shift 2
  cat core.js arrange.js compose.js form.js "$@" > ${TMPDIR:-/tmp}/$name.src.js
  npx --yes terser ${TMPDIR:-/tmp}/$name.src.js -c passes=2 -m -o ${TMPDIR:-/tmp}/$name.min.js
  { printf '%s' "$HEAD" | sed "s/TITLE/$title/"; printf '(()=>{'; cat ${TMPDIR:-/tmp}/$name.min.js; printf '})();</script></body></html>'; } > ../tiers/$name.html
  wc -c ../tiers/$name.html
}
build 400k "Demoseed 400K" synth.js gl.js ships.js runtime.js t400k.js p400k.js
build 4m "Demoseed 4M" synth.js gl.js runtime.js t4m.js p4m.js
build 40m "Demoseed 40M" synth.js gl.js runtime.js t40m.js p40m.js
