/* 40M tier page: era 2026. Tight grotesk display type, monospace metadata, the whole form drawn as a timeline. */
const SANS='system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',MONO='ui-monospace, "SF Mono", Menlo, Consolas, monospace';
runTier({tier:'40M',
  soundPrompt(x,W,H,T){x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,W,H);const w=W*.42,h=H*.3,X=(W-w)/2,Y=(H-h)/2,r=H*.03;
    x.beginPath();x.roundRect?x.roundRect(X,Y,w,h,r):x.rect(X,Y,w,h);x.fillStyle='rgba(28,28,34,.82)';x.fill();x.strokeStyle='rgba(255,255,255,.16)';x.lineWidth=1;x.stroke();
    const bw=H*.014,bx=X+h*.32,by=Y+h*.5;x.fillStyle='#fff';for(let i=0;i<5;i++){const a=.25+.75*Math.abs(Math.sin(T*(3+i*.7)+i*1.9));const bh=h*.36*a;x.beginPath();x.roundRect?x.roundRect(bx+i*bw*1.9-bw/2,by-bh/2,bw,bh,bw/2):x.rect(bx+i*bw*1.9-bw/2,by-bh/2,bw,bh);x.fill();}
    const tx=X+h*.32+bw*9.5+h*.12;x.textAlign='left';x.textBaseline='alphabetic';x.font=`600 ${H*.058|0}px ${SANS}`;try{x.letterSpacing=(-H*.002|0)+'px';}catch(e){}x.fillText('Click for sound',tx,by+H*.005);try{x.letterSpacing='0px';}catch(e){}
    x.fillStyle='#a6a6b2';x.font=`${H*.022|0}px ${MONO}`;x.fillText('audio paused by the browser',tx,by+H*.05);},L:3,aspect:16/9,fixedW:1024,maxDpr:1,budget:40*1048576,
  intro:'title',outro:'credits',pool:['fluid','swarm','rd','nebula'],
  // the movement decides the simulation: themes get the two "characters", development grows, the build accelerates, the climax explodes
  sceneFor:n=>/theme A/.test(n)?['swarm','fluid']:/theme B/.test(n)?['fluid','swarm']:/development/.test(n)?['rd']:/build/.test(n)?['nebula']:/climax/.test(n)?['swarm']:null,
  makeVisuals:vis40m,
  idleText(x,W,H,T,seed){x.fillStyle='#000';x.fillRect(0,0,W,H);x.textAlign='left';x.fillStyle='#fff';x.font=`700 ${H*.1|0}px ${SANS}`;try{x.letterSpacing=(-H*.004|0)+'px';}catch(e){}
    x.fillText('Demoseed 40M',W*.08,H*.5);try{x.letterSpacing='0px';}catch(e){}x.fillStyle='#8c8c96';x.font=`${H*.026|0}px ${MONO}`;
    x.fillText('2026 / gpu simulation / physical modelling / seed '+hex8(seed).toLowerCase(),W*.08,H*.58);x.fillStyle='#fff';x.globalAlpha=.5+.5*Math.sin(T*3);x.fillText('▶ click to start',W*.08,H*.66);x.globalAlpha=1;},
  overlay(x,W,H,s,demo,k){const n=demo.names,song=demo.song,secs=demo.score.secs,fade=(a,b,t)=>Math.max(0,Math.min(1,(t-a)/.8,(b-t)/.8));x.textAlign='left';
    const m=W*.05;x.font=`${H*.022|0}px ${MONO}`;
    if(s.role==='intro'){x.globalAlpha=k*fade(.4,s.secLen*.7,s.secT);x.fillStyle='#fff';x.fillText(n.group.toLowerCase()+' presents',m,H*.1);}
    else if(s.role==='outro'){const L=[['code',n.code],['music',n.music],['graphics',n.gfx],['greetings',n.greets.join(', ')],['seed',hex8(demo.seed).toLowerCase()]],per=s.secLen/L.length,i=Math.min(L.length-1,s.secT/per|0);
      x.globalAlpha=k*fade(i*per,(i+1)*per,s.secT);x.fillStyle='#9a9aa6';x.fillText(L[i][0],m,H*.8);x.fillStyle='#fff';x.font=`600 ${H*.045|0}px ${SANS}`;x.fillText(L[i][1],m,H*.87);}
    else{x.globalAlpha=k*fade(.3,5,s.secT);x.fillStyle='#fff';x.font=`600 ${H*.045|0}px ${SANS}`;x.fillText(s.name.replace(/^./,c=>c.toUpperCase()),m,H*.84);
      x.font=`${H*.022|0}px ${MONO}`;x.fillStyle='#b8b8c4';x.fillText(`${String(s.sec).padStart(2,'0')} / ${song.bpm} bpm / ${song.desc.key.toLowerCase()} / ${s.scene}`,m,H*.885);}
    // the whole form as a timeline: one segment per section, width = length, the current one filling
    x.globalAlpha=k*.8;const tw=W-2*m,y=H*.94,hh=Math.max(2,H*.004);let px=m;
    for(let i=0;i<secs.length;i++){const w=secs[i].len/demo.score.rows*tw-3;x.fillStyle='rgba(255,255,255,.22)';x.fillRect(px,y,w,hh);
      if(i<s.sec)x.fillStyle='rgba(255,255,255,.7)';if(i<=s.sec){x.fillStyle='#fff';x.fillRect(px,y,i<s.sec?w:w*Math.max(0,Math.min(1,s.prog)),hh);}px+=w+3;}
    x.globalAlpha=1;}});
