/* 400K tier page: era 2003. */
runTier({tier:'400K',L:1,aspect:4/3,fixedW:800,maxDpr:1,
  intro:'title',outro:'credits',pool:['tunnel','fleet','city','particles','terrain'],
  makeVisuals:vis400k,
  idleText(x,W,H,T,seed){x.fillStyle='#000';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#9fb4ff';x.font=`bold ${H*.07|0}px Tahoma, Verdana, sans-serif`;x.fillText('DEMOSEED 400K',W/2,H*.42);
    x.fillStyle='#8890a8';x.font=`${H*.035|0}px Tahoma, Verdana, sans-serif`;x.fillText('2003 · hardware 3D · softsynth · seed '+hex8(seed),W/2,H*.5);if((T*2|0)%2)x.fillText('click to start',W/2,H*.6);},
  overlay(x,W,H,s,demo,k){const n=demo.names;x.globalAlpha=k;x.textAlign='center';
    if(s.role==='outro'){const L=['CODE',n.code,'','MUSIC',n.music,'','GRAPHICS',n.gfx,'','GREETINGS',...n.greets,'','SEED '+hex8(demo.seed)],lh=H*.06,y0=H-s.secT*H*.09;
      x.font=`bold ${H*.045|0}px Tahoma, Verdana, sans-serif`;L.forEach((l,i)=>{const y=y0+i*lh;if(y<-lh||y>H+lh)return;x.fillStyle=/^[A-Z]+$/.test(l)&&['CODE','MUSIC','GRAPHICS','GREETINGS'].includes(l)?'#9fb4ff':'#fff';x.shadowColor='#36f';x.shadowBlur=12;x.fillText(l,W/2,y);});x.shadowBlur=0;}
    else if(s.role!=='intro'){x.font=`bold ${H*.04|0}px Tahoma, Verdana, sans-serif`;x.textAlign='left';const tw=x.measureText(n.scroll).width,px=W-(s.T*W*.18)%(tw+W);
      x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,H*.9,W,H*.07);x.fillStyle='#fff';x.fillText(n.scroll,px,H*.947);}
    x.globalAlpha=1;}});
