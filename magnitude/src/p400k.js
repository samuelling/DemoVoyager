/* 400K tier page: era 2003. */
const speaker=(x,cx,cy,r,waves,lw)=>{x.beginPath();x.moveTo(cx-r,cy-r*.35);x.lineTo(cx-r*.45,cy-r*.35);x.lineTo(cx+r*.1,cy-r*.85);x.lineTo(cx+r*.1,cy+r*.85);x.lineTo(cx-r*.45,cy+r*.35);x.lineTo(cx-r,cy+r*.35);x.closePath();x.fill();
  x.lineWidth=lw;x.lineCap='round';for(let i=0;i<waves;i++){x.beginPath();x.arc(cx+r*.15,cy,r*(.55+i*.4),-.75,.75);x.stroke();}};
runTier({tier:'400K',
  soundPrompt(x,W,H,T){const u=H/430,w=440*u,h=170*u,X=(W-w)/2,Y=(H-h)/2,F=`${13*u|0}px Tahoma, Verdana, sans-serif`;x.fillStyle='rgba(0,0,20,.55)';x.fillRect(0,0,W,H);
    x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=18*u;x.shadowOffsetY=6*u;x.fillStyle='#ece9d8';x.fillRect(X,Y,w,h);x.shadowColor='transparent';
    const g=x.createLinearGradient(0,Y,0,Y+30*u);g.addColorStop(0,'#3d95ff');g.addColorStop(.12,'#0a5ee8');g.addColorStop(1,'#0548c4');x.fillStyle=g;x.fillRect(X,Y,w,30*u);
    x.fillStyle='#fff';x.font=`bold ${F}`;x.textAlign='left';x.textBaseline='middle';x.fillText('Demoseed 400K',X+12*u,Y+15*u);
    x.fillStyle='#d9573b';x.fillRect(X+w-28*u,Y+5*u,21*u,20*u);x.strokeStyle='#fff';x.lineWidth=2*u;x.beginPath();x.moveTo(X+w-23*u,Y+10*u);x.lineTo(X+w-12*u,Y+21*u);x.moveTo(X+w-12*u,Y+10*u);x.lineTo(X+w-23*u,Y+21*u);x.stroke();
    x.fillStyle='#2a5bd7';x.strokeStyle='#2a5bd7';speaker(x,X+48*u,Y+76*u,20*u,(T*3|0)%4,3*u);
    x.fillStyle='#000';x.font=F;x.fillText('Sound is switched off.',X+92*u,Y+66*u);x.fillText('Click anywhere to turn it on.',X+92*u,Y+86*u);
    const bx=X+w/2-40*u,by=Y+h-44*u;x.fillStyle='#f4f3ee';x.fillRect(bx,by,80*u,26*u);x.strokeStyle='#003c74';x.lineWidth=1.5*u;x.strokeRect(bx,by,80*u,26*u);
    if((T*2|0)%2){x.strokeStyle='#e8a33c';x.lineWidth=2*u;x.strokeRect(bx+2*u,by+2*u,76*u,22*u);}x.setLineDash([u,u]);x.strokeStyle='#000';x.lineWidth=u;x.strokeRect(bx+5*u,by+5*u,70*u,16*u);x.setLineDash([]);
    x.fillStyle='#000';x.textAlign='center';x.fillText('OK',bx+40*u,by+13*u);x.strokeStyle='#0a246a';x.lineWidth=u;x.strokeRect(X,Y,w,h);},L:1,aspect:4/3,fixedW:800,maxDpr:1,
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
