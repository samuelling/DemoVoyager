/* 8x8 glyphs (ASCII 32-126) rasterized from Press Start 2P, (c) 2012 The Press Start 2P Project Authors, SIL Open Font License 1.1 */
function buildFont(){const d=atob("AAAAAAAAAAA4ODgwMAAwAGxsbAAAAAAAbP5sbGz+bAAQfNB8FvwQAGKkyBAmSowAcNjYcNrMfgAwMDAAAAAAAAwYMDAwGAwAYDAYGBgwYAAAbDj+OGwAAAAYGH4YGAAAAAAAAAAwMGAAAAB+AAAAAAAAAAAAMDAAAgQIECBAgAA4TMbGxmQ4ABg4GBgYGH4AfMYOPHjg/gB+DBg8BsZ8ABw8bMz+DAwA/MD8BgbGfAA8YMD8xsZ8AP7GDBgwMDAAeMTkeJ6GfAB8xsZ+Bgx4AAAwMAAwMAAAADAwADAwYAAMGDBgMBgMAAAA/gD+AAAAYDAYDBgwYAB8/sYMOAA4AHyCuqq+gHwAOGzGxv7GxgD8xsb8xsb8ADxmwMDAZjwA+MzGxsbM+AD+wMD8wMD+AP7AwPzAwMAAPmDAzsZmPgDGxsb+xsbGAH4YGBgYGH4ABgYGBgbGfADGzNjw+NzOAGBgYGBgYH4Axu7+1tbGxgDG5vbezsbGAHzGxsbGxnwA/MbGxvzAwAB8xsbG3sx6APzGxs743M4AfMbAfAbGfAB+GBgYGBgYAMbGxsbGxnwAxsbG7nw4EADW1tbW/u5EAMbGbDhsxsYAZmZmPBgYGAD+Dhw4cOD+ADwwMDAwMDwAgEAgEAgEAgB4GBgYGBh4ADhsAAAAAAAAAAAAAAAAAP4QCAAAAAAAAAAAfAZ+xn4AwMD8xsbGfAAAAH7AwMB+AAYGfsbGxn4AAAB8xv7AfAAOGH4YGBgYAAAAfsbGfgZ8wMD8xsbGxgAYADgYGBh+AAwAHAwMDAx4wMDGzPjMxgA4GBgYGBh+AAAA/La2trYAAAD8xsbGxgAAAHzGxsZ8AAAA/MbG/MDAAAB+xsZ+BgYAAG5wYGBgAAAAfMB8BvwAGBh+GBgYGAAAAMbGxsZ+AAAAZmZmPBgAAADW1tbWbAAAAMZsOGzGAAAAxsbGfgZ8AAD+HDhw/gAMGBgwGBgMABgYGBgYGBgAYDAwGDAwYAAAAHC6HAAAAA==");for(let k=0;k<95;k++)for(let y=0;y<8;y++){const v=d.charCodeAt(k*8+y);for(let x=0;x<8;x++)GL[k*64+y*8+x]=v>>7-x&1;}}
/* =============================== NEW 90s SCENES =============================== */
// --- generated spaceships: lathed hull from seeded cross-sections, wings, tail fin, glowing engine cap
function shipMesh(R,big){
  const n=R.ri(4,6),sd=R.pick([3,4,4,5,6,8]),fl=R.rf(.35,.8),wx=R.rf(.8,1.3),r0=sd===4?Math.PI/4:Math.PI/2,rings=[],V=[[0,0,2.5]],F=[];
  for(let i=0;i<n;i++){const u=i/(n-1);rings.push([1.9-u*3.4,(i?R.rf(.3,.75):R.rf(.12,.3))*(1-.35*u)]);}
  rings.forEach(([z,r])=>{for(let j=0;j<sd;j++){const a=r0+j/sd*2*Math.PI;V.push([Math.cos(a)*r*wx,Math.sin(a)*r*fl,z]);}});
  const tl=V.length,rg=(i,j)=>1+i*sd+((j%sd+sd)%sd);V.push([0,0,rings[n-1][0]-.15]);
  for(let j=0;j<sd;j++)F.push([0,rg(0,j+1),rg(0,j),0],[tl,rg(n-1,j),rg(n-1,j+1),1]);
  for(let i=0;i<n-1;i++)for(let j=0;j<sd;j++)F.push([rg(i,j),rg(i,j+1),rg(i+1,j+1),0],[rg(i,j),rg(i+1,j+1),rg(i+1,j),0]);
  const k=R.ri(1,n-2),[wz,wr]=rings[k],sp=R.rf(1.1,2.6),sw=R.rf(.4,1.6),dh=R.rf(-.3,.4);
  for(const s of [-1,1]){const a=V.length;V.push([s*wr*wx*.9,0,wz+.5],[s*(wr*wx+sp),dh,wz-sw],[s*wr*wx*.9,0,wz-.7]);F.push([a,a+1,a+2,0]);}
  if(R.chance(.6)){const a=V.length,[tz,tr]=rings[n-1];V.push([0,tr*fl,tz+.7],[0,tr*fl+R.rf(.5,1),tz-.3],[0,tr*fl,tz-.1]);F.push([a,a+1,a+2,0]);}
  return{V,F,sc:big?R.rf(2.5,4):1};
}
const SHL=norm3([-.4,.7,-.6]);
function drawShips(list,base,span){
  const fc=[];
  for(const [m,ox,oy,oz,yw,pi,rl] of list){
    const cy=Math.cos(yw),sy=Math.sin(yw),cp=Math.cos(pi),sp=Math.sin(pi),cr=Math.cos(rl),sr=Math.sin(rl),s=m.sc;
    const P=m.V.map(([a,b,c])=>{a*=s;b*=s;c*=s;let x=a*cr-b*sr,y=a*sr+b*cr,z=c,y2=y*cp-z*sp;z=y*sp+z*cp;y=y2;const x2=x*cy+z*sy;z=z*cy-x*sy;return[x2+ox,y+oy,z+oz];});
    for(const [a,b,c,g] of m.F){const A=P[a],B=P[b],C=P[c];if(A[2]<.4||B[2]<.4||C[2]<.4)continue;
      const n=norm3(cross3([B[0]-A[0],B[1]-A[1],B[2]-A[2]],[C[0]-A[0],C[1]-A[1],C[2]-A[2]]));
      fc.push([A[2]+B[2]+C[2],g?255:base+(.2+.8*Math.abs(n[0]*SHL[0]+n[1]*SHL[1]+n[2]*SHL[2]))*span,A,B,C]);}}
  fc.sort((p,q)=>q[0]-p[0]);
  const pr=v=>[160+v[0]/v[2]*230,100-v[1]/v[2]*192];
  for(const [,l,A,B,C] of fc){const a=pr(A),b=pr(B),c=pr(C);tri(a[0],a[1],l,b[0],b[1],l,c[0],c[1],l);}
}
function planet(px,py,r,base,span,bands){for(let y=Math.max(0,py-r/1.2|0);y<Math.min(H,py+r/1.2);y++)for(let x=Math.max(0,px-r|0);x<Math.min(W,px+r);x++){
  const dx=(x-px)/r,dy=(y-py)*1.2/r,d=dx*dx+dy*dy;if(d>=1)continue;const nz=Math.sqrt(1-d),l=Math.max(0,-.55*dx-.5*dy+.67*nz)+bands*Math.sin(dy*9+dx*2);ib[y*W+x]=base+Math.max(0,Math.min(1,l*.9+.06))*span;}}
function shipPal(R,th,P){const c=cosCol(tp(R,th),R.f());gradTo(P,128,127,[st(0,mul(c,.12)),st(.6,mixW(mul(c,.8),.25)),st(1,[250,250,255])]);P[255]=rgbA(mixW(bright(cosCol(tp(R,th),R.f()),230),.4));}

/* --- glenz: OR-blended translucent stellated cube over a checker */
function triOr(ax,ay,bx,by,cx2,cy,v){let t;if(ay>by){t=ax;ax=bx;bx=t;t=ay;ay=by;by=t;}if(ay>cy){t=ax;ax=cx2;cx2=t;t=ay;ay=cy;cy=t;}if(by>cy){t=bx;bx=cx2;cx2=t;t=by;by=cy;cy=t;}
  const dAC=cy-ay;if(dAC<=0)return;for(let y=Math.max(0,Math.ceil(ay));y<=Math.min(H-1,Math.ceil(cy)-1);y++){const u=(y-ay)/dAC;let xa=ax+(cx2-ax)*u,xb=y<by?ax+(bx-ax)*((y-ay)/(by-ay||1)):bx+(cx2-bx)*((y-by)/(cy-by||1));
  if(xa>xb){t=xa;xa=xb;xb=t;}const row=y*W;for(let x=Math.max(0,Math.ceil(xa));x<=Math.min(W-1,Math.ceil(xb)-1);x++)ib[row+x]|=v;}}
const GZ=(()=>{const c=[],T=[];for(let i=0;i<8;i++)c.push([i&1?1:-1,i&2?1:-1,i&4?1:-1]);const fs=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
  fs.forEach((f,k)=>{const ce=[0,1,2].map(a=>f.reduce((s,i)=>s+c[i][a],0)/4);for(let j=0;j<4;j++)T.push([c[f[j]],c[f[(j+1)%4]],ce,(k+j)&1]);});return T;})();

/* --- 2D bump map height field */
function bumpMap(R,nm){const g=document.createElement('canvas');g.width=W;g.height=H;const k=g.getContext('2d',{willReadFrequently:true});k.fillStyle='#fff';k.textAlign='center';k.textBaseline='middle';
  const w=R.chance(.5)?nm.group:nm.title;k.font='60px '+FACE;const fw=k.measureText(w).width;k.font=Math.min(60,60*290/fw|0)+'px '+FACE;k.fillText(w,160,100);const d=k.getImageData(0,0,W,H).data,hm=new Float32Array(N),fx=R.rf(.05,.2),fy=R.rf(.05,.2),kind=R.ri(0,2);
  for(let i=0;i<N;i++){const x=i%W,y=i/W|0;hm[i]=(kind?Math.sin(x*fx)*Math.cos(y*fy)*30:((x>>4)+(y>>4)&1)*20)+(d[i*4+3]>100?90:0)+rn()*6;}
  for(let p=0;p<3;p++)for(let i=W+1;i<N-W-1;i++)hm[i]=(hm[i-1]+hm[i+1]+hm[i-W]+hm[i+W]+hm[i]*4)/8;return hm;}

Object.assign(MK,{
  fleet:(R,th)=>{const P=new Uint32Array(256);gradTo(P,0,16,[st(0,[0,0,0]),st(1,[235,240,255])]);const pc=cosCol(tp(R,th),R.f());gradTo(P,16,112,[st(0,mul(pc,.08)),st(.7,bright(pc,170)),st(1,mixW(pc,.6))]);shipPal(R,th,P);
    return{type:'fleet',label:'Fleet',pal:P,f:shipMesh(R),m:R.chance(.7)?shipMesh(R,1):null,n:R.ri(3,9),mode:R.chance(.4),sw:R.rf(.2,.5)*(R.chance(.5)?1:-1),gap:R.rf(3,5),px:R.ri(60,260),py:R.ri(40,120),pr:R.ri(30,80),bands:R.chance(.5)?R.rf(.05,.15):0,md:R.chance(.5)?1:-1};},
  voxship:(R,th)=>{const s=MK.voxel(R,th),P=new Uint32Array(256);shipPal(R,th,P);return Object.assign(s,{type:'voxship',label:'Voxel flight',ship:shipMesh(R),spal:P});},
  glenz:(R,th)=>{const P=new Uint32Array(256),a=bright(cosCol(tp(R,th),R.f()),220),b=bright(cosCol(tp(R,th),R.f()),220),g1=mul(cosCol(tp(R,th),R.f()),.18),g2=mul(cosCol(tp(R,th),R.f()),.4);
    for(let v=0;v<32;v++){let c=v&16?g2:g1;c=[0,1,2].map(j=>Math.min(255,c[j]*.6+(v&1?a[j]*.75:0)+(v&2?b[j]*.75:0)+(v&4?a[j]*.3:0)+(v&8?b[j]*.3:0)+(v&3?30:0)));P[v]=rgbA(c);}
    return{type:'glenz',label:'Glenz vectors',pal:P,k:R.rf(1.1,1.9),n:R.ri(1,2),rs:[R.rf(.4,1.1),R.rf(.3,.9),R.rf(.1,.5)]};},
  floor:(R,th)=>{const p=tp(R,th),base=new Uint32Array(64);palRamp(p,R.f(),R.f()+R.rf(.3,.8),.3,.15,base,0,64);const P=new Uint32Array(256),f=[.12,.35,.65,1];
    for(let s=0;s<4;s++)for(let i=0;i<64;i++){const c=base[i];P[s*64+i]=rgb((c&255)*f[s],((c>>8)&255)*f[s],((c>>16)&255)*f[s]);}
    return{type:'floor',label:'Mode 7',pal:P,tex:tex64(R,R.pick(['xor','checker','bricks','stripes','rings'])),ceil:R.chance(.6),h:R.rf(18,34),sp:R.rf(40,90),tr:R.rf(.1,.35)*(R.chance(.5)?1:-1)};},
  bump:(R,th,nm)=>({type:'bump',label:'Bump mapping',hm:bumpMap(R,nm),pal:palRamp(tp(R,th),R.f(),R.f()+.4,.15,.25),two:R.chance(.6),f:[R.rf(.5,1.2),R.rf(.6,1.4),R.rf(.4,1.1),R.rf(.7,1.5)]}),
  water:(R,th,nm)=>({type:'water',label:'Water',tex:tex256(R,R.pick(['blobs','xor','rings','noise']),R.chance(.5)?nm.title:null),pal:palCycle(tp(R,th)),b1:new Int16Array(N),b2:new Int16Array(N),rain:R.rf(.2,.9),vx:R.rf(-20,20),vy:R.rf(-20,20)}),
  shadebobs:(R,th)=>({type:'shadebobs',label:'Shadebobs',buf:new Uint8Array(N),n:R.ri(3,8),r:R.ri(10,22),k:R.pick([2,3,4]),f:[R.rf(.6,1.6),R.rf(.7,1.9),R.rf(.3,1),R.rf(.4,1.3)],pal:palCycle(tp(R,th)),cyc:R.rf(0,30)}),
  dots:(R,th)=>({type:'dots',label:'Dot landscape',pal:palRamp(tp(R,th),R.f(),R.f()+.5,.3,.2),a:R.rf(.3,.9),b:R.rf(.3,.9),amp:R.rf(.6,1.6),rs:R.rf(.15,.4)*(R.chance(.5)?1:-1),tilt:R.rf(.35,.7)}),
});
Object.assign(DRAW,{
  fleet(s,pt,dt){pal.set(s.pal);ib.fill(0);starfield(dt,s.mode?.6:.05,0,16);planet(s.px,s.py,s.pr,16,111,s.bands);const L=[],dur=ROWS*rowDur();
    if(s.m)L.push([s.m,s.md*(-40+pt/dur*80),5,48,s.md*Math.PI/2,0,0]);
    for(let i=0;i<s.n;i++){
      if(s.mode){const z=60-((T*14+i*9)%62);L.push([s.f,((i%3)-1)*3+Math.sin(i*2.3),((i/3|0)%3-1)*1.6,z,Math.PI,0,Math.sin(T+i)*.3]);}
      else{const ph=T*s.sw,bx=(i%3-1)*s.gap+Math.sin(T+i)*.5,by=(i/3|0)*1.4-1.5+Math.cos(T*.7+i)*.3,bz=(i/3|0)*3.5-3.5;L.push([s.f,bx*Math.cos(ph)+bz*Math.sin(ph),by,bz*Math.cos(ph)-bx*Math.sin(ph)+16,ph+Math.sin(T*.5)*.3,0,Math.sin(T*.6)*.4]);}}
    drawShips(L,128,126);return true;},
  voxship(s,pt,dt){DRAW.voxel(s,pt,dt);ib.fill(0);drawShips([[s.ship,Math.sin(T*.7)*1.5,-1.3+Math.sin(T)*.3,7,Math.sin(T*.5)*.3,.1,-Math.sin(T*.7)*.5]],128,126);
    for(let i=0;i<N;i++)if(ib[i])out[i]=s.spal[ib[i]];return false;},
  glenz(s,pt){pal.set(s.pal);const sh=(T*25)|0;for(let y=0;y<H;y++){const row=y*W;for(let x=0;x<W;x++)ib[row+x]=((x+sh>>4)^(y>>4))&1?16:0;}
    for(let o=0;o<s.n;o++){const a=T*s.rs[0]+o,b=T*s.rs[1],c=T*s.rs[2],sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b),sc=Math.sin(c),cc=Math.cos(c),zc=4.2-beat()*.4,
      ox=s.n>1?(o?1.6:-1.6)*Math.cos(T*.6):0,pr=v=>{let [x,y,z]=v,t=y*ca-z*sa;z=y*sa+z*ca;y=t;t=x*cb+z*sb;z=z*cb-x*sb;x=t;t=x*cc-y*sc;y=x*sc+y*cc;x=t+ox;z+=zc;return[160+x/z*220,100+y/z*183];};
      for(const [A,B,C,alt] of GZ){const ce=C.map(q=>q*s.k),p=pr(A),q=pr(B),r=pr(ce),ar=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);triOr(p[0],p[1],q[0],q[1],r[0],r[1],ar<0?(alt?1:2):(alt?4:8));}}
    return true;},
  floor(s,pt){pal.set(s.pal);const hor=s.ceil?100:70,a=T*s.tr,ca=Math.cos(a),sa=Math.sin(a),cxp=T*s.sp*sa,czp=T*s.sp*ca,h=s.h*(1+beat()*.08),tex=s.tex;
    for(let y=0;y<H;y++){const dy=y-hor,row=y*W;if(!dy||(!s.ceil&&dy<0)){ib.fill(dy?0:0,row,row+W);continue;}
      const d=h*80/Math.abs(dy),sh=Math.max(0,3-(d/90|0))*64,rx0=cxp+d*(sa-ca),rz0=czp+d*(ca+sa),stx=d*2*ca/W,stz=-d*2*sa/W;let u=rx0,v=rz0;
      for(let x=0;x<W;x++){ib[row+x]=sh+tex[((v|0)&255)<<8|((u|0)&255)];u+=stx;v+=stz;}}return true;},
  bump(s,pt){pal.set(s.pal);ib.fill(0);const hm=s.hm,f=s.f,l1x=160+Math.sin(T*f[0])*120,l1y=100+Math.cos(T*f[1])*70,l2x=160+Math.cos(T*f[2])*120,l2y=100+Math.sin(T*f[3])*70,rr=1+beat()*.4;
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,nx=(hm[i+1]-hm[i-1])*2,ny=(hm[i+W]-hm[i-W])*2;let dx=x-l1x+nx,dy=(y-l1y)*1.2+ny,v=255-(dx*dx+dy*dy)/(40*rr);
      if(s.two){dx=x-l2x+nx;dy=(y-l2y)*1.2+ny;v=Math.max(v,255-(dx*dx+dy*dy)/(30*rr));}ib[i]=v<0?0:v>255?255:v;}return true;},
  water(s,pt,dt){pal.set(s.pal);
    if(s.lb!==beatT){s.lb=beatT;const x=20+rn()*280|0,y=20+rn()*160|0;for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++)s.b1[(y+j)*W+x+i]=900;}
    if(rn()<s.rain){const x=5+rn()*310|0,y=5+rn()*190|0;s.b1[y*W+x]=500;}
    s.acc=(s.acc||0)+dt;let n=0;while(s.acc>1/60&&n<3){s.acc-=1/60;n++;const a=s.b1,b=s.b2;for(let i=W+1;i<N-W-1;i++){let v=((a[i-1]+a[i+1]+a[i-W]+a[i+W])>>1)-b[i];b[i]=v-(v>>5);}s.b1=b;s.b2=a;}
    const b=s.b1,ox=T*s.vx|0,oy=T*s.vy|0,tex=s.tex;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,dx=b[i-1]-b[i+1],dy=b[i-W]-b[i+W],v=tex[((y+(dy>>3)+oy)&255)<<8|((x+(dx>>3)+ox)&255)]+(dx>>2);ib[i]=v<0?0:v>255?255:v;}return true;},
  shadebobs(s,pt){const o=(T*s.cyc)|0;for(let i=0;i<256;i++)pal[i]=s.pal[(i+o)&255];const f=s.f,r=s.r,r2=r*r;
    for(let b=0;b<s.n;b++){const cx2=160+Math.sin(T*f[0]+b*.9)*Math.cos(T*f[2]+b)*125|0,cy=100+Math.sin(T*f[1]+b*1.3)*Math.cos(T*f[3]+b*.7)*75|0;
      for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){if(x*x+y*y>r2)continue;const py=cy+y,px=cx2+x;if(py<0||py>=H||px<0||px>=W)continue;const i=py*W+px;s.buf[i]=(s.buf[i]+s.k)&255;}}
    ib.set(s.buf);return true;},
  dots(s,pt){pal.set(s.pal);ib.fill(0);const a=T*s.rs,ca=Math.cos(a),sa=Math.sin(a),ct=Math.cos(s.tilt),stl=Math.sin(s.tilt),amp=s.amp*(1+beat()*.6+en[2]*.3);
    for(let gz=0;gz<48;gz++)for(let gx=0;gx<48;gx++){const x=(gx-23.5)*.25,z=(gz-23.5)*.25,y=Math.sin(x*s.a*3+T*1.7)*Math.cos(z*s.b*3+T*1.3)*amp;
      let X=x*ca-z*sa,Z=x*sa+z*ca,Y=y*ct-Z*stl;Z=y*stl+Z*ct+7;if(Z<.5)continue;const px=160+X/Z*230|0,py=100-Y/Z*192|0;if(px<0||px>=W-1||py<0||py>=H-1)continue;
      const c=Math.max(16,Math.min(255,(255-Z*20)+y*30))|0,i=py*W+px;if(c>ib[i])ib[i]=c;if(Z<6){ib[i+1]=Math.max(ib[i+1],c);ib[i+W]=Math.max(ib[i+W],c);}}return true;},
});
function lensFX(){const R0=46,R2=R0*R0,lx=160+110*Math.sin(T*.9)|0,ly=150-100*Math.abs(Math.sin(T*1.8))|0;tmpBuf.set(out);
  for(let j=-R0;j<R0;j++)for(let i=-R0;i<R0;i++){const l=i*i+j*j;if(l>=R2)continue;const w=1-Math.sqrt(1-l/R2)*.55;out[(ly+j)*W+lx+i]=tmpBuf[(ly+(j*w|0))*W+lx+(i*w|0)];}}
const tmpBuf=new Uint32Array(N);

/* =============================== DOS PROMPT =============================== */
const DOSC=colsN(8,[[170,170,170],[170,170,170]]),DOSW=colsN(8,[[255,255,255],[255,255,255]]);
function dosScript(first){
  const d=song.desc,np=song.pats.length,ins=song.inst.slice(1).map(i=>i.name).join(' ');
  const cmd='DEMOSEED.EXE /S:'+hex8(seed);
  const L=[];
  if(first)L.push(['Starting MS-DOS...',3],['',3],['HIMEM: testing extended memory...done',3],['',3],['C:\\>CD DEMOS',1]);
  L.push(['C:\\DEMOS>'+cmd,1],['',0],[('DEMOSEED 40K  (C) '+names.year+' '+names.group).slice(0,40),2],['',0],
    ['VGA: MODE 13H 320X200X256 ... OK',0],['SOUND: GRAVIS ULTRASOUND AT 240H',0],['GENERATING '+song.inst.length+' SAMPLES',0],
    ...ins.match(/.{1,38}(\s|$)/g).map(s=>[' '+s.trim(),0]),['COMPOSING '+np+' PATTERNS, '+song.sections.length+' ORDERS',0],
    [(' '+d.key+', '+song.bpm+' BPM').slice(0,40),0],['PRECALCULATING TABLES ........ OK',0],['',0],['ENJOY.',2]);
  return L;
}
function dosTimeline(L){let tt=0;return{E:L.map(([s,k])=>{const st=tt,p=s.indexOf('>')+1,dur=k===3?0:k===1?.6+(s.length-p)/14+.3:k===2?.3:.07+(s.length>20?.1:0);tt+=dur;return{s,k,st,dur,p};}),end:tt+.9};}
function drawDos(D,t){out.fill(0xff000000);const rows=[];
  for(const e of D.E){if(t<e.st)break;let s=e.s,cur=false;if(e.k===1){s=s.slice(0,e.p+Math.max(0,Math.min(s.length-e.p,Math.floor((t-e.st-.6)*14))));cur=t<e.st+e.dur;}rows.push([s,e.k,cur]);}
  if(!rows.some(r=>r[2])&&t<D.end)rows.push(['',0,true]);
  rows.slice(-25).forEach(([s,k,cur],i)=>{drawText(s,0,i*8,1,k===2?DOSW:DOSC,false);if(cur&&(T*3|0)%2)drawText('_',s.length*8,i*8,1,DOSC,false);});
  cx.putImageData(img,0,0);return t<D.end;}
