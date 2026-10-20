/* 4M tier page: era 2012. Clean sans typography, section captions, credits as fading cards. */
const F4=(w,px)=>`${w} ${px|0}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
const speaker=(x,cx,cy,r,waves,lw)=>{x.beginPath();x.moveTo(cx-r,cy-r*.35);x.lineTo(cx-r*.45,cy-r*.35);x.lineTo(cx+r*.1,cy-r*.85);x.lineTo(cx+r*.1,cy+r*.85);x.lineTo(cx-r*.45,cy+r*.35);x.lineTo(cx-r,cy+r*.35);x.closePath();x.fill();
  x.lineWidth=lw;x.lineCap='round';for(let i=0;i<waves;i++){x.beginPath();x.arc(cx+r*.15,cy,r*(.55+i*.4),-.75,.75);x.stroke();}};
runTier({tier:'4M',
  soundPrompt(x,W,H,T){x.fillStyle='rgba(4,6,10,.62)';x.fillRect(0,0,W,H);const cx=W/2,cy=H*.44,r=H*.11,b=.5+.5*Math.sin(T*2.4);
    x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=Math.max(1,H*.003);x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();
    x.strokeStyle=`rgba(255,255,255,${.35*(1-b)})`;x.beginPath();x.arc(cx,cy,r*(1+b*.45),0,7);x.stroke();
    x.fillStyle='#fff';x.strokeStyle='#fff';speaker(x,cx-r*.12,cy,r*.4,2,Math.max(1,H*.004));
    x.textAlign='center';x.textBaseline='middle';try{x.letterSpacing=(H*.014|0)+'px';}catch(e){}x.font=F4(200,H*.045);x.fillText('CLICK FOR SOUND',cx,cy+r*1.75);
    try{x.letterSpacing=(H*.006|0)+'px';}catch(e){}x.fillStyle='rgba(255,255,255,.55)';x.font=F4(300,H*.022);x.fillText('YOUR BROWSER IS HOLDING THE AUDIO',cx,cy+r*2.35);try{x.letterSpacing='0px';}catch(e){}},L:2,aspect:16/9,fixedW:800,maxDpr:1,budget:4*1048576,
  intro:'title',outro:'credits',pool:['terrain','fractal','corridor','blobs','cubes','tunnel'],
  // the form chooses the scene: builds run forward, drops hit hard, quiet sections breathe
  sceneFor:n=>/build|bridge/.test(n)?['corridor','tunnel']:/drop|climax/.test(n)?['cubes','fractal','tunnel']:/break|verse|state|ret|development|variation/.test(n)?['terrain','blobs','fractal','cubes']:null,
  makeVisuals:vis4m,
  idleText(x,W,H,T,seed){x.fillStyle='#050608';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#eef';
    try{x.letterSpacing=(H*.02|0)+'px';}catch(e){}x.font=F4(200,H*.09);x.fillText('DEMOSEED 4M',W/2,H*.44);
    try{x.letterSpacing=(H*.006|0)+'px';}catch(e){}x.fillStyle='#8a90a0';x.font=F4(300,H*.03);x.fillText('2012  ·  RAYMARCHING  ·  BIG-ROOM SYNTHS  ·  SEED '+hex8(seed),W/2,H*.52);
    x.globalAlpha=.5+.5*Math.sin(T*3);x.fillText('CLICK TO START',W/2,H*.64);x.globalAlpha=1;try{x.letterSpacing='0px';}catch(e){}},
  overlay(x,W,H,s,demo,k){const n=demo.names,ls=v=>{try{x.letterSpacing=v;}catch(e){}};x.textAlign='center';x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=H*.02;
    const fade=(a,b,t)=>Math.max(0,Math.min(1,(t-a)/.8,(b-t)/.8));
    if(s.role==='intro'){const L=s.secLen,t=s.secT;
      x.globalAlpha=k*fade(.5,L*.45,t);ls((H*.012|0)+'px');x.fillStyle='#fff';x.font=F4(300,H*.035);x.fillText(n.group,W/2,H*.47);x.font=F4(200,H*.025);x.fillText('PRESENTS',W/2,H*.53);
      x.globalAlpha=k*fade(L*.5,L+5,t);ls((H*.03|0)+'px');x.font=F4(100,H*.11);x.fillText(n.title,W/2,H*.53);}
    else if(s.role==='outro'){const L=[['CODE',n.code],['MUSIC',n.music],['GRAPHICS',n.gfx],['GREETINGS',n.greets.slice(0,3).join('  ·  ')],['',n.greets.slice(3).join('  ·  ')],['SEED',hex8(demo.seed)]],per=s.secLen/L.length,i=Math.min(L.length-1,s.secT/per|0),c=L[i];
      x.globalAlpha=k*fade(i*per,(i+1)*per,s.secT);ls((H*.012|0)+'px');x.fillStyle='#aab';x.font=F4(300,H*.028);x.fillText(c[0],W/2,H*.45);ls((H*.006|0)+'px');x.fillStyle='#fff';x.font=F4(200,H*.06);x.fillText(c[1],W/2,H*.54);}
    else{x.textAlign='left';const a=fade(.3,4,s.secT);x.globalAlpha=k*a;ls((H*.01|0)+'px');x.fillStyle='#fff';x.font=F4(200,H*.022);
      x.fillText(String(s.sec).padStart(2,'0')+'  /  '+s.name.toUpperCase(),W*.05,H*.92);x.globalAlpha=k*.55;x.font=F4(300,H*.018);x.fillText(n.title+'  ·  '+n.group,W*.05,H*.08);
      // section progress hairline
      x.globalAlpha=k*.35;x.fillStyle='#fff';x.fillRect(W*.05,H*.94,W*.2*Math.min(1,Math.max(0,s.prog)),Math.max(1,H*.002));}
    ls('0px');x.shadowBlur=0;x.globalAlpha=1;}});
