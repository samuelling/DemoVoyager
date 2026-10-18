/* =============================== GENERATE =============================== */
let song,names,vis,seed;
const NOLENS={title:1,credits:1,fire:1,voxel:1,voxship:1,fleet:1};
function genVisuals(sd){
  const R=Rng(hashSeed(sd,3)),th=mkTheme(R);
  const POOL=['plasma','tunnel','roto','fire','voxel','object','bobs','moire','metaballs','twister','kaleido','fleet','voxship','glenz','floor','bump','water','shadebobs','dots'];
  const shuffle=()=>{const a=POOL.slice();for(let i=a.length-1;i>0;i--){const j=R.ri(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};let bag=shuffle();
  const scenes=song.sections.map((sec,i)=>{let type;if(sec.name==='intro')type=R.chance(.5)?'fleet':'title';else if(sec.name==='outro')type='credits';else{if(!bag.length)bag=shuffle();type=bag.pop();}
    const sc=MK[type](R,th,names);sc.trans=i===0?'fade':R.wpick(['flash','fade','slice','cut'],[4,2,2,1]);
    sc.overlay=(type==='title'||type==='credits'||type==='fire')?'none':R.wpick(['scroller','logo','none','lens'],NOLENS[type]?[4,2,2,0]:[3,1,1,3]);
    if(sec.name==='intro'&&type==='fleet')sc.overlay='intro';sc.samp=R.rf(4,14);return sc;});
  const tp1=tp(R,th),tp2=tp(R,th);
  return{scenes,scrollCols:colsN(16,[[255,250,235],bright(cosCol(tp1,.2),220),bright(cosCol(tp1,.55),180),mul(cosCol(tp2,.8),.8)]),logoCols:colsN(8,[[255,255,245],bright(cosCol(tp2,.4),200)])};
}
function generate(sd){
  seed=sd>>>0;names=genNames(seed);song=genSong(seed);vis=genVisuals(seed);
  names.scroll=`${names.group} PRESENTS ${names.title} ...   RELEASED AT ${names.party}, ${names.place} PLACE IN THE PC DEMO COMPO ...   CODE: ${names.code}   MUSIC: ${names.music}   GRAPHICS: ${names.gfx} ...   ${names.boasts[0]} ...   GREETINGS TO ${names.greets.join(', ')} ...   THIS DEMO IS SEED ${hex8(seed)} ...          `;
  curOrder=-1;curRow=-1;
  try{history.replaceState(null,'','#'+hex8(seed));}catch(e){}
}

/* =============================== MAIN LOOP =============================== */
// mode: 'idle' (prompt, waiting for a tap), 'dos' (typing + loading text), 'demo' (playing)
let curOrder=-1,curRow=-1,last=performance.now(),mode='idle',dos=null,dosT0=0;const endless=true;
function onRow(o,r){
  if(o!==curOrder){const sc=vis.scenes[o];if(sc.type==='fire'){FB.fill(0);sc.acc=0;}if(sc.type==='shadebobs')sc.buf.fill(0);if(sc.type==='water'){sc.b1.fill(0);sc.b2.fill(0);}}
  curOrder=o;curRow=r;const row=song.pats[song.sections[o].pat][r];
  for(let c=0;c<CH;c++){const cl=row[c];if(cl.n>0){en[c]=cl.fx===0xC?Math.max(.25,cl.p/64):1;if(c<2&&cl.i===1)beatT=T;if(c<2&&cl.i===2)snareT=T;}}
}
function runDos(first,sd){generate(sd);dos=dosTimeline(dosScript(first));dosT0=performance.now();mode='dos';}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(mode==='test')return;if(mode==='idle'){drawDos(dos,.3);return;}
  if(mode==='dos'){if(!drawDos(dos,(now-dosT0)/1000)){mode='demo';startAt(0);}return;}
  let o,r,frac;const at=ac.currentTime;while(queue.length>1&&queue[1].time<=at)queue.shift();const q=queue[0];
  if(q&&q.end&&q.time<=at){stopAudio();runDos(false,hashSeed(seed,777));return;}
  if(q&&!q.end&&q.time<=at){o=q.order;r=q.row;frac=Math.min(1,(at-q.time)/q.rd);}else{o=Math.max(0,curOrder);r=Math.max(0,curRow);frac=0;}
  if(!(o>=0&&o<song.sections.length))o=0;if(!(r>=0&&r<ROWS))r=0;
  if(o!==curOrder||r!==curRow)onRow(o,r);
  for(let c=0;c<CH;c++)en[c]*=Math.pow(c<2?.02:.15,dt);
  const rd=rowDur(),pt=(r+frac)*rd,sc=vis.scenes[o];
  if(DRAW[sc.type](sc,pt,dt))flush();
  if(sc.overlay==='lens')lensFX();
  if(sc.overlay==='scroller'||sc.overlay==='lens')scroller(names.scroll,vis.scrollCols,sc.samp);
  else if(sc.overlay==='logo'){const t=names.title,s2=fitSc(t,2);drawText(t,cxText(t,s2),(10+Math.abs(Math.sin(T*2.2))*8)|0,s2,vis.logoCols,true);}
  else if(sc.overlay==='intro'){const g=names.group,t=names.title,s1=fitSc(g,2),s2=fitSc(t,3);if(pt>1&&pt<4)drawText(g,cxText(g,s1),14,s1,vis.logoCols,true);if(pt>4.2)drawText(t,cxText(t,s2),12,s2,vis.scrollCols.subarray(4,12),true);}
  if(pt<.35){const u=pt/.35;
    if(sc.trans==='flash'){const k=(1-u)*.85;for(let i=0;i<N;i++){const c=out[i];out[i]=rgb((c&255)+(255-(c&255))*k,((c>>8)&255)+(255-((c>>8)&255))*k,((c>>16)&255)+(255-((c>>16)&255))*k);}}
    else if(sc.trans==='fade'){for(let i=0;i<N;i++){const c=out[i];out[i]=rgb((c&255)*u,((c>>8)&255)*u,((c>>16)&255)*u);}}
    else if(sc.trans==='slice'){const amp=(1-u)*60;for(let y=0;y<H;y++){const sh=((Math.sin(y*12.9898+o*7.1)*43758.5453%1)*amp)|0;if(!sh)continue;const row=y*W;for(let x=0;x<W;x++)tmpRow[x]=out[row+((x+sh+W*4)%W)];out.set(tmpRow,row);}}}
  cx.putImageData(img,0,0);
}

/* =============================== CONTROLS =============================== */
// tap/click/space: start; during the prompt: skip to the demo; during a demo: next demo. F: fullscreen
function act(){
  if(mode==='idle'){try{initAudio();ac.resume&&ac.resume();}catch(e){}mode='dos';dosT0=performance.now();try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{});}catch(e){}}
  else if(mode==='dos'){mode='demo';startAt(0);}
  else{stopAudio();runDos(false,hashSeed(seed,777));}
}
cv.addEventListener('click',act);
addEventListener('keydown',e=>{if(e.code==='KeyF'){try{document.fullscreenElement?document.exitFullscreen():cv.requestFullscreen();}catch(_){}}else if(e.code==='Space'||e.code==='Enter'||e.code==='KeyN'){e.preventDefault();act();}});

/* =============================== BOOT =============================== */
buildFont();
const hm=/^#?([0-9a-fA-F]{1,8})$/.exec(location.hash||'');
runDos(true,hm?parseInt(hm[1],16)>>>0:(Math.random()*4294967296)>>>0);mode='idle';
if(/test/.test(location.search))window.__ds={generate,get song(){return song;},get vis(){return vis;},get mode(){return mode;},act,test:()=>{mode="test";stopAudio();},DRAW,setPos:(o,r)=>{curOrder=-1;onRow(o,r);},drawScene:(o,pt)=>{const sc=vis.scenes[o];if(DRAW[sc.type](sc,pt,1/60))flush();if(sc.overlay==='lens')lensFX();cx.putImageData(img,0,0);}};
requestAnimationFrame(frame);
