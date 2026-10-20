/* Shared by the player and the dissection page: describes every tier's song in common terms, measures it, draws its form. */
// ---- what each tier writes for this seed, as one common description per section
const MATCOL={A:'#c98500',B:'#3987e5',C:'#d55181',D:'#9085e9',E:'#199e70'},NEUTRAL='#5c5f68';
const ROLEWORD={intro:'intro',outro:'outro',build:'build',bridge:'bridge',drop:'drop',climax:'climax',break:'break',development:'development',state:'statement',ret:'return',variation:'variation'};
const KEYS=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
// the shared (fixed) forms, described in the same terms as the free ones
const SH={
  intro:{role:'intro',e:.15},outro:{role:'outro',e:.25},build:{role:'build',e:.6,mat:'A',xf:[]},
  A:{mat:'A',e:.6},A2:{mat:'A',e:.65,xf:['vary']},A3:{mat:'A',e:.8,xf:['vary','transpose'],up:1},B:{mat:'B',e:.6},B2:{mat:'B',e:.65,xf:['vary']},break:{role:'break',mat:'B',e:.2},
  verse:{mat:'A',e:.5,xf:['thin']},'build 2':{role:'build',e:.6,mat:'A',xf:['fragment','sequence']},drop:{role:'drop',mat:'A',e:.95,xf:['harmony']},'drop 2':{role:'drop',mat:'A',e:1,xf:['harmony','transpose'],up:1},
  prelude:{role:'intro',e:.15,mat:'A',xf:['augment']},'theme A':{mat:'A',e:.55,xf:['vary']},'theme B':{mat:'B',e:.6,rel:1},development:{role:'development',mat:'A',e:.6,xf:['fragment','sequence','canon']},
  climax:{role:'climax',mat:'A',e:1,xf:['transpose','combine'],up:1},coda:{role:'outro',e:.25,xf:['invert','augment','modal']}};
function sharedSecs(list,song,L){const seen={};let r=0;return list.map(([name,rows])=>{const d=SH[name]||{mat:'A',e:.5};let role=d.role;
  if(!role){role=seen[d.mat]?'ret':'state';seen[d.mat]=1;}
  const xf=(d.xf||[]).slice();if(L===1&&!/intro|outro/.test(name)&&!xf.includes('vary'))xf.push('vary');
  const o={name,start:r,len:rows,bars:rows/16,meter:16,role,mat:d.mat||null,xf,tr:d.up?(song.mat.modUp||2):0,key:d.up?(song.mat.modUp||2):d.rel?(song.minor?3:-3):0,energy:d.e};r+=rows;return o;});}
// the 40K tracker module as note events, so its similarity can be measured like the others
function trackerEvents(song){const ev=[];let R0=0;for(const s of song.sections){const P=song.pats[s.pat];
  for(const c of [2,3,4,5]){let open=null;for(let r=0;r<ROWS;r++){const cl=P[r][c],n=cl.n;if(n===null)continue;if(open){open.d=R0+r-open.t;open=null;}
    if(n>0){const v=cl.fx===0xC?Math.max(.15,cl.p/64):1,i=c===4?'lead':c===2?'bass':c===3?'arp':cl.i===6?'echo':'pad';
      open={i,t:R0+r,d:1,v};if(c===3&&cl.fx===0&&cl.p)open.ns=[n,n+(cl.p>>4),n+(cl.p&15)];else open.n=n;ev.push(open);}}if(open)open.d=R0+ROWS-open.t;}
  for(let r=0;r<ROWS;r++)for(const c of [0,1]){const cl=P[r][c];if(cl.n>0)ev.push({i:cl.i===1?'kick':cl.i===2?'snare':'hat',t:R0+r,v:cl.fx===0xC?Math.max(.15,cl.p/64):1});}R0+=ROWS;}return ev;}
const sharedThemes=song=>{const M=song.mat;return{A:{motifs:{A:M.m[0],B:M.m[1]},shape:M.sh1,prog:M.P1,start:M.start1},B:{motifs:{A:M.m[2],B:M.m[3]},shape:M.sh2,prog:M.P2,start:M.start2}};};
function composeAll(sd,mode){if(mode===true)mode='free';if(!mode)mode='shared';const free=mode!=='shared';const song=genSong(sd),res=[];
  const k4=[['intro','intro',.15],['groove','build',.4],['A','A',.7],['A','A',.7],['break','break',.25],['B','B',.7],['B','B',.7],['groove','build',.5],['A lift','A',.85],['outro','outro',.3]];
  res.push({secs:k4.map(([n,m,e],i)=>({name:n,start:i*64,len:64,bars:4,meter:16,role:/^[AB]/.test(m)?(i===2||i===5?'state':'ret'):m,mat:/^[AB]/.test(m)?m:null,xf:n==='A lift'?['transpose']:[],key:n==='A lift'?2:0,energy:e})),rows:640,levels:1,ev:null,len:null});
  {const secs=sharedSecs(song.sections.map(s=>[s.name,ROWS]),song,0);res.push({secs,rows:song.sections.length*ROWS,levels:1,ev:trackerEvents(song),len:timeOf(song,song.sections.length*ROWS),themes:sharedThemes(song),inst:{A:'lead',B:'lead'}});}
  for(const L of [1,2,3]){const sc=mode==='era'?arrangeEra(song,L):mode==='free'?arrangeFree(song,L):arrange(song,L);
    const secs=free?sc.secs.map(x=>Object.assign({},x,{tr:x.rel?x.key-(song.minor?3:-3):x.key,mat:/intro|outro|build|bridge/.test(x.role)?null:x.mat})):sharedSecs(sc.secs.map(x=>[x.name,x.len]),song,L);
    const levels=free?(sc.tree.kids.some(g=>g.kids.some(k=>k.kids))?3:sc.tree.kids.some(g=>g.label)?2:1):1;
    res.push({secs,rows:sc.rows,levels,ev:sc.ev,tree:free?sc.tree:null,len:timeOf(song,sc.rows),themes:free?sc.themes:sharedThemes(song),inst:free?sc.inst:[null,{A:'lead',B:'lead'},{A:'lead',B:'keys'},{A:'oboe',B:'bell'}][L]});}
  for(const r of res)r.sim=r.ev?similarity(r,song):null;
  for(const r of res)if(r.sim)r.idiom=idiomStats(r);
  return{song,res,free,mode};}

// bar-by-bar similarity of what is actually played, in the terms a listener recognises a tune by:
// melody intervals and scale degrees (so a transposed return still matches), melody rhythm, harmony as scale degrees, drum density
const MEL=/^(lead|leadx|oboe|bell|keys|harm|piano)$/,DRUM=/^(kick|snare|hat|ohat|clap|shaker|taiko|tom|crash)$/,NF=48;
function similarity(r,song){const bars=[];for(const sc of r.secs)for(let b=0;b<sc.bars;b++)bars.push({t0:sc.start+b*sc.meter,len:sc.meter,sec:sc});
  const F=bars.map(()=>new Float32Array(NF)),drum=new Float32Array(bars.length);const idx=t=>{let lo=0,hi=bars.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(bars[m].t0<=t)lo=m;else hi=m-1;}return lo;};
  const deg=(n,B)=>(((n-song.key-(B.sec.tr||0))%12)+12)%12;const mel=[];
  for(const e of r.ev){if(e.t<0||e.t>=r.rows)continue;const k=idx(e.t),B=bars[k],f=F[k],v=e.v??1;
    if(DRUM.test(e.i)){drum[k]+=v;continue;}const ns=e.ns||(e.n!=null?[e.n]:[]);if(!ns.length)continue;const w=Math.min(e.d||1,B.len)*v;
    if(MEL.test(e.i)&&v>.55){mel.push(e);f[deg(e.n,B)]+=w*.8;f[27+Math.min(7,Math.floor((e.t-B.t0)/B.len*8))]+=.6;}else if(!MEL.test(e.i))for(const n of ns)f[35+deg(n,B)]+=w*.12;}
  mel.sort((a,b)=>a.t-b.t);for(let i=1;i<mel.length;i++){const k=idx(mel[i].t);if(mel[i].t===mel[i-1].t)continue;F[k][12+Math.max(-7,Math.min(7,mel[i].n-mel[i-1].n))+7]+=1;}
  F.forEach((f,k)=>{f[47]=.25*Math.min(1,drum[k]/24);});
  for(const f of F){let s=0;for(let i=0;i<NF;i++)s+=f[i]*f[i];s=Math.sqrt(s)||1;for(let i=0;i<NF;i++)f[i]/=s;}
  const N=bars.length,S=new Float32Array(N*N);for(let i=0;i<N;i++)for(let j=i;j<N;j++){let d=0;const a=F[i],b=F[j];for(let k=0;k<NF;k++)d+=a[k]*b[k];S[i*N+j]=S[j*N+i]=d;}
  // d': do bars of sections built on the same theme sound more alike than bars of different themes?
  // compare sections bar for bar from their starts (the way a listener lines up a returning phrase)
  const first=new Map();bars.forEach((B,i)=>{if(!first.has(B.sec))first.set(B.sec,i);});const secs=r.secs.filter(x=>x.mat),same=[],diff=[];
  for(let p=0;p<secs.length;p++)for(let q=p+1;q<secs.length;q++){const a=secs[p],b=secs[q],i0=first.get(a),j0=first.get(b),n=Math.min(a.bars,b.bars);
    for(let k=0;k<n;k++)(a.mat===b.mat?same:diff).push(S[(i0+k)*N+j0+k]);}
  const mv=x=>{const m=x.reduce((p,q)=>p+q,0)/x.length;return[m,x.reduce((p,q)=>p+(q-m)*(q-m),0)/x.length];};
  let dp=null;if(same.length>3&&diff.length>3){const [ms,vs]=mv(same),[md,vd]=mv(diff);dp=(ms-md)/Math.sqrt((vs+vd)/2||1e-6);}
  // how recognisable each section is as its theme: aligned similarity to the theme's first appearance
  const firstSec={};for(const x of secs)if(!firstSec[x.mat])firstSec[x.mat]=x;
  const recog=new Map();for(const x of secs){const f=firstSec[x.mat];if(f===x)continue;const i0=first.get(f),j0=first.get(x),n=Math.min(f.bars,x.bars);let t=0;for(let k=0;k<n;k++)t+=S[(i0+k)*N+j0+k];recog.set(x,t/n);}
  return{S,N,bars,dp,same,diff,recog,first};}

function stats(r){const mats=new Set(r.secs.filter(x=>x.mat).map(x=>x.mat)),xf=new Set(),keys=new Set(),met=new Set();
  for(const x of r.secs){x.xf.forEach(y=>{if(y!=='sub'&&y!=='meter')xf.add(y);});keys.add((x.key||0)+(x.rel?'r':''));met.add(x.meter);}
  return{secs:r.secs.length,levels:r.levels,themes:mats.size,xf:xf.size,keys:keys.size,meters:met.size,bars:r.secs.reduce((a,x)=>a+x.bars,0)};}

// ---- the form diagram: hierarchy brackets, sections (colour = theme, fill = energy), arcs from each return to its source, key plan
const meterName=m=>({12:'3/4',14:'7/8',16:'4/4',20:'5/4'})[m]||m+'/16';
const keyName=(song,k)=>KEYS[((song.key+k)%12+12)%12];
const svgEl=(tag,at,txt)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in at)e.setAttribute(k,at[k]);if(txt!=null)e.textContent=txt;return e;};
function describe(x,song){const bits=[ROLEWORD[x.role]||x.role];if(x.mat)bits.push('theme '+x.mat);const xf=x.xf.filter(y=>y!=='meter').map(y=>XF_LABEL[y]||y);if(xf.length)bits.push(xf.join(', '));
  bits.push(keyName(song,x.key||0)+(x.rel?' (relative)':''));bits.push(`${x.bars} bars of ${meterName(x.meter)}`);bits.push(`energy ${x.energy.toFixed(2)}`);return `${x.name}: `+bits.join(' · ');}
function formDiagram(svg,r,song,o={}){svg.innerHTML='';const W=Math.max(300,svg.clientWidth||600),tot=r.rows,xs=t=>t/tot*W;
  const lv=r.tree?(r.levels>=3?2:1):0,top=lv*18+4,BH=46,arcY=top+BH+4,maxArc=58,keyY=arcY+maxArc+14,H=keyY+34;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);
  // brackets from the plan tree
  if(r.tree){let i=0;const leafStart=k=>r.secs[k].start,leafEnd=k=>r.secs[k].start+r.secs[k].len;
    for(const g of r.tree.kids){const n0=i;for(const k of g.kids){if(k.kids){const a=i;i+=k.kids.length;if(lv>=2){const x0=xs(leafStart(a)),x1=xs(leafEnd(i-1));svg.append(svgEl('path',{d:`M${x0+1} ${top-2}V${top-7}H${x1-1}V${top-2}`,stroke:'#5c5f68',fill:'none'}));if(x1-x0>46)svg.append(svgEl('text',{x:x0+3,y:top-10},k.label));}}else i++;}
      if(g.label){const x0=xs(leafStart(n0)),x1=xs(leafEnd(i-1));svg.append(svgEl('path',{d:`M${x0+1} 16V10H${x1-1}V16`,stroke:'#8e919a',fill:'none'}));svg.append(svgEl('text',{x:x0+3,y:7,class:'lbl','font-size':'10'},g.label.toUpperCase()));}}}
  // sections
  const firstOf={};r.secs.forEach((x,k)=>{const x0=xs(x.start),w=Math.max(1,xs(x.len)-2),col=x.mat?MATCOL[x.mat]:NEUTRAL,g=svgEl('g',{tabindex:0});
    g.append(svgEl('rect',{x:x0,y:top,width:w,height:BH,fill:col,'fill-opacity':.14}));
    g.append(svgEl('rect',{x:x0,y:top+BH*(1-x.energy),width:w,height:BH*x.energy,fill:col,'fill-opacity':x.role==='development'||x.role==='bridge'?.35:.6}));
    if(x.meter!==16)g.append(svgEl('rect',{x:x0,y:top,width:w,height:3,fill:'#ebe8e1'}));
    if(w>34)g.append(svgEl('text',{x:x0+4,y:top+13,class:'lbl'},x.name.length*6.6>w-6?x.name.slice(0,Math.max(1,Math.floor((w-8)/6.6))):x.name));
    g.append(svgEl('title',{},describe(x,song)));const show=()=>{o.detail&&o.detail(describe(x,song),x);};g.addEventListener('mouseenter',show);g.addEventListener('focus',show);g.addEventListener('click',show);svg.append(g);
    // arc back to where this theme was last heard
    if(x.mat&&/ret|variation|drop|climax|break|development|state/.test(x.role)){const prev=firstOf[x.mat];if(prev&&x.role!=='state'){const a=xs(prev.start+prev.len/2),b=xs(x.start+x.len/2),h=Math.min(maxArc,(b-a)*.45);
        const pth=svgEl('path',{d:`M${a} ${arcY}C${a} ${arcY+h*1.33} ${b} ${arcY+h*1.33} ${b} ${arcY}`,stroke:MATCOL[x.mat],'stroke-opacity':.75,'stroke-width':x.xf.filter(y=>y!=='sub').length?1.5:2.5,fill:'none'});
        if(x.xf.length)pth.setAttribute('stroke-dasharray',x.xf.length>1?'2 3':'6 3');svg.append(pth);}
      if(!firstOf[x.mat]||x.role==='state')firstOf[x.mat]=x;else firstOf[x.mat]=x;}});
  // key plan
  svg.append(svgEl('text',{x:0,y:keyY-6},'key'));let last=null,d='';r.secs.forEach(x=>{const k=(x.key||0)+(x.rel?.5:0),y=keyY+12-k*1.6,x0=xs(x.start),x1=xs(x.start+x.len);d+=(d?`L${x0} ${y}`:`M${x0} ${y}`)+`H${x1}`;
    const nm=keyName(song,x.key||0)+(x.rel?'*':'');if(nm!==last&&x1-x0>14)svg.append(svgEl('text',{x:x0+2,y:y-4,class:'lbl'},nm));last=nm;});
  svg.append(svgEl('path',{d,stroke:'#ebe8e1','stroke-width':1.5,fill:'none'}));
  const playX=svgEl('line',{x1:0,x2:0,y1:0,y2:H,stroke:'#ebe8e1','stroke-width':1.5,opacity:0});svg.append(playX);
  if(o.legend)o.legend.innerHTML=[...new Set(r.secs.filter(x=>x.mat).map(x=>x.mat))].sort().map(m=>`<span><i style="background:${MATCOL[m]}"></i>theme ${m}</span>`).join('')+
    `<span><i style="background:${NEUTRAL}"></i>intro, build, bridge, outro</span><span>fill height = energy</span><span>arcs = a theme returning (dashed = transformed)</span>`+(r.secs.some(x=>x.meter!==16)?'<span>white top edge = odd meter</span>':'')+(r.secs.some(x=>x.rel)?'<span>* relative key</span>':'');return playX;}

// ---- estimated harmony: per bar, match the accompaniment's pitch classes (bass weighted) against major, minor and diminished triads
const ROM=['I','♭II','II','♭III','III','IV','♯IV','V','♭VI','VI','♭VII','VII'];
function chordsPerBar(r,song){const sim=r.sim;if(!sim)return null;const {bars}=sim,N=bars.length,W=bars.map(()=>new Float32Array(12)),BASS=bars.map(()=>new Float32Array(12));
  const idx=t=>{let lo=0,hi=N-1;while(lo<hi){const m=(lo+hi+1)>>1;if(bars[m].t0<=t)lo=m;else hi=m-1;}return lo;};
  for(const e of r.ev){if(DRUM.test(e.i)||e.t<0||e.t>=r.rows)continue;const k=idx(e.t),ns=e.ns||(e.n!=null?[e.n]:[]),w=Math.min(e.d||1,bars[k].len)*(e.v??1)*(MEL.test(e.i)?.4:1);
    for(const n of ns){W[k][((n%12)+12)%12]+=w;if(e.i==='bass')BASS[k][((n%12)+12)%12]+=w;}}
  const Q=[['',[0,4,7]],['m',[0,3,7]],['°',[0,3,6]]];
  return bars.map((B,k)=>{let best=null,bs=-1;for(let root=0;root<12;root++)for(const [q,iv] of Q){let sc=0;for(const d of iv)sc+=W[k][(root+d)%12];sc+=BASS[k][root]*.8;sc-=.25*W[k].reduce((a,v,pc)=>a+(iv.some(d=>(root+d)%12===pc)?0:v),0);if(sc>bs){bs=sc;best={root,q};}}
    if(!best||bs<=0)return null;const tonic=((song.key+(B.sec.tr||0))%12+12)%12,deg=((best.root-tonic)%12+12)%12;let rn=ROM[deg];if(best.q)rn=rn.toLowerCase().replace('♭','♭');return{root:best.root,q:best.q,rn:rn+(best.q==='°'?'°':''),name:KEYS[best.root]+(best.q==='m'?'m':best.q)};});}
const FAMILY=[['melody',/^(lead|leadx|oboe|bell|keys|harm|piano|echo)$/],['counter',/^counter$/],['chords',/^(pad|strings|choir|stab)$/],['arpeggio',/^(arp|pluck|harp)$/],['bass',/^bass$/],['drums',DRUM],['effects',/^(riser|impact|sweep|timp)$/]];
const familyOf=i=>{for(const [f,re] of FAMILY)if(re.test(i))return f;return 'other';};
function perBar(r){const sim=r.sim;if(!sim)return null;const {bars}=sim,N=bars.length,notes=new Float32Array(N),inst={};
  const idx=t=>{let lo=0,hi=N-1;while(lo<hi){const m=(lo+hi+1)>>1;if(bars[m].t0<=t)lo=m;else hi=m-1;}return lo;};
  for(const e of r.ev){if(e.t<0||e.t>=r.rows||e.i==='sweep')continue;const k=idx(e.t),c=e.ns?e.ns.length:1;notes[k]+=c;(inst[e.i]||(inst[e.i]=new Float32Array(N)))[k]+=c;}
  return{notes,inst};}
const progName=(song,prog)=>prog.map(d=>{const c=chordInfo(song.iv,d),rn=['I','II','III','IV','V','VI','VII'][d];return(c.third===3?rn.toLowerCase():rn)+(c.fifth===6?'°':'');}).join('–');

// ---- era signatures: how many layers play, how often they change, how long phrases run, how much is repeated
function idiomStats(r){const {bars,S,N}=r.sim,lay=bars.map(()=>new Set()),idx=t=>{let lo=0,hi=N-1;while(lo<hi){const m=(lo+hi+1)>>1;if(bars[m].t0<=t)lo=m;else hi=m-1;}return lo;};
  for(const e of r.ev){if(e.t<0||e.t>=r.rows)continue;const l=layerOf(e.i);if(l!=='fx')lay[idx(e.t)].add(l);}
  const layers=lay.map(x=>x.size);let changes=0;for(let i=1;i<N;i++)if(layers[i]!==layers[i-1])changes++;
  // a bar "repeats" if some earlier bar is nearly the same (similarity 0.9 or more)
  const rep=new Uint8Array(N);for(let j=1;j<N;j++)for(let i=0;i<j;i++)if(S[i*N+j]>=.9){rep[j]=1;break;}
  const reps=rep.reduce((a,b)=>a+b,0)/N,phr=r.secs.map(x=>x.bars),avgPhrase=phr.reduce((a,b)=>a+b,0)/phr.length;
  return{layers,changes,rep,reps,avgPhrase,maxLayers:Math.max(...layers),meanLayers:layers.reduce((a,b)=>a+b,0)/N};}

// ---- MIDI export: a type-1 file, one track per instrument, drums on channel 10, section markers and meter changes
const GM={lead:81,leadx:81,echo:80,harm:80,keys:4,piano:0,oboe:68,bell:14,pad:89,strings:48,choir:52,stab:62,arp:80,pluck:45,harp:46,bass:38,counter:73,timp:47};
const GMDRUM={kick:36,snare:38,clap:39,hat:42,ohat:46,crash:49,shaker:70,taiko:35,impact:57};
function toMidi(song,r,meta){const PPQ=96,T16=PPQ/4,swing=song.swing;
  const tick=t=>{const ri=Math.floor(t),fr=t-ri;return Math.round(ri*T16+(swing&&(ri&1)?T16/6:0)+fr*T16);};
  const vlq=n=>{const b=[n&127];while(n>>=7)b.unshift((n&127)|128);return b;},str=x=>[...new TextEncoder().encode(x)];
  const track=evs=>{evs.sort((a,b)=>a.t-b.t||a.o-b.o);let last=0;const out=[];for(const e of evs){out.push(...vlq(Math.max(0,e.t-last)),...e.b);last=Math.max(last,e.t);}
    out.push(0,0xFF,0x2F,0);return[0x4D,0x54,0x72,0x6B,(out.length>>>24)&255,(out.length>>16)&255,(out.length>>8)&255,out.length&255,...out];};
  // conductor: tempo, meters, section markers, text
  const c0=[{t:0,o:0,b:[0xFF,0x03,...vlq(str(meta.title).length),...str(meta.title)]},{t:0,o:0,b:[0xFF,0x51,3,...[16,8,0].map(k=>(Math.round(6e7/song.bpm)>>k)&255)]},
    {t:0,o:0,b:[0xFF,0x01,...vlq(str(meta.text).length),...str(meta.text)]}];
  let lastM=0;for(const x of r.secs){const t=tick(x.start);if(x.meter!==lastM){const [nn,dd]={12:[3,2],14:[7,3],16:[4,2],20:[5,2]}[x.meter]||[4,2];c0.push({t,o:1,b:[0xFF,0x58,4,nn,dd,24,8]});lastM=x.meter;}
    c0.push({t,o:2,b:[0xFF,0x06,...vlq(str(x.name).length),...str(x.name)]});}
  const tracks=[track(c0)],by={};for(const e of r.ev){if(e.i==='sweep'||e.i==='riser')continue;(by[e.i]||(by[e.i]=[])).push(e);}
  let ch=0;const drums=[];
  for(const [inst,list] of Object.entries(by)){const isDrum=GMDRUM[inst]!=null||inst==='tom';if(isDrum){for(const e of list)drums.push(Object.assign({inst},e));continue;}
    const c=ch++%15,C=c>=9?c+1:c,evs=[{t:0,o:0,b:[0xFF,0x03,...vlq(str(inst).length),...str(inst)]},{t:0,o:0,b:[0xC0|C,GM[inst]??0]}];
    for(const e of list){const ns=e.ns||(e.n!=null?[e.n]:[]),t0=tick(e.t),t1=Math.max(t0+6,tick(e.t+(e.d||1))),v=Math.max(1,Math.min(127,Math.round((e.v??1)*100)));
      for(const n of ns){if(n<0||n>127)continue;evs.push({t:t0,o:2,b:[0x90|C,n,v]},{t:t1,o:1,b:[0x80|C,n,0]});}}
    tracks.push(track(evs));}
  if(drums.length){const evs=[{t:0,o:0,b:[0xFF,0x03,5,...str('drums')]}];for(const e of drums){const n=e.inst==='tom'?Math.max(41,Math.min(50,e.n||45)):GMDRUM[e.inst],t0=tick(e.t),v=Math.max(1,Math.min(127,Math.round((e.v??1)*100)));
      evs.push({t:t0,o:2,b:[0x99,n,v]},{t:t0+T16/2,o:1,b:[0x89,n,0]});}tracks.push(track(evs));}
  const head=[0x4D,0x54,0x68,0x64,0,0,0,6,0,1,(tracks.length>>8)&255,tracks.length&255,(PPQ>>8)&255,PPQ&255];
  return new Uint8Array([...head,...tracks.flat()]);}
// a stored (uncompressed) zip, for hosts that only accept zip downloads
function zipStore(files){const crcT=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0;}),crc=b=>{let c=~0;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return(~c)>>>0;};
  const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255],parts=[],cent=[];let off=0;
  for(const f of files){const nm=new TextEncoder().encode(f.name),c=crc(f.data),h=[...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(f.data.length),...u32(f.data.length),...u16(nm.length),...u16(0),...nm];
    parts.push(new Uint8Array(h),f.data);cent.push(...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(f.data.length),...u32(f.data.length),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off),...nm);off+=h.length+f.data.length;}
  const end=[...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cent.length),...u32(off),...u16(0)];
  return new Blob([...parts,new Uint8Array(cent),new Uint8Array(end)],{type:'application/zip'});}
// hand the file over: inside claude.ai through the downloads capability (zip, since .mid is not on its list); elsewhere a plain download
async function offerMidi(base,bytes,say){const safe=base.replace(/[^A-Za-z0-9 ._-]+/g,'').replace(/\s+/g,' ').trim()||'demoseed';
  if(window.claude&&window.claude.use){let dl=null;try{dl=await window.claude.use('downloads');}catch(e){}
    if(!dl){say('Downloads are not available in this view.');return;}
    try{await dl.save({filename:safe+'.zip',data:zipStore([{name:safe+'.mid',data:bytes}])});say('Saved as a zip with the .mid inside.');}
    catch(e){say(e&&e.code==='declined'?'Download cancelled.':e&&e.code==='rate_limited'?'A download prompt is already open.':'The download could not start here.');}return;}
  const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'})),a=document.createElement('a');a.href=url;a.download=safe+'.mid';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);say('Downloaded '+safe+'.mid');}
