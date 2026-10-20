/* Tier harness for 400K / 4M / 40M: seed -> names, song, score(L) -> synth + conductor; a visual engine draws one scene per section.
   Reports what it generates (bytes) to the parent page, plays endlessly (next seed = hash of the current one). */
function runTier(cfg){
  const cv=document.getElementById('c'),ov=document.getElementById('o'),x=ov.getContext('2d');
  let meterItems={},ac=null,synth=null,cond=null,demo=null,vis=null,state='idle',fade=0;
  const meter=(label,bytes)=>{meterItems[label]=(meterItems[label]||0)+bytes;};
  const report=()=>{const total=Object.values(meterItems).reduce((a,b)=>a+b,0);try{parent.postMessage({demoseed:1,tier:cfg.tier,generated:total,items:meterItems,seed:demo&&hex8(demo.seed),title:demo&&demo.names.title,group:demo&&demo.names.group,state,free,sound:ac?ac.state:null,budget:cfg.budget||0,form:demo&&demo.score.secs.map(s=>[s.name,s.len]),bpm:demo&&demo.song.bpm,pos:cond&&state==='play'?cond.pos().row:0,rows:demo&&demo.score.rows},'*');}catch(e){}};
  const resize=()=>{const dpr=Math.min(cfg.maxDpr||2,window.devicePixelRatio||1),w=innerWidth,h=innerHeight;
    const ar=cfg.aspect||16/9;let W=w,H=w/ar;if(H>h){H=h;W=h*ar;}
    const rw=cfg.fixedW||Math.round(W*dpr),rh=cfg.fixedW?Math.round(cfg.fixedW/ar):Math.round(H*dpr);
    cv.width=rw;cv.height=rh;Object.assign(cv.style,{width:W+'px',height:H+'px',left:(w-W)/2+'px',top:(h-H)/2+'px'});
    ov.width=Math.round(W*dpr);ov.height=Math.round(H*dpr);Object.assign(ov.style,{width:W+'px',height:H+'px',left:(w-W)/2+'px',top:(h-H)/2+'px'});vis&&vis.resize&&vis.resize(rw,rh);};
  addEventListener('resize',resize);
  vis=cfg.makeVisuals(cv,meter);if(!vis){x.fillStyle='#fff';x.fillText('This tier needs WebGL.',20,40);return;}
  resize();
  const hm=/^#?([0-9a-fA-F]{1,8})(-free)?/.exec(location.hash||'');let seed=hm?parseInt(hm[1],16)>>>0:(Math.random()*4294967296)>>>0;const free=!!(hm&&hm[2]);
  function build(sd){meterItems={};const names=genNames(sd),song=genSong(sd),score=free?arrangeFree(song,cfg.L):arrange(song,cfg.L);
    const n=names;n.scroll=`${n.group} PRESENTS ${n.title}  ·  CODE ${n.code}  ·  MUSIC ${n.music}  ·  GRAPHICS ${n.gfx}  ·  GREETINGS TO ${n.greets.join(' · ')}  ·  SEED ${hex8(sd)}  ·  `;
    const R=Rng(hashSeed(sd,13)),pool=cfg.pool.slice();let bag=[];
    const used=[],last=score.secs.length-1,scenes=score.secs.map((s,i)=>{if(i===0)return cfg.intro;if(i===last)return cfg.outro;if(s.sg!==undefined&&i>1&&score.secs[i-1].sg===s.sg)return null; // phrases of one section share its scene
      const prev=used[used.length-1],cand=cfg.sceneFor&&cfg.sceneFor(s.role||s.name);if(cand){let ok=cand.filter(c=>!used.includes(c)&&c!==prev);if(!ok.length)ok=cand.filter(c=>c!==prev);const pk=R.pick(ok.length?ok:cand);used.push(pk);return pk;}
      if(!bag.length){bag=pool.slice();for(let i=bag.length-1;i>0;i--){const j=R.ri(0,i);[bag[i],bag[j]]=[bag[j],bag[i]];}}const pk=bag.pop();used.push(pk);return pk;});for(let i=1;i<scenes.length;i++)if(scenes[i]===null)scenes[i]=scenes[i-1];
    return{seed:sd,names,song,score,scenes};}
  function start(sd){
    demo=build(sd);try{history.replaceState(null,'','#'+hex8(sd)+(free?'-free':''));}catch(e){}
    vis.setup(demo,meter);
    if(synth)synth.stop();if(cond)cond.stop();
    synth=makeSynth(ac,cfg.L,sd,meter);synth.setTempo(demo.song.bpm);cond=Conductor(ac,demo.song,demo.score,synth.play,null);cond.start(ac.currentTime+.15);
    state='play';fade=0;report();
  }
  const act=()=>{if(ac&&ac.state==='suspended'){ac.resume();return;}if(state==='idle'){const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();ac.resume&&ac.resume();start(seed);}else if(state==='play')next();};
  const next=()=>{if(state!=='play')return;state='fadeout';fade=performance.now();};
  cv.parentElement.addEventListener('click',act);
  addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'||e.code==='KeyN'){e.preventDefault();act();}else if(e.code==='KeyF'){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch(_){}}});
  let shown=true; // the player tells us when the stage is scrolled out of view; then we stop drawing and leave the CPU to the audio
  addEventListener('message',e=>{if(e.data&&e.data.demoseedCmd==='visible')shown=!!e.data.v;if(e.data&&e.data.demoseedCmd==='next')next();else if(e.data&&e.data.demoseedCmd==='start'&&state==='idle')act();});
  let last=performance.now(),T=0;
  function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
    if(state==='test')return;const W=ov.width,H=ov.height;if(shown||state==='idle')x.clearRect(0,0,W,H);
    if(state==='idle'){vis.idle(T);cfg.idleText(x,W,H,T,seed);return;}
    const s=cond.pos();s.T=T;s.dt=dt;s.scene=demo.scenes[s.sec];s.role=s.sec===0?'intro':s.sec===demo.scenes.length-1?'outro':'body';s.names=demo.names;
    if(s.done&&state==='play')next();
    let k=1;if(state==='fadeout'){k=1-Math.min(1,(now-fade)/900);if(k<=0){start(hashSeed(demo.seed,777));return;}synth.master.gain.setTargetAtTime(.6*k,ac.currentTime,.05);}
    if(s.t<.6)k*=Math.max(0,s.t/.6);
    if(shown){vis.draw(s,k);cfg.overlay(x,W,H,s,demo,k);}
    // the browser kept the audio suspended (auto-start without a click in this frame): ask, in the tier's own period style
    if(ac.state==='suspended'){x.save();cfg.soundPrompt(x,W,H,T);x.restore();}
    if((T*8|0)!==((T-dt)*8|0))report();
  }
  requestAnimationFrame(frame);report();
  if(/test/.test(location.search))window.__tier={get demo(){return demo;},get ac(){return ac;},get meter(){return meterItems;},vis,act,next,drawAt:(sec,secT,dt)=>{const S=demo.score.secs[sec],row=S.start+secT/(15/demo.song.bpm),s={t:secT,row,sec,secT,secLen:S.len*15/demo.song.bpm,name:S.name,kind:S.role||S.name,role:sec===0?'intro':sec===demo.scenes.length-1?'outro':'body',kick:.5,snare:.3,lead:.5,T:secT,dt:dt||1/60,scene:demo.scenes[sec],prog:(row-S.start)/S.len,names:demo.names};vis.draw(s,1);x.clearRect(0,0,ov.width,ov.height);cfg.overlay(x,ov.width,ov.height,s,demo,1);},stopAudio:()=>{cond&&cond.stop();state='test';}};
}
