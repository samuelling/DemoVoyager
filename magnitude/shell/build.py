import os,json,re
import os.path as _p; D=_p.dirname(_p.dirname(_p.abspath(__file__)))
core=''.join(open(f'{D}/src/{f}').read()+'\n' for f in ['core.js','arrange.js','compose.js'])
sizes={t:os.path.getsize(f'{D}/tiers/{t}.html') for t in ['4k','40k','400k','4m','40m']}
page=open(f'{D}/shell/page.html').read().replace('/*CORE*/',core.replace('</script','<\\/script')).replace('/*SIZES*/{}',json.dumps(sizes))
open(f'{D}/shell/artifact.html','w').write(page)
open(f'{D}/index.html','w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+page.replace('<div class="wrap">','</head><body><div class="wrap">',1)+'</body></html>')
print(sizes,len(page))
