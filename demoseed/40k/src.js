(()=>{
"use strict";
const $=id=>document.getElementById(id);
const W=320,H=200,N=W*H,ROWS=64,CH=6,SR=22050;
const hex2=v=>v.toString(16).toUpperCase().padStart(2,'0');
const hex8=v=>(v>>>0).toString(16).toUpperCase().padStart(8,'0');
const NOTE=['C-','C#','D-','D#','E-','F-','F#','G-','G#','A-','A#','B-'];
const KEYN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

/* =============================== RNG =============================== */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hashSeed(s,k){let h=(s^Math.imul(k+1,0x9E3779B1))>>>0;h=Math.imul(h^h>>>16,0x85EBCA6B)>>>0;h=Math.imul(h^h>>>13,0xC2B2AE35)>>>0;return(h^h>>>16)>>>0;}
function Rng(seed){const f=mulberry(seed);f();f();return{f,rf:(a,b)=>a+(b-a)*f(),ri:(a,b)=>a+Math.floor(f()*(b-a+1)),pick:a=>a[Math.floor(f()*a.length)],chance:p=>f()<p,
  wpick:(it,ws)=>{let s=0;for(const w of ws)s+=w;let x=f()*s;for(let i=0;i<it.length;i++){x-=ws[i];if(x<=0)return it[i];}return it[it.length-1];}};}
const rn=mulberry(12345);

/* =============================== NAMES =============================== */
const SA=['ne','xe','vo','ky','zy','ra','qua','ha','mo','sy','te','lu','pha','cy','ze','or','ae','dra','tri','fu','ka','vi','sto','ny','gla','bre','ix'];
const SB=['tron','rix','lon','phex','zar','nox','dyne','vex','lux','gon','mos','tek','rax','ion','zor','nis','ptic','lith','kor','plex'];
function coin(R){let w=R.pick(SA);if(R.chance(.3))w+=R.pick(SA);return(w+R.pick(SB)).toUpperCase();}
function genNames(seed){
  const R=Rng(hashSeed(seed,0));
  const group=coin(R)+(R.chance(.5)?' '+R.pick(['DESIGN','CREW','LABS','SYSTEMS','DIVISION','INC','UNLIMITED','COLLECTIVE','ORBITAL']):'');
  const ADJ=['CRYSTAL','NEON','HYPER','LIQUID','SILENT','MOLTEN','VELVET','PHANTOM','CHROME','INFINITE','BINARY','STATIC','DEEP','FROZEN','ELECTRIC','HOLLOW','SOLAR','LUNAR','IRON','GLASS'];
  const NOUN=['DREAM','MACHINE','HORIZON','SIGNAL','ORBIT','PARADOX','ENGINE','MIRAGE','SPECTRUM','CIRCUIT','GARDEN','EMPIRE','PULSE','ECHO','TEMPLE','ANATOMY','VOYAGE','THEOREM','CATHEDRAL','STATE'];
  const title=R.chance(.6)?R.pick(ADJ)+' '+R.pick(NOUN):coin(R)+(R.chance(.4)?' '+R.pick(['II','III','2000','IV','X']):'');
  const H1=['ACID','COLD','DARK','STATIC','SILVER','LAZY','MAD','ZERO','ULTRA','NEON','RED','BLUE','GREY','HOLY','LOW','IRON','FAST','BENT'];
  const H2=['VIPER','FOX','PIXEL','WIZARD','RAVEN','BYTE','GHOST','COBRA','HAWK','LOOP','SAINT','MONK','BISHOP','DRIFT','KNIGHT','SPIKE','JACKAL','NOMAD'];
  const handle=()=>R.chance(.6)?R.pick(H1)+' '+R.pick(H2):coin(R);
  const code=handle(),music=handle(),gfx=handle(),year=R.ri(1993,1997);
  const party=coin(R)+' '+R.pick(['PARTY','GATHERING','CONVENTION','JAM','SYMPOSIUM'])+" '"+String(year).slice(2);
  const place=R.wpick(['1ST','2ND','3RD','4TH'],[4,3,2,1]);
  const greets=[];const ng=R.ri(7,10);for(let i=0;i<ng;i++)greets.push(coin(R));
  const BOAST=['NO 3D CARD REQUIRED','ALL CODE IN 100% ASSEMBLER','RUNS ON A 486DX2 OR NOT AT ALL','BUILT IN 72 SLEEPLESS HOURS','SAMPLES MADE FROM PURE MATH','EVERY PIXEL COMPUTED BY HAND','GRAVIS ULTRASOUND RECOMMENDED','PRESS ESC TO RETURN TO DOS','SOURCE CODE LOST IN A DISK CRASH','MORE PALETTE CYCLING THAN IS LEGAL'];
  const b1=R.pick(BOAST);let b2=R.pick(BOAST);if(b2===b1)b2=BOAST[(BOAST.indexOf(b1)+3)%BOAST.length];
  return {group,title,code,music,gfx,party,place,year,greets,boasts:[b1,b2]};
}

/* =============================== MUSIC =============================== */
const MODES=[['AEOLIAN',[0,2,3,5,7,8,10]],['DORIAN',[0,2,3,5,7,9,10]],['PHRYGIAN',[0,1,3,5,7,8,10]],['HARMONIC MINOR',[0,2,3,5,7,8,11]],['IONIAN',[0,2,4,5,7,9,11]],['MIXOLYDIAN',[0,2,4,5,7,9,10]]];
const degS=(iv,d)=>iv[((d%7)+7)%7]+12*Math.floor(d/7);
const PROG_MIN=[[0,5,2,6],[0,3,6,2],[0,6,5,6],[0,5,3,4],[0,3,4,0],[5,6,0,0],[0,2,5,6],[0,3,5,4],[0,6,3,4],[3,4,0,0],[0,5,6,4],[0,0,5,6]];
const PROG_MAJ=[[0,4,5,3],[5,3,0,4],[0,5,3,4],[0,3,4,3],[0,2,3,4],[3,4,2,5],[0,3,0,4]];
const ROMAN=['I','II','III','IV','V','VI','VII'];
const FORMS=[['intro','build','A','A2','break','B','B2','A3','outro'],['intro','A','A2','B','break','A3','A3','outro'],['intro','build','A','B','A2','break','B2','A3','outro'],['intro','build','A','A2','B','B2','break','A3','outro']];
const empty=()=>({n:null,i:0,fx:null,p:0});
const blankPat=()=>Array.from({length:ROWS},()=>Array.from({length:CH},empty));
function set(P,r,c,n,i,fx,p){if(r<0||r>=ROWS)return;const x=P[r][c];if(n!==null&&n!==undefined)x.n=n;if(i)x.i=i;if(fx!==null&&fx!==undefined){x.fx=fx;x.p=p||0;}}

/* ---- samples ---- */
function q8(d){let m=0;for(const v of d)m=Math.max(m,Math.abs(v));const s=m>0?0.95/m:1;for(let k=0;k<d.length;k++)d[k]=Math.round(d[k]*s*127)/127;return d;}
const PER=128,CYC=16,BASEF=SR/PER;
function cycleWave(fn){const n=PER*CYC,d=new Float32Array(n);for(let k=0;k<n;k++)d[k]=fn(2*Math.PI*(k%PER)/PER);return q8(d);}
const addW=ws=>ph=>{let s=0;for(let h=1;h<ws.length;h++)if(ws[h])s+=ws[h]*Math.sin(h*ph);return s;};
const sawW=(n,roll)=>{const w=[0];for(let h=1;h<=n;h++)w.push(Math.pow(roll,h)/h);return addW(w);};
const sqW=(n)=>{const w=[0];for(let h=1;h<=n;h++)w.push(h%2?1/h:0);return addW(w);};
const pulseW=(pw,n)=>ph=>{let s=0;for(let h=1;h<=n;h++)s+=Math.sin(h*Math.PI*pw)/h*Math.cos(h*ph);return s;};
const fmW=(k,I)=>ph=>Math.sin(ph+I*Math.sin(k*ph));
function genInstruments(seed){
  const R=Rng(hashSeed(seed,2)),I=[null],nz=mulberry(hashSeed(seed,9));
  {const f0=R.rf(38,58),f1=R.rf(110,230),sw=R.rf(16,40),dec=R.rf(5.5,10),drv=R.rf(1.2,2.8),clk=R.rf(0,.35),n=(0.34*SR)|0,d=new Float32Array(n);let ph=0;
   for(let k=0;k<n;k++){const t=k/SR,f=f0+(f1-f0)*Math.exp(-t*sw);ph+=2*Math.PI*f/SR;d[k]=Math.tanh(drv*(Math.sin(ph)*Math.exp(-t*dec)+clk*(nz()*2-1)*Math.exp(-t*260)));}
   I.push({name:'KICK',data:q8(d),mix:.95});}
  {const tone=R.rf(150,270),nd=R.rf(10,22),td=R.rf(16,34),hp=R.rf(.3,.9),mx=R.rf(.5,.9),n=(0.24*SR)|0,d=new Float32Array(n);let p=0;
   for(let k=0;k<n;k++){const t=k/SR,w=nz()*2-1,h=w-p*hp;p=w;d[k]=h*mx*Math.exp(-t*nd)+Math.sin(2*Math.PI*tone*t)*(1-mx*.5)*Math.exp(-t*td);}
   I.push({name:'SNARE',data:q8(d),mix:.6});}
  {const metal=R.chance(.45),dec=R.rf(45,95),n=(0.09*SR)|0,d=new Float32Array(n);let p=0;const fr=[205.3,304.4,369.6,522.7,540,800].map(f=>f*R.rf(1.6,2.4));
   for(let k=0;k<n;k++){const t=k/SR;let v;if(metal){v=0;for(const f of fr)v+=Math.sign(Math.sin(2*Math.PI*f*t));v/=6;}else v=nz()*2-1;d[k]=(v-p)*Math.exp(-t*dec);p=v;}
   I.push({name:metal?'HAT.METAL':'HAT',data:q8(d),mix:.3});}
  {const ty=R.wpick(['SAW','SQUARE','FM','SUB'],[3,2,2,1]);let fn;
   if(ty==='SAW')fn=sawW(16,R.rf(.75,.95));else if(ty==='SQUARE')fn=sqW(15);else if(ty==='FM')fn=fmW(R.pick([1,2]),R.rf(.6,2.4));else fn=sawW(6,.6);
   const sub=R.rf(0,.4),f2=ph=>fn(ph)+sub*Math.sin(ph);
   I.push({name:'BASS.'+ty,data:cycleWave(f2),loop:true,tonal:true,mix:.5,att:.003,sus:R.rf(.5,.85),tau:R.rf(.12,.4)});}
  {const ty=R.wpick(['PULSE','CHIP','BELL'],[3,2,1]);let fn;
   if(ty==='PULSE')fn=pulseW(R.rf(.1,.45),16);else if(ty==='CHIP')fn=sqW(13);else fn=fmW(2,R.rf(.8,2));
   I.push({name:'ARP.'+ty,data:cycleWave(fn),loop:true,tonal:true,mix:.2,att:.002,sus:R.rf(.3,.7),tau:R.rf(.06,.2)});}
  {const ty=R.wpick(['ADD','PULSE','FM','ORGAN'],[3,2,2,1]);let fn;
   if(ty==='ADD'){const w=[0,1];for(let h=2;h<=10;h++)w.push(R.f()*Math.pow(h,-R.rf(.6,1.5)));fn=addW(w);}
   else if(ty==='PULSE')fn=pulseW(R.rf(.2,.5),12);
   else if(ty==='FM')fn=fmW(R.pick([1,2]),R.rf(.8,2.6));
   else{const w=[0,1,R.rf(.3,.9),R.rf(0,.6),R.rf(0,.5),0,R.rf(0,.3),0,R.rf(0,.25)];fn=addW(w);}
   I.push({name:'LEAD.'+ty,data:cycleWave(fn),loop:true,tonal:true,mix:.3,att:R.rf(.003,.03),sus:R.rf(.6,.85),tau:R.rf(.25,.6)});}
  {const w=[0,1];for(let h=2;h<=5;h++)w.push(R.f()*Math.pow(h,-1.5));
   I.push({name:'PAD',data:cycleWave(addW(w)),loop:true,tonal:true,mix:.17,att:R.rf(.15,.4),sus:.9,tau:1.5});}
  return I;
}

/* ---- composition ---- */
function chordInfo(iv,d){const r=degS(iv,d);return{deg:d,root:r,third:degS(iv,d+2)-r,fifth:degS(iv,d+4)-r,sev:degS(iv,d+6)-r};}
function nearestTone(d,cd,rootOnly){let best=d,bd=99;for(let x=d-4;x<=d+4;x++){const m=((x-cd)%7+7)%7;if(m===0||(!rootOnly&&(m===2||m===4))){const dd=Math.abs(x-d);if(dd<bd){bd=dd;best=x;}}}return best;}
function makeMotif(R){
  const w=[1,.12,.4,.18,.8,.12,.45,.22,.9,.12,.4,.18,.7,.15,.5,.3],dens=R.rf(.3,.6);
  const on=[];for(let s=0;s<16;s++)if(R.f()<Math.min(.95,w[s]*dens*1.7))on.push(s);
  if(!on.includes(0)&&!on.includes(2))on.unshift(R.chance(.7)?0:2);
  while(on.length<3){const s=R.ri(1,15);if(!on.includes(s))on.push(s);}
  on.sort((a,b)=>a-b);
  const mv=on.map((_,i)=>i===0?0:R.wpick([-3,-2,-1,0,1,2,3,4],[.04,.1,.3,.08,.3,.1,.05,.03]));
  return{on,mv,offs:R.chance(.4)};
}
const varyMotif=(R,m)=>({on:m.on.slice(),mv:m.mv.map((v,i)=>i&&R.chance(.3)?v+R.pick([-1,1]):v),offs:m.offs});

function genSong(seed){
  const R=Rng(hashSeed(seed,1));
  const [modeName,iv]=MODES[R.wpick([0,1,2,3,4,5],[4,2,1,2,1.5,1])];
  const minor=iv[2]===3,key=R.ri(0,11),bpm=R.ri(112,152),speed=6,swing=R.chance(.22)?1:0;
  const okProg=p=>p.every(d=>degS(iv,d+4)-degS(iv,d)===7);
  let pool=(minor?PROG_MIN:PROG_MAJ).filter(okProg);if(pool.length<2)pool=(minor?PROG_MIN:PROG_MAJ).filter(p=>p.every(d=>{const f=degS(iv,d+4)-degS(iv,d);return f===7||d===4;}));if(pool.length<2)pool=minor?PROG_MIN:PROG_MAJ;
  const P1=R.pick(pool);let P2=R.pick(pool);for(let k=0;k<6&&P2.join()===P1.join();k++)P2=R.pick(pool);
  const s1=R.wpick([4,8,2],[6,2,1]),s2=R.wpick([4,8,2],[6,2,1]);
  const dStyle=R.wpick(['four','break','half','electro'],[3,3,1,2]);
  const D=(()=>{let K,S,G=[];
    if(dStyle==='four'){K=[0,4,8,12];S=[4,12];if(R.chance(.4))K.push(R.pick([14,10,7]));}
    else if(dStyle==='break'){K=[0,10];if(R.chance(.5))K.push(R.pick([6,3,7]));S=[4,12];if(R.chance(.6))G=[R.pick([7,9]),R.pick([14,15])];}
    else if(dStyle==='half'){K=[0];if(R.chance(.6))K.push(R.pick([10,11,6]));S=[8];if(R.chance(.5))G=[14];}
    else{K=[0,6,10];if(R.chance(.3))K.push(3);S=[4,12];}
    return{K:[...new Set(K)].sort((a,b)=>a-b),S,G};})();
  const hStyle=R.wpick(['off8','8th','16th'],[2,3,2]);
  const BT=[[0,3,6,8,11,12,14],[0,2,4,6,8,10,12,14],[0,4,8,12],[0,3,6,10,12],[0,1,4,6,8,9,12,14],[0,6,8,14],[0,2,3,6,8,10,11,14],[0,3,8,11]];
  const octStyle=R.chance(.3);
  const bassT=octStyle?{steps:[0,2,4,6,8,10,12,14],oct:[2,6,10,14],fifth:[]}:(()=>{const st=R.pick(BT);return{steps:st,oct:st.filter(s=>s&&R.chance(.2)),fifth:st.filter(s=>s&&R.chance(.15))};})();
  const bassStac=R.chance(.5),bassApproach=R.chance(.5);
  const arpStyle=R.wpick(['fx','notes'],[3,2]),arpType=R.wpick(['triad','power','seventh'],[4,1,1]),arpRate=R.pick([2,4,4,8]);
  const arpPat=R.pick(['up','down','updown','random']),arpStep=R.pick([1,2,2]);
  const echoD=R.pick([3,3,6,2]),echoV=R.ri(0x10,0x1A),vib=(R.ri(3,6)<<4)|R.ri(2,4);
  const modUp=R.wpick([0,1,2],[2,2,3]);
  const form=R.pick(FORMS);
  const m1=makeMotif(R),m2=makeMotif(R),m3=makeMotif(R),m4=makeMotif(R);
  const SH=['AABA','ABAC','AAAB','ABAB','AABC'];
  const sh1=R.pick(SH),sh2=R.pick(SH);
  const MA={A:m1,B:m2,C:varyMotif(R,m1)},MA2={A:varyMotif(R,m1),B:m2,C:varyMotif(R,m1)};
  const MB={A:m3,B:m4,C:varyMotif(R,m3)},MB2={A:varyMotif(R,m3),B:varyMotif(R,m4),C:varyMotif(R,m3)};
  const start1=R.pick([0,2,4]),start2=R.pick([0,2,4]),breakLead=R.chance(.5);
  const fillAt=R.pick([8,12]),fillA=R.chance(.5);
  const bassBase=36+key-(36+key>42?12:0),arpBase=60+key-(60+key>66?12:0),leadBase=72+key-(key>=5?12:0),padBase=arpBase;
  const chordCache={};const chord=d=>chordCache[d]||(chordCache[d]=chordInfo(iv,d));

  function ctxFor(name){const isB=name[0]==='B';const prog=isB?P2:P1,slots=isB?s2:s1,tr=name==='A3'?modUp:0;
    return{prog,slots,tr,chordAt:r=>{const len=64/slots;return chord(prog[Math.floor(r/len)%prog.length]);}};}
  function drums(P,o){
    for(let b=0;b<4;b++){
      const R0=b*16,ev=Array.from({length:16},()=>({k:0,s:0,g:0,h:0,v:0}));
      const kOn=o.k&&b>=(o.kFrom||0)&&b<(o.kTo??4),hOn=o.h&&b>=(o.hFrom||0)&&b<(o.hTo??4);
      if(kOn)for(const s of (o.k4?[0,4,8,12]:D.K))ev[s].k=1;
      if(o.s&&kOn){for(const s of D.S)ev[s].s=1;for(const s of D.G)ev[s].g=1;}
      if(hOn){const hs=o.h16?'16th':hStyle;
        if(hs==='off8')for(const s of [2,6,10,14])ev[s].h=0x28;
        else if(hs==='8th')for(let s=0;s<16;s+=2)ev[s].h=s%4===2?0x30:0x18;
        else for(let s=0;s<16;s++)ev[s].h=s%4===0?0x24:s%2?0x10:0x1C;}
      if(o.fill&&b===3){const fa=o.fillAt??fillAt;for(let s=fa;s<16;s++){ev[s].k=s===fa?ev[s].k:0;ev[s].s=0;ev[s].g=0;ev[s].h=0;ev[s].v=0x14+Math.round((s-fa)/(15-fa||1)*0x2C);}}
      for(let s=0;s<16;s++){const e=ev[s],r=R0+s;let c0=false;
        if(e.k){set(P,r,0,60,1);c0=true;}
        if(e.v){if(!c0){set(P,r,0,60,2,0xC,e.v);c0=true;}else set(P,r,1,60,2,0xC,e.v);continue;}
        if(e.s){if(!c0){set(P,r,0,60,2);c0=true;}else{set(P,r,1,60,2);continue;}}
        else if(e.g&&!c0){set(P,r,0,60,2,0xC,0x14);c0=true;}
        if(e.h&&P[r][1].n===null)set(P,r,1,60,3,0xC,e.h);
      }
    }
  }
  function bass(P,cx,o){
    if(o.long){let last=-1;for(let r=0;r<64;r++){const c=cx.chordAt(r);if(c.deg!==last){set(P,r,2,bassBase+cx.tr+c.root,4);last=c.deg;}}return;}
    const on=[];
    for(let r=0;r<64;r++){const s=r%16,b=r>>4;if(b<(o.from||0)||b>=(o.to??4))continue;if(!bassT.steps.includes(s))continue;
      const c=cx.chordAt(r);let n=bassBase+cx.tr+c.root;
      if(bassT.fifth.includes(s))n+=c.fifth;if(bassT.oct.includes(s))n+=12;
      const nx=bassT.steps.find(x=>x>s);const nr=nx===undefined?r-s+16:r-s+nx;
      if(bassApproach&&nr<64&&cx.chordAt(nr).deg!==c.deg&&nr-r<=3){const t=bassBase+cx.tr+cx.chordAt(nr).root;n=t+(t>n?-1:1)*(R.chance(.5)?1:2);}
      set(P,r,2,n,4);on.push(r);}
    if(bassStac)for(let i=0;i<on.length;i++){const nx=i+1<on.length?on[i+1]:64;if(nx-on[i]>=3)set(P,on[i]+2,2,-1);}
  }
  function arp(P,cx,o){
    const ip=c=>arpType==='power'?0x7C:arpType==='seventh'?((c.third<<4)|Math.min(15,c.sev)):((c.third<<4)|c.fifth);
    const vol=r=>o.fadeIn?Math.round(0x0C+r/63*0x34):o.fadeOut?Math.round(0x40-r/63*0x38):0x40;
    if(arpStyle==='fx'){let last=-1;for(let r=0;r<64;r++){const c=cx.chordAt(r);
        if(r%arpRate===0||c.deg!==last){set(P,r,3,arpBase+cx.tr+c.root,5,0,ip(c));last=c.deg;}else set(P,r,3,null,0,0,ip(c));
        if(o.fadeIn||o.fadeOut){if(P[r][3].n>0){P[r][3].fx=0xC;P[r][3].p=vol(r);}}}}
    else{let k=0;for(let r=0;r<64;r+=arpStep){const c=cx.chordAt(r),tones=[0,c.third,c.fifth,12,12+c.third];let idx;
        if(arpPat==='up')idx=k%4;else if(arpPat==='down')idx=3-(k%4);else if(arpPat==='updown'){const q=k%6;idx=q<4?q:6-q;}else idx=[0,2,1,3,4,2,0,1][k%8];
        set(P,r,3,arpBase+cx.tr+c.root+tones[idx],5,0xC,vol(r));k++;}}
  }
  function pad(P,cx,o){let last=-1;for(let r=0;r<64;r++){const c=cx.chordAt(r);if(c.deg!==last){set(P,r,5,padBase+cx.tr+c.root+c.third,7,0xC,0x30);last=c.deg;}}if(o.end)set(P,60,5,-1);}
  function lead(P,cx,motifs,shape,startDeg,o){
    const notes=[];let anchor=startDeg;
    for(let b=0;b<4;b++){const m=motifs[shape[b]],last=b===3,c0=cx.chordAt(b*16);anchor=nearestTone(anchor,c0.deg);let d=anchor;
      const ons=o.sparse?m.on.slice(0,1):(last?m.on.filter(s=>s<=8):m.on);
      ons.forEach((s,i)=>{const r=b*16+s;d+=m.mv[i]||0;const c=cx.chordAt(r);if(s%4===0||o.sparse)d=nearestTone(d,c.deg);
        if(last&&i===ons.length-1)d=nearestTone(d,c.deg,true);while(d>9)d-=7;while(d<-4)d+=7;notes.push({r,d});});}
    notes.forEach((nt,i)=>{const nx=i+1<notes.length?notes[i+1].r:64;set(P,nt.r,4,leadBase+cx.tr+degS(iv,nt.d),6);
      let end=nx;if(motifs.A.offs&&nx-nt.r>=5&&i+1<notes.length){set(P,nx-1,4,-1);end=nx-1;}
      if(nx-nt.r>=3)for(let r=nt.r+2;r<end;r++)set(P,r,4,null,0,4,vib);});
    if(o.echo)for(let r=0;r+echoD<64;r++){const s=P[r][4];if(s.n>0)set(P,r+echoD,5,s.n,6,0xC,echoV);else if(s.n===-1)set(P,r+echoD,5,-1);}
  }
  function build(name){
    const P=blankPat(),cx=ctxFor(name);
    switch(name){
      case 'intro':arp(P,cx,{fadeIn:1});pad(P,cx,{});drums(P,{h:1,hFrom:2,k:1,k4:1,kFrom:3});break;
      case 'build':arp(P,cx,{});bass(P,cx,{});drums(P,{k:1,k4:1,h:1,hFrom:1,fill:1});break;
      case 'A':drums(P,{k:1,s:1,h:1,fill:fillA});bass(P,cx,{});arp(P,cx,{});lead(P,cx,MA,sh1,start1,{echo:1});break;
      case 'A2':drums(P,{k:1,s:1,h:1,fill:1});bass(P,cx,{});arp(P,cx,{});lead(P,cx,MA2,sh1,start1,{echo:1});break;
      case 'A3':drums(P,{k:1,s:1,h:1,h16:1,fill:1});bass(P,cx,{});arp(P,cx,{});lead(P,cx,MA2,sh1,start1,{echo:1});break;
      case 'B':drums(P,{k:1,s:1,h:1,fill:fillA});bass(P,cx,{});arp(P,cx,{});lead(P,cx,MB,sh2,start2,{echo:1});break;
      case 'B2':drums(P,{k:1,s:1,h:1,fill:1});bass(P,cx,{});arp(P,cx,{});lead(P,cx,MB2,sh2,start2,{echo:1});break;
      case 'break':pad(P,cx,{});arp(P,cx,{});bass(P,cx,{long:1});drums(P,{fill:1,fillAt:8});if(breakLead)lead(P,cx,MB,sh2,start2,{sparse:1});break;
      case 'outro':arp(P,cx,{fadeOut:1});pad(P,cx,{end:1});drums(P,{k:1,k4:1,h:1,kTo:2,hTo:2});bass(P,cx,{to:2});for(const c of [2,3,4])set(P,60,c,-1);break;
    }
    return P;
  }
  const pats=[],patOf={},sections=[];
  for(const name of form){if(!(name in patOf)){patOf[name]=pats.length;pats.push(build(name));}sections.push({name,pat:patOf[name]});}
  const progTxt=p=>p.map(d=>{const c=chord(d),q=c.third===3?'m':'';const rn=ROMAN[d];return(c.third===3?rn.toLowerCase():rn)+(c.fifth===6?'°':'');}).join('-');
  return{seed,key,modeName,iv,bpm,speed,swing,pats,sections,inst:genInstruments(seed),dStyle,
    desc:{key:KEYN[key]+' '+modeName,prog1:progTxt(P1),prog2:progTxt(P2),drums:{four:'FOUR TO THE FLOOR',break:'BREAKBEAT',half:'HALF-TIME',electro:'ELECTRO'}[dStyle],modUp}};
}

/* =============================== AUDIO =============================== */
let ac=null,mixBus=null,chans=[],playing=false,timer=0,queue=[],sch=null,bufFor=-1;
const PANS=[0,.35,-.1,-.45,.25,-.5];
function initAudio(){
  if(ac)return;const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();
  mixBus=ac.createGain();mixBus.gain.value=.75;
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9500;lp.Q.value=.4;
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;
  mixBus.connect(lp);lp.connect(comp);comp.connect(ac.destination);
  chans=PANS.map(p=>{const g=ac.createGain();let o=g;if(ac.createStereoPanner){const pn=ac.createStereoPanner();pn.pan.value=p;g.connect(pn);o=pn;}o.connect(mixBus);return{g,src:null,ng:null,inst:0,rate:1,vol:64,fx:null,p:0,vib:0};});
}
function loadBuffers(){if(!ac||bufFor===song.seed)return;for(const it of song.inst){if(!it)continue;const b=ac.createBuffer(1,it.data.length,SR);b.copyToChannel(it.data,0);it.buf=b;}bufFor=song.seed;}
function killVoice(ch,tm,tau){if(ch.ng){ch.ng.gain.cancelScheduledValues(tm);ch.ng.gain.setTargetAtTime(0,tm,tau);try{ch.src.stop(tm+tau*8);}catch(e){}ch.src=null;ch.ng=null;}}
function trigger(c,cell,tm){
  const ch=chans[c];
  if(cell.n===-1)killVoice(ch,tm,.03);
  else if(cell.n!==null&&cell.n>0){const ii=cell.i||ch.inst,it=song.inst[ii];if(it&&it.buf){
    ch.inst=ii;ch.vol=cell.fx===0xC?Math.min(64,cell.p):64;killVoice(ch,tm,.004);
    const s=ac.createBufferSource();s.buffer=it.buf;s.loop=!!it.loop;
    const rate=it.tonal?440*Math.pow(2,(cell.n-69)/12)/BASEF:Math.pow(2,(cell.n-60)/12);
    s.playbackRate.setValueAtTime(rate,tm);ch.rate=rate;ch.vib=0;
    const g=ac.createGain(),at=it.att||.003;g.gain.setValueAtTime(0,tm);g.gain.linearRampToValueAtTime(it.mix,tm+at);
    if(it.tonal)g.gain.setTargetAtTime(it.mix*it.sus,tm+at+.001,it.tau);
    s.connect(g);g.connect(ch.g);s.start(tm);ch.src=s;ch.ng=g;}}
  else if(cell.fx===0xC)ch.vol=Math.min(64,cell.p);
  ch.fx=cell.fx;ch.p=cell.p;ch.g.gain.setValueAtTime(ch.vol/64,tm);
}
function tickFx(ch,k,tt){
  if(!ch.src)return;
  if(ch.fx===0&&ch.p){const st=[0,ch.p>>4,ch.p&15][k%3];ch.src.playbackRate.setValueAtTime(ch.rate*Math.pow(2,st/12),tt);}
  else if(ch.fx===4){if(k>0)ch.vib+=(ch.p>>4)*4;const d=(ch.p&15)/8*Math.sin(ch.vib/64*2*Math.PI);ch.src.playbackRate.setValueAtTime(ch.rate*Math.pow(2,d/12),tt);}
  else if(k===0)ch.src.playbackRate.setValueAtTime(ch.rate,tt);
}
const rowDur=()=>song.speed*2.5/song.bpm;
function pump(){
  if(!playing)return;const ahead=ac.currentTime+.2;
  while(sch.t<ahead&&!sch.ended){
    const tt=sch.t;
    if(sch.tick===0){const sec=song.sections[sch.order],r=song.pats[sec.pat][sch.row];
      queue.push({time:tt,order:sch.order,row:sch.row,rd:rowDur()});
      for(let c=0;c<CH;c++)trigger(c,r[c],tt);
      sch.rt=song.speed+(song.swing?(sch.row%2===0?1:-1):0);}
    for(let c=0;c<CH;c++)tickFx(chans[c],sch.tick,tt);
    sch.t+=2.5/song.bpm;
    if(++sch.tick>=sch.rt){sch.tick=0;if(++sch.row>=ROWS){sch.row=0;if(++sch.order>=song.sections.length){if(endless){sch.ended=true;queue.push({time:sch.t+.25,end:true});}else sch.order=0;}}}
  }
}
function startAt(order){
  initAudio();ac.resume&&ac.resume();loadBuffers();
  const now=ac.currentTime;for(const ch of chans){killVoice(ch,now,.02);ch.vol=64;ch.fx=null;}
  sch={order,row:0,tick:0,rt:song.speed,t:now+.08,ended:false};queue=[];playing=true;
  clearInterval(timer);timer=setInterval(pump,25);pump();
}
function stopAudio(){playing=false;clearInterval(timer);if(ac){const now=ac.currentTime;for(const ch of chans)killVoice(ch,now,.05);}}

/* =============================== VISUAL CORE =============================== */
const cv=$('scr'),cx=cv.getContext('2d',{alpha:false});
const img=cx.createImageData(W,H),out=new Uint32Array(img.data.buffer);
const ib=new Uint8Array(N),pal=new Uint32Array(256),tmpRow=new Uint32Array(W);
const rgb=(r,g,b)=>(255<<24)|((b&255)<<16)|((g&255)<<8)|(r&255);
const rgbA=c=>rgb(c[0],c[1],c[2]);
function flush(){for(let i=0;i<N;i++)out[i]=pal[ib[i]];}
function gradTo(dst,start,len,stops){for(let i=0;i<len;i++){const t=len>1?i/(len-1):0;let k=0;while(k<stops.length-2&&t>stops[k+1][0])k++;const a=stops[k],b=stops[k+1],u=Math.min(1,Math.max(0,(t-a[0])/Math.max(1e-6,b[0]-a[0])));dst[start+i]=rgb(a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u,a[3]+(b[3]-a[3])*u);}}
const st=(t,c)=>[t,c[0],c[1],c[2]];
const mul=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
const mixW=(c,k)=>[c[0]+(255-c[0])*k,c[1]+(255-c[1])*k,c[2]+(255-c[2])*k];
function cosCol(p,t){return[0,1,2].map(j=>Math.max(0,Math.min(1,p.a[j]+p.b[j]*Math.cos(2*Math.PI*(p.c[j]*t+p.d[j]))))*255);}
function mkTheme(R){return{d0:R.f(),sp:R.pick([.1,.15,.2,.33]),a:R.rf(.42,.58),b:R.rf(.38,.55)};}
function tp(R,th){const d0=th.d0+R.rf(-.12,.12),c=R.wpick([[1,1,1],[1,1,2],[2,1,1],[1,2,1]],[5,1,1,1]);return{a:[0,1,2].map(()=>th.a+R.rf(-.08,.08)),b:[0,1,2].map(()=>th.b+R.rf(-.08,.08)),c,d:[d0,d0+th.sp,d0+2*th.sp]};}
function palCycle(p){const P=new Uint32Array(256);for(let i=0;i<256;i++)P[i]=rgbA(cosCol(p,i/256));return P;}
function palRamp(p,t0,t1,black=.25,white=.12,dst,start=0,len=256){const P=dst||new Uint32Array(256);for(let i=0;i<len;i++){const u=i/(len-1);let c=cosCol(p,t0+(t1-t0)*u);c=mul(c,Math.min(1,u/black));if(white>0&&u>1-white)c=mixW(c,(u-(1-white))/white);P[start+i]=rgbA(c);}return P;}
function bright(c,min=150){const m=Math.max(c[0],c[1],c[2],1);return m<min?mul(c,min/m):c;}

/* font */
const GL=new Uint8Array(96*64);let FACE='ui-monospace, monospace';
function buildFont0(){const c=document.createElement('canvas');c.width=8;c.height=8;const g=c.getContext('2d',{willReadFrequently:true});
  for(let k=0;k<96;k++){g.clearRect(0,0,8,8);g.fillStyle='#fff';g.font='8px '+FACE;g.textBaseline='top';g.fillText(String.fromCharCode(32+k),0,0);const d=g.getImageData(0,0,8,8).data;for(let p=0;p<64;p++)GL[k*64+p]=d[p*4+3]>110?1:0;}}
function drawText(s,x,y,sc,cols,shadow){for(let pass=shadow?0:1;pass<2;pass++){const o=pass?0:sc;for(let i=0;i<s.length;i++){const k=s.charCodeAt(i)-32;if(k<=0||k>=96)continue;
  for(let gy=0;gy<8;gy++){const col=pass?cols[gy]:0xff000000;for(let gx=0;gx<8;gx++){if(!GL[k*64+gy*8+gx])continue;for(let sy=0;sy<sc;sy++){const py=y+gy*sc+sy+o;if(py<0||py>=H)continue;for(let sx=0;sx<sc;sx++){const px=x+(i*8+gx)*sc+sx+o;if(px>=0&&px<W)out[py*W+px]=col;}}}}}}}
const fitSc=(s,maxSc)=>{for(let sc=maxSc;sc>1;sc--)if(s.length*8*sc<=304)return sc;return 1;};
const cxText=(s,sc)=>((W-s.length*8*sc)/2)|0;
function colsN(n,cs){const a=new Uint32Array(n);gradTo(a,0,n,cs.map((c,i)=>st(i/(cs.length-1),c)));return a;}

/* lookup tables */
const LW=640,LH=400,lutA=new Uint16Array(LW*LH),lutD=new Uint8Array(LW*LH),lutS=new Uint8Array(LW*LH),lutR=new Uint16Array(LW*LH);
for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){const dx=x-320,dy=(y-200)*1.2,r=Math.sqrt(dx*dx+dy*dy)+1e-4,i=y*LW+x;
  lutA[i]=((Math.atan2(dy,dx)+Math.PI)/(2*Math.PI)*1024)&1023;lutD[i]=(7000/r)&255;lutS[i]=Math.min(3,(r/38)|0)*64;lutR[i]=Math.min(65535,r*2)|0;}
const SINT=new Float32Array(1024),COST=new Float32Array(1024);for(let i=0;i<1024;i++){SINT[i]=Math.sin(i/1024*2*Math.PI);COST[i]=Math.cos(i/1024*2*Math.PI);}
const KS=1024/(2*Math.PI);

/* stars */
const stars=Array.from({length:420},()=>({x:rn()*2-1,y:rn()*2-1,z:rn()}));
function starfield(dt,speed,base,span){for(const s of stars){s.z-=dt*speed;if(s.z<=.02){s.z=1;s.x=rn()*2-1;s.y=rn()*2-1;}const sx=(160+s.x/s.z*160)|0,sy=(100+s.y/s.z*100/1.2)|0;if(sx<0||sx>=W-1||sy<0||sy>=H-1)continue;
  const c=base+(((1-s.z)*(span-1))|0),i=sy*W+sx;if(c>ib[i])ib[i]=c;if(s.z<.3){if(c>ib[i+1])ib[i+1]=c;if(c>ib[i+W])ib[i+W]=c;if(c>ib[i+W+1])ib[i+W+1]=c;}}}

/* runtime sync */
let T=0,beatT=-10,snareT=-10;const en=new Float32Array(CH);
const beat=()=>Math.exp(-(T-beatT)*7),snr=()=>Math.exp(-(T-snareT)*9);

/* =============================== EFFECT MAKERS =============================== */
function tex256(R,kind,txt){const t=new Uint8Array(65536);
  if(kind==='xor')for(let y=0;y<256;y++)for(let x=0;x<256;x++)t[y*256+x]=(x^y)&255;
  else if(kind==='rings')for(let y=0;y<256;y++)for(let x=0;x<256;x++){const lx=(x&63)-31.5,ly=(y&63)-31.5;t[y*256+x]=(Math.sqrt(lx*lx+ly*ly)*6)&255;}
  else if(kind==='noise'){const g=new Float32Array(16*16);for(let i=0;i<256;i++)g[i]=R.f();for(let y=0;y<256;y++)for(let x=0;x<256;x++){const gx=x/16,gy=y/16,x0=gx|0,y0=gy|0,fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),q=(a,b)=>g[(b&15)*16+(a&15)];
    t[y*256+x]=(((q(x0,y0)*(1-sx)+q(x0+1,y0)*sx)*(1-sy)+(q(x0,y0+1)*(1-sx)+q(x0+1,y0+1)*sx)*sy)*255*2)&255;}}
  else{for(let y=0;y<256;y++)for(let x=0;x<256;x++){const c=((x>>5)^(y>>5))&1,lx=(x&31)-15.5,ly=(y&31)-15.5,d=Math.min(1,Math.sqrt(lx*lx+ly*ly)/22);t[y*256+x]=c*100+((1-d)*90|0);}}
  if(txt){const g=document.createElement('canvas');g.width=256;g.height=256;const k=g.getContext('2d',{willReadFrequently:true});k.fillStyle='#fff';k.textAlign='center';k.textBaseline='middle';
    const words=txt.split(' ');const fs=Math.min(30,Math.floor(230/Math.max(...words.map(w=>w.length))));k.font=fs+'px '+FACE;words.slice(0,3).forEach((w,i,a)=>k.fillText(w,128,128+(i-(a.length-1)/2)*fs*1.5));
    const d=k.getImageData(0,0,256,256).data;for(let i=0;i<65536;i++)if(d[i*4+3]>120)t[i]=200+(((i>>8)/256)*55|0);}
  return t;}
function tex64(R,kind){const t=new Uint8Array(65536);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){let v;
    if(kind==='xor'){v=(((x*2)^(y*2))&63);if((x&31)<2||(y&31)<3)v=63;}
    else if(kind==='checker')v=((x>>4)^(y>>5))&1?54+((x+y)&7):10+((x*y)&7);
    else if(kind==='bricks'){const row=y>>4,bx=(x+(row&1)*16)&31;v=(bx<2||(y&15)<2)?6:36+((x*7+y*3)&15);}
    else if(kind==='stripes')v=((x+Math.sin(y/256*2*Math.PI*3)*20)&31)<14?60:12;
    else{const lx=(x&31)-15.5,ly=(y&31)-15.5;v=(Math.sqrt(lx*lx+ly*ly)*4)&63;}
    t[y*256+x]=v;}
  return t;}
const MK={
  title:(R,th,nm)=>({type:'title',label:'Title',bars:[0,1,2].map(()=>bright(cosCol(tp(R,th),R.f()))),pal:(()=>{const P=new Uint32Array(256);gradTo(P,0,256,[st(0,[0,0,0]),st(.4,mul(cosCol(tp(R,th),.2),.35)),st(1,[240,244,255])]);return P;})(),
    c1:colsN(8,[mixW(cosCol(tp(R,th),.1),.6),bright(cosCol(tp(R,th),.5)),mul(cosCol(tp(R,th),.8),.7)]),c2:colsN(8,[[240,248,255],bright(cosCol(tp(R,th),.3))])}),
  credits:(R,th,nm)=>({type:'credits',label:'Credits',pal:(()=>{const P=new Uint32Array(256);gradTo(P,0,256,[st(0,[0,0,0]),st(.5,mul(cosCol(tp(R,th),.4),.4)),st(1,[230,236,255])]);return P;})(),
    head:colsN(8,[bright(cosCol(tp(R,th),.1)),bright(cosCol(tp(R,th),.6))]),body:colsN(8,[[245,245,250],[170,170,190]]),
    lines:['CODE','',nm.code,'','','MUSIC','',nm.music,'','','GRAPHICS','',nm.gfx,'','','','GREETINGS TO','',...nm.greets,'','','',nm.boasts[1],'','','THANK YOU FOR WATCHING']}),
  plasma:(R,th)=>{const n=R.ri(2,4),terms=[];for(let i=0;i<n;i++){const a=R.rf(0,Math.PI*2),f=R.rf(.015,.06);terms.push({fx:Math.cos(a)*f,fy:Math.sin(a)*f*1.2,sp:R.rf(-1.8,1.8),amp:R.rf(.6,1)});}
    return{type:'plasma',label:'Plasma',terms,rk:R.rf(.03,.09),rs:R.rf(1,3),ra:R.rf(.4,1),o1:R.rf(.3,.9),o2:R.rf(.3,.9),cyc:R.rf(20,70)*(R.chance(.5)?1:-1),scale:R.rf(26,42),pal:palCycle(tp(R,th))};},
  tunnel:(R,th)=>{const p=tp(R,th),base=new Uint32Array(64);palRamp(p,R.f(),R.f()+R.rf(.3,.8),.3,.15,base,0,64);const P=new Uint32Array(256),f=[.12,.35,.65,1];
    for(let s=0;s<4;s++)for(let i=0;i<64;i++){const c=base[i];P[s*64+i]=rgb((c&255)*f[s],((c>>8)&255)*f[s],((c>>16)&255)*f[s]);}
    return{type:'tunnel',label:R.chance(.5)?'Tunnel':'Wormhole',tex:tex64(R,R.pick(['xor','checker','bricks','stripes','rings'])),rep:R.pick([1,2,2,3,4]),twist:R.pick([0,0,1,2,3,-2]),sa:R.rf(-60,60),sd:R.rf(60,160),wob:R.rf(40,120),w1:R.rf(.4,1),w2:R.rf(.5,1.1),kick:R.rf(8,24),pal:P};},
  roto:(R,th,nm)=>{const k=R.pick(['blobs','xor','noise','rings']),useTxt=R.chance(.55);return{type:'roto',label:'Rotozoomer',tex:tex256(R,k,useTxt?nm.group:null),rs:R.rf(.25,.8)*(R.chance(.5)?1:-1),z0:R.rf(.45,.8),z1:R.rf(.2,.45),zs:R.rf(.4,1),vx:R.rf(-50,50),vy:R.rf(-50,50),cyc:R.chance(.5)?R.rf(10,40):0,pal:palCycle(tp(R,th))};},
  fire:(R,th,nm)=>{const p=tp(R,th),c1=bright(cosCol(p,R.f()),200),c2=bright(cosCol(p,R.f()),230),P=new Uint32Array(256);
    gradTo(P,0,256,[st(0,[0,0,0]),st(.18,mul(c1,.25)),st(.38,mul(c1,.7)),st(.58,c1),st(.78,mixW(c2,.3)),st(1,[255,252,235])]);
    return{type:'fire',label:'Fire',pal:P,word:R.chance(.5)?nm.title:nm.group,cool:R.rf(.35,.55),mask:null};},
  voxel:(R,th)=>{const hf=new Float32Array(65536);for(const [cell,amp] of [[64,1],[32,.5],[16,.25],[8,.13],[4,.06]]){const n=256/cell,g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=R.f();
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){const gx=x/cell,gy=y/cell,x0=gx|0,y0=gy|0,fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=g[(y0%n)*n+x0%n],b=g[(y0%n)*n+(x0+1)%n],c=g[((y0+1)%n)*n+x0%n],d=g[((y0+1)%n)*n+(x0+1)%n];hf[y*256+x]+=amp*((a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy);}}
    let mn=1e9,mx=-1e9;for(const v of hf){mn=Math.min(mn,v);mx=Math.max(mx,v);}const wl=R.ri(40,80),ex=R.rf(1.1,1.6);
    const HM=new Uint8Array(65536),CR=new Uint8Array(65536),CG=new Uint8Array(65536),CB=new Uint8Array(65536);for(let i=0;i<65536;i++){let h=Math.pow((hf[i]-mn)/(mx-mn),ex)*255;if(h<wl)h=wl;HM[i]=h|0;}
    const p=tp(R,th),t0=R.f(),water=bright(cosCol(tp(R,th),R.f()),120);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=y*256+x,h=HM[i],sl=h-HM[((y+1)&255)*256+((x+1)&255)];let c;
      if(h<=wl)c=mul(water,.55+.08*Math.sin(x*.7)*Math.cos(y*.5));else{const u=(h-wl)/(255-wl);c=cosCol(p,t0+u*.6);c=mul(c,.45+.6*u);if(u>.82)c=mixW(c,(u-.82)/.18);c=mul(c,Math.min(1.4,Math.max(.5,1+sl*.05)));}
      CR[i]=Math.min(255,c[0]);CG[i]=Math.min(255,c[1]);CB[i]=Math.min(255,c[2]);}
    const hz=bright(cosCol(tp(R,th),R.f()),190),top=mul(cosCol(tp(R,th),R.f()),.18),SKY=new Uint32Array(H);gradTo(SKY,0,H,[st(0,top),st(.32,mul(hz,.55)),st(.5,hz),st(1,hz)]);
    return{type:'voxel',label:'Voxel flight',HM,CR,CG,CB,SKY,fog:hz,spd:R.rf(30,60),turn:R.rf(.08,.18),alt:R.rf(40,70),vx:R.rf(0,256),vy:R.rf(0,256),vh:200};},
  object:(R,th)=>{const kind=R.wpick(['torus','knot','blob'],[2,3,2]);let mesh,label;
    if(kind==='torus'){const r=R.rf(.3,.5);mesh=paramMesh((u,v)=>[(1+r*Math.cos(v))*Math.cos(u),(1+r*Math.cos(v))*Math.sin(u),r*Math.sin(v)],26,12,true);label='Gouraud torus';}
    else if(kind==='knot'){const [p,q]=R.pick([[2,3],[3,2],[2,5],[3,4],[3,5]]),tr=R.rf(.16,.26),C=u=>[(2+Math.cos(q*u))*Math.cos(p*u)*.45,(2+Math.cos(q*u))*Math.sin(p*u)*.45,Math.sin(q*u)*.45];
      mesh=paramMesh((u,v)=>{const c=C(u),c2=C(u+.001),Tn=norm3([c2[0]-c[0],c2[1]-c[1],c2[2]-c[2]]),Nn=norm3(cross3(Tn,[0,0,1])),B=cross3(Tn,Nn);return[c[0]+tr*(Math.cos(v)*Nn[0]+Math.sin(v)*B[0]),c[1]+tr*(Math.cos(v)*Nn[1]+Math.sin(v)*B[1]),c[2]+tr*(Math.cos(v)*Nn[2]+Math.sin(v)*B[2])];},84,8,true);label='Torus knot '+p+','+q;}
    else{const k1=R.ri(2,6),k2=R.ri(2,5),a=R.rf(.15,.32);mesh=paramMesh((u,v)=>{const r=1+a*Math.sin(k1*u)*Math.sin(k2*v);return[r*Math.sin(v)*Math.cos(u),r*Math.sin(v)*Math.sin(u),r*Math.cos(v)];},28,14,false);label='Blob object';}
    const p=tp(R,th),P=new Uint32Array(256);const b1=mul(cosCol(tp(R,th),R.f()),.22),b2=mul(cosCol(tp(R,th),R.f()),.38);gradTo(P,0,16,[st(0,b1),st(1,b2)]);palRamp(p,R.f(),R.f()+.5,.2,.18,P,16,240);
    return{type:'object',label,mesh,bg:R.pick(['checker','raster','stars']),rs:[R.rf(.3,1),R.rf(.3,1),R.rf(.1,.5)],flat:R.chance(.3),zoff:R.rf(3.8,4.6),pal:P};},
  bobs:(R,th)=>{const P=new Uint32Array(256);for(let k=0;k<4;k++){const c=bright(cosCol(tp(R,th),R.f()),170);gradTo(P,k*64,64,[st(0,[0,0,0]),st(.72,c),st(1,[255,255,250])]);}
    const kinds=['sphere','cube','torus','helix','knot','ring','wave'],seq=[];for(let i=0;i<4;i++)seq.push(R.pick(kinds));return{type:'bobs',label:'Vector bobs',shapes:seq.map(k=>bobShape(k,R)),pal:P,spin:[R.rf(.4,1),R.rf(.3,.8)]};},
  moire:(R,th)=>{const n=R.pick([2,2,3]),cs=[];for(let i=0;i<n;i++)cs.push({ax:R.rf(.3,.85),ay:R.rf(.3,.85),fx:R.rf(.2,.9),fy:R.rf(.2,.9),ph:R.rf(0,6)});
    const a=bright(cosCol(tp(R,th),R.f()),200),b=mul(cosCol(tp(R,th),R.f()),.6),P=new Uint32Array(256);gradTo(P,0,128,[st(0,mul(b,.25)),st(1,b)]);gradTo(P,128,128,[st(0,mul(a,.5)),st(1,mixW(a,.3))]);
    return{type:'moire',label:'Interference',cs,sh:R.ri(3,5),pal:P};},
  metaballs:(R,th)=>{const n=R.ri(4,7),bs=[];for(let i=0;i<n;i++)bs.push({ax:R.rf(50,130),ay:R.rf(30,80),fx:R.rf(.3,1.2),fy:R.rf(.3,1.2),ph:R.rf(0,6),r:R.rf(18,34)});
    const p=tp(R,th),P=new Uint32Array(256),bands=R.ri(3,6),t0=R.f();gradTo(P,0,96,[st(0,[0,0,0]),st(1,mul(cosCol(p,t0),.25))]);
    for(let i=96;i<256;i++){const u=(i-96)/160,bq=Math.floor(u*bands)/bands,edge=(u*bands)%1<.12;let c=bright(cosCol(p,t0+.15+bq*.6),120+bq*120);if(edge)c=mixW(c,.5);P[i]=rgbA(c);}
    return{type:'metaballs',label:'Metaballs',bs,pal:P};},
  twister:(R,th)=>{const P=new Uint32Array(256);const bg=cosCol(tp(R,th),R.f());gradTo(P,0,64,[st(0,mul(bg,.08)),st(.5,mul(bg,.35)),st(1,mul(bg,.08))]);
    for(let k=0;k<4;k++){const c=bright(cosCol(tp(R,th),R.f()+k*.25),180);gradTo(P,64+k*48,48,[st(0,mul(c,.15)),st(.8,c),st(1,mixW(c,.5))]);}
    return{type:'twister',label:'Twister',w:R.rf(34,60),amp:R.rf(.6,2.6),k:R.rf(.008,.03),sp:R.rf(.8,2.2)*(R.chance(.5)?1:-1),sp2:R.rf(.5,1.5),wob:R.rf(0,50),stripe:R.chance(.6),pal:P,count:R.wpick([1,2],[3,1])};},
  kaleido:(R,th,nm)=>{const segs=R.ri(5,10),KA=new Uint16Array(N),KR=new Float32Array(N),seg=1024/segs;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,li=(y+100)*LW+(x+160);let a=lutA[li]%seg;const s=Math.floor(lutA[li]/seg);if(s&1)a=seg-a;KA[i]=a|0;KR[i]=lutR[li]/2;}
    return{type:'kaleido',label:'Kaleidoscope '+segs,KA,KR,tex:tex256(R,R.pick(['blobs','xor','noise','rings']),null),rs:R.rf(.2,.7)*(R.chance(.5)?1:-1),z:R.rf(.5,1.3),vx:R.rf(-40,40),vy:R.rf(10,60),cyc:R.rf(15,50),pal:palCycle(tp(R,th))};},
};
function norm3(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];}
function cross3(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function paramMesh(fn,U,V,wrapV){const VV=wrapV?V:V+1,P=[],Nn=[],tris=[],e=1e-3;
  for(let i=0;i<U;i++)for(let j=0;j<VV;j++){const u=i/U*2*Math.PI,v=wrapV?j/V*2*Math.PI:.03+j/V*(Math.PI-.06),p=fn(u,v),pu=fn(u+e,v),pv=fn(u,v+e);
    const n=norm3(cross3([pu[0]-p[0],pu[1]-p[1],pu[2]-p[2]],[pv[0]-p[0],pv[1]-p[1],pv[2]-p[2]]));P.push(p[0],p[1],p[2]);Nn.push(n[0],n[1],n[2]);}
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){const jn=wrapV?(j+1)%V:j+1;if(!wrapV&&j>=V)continue;const a=i*VV+j,b=((i+1)%U)*VV+j,c=((i+1)%U)*VV+jn,d=i*VV+jn;tris.push(a,b,c,a,c,d);}
  let mr=0;for(let i=0;i<P.length;i+=3)mr=Math.max(mr,Math.hypot(P[i],P[i+1],P[i+2]));for(let i=0;i<P.length;i++)P[i]/=mr*.72;
  const n=P.length/3;return{P:new Float32Array(P),Nn:new Float32Array(Nn),tris:new Uint32Array(tris),n,X:new Float32Array(n),Y:new Float32Array(n),Z:new Float32Array(n),C:new Float32Array(n),ord:[]};}
function bobShape(k,R){const NB=64,a=[];for(let i=0;i<NB;i++){let p;const t=i/NB*2*Math.PI;
  if(k==='sphere'){const y=1-2*(i+.5)/NB,r=Math.sqrt(1-y*y),th=i*2.39996;p=[Math.cos(th)*r,y,Math.sin(th)*r];}
  else if(k==='cube')p=[(i&3)/1.5-1,((i>>2)&3)/1.5-1,(i>>4)/1.5-1];
  else if(k==='torus'){const u=(i%16)/16*2*Math.PI,v=Math.floor(i/16)/4*2*Math.PI;p=[(.75+.3*Math.cos(v))*Math.cos(u),(.75+.3*Math.cos(v))*Math.sin(u),.3*Math.sin(v)];}
  else if(k==='helix'){const s=i&1?Math.PI:0;p=[Math.cos(t*3+s)*.6,(i/NB)*2-1,Math.sin(t*3+s)*.6];}
  else if(k==='knot'){const rr=.75+.32*Math.cos(3*t);p=[rr*Math.cos(2*t),rr*Math.sin(2*t),.38*Math.sin(3*t)];}
  else if(k==='ring'){const ring=i>>4,u=(i&15)/16*2*Math.PI,ax=ring/4*Math.PI;p=[Math.cos(u)*Math.cos(ax),Math.sin(u),Math.cos(u)*Math.sin(ax)];}
  else{const x=(i&7)/3.5-1,z=(i>>3)/3.5-1;p=[x,Math.sin(x*3)*Math.cos(z*3)*.4,z];}
  a.push(p);}return a;}

/* =============================== EFFECT DRAW =============================== */
const TXb=[0,1,2,3].map(()=>new Int32Array(W)),TYb=[0,1,2,3].map(()=>new Int32Array(H)),AMP=new Float32Array(4);
const FB=new Uint8Array(W*(H+2)),ybuf=new Int32Array(W);
function drawBg(kind,pt){
  if(kind==='checker'){const sh=(T*30)|0;for(let y=0;y<H;y++){const row=y*W;for(let x=0;x<W;x++)ib[row+x]=((x+y+sh)>>4)&1?3:12;}}
  else if(kind==='raster'){for(let y=0;y<H;y++){const v=Math.sin(y*.06+T*2)*.5+.5,c=(v*15)|0;ib.fill(c,y*W,y*W+W);}}
  else{ib.fill(0);starfieldIdx();}
}
function starfieldIdx(){for(const s of stars){const sx=(160+s.x/s.z*160)|0,sy=(100+s.y/s.z*100/1.2)|0;if(sx>=0&&sx<W&&sy>=0&&sy<H)ib[sy*W+sx]=15;}}
function tri(ax,ay,ac_,bx,by,bc,cx2,cy,cc){let t;if(ay>by){t=ax;ax=bx;bx=t;t=ay;ay=by;by=t;t=ac_;ac_=bc;bc=t;}if(ay>cy){t=ax;ax=cx2;cx2=t;t=ay;ay=cy;cy=t;t=ac_;ac_=cc;cc=t;}if(by>cy){t=bx;bx=cx2;cx2=t;t=by;by=cy;cy=t;t=bc;bc=cc;cc=t;}
  const dAC=cy-ay;if(dAC<=0)return;const y0=Math.max(0,Math.ceil(ay)),y1=Math.min(H-1,Math.ceil(cy)-1);
  for(let y=y0;y<=y1;y++){const u=(y-ay)/dAC;let xa=ax+(cx2-ax)*u,ca=ac_+(cc-ac_)*u,xb,cb;
    if(y<by){const d=by-ay,s=d>0?(y-ay)/d:0;xb=ax+(bx-ax)*s;cb=ac_+(bc-ac_)*s;}else{const d=cy-by,s=d>0?(y-by)/d:0;xb=bx+(cx2-bx)*s;cb=bc+(cc-bc)*s;}
    if(xa>xb){t=xa;xa=xb;xb=t;t=ca;ca=cb;cb=t;}const xs=Math.max(0,Math.ceil(xa)),xe=Math.min(W-1,Math.ceil(xb)-1),dx=xb-xa,dc=dx>0?(cb-ca)/dx:0;let c=ca+(xs-xa)*dc;const row=y*W;
    for(let x=xs;x<=xe;x++){ib[row+x]=c<16?16:c>255?255:c|0;c+=dc;}}}
const LD=norm3([-.45,-.7,-.55]),HV=norm3([LD[0],LD[1],LD[2]-1]);
const SPR=[];for(let r=0;r<=12;r++){const ry=Math.max(1,Math.round(r/1.2)),w=2*r+1,h=2*ry+1,d=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const nx=(x-r)/(r+.5),ny=(y-ry)/(ry+.5),q=nx*nx+ny*ny;if(q>1){d[y*w+x]=0;continue;}const nz=Math.sqrt(1-q),l=Math.max(0,-.5*nx-.6*ny+.62*nz);d[y*w+x]=Math.max(1,Math.min(63,(6+l*44+Math.pow(l,18)*40)|0));}SPR.push({r,ry,w,h,d});}
const BP=Array.from({length:64},(_,i)=>({x:0,y:0,z:0,i}));

const DRAW={
  title(s,pt,dt){ib.fill(0);pal.set(s.pal);starfield(dt,.32+beat()*.4,0,256);flush();
    for(let b=0;b<3;b++){const cy=100+Math.sin(T*1.5+b*2.1)*72,c=s.bars[b];for(let dy=-8;dy<=8;dy++){const y=(cy+dy)|0;if(y<0||y>=H)continue;const k=1-Math.abs(dy)/9,col=rgb(c[0]*k,c[1]*k,c[2]*k),row=y*W;for(let x=0;x<W;x++)if(ib[row+x]===0)out[row+x]=col;}}
    const g=names.group,t=names.title;
    if(pt<2.6){const sc=fitSc(g,3),sh=g.slice(0,Math.min(g.length,Math.floor(pt*9)));drawText(sh,cxText(g,sc),100-sc*4,sc,s.c1,true);}
    else if(pt<4.2)drawText('PRESENTS',cxText('PRESENTS',2),92,2,s.c2,true);
    else{const sc=fitSc(t,4);drawText(t,cxText(t,sc),92-sc*4,sc,s.c1,true);if(pt>5){const l=names.party;drawText(l,cxText(l,1),118,1,s.c2,true);}}
    return false;},
  credits(s,pt,dt){ib.fill(0);pal.set(s.pal);starfield(dt,.18,0,256);flush();
    const dur=ROWS*rowDur(),total=s.lines.length*10+H,off=H-(pt/dur)*total;
    s.lines.forEach((l,i)=>{const y=(off+i*10)|0;if(y<-10||y>=H)return;const head=['CODE','MUSIC','GRAPHICS','GREETINGS TO'].includes(l);drawText(l,cxText(l,1),y,1,head?s.head:s.body,true);});return false;},
  plasma(s,pt){const n=s.terms.length;for(let i=0;i<n;i++){const t=s.terms[i],ph=T*t.sp*KS;AMP[i]=t.amp;for(let x=0;x<W;x++)TXb[i][x]=(x*t.fx*KS)|0;for(let y=0;y<H;y++)TYb[i][y]=(y*t.fy*KS+ph)|0;}
    const ox=(160+Math.sin(T*s.o1)*130)|0,oy=(100+Math.cos(T*s.o2)*90)|0,rk=s.rk*KS/2,rph=(T*s.rs*KS)|0,ra=s.ra*(1+beat()*.9+en[2]*.3),off=T*s.cyc,sc=s.scale;
    for(let y=0;y<H;y++){const base=(y+oy)*LW+ox,row=y*W;for(let x=0;x<W;x++){let v=0;for(let i=0;i<n;i++)v+=AMP[i]*SINT[(TXb[i][x]+TYb[i][y])&1023];v+=ra*SINT[(((lutR[base+x]*rk)|0)-rph)&1023];ib[row+x]=(128+v*sc+off)&255;}}
    pal.set(s.pal);return true;},
  tunnel(s,pt){pal.set(s.pal);const ox=(160+Math.sin(T*s.w1)*s.wob)|0,oy=(100+Math.cos(T*s.w2)*s.wob*.7)|0,sa=(T*s.sa)|0,sd=(T*s.sd+beat()*s.kick)|0,tw=s.twist,rep=s.rep,tex=s.tex;
    for(let y=0;y<H;y++){const base=(y+oy)*LW+ox,row=y*W;for(let x=0;x<W;x++){const i=base+x,d=lutD[i];ib[row+x]=lutS[i]+tex[(((d+sd)&255)<<8)|((((lutA[i]*rep)>>2)+sa+((d*tw)>>4))&255)];}}return true;},
  roto(s,pt){if(s.cyc){const o=(T*s.cyc)|0;for(let i=0;i<256;i++)pal[i]=s.pal[(i+o)&255];}else pal.set(s.pal);
    const a=T*s.rs,z=(s.z0+s.z1*Math.sin(T*s.zs))*(1-beat()*.12),ca=Math.cos(a)*z,sa=Math.sin(a)*z,F=65536,dux=(ca*F)|0,dvx=(sa*F)|0,duy=(-sa*1.2*F)|0,dvy=(ca*1.2*F)|0;
    let u0=((128+T*s.vx)*F-160*dux-100*duy)|0,v0=((128+T*s.vy)*F-160*dvx-100*dvy)|0;const tex=s.tex;
    for(let y=0;y<H;y++){let u=u0,v=v0;const row=y*W;for(let x=0;x<W;x++){ib[row+x]=tex[(((v>>16)&255)<<8)|((u>>16)&255)];u+=dux;v+=dvx;}u0+=duy;v0+=dvy;}return true;},
  fire(s,pt,dt){pal.set(s.pal);if(!s.mask)s.mask=fireMask(s.word);const M=s.mask,heat=Math.min(1,.55+.45*Math.min(1,pt/(ROWS*rowDur()))+snr()*.2);
    s.acc=(s.acc||0)+dt;let n=0;while(s.acc>1/60&&n<3){s.acc-=1/60;n++;const b1=H*W,b2=(H+1)*W;for(let x=0;x<W;x++){FB[b1+x]=rn()<.5*heat+.1?255:0;FB[b2+x]=rn()<.5*heat+.1?255:20;}
      for(let y=0;y<H;y++){const r=y*W,r1=r+W,r2=r1+W;for(let x=0;x<W;x++){const xl=x?x-1:W-1,xr=x<W-1?x+1:0;let v=(FB[r1+xl]+FB[r1+x]+FB[r1+xr]+FB[r2+x])>>2;v-=v>1?(rn()<s.cool?2:1):v;if(M[r+x]){const h=(170+rn()*85)*heat|0;if(h>v)v=h;}FB[r+x]=v;}}}
    ib.set(FB.subarray(0,N));return true;},
  voxel(s,pt,dt){const phi=T*s.turn+Math.sin(T*.31)*.5,sp=Math.sin(phi),cp=Math.cos(phi);s.vx-=sp*dt*s.spd;s.vy-=cp*dt*s.spd;
    const HM=s.HM,ix=(s.vx|0)&255,iy=(s.vy|0)&255,ax=((s.vx-sp*14)|0)&255,ay=((s.vy-cp*14)|0)&255,tgt=Math.max(HM[iy*256+ix],HM[ay*256+ax])+s.alt;s.vh+=(tgt-s.vh)*Math.min(1,dt*2.2);
    const hor=58+Math.sin(T*.5)*8+beat()*3,sc=118;for(let y=0;y<H;y++)out.fill(s.SKY[y],y*W,y*W+W);ybuf.fill(H);let z=1,dz=.55;const ZMAX=260,F=s.fog;
    while(z<ZMAX){let plx=-cp*z-sp*z+s.vx,ply=sp*z-cp*z+s.vy;const prx=cp*z-sp*z+s.vx,pry=-sp*z-cp*z+s.vy,ddx=(prx-plx)/W,ddy=(pry-ply)/W,f=Math.pow(z/ZMAX,1.5),fi=1-f,fr=F[0]*f,fg=F[1]*f,fb=F[2]*f,inv=sc/z;
      for(let i=0;i<W;i++){const idx=(((ply|0)&255)<<8)|((plx|0)&255);let hs=((s.vh-HM[idx])*inv+hor)|0;if(hs<0)hs=0;if(hs<ybuf[i]){const col=rgb(s.CR[idx]*fi+fr,s.CG[idx]*fi+fg,s.CB[idx]*fi+fb);for(let y=hs;y<ybuf[i];y++)out[y*W+i]=col;ybuf[i]=hs;}plx+=ddx;ply+=ddy;}z+=dz;dz+=.012;}
    return false;},
  object(s,pt,dt){pal.set(s.pal);if(s.bg==='stars'){for(const st_ of stars){st_.z-=dt*.25;if(st_.z<=.02){st_.z=1;st_.x=rn()*2-1;st_.y=rn()*2-1;}}}drawBg(s.bg,pt);
    const m=s.mesh,a=T*s.rs[0],b=T*s.rs[1],c=T*s.rs[2],sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b),sc=Math.sin(c),cc=Math.cos(c),zoff=s.zoff-beat()*.35,f=255;
    const rot=(x,y,z,o)=>{let t=y*ca-z*sa;z=y*sa+z*ca;y=t;t=x*cb+z*sb;z=-x*sb+z*cb;x=t;t=x*cc-y*sc;y=x*sc+y*cc;x=t;o[0]=x;o[1]=y;o[2]=z;},v=[0,0,0],nv=[0,0,0];
    for(let i=0;i<m.n;i++){rot(m.P[i*3],m.P[i*3+1],m.P[i*3+2],v);rot(m.Nn[i*3],m.Nn[i*3+1],m.Nn[i*3+2],nv);const z=v[2]+zoff;m.X[i]=160+v[0]/z*f;m.Y[i]=100+v[1]/z*f/1.2;m.Z[i]=z;
      const df=Math.abs(nv[0]*LD[0]+nv[1]*LD[1]+nv[2]*LD[2]),spc=Math.pow(Math.abs(nv[0]*HV[0]+nv[1]*HV[1]+nv[2]*HV[2]),24);m.C[i]=Math.min(255,26+df*190+spc*60+en[4]*20);}
    const tr=m.tris,nt=tr.length/3;if(m.ord.length!==nt){m.ord=Array.from({length:nt},(_,i)=>i);m.dep=new Float32Array(nt);}
    for(let k=0;k<nt;k++)m.dep[k]=m.Z[tr[k*3]]+m.Z[tr[k*3+1]]+m.Z[tr[k*3+2]];m.ord.sort((p,q)=>m.dep[q]-m.dep[p]);
    for(const k of m.ord){const A=tr[k*3],B=tr[k*3+1],C=tr[k*3+2];if(s.flat){const cc_=(m.C[A]+m.C[B]+m.C[C])/3;tri(m.X[A],m.Y[A],cc_,m.X[B],m.Y[B],cc_,m.X[C],m.Y[C],cc_);}else tri(m.X[A],m.Y[A],m.C[A],m.X[B],m.Y[B],m.C[B],m.X[C],m.Y[C],m.C[C]);}
    return true;},
  bobs(s,pt,dt){pal.set(s.pal);ib.fill(0);starfield(dt,.22,192,48);const rd=rowDur(),rowf=pt/rd,bar=Math.min(3,(rowf/16)|0),m0=Math.min(1,(rowf-bar*16)/6),mm=m0*m0*(3-2*m0),A=s.shapes[(bar+3)%4],B=s.shapes[bar];
    const a=T*s.spin[0],b=T*s.spin[1],sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b),scl=1.15*(1+beat()*.18);
    for(let i=0;i<64;i++){let x=(A[i][0]+(B[i][0]-A[i][0])*mm)*scl,y=(A[i][1]+(B[i][1]-A[i][1])*mm)*scl,z=(A[i][2]+(B[i][2]-A[i][2])*mm)*scl;let t=x*ca-z*sa;z=x*sa+z*ca;x=t;t=y*cb-z*sb;z=y*sb+z*cb;y=t;BP[i].x=x;BP[i].y=y;BP[i].z=z+4;BP[i].i=i;}
    BP.sort((p,q)=>q.z-p.z);for(const p of BP){const sp=SPR[Math.max(2,Math.min(12,(30/p.z)|0))],x0=(160+p.x/p.z*230)|0,y0=(98+p.y/p.z*230/1.2)|0,hue=(p.i&3)*64;
      for(let y=0;y<sp.h;y++){const py=y0-sp.ry+y;if(py<0||py>=H)continue;for(let x=0;x<sp.w;x++){const v=sp.d[y*sp.w+x];if(!v)continue;const px=x0-sp.r+x;if(px<0||px>=W)continue;ib[py*W+px]=hue+v;}}}return true;},
  moire(s,pt){pal.set(s.pal);const o=s.cs.map(c=>[(160+Math.sin(T*c.fx+c.ph)*c.ax*150)|0,(100+Math.cos(T*c.fy+c.ph)*c.ay*95)|0]),sh=s.sh,inv=snr()>.6?1:0,n=o.length;
    for(let y=0;y<H;y++){const row=y*W,b0=(y+o[0][1])*LW+o[0][0],b1=(y+o[1][1])*LW+o[1][0],b2=n>2?(y+o[2][1])*LW+o[2][0]:0;
      for(let x=0;x<W;x++){const r0=lutR[b0+x],r1=lutR[b1+x];let v=(r0>>sh)^(r1>>sh);if(n>2)v^=lutR[b2+x]>>sh;v=(v^inv)&1;ib[row+x]=(v<<7)|((127-((r0>>2)&127))>>0);}}return true;},
  metaballs(s,pt){pal.set(s.pal);const n=s.bs.length,bx=new Float32Array(n),by=new Float32Array(n),br=new Float32Array(n),pul=1+en[2]*.25+beat()*.15;
    s.bs.forEach((b,i)=>{bx[i]=160+Math.sin(T*b.fx+b.ph)*b.ax;by[i]=100+Math.cos(T*b.fy+b.ph*1.3)*b.ay;br[i]=b.r*b.r*pul;});
    for(let y=0;y<H;y++){const row=y*W;for(let x=0;x<W;x++){let f=0;for(let i=0;i<n;i++){const dx=x-bx[i],dy=(y-by[i])*1.2;f+=br[i]/(dx*dx+dy*dy+1);}ib[row+x]=f>=1?Math.min(255,96+((f-1)*60)|0):(f*95)|0;}}return true;},
  twister(s,pt){pal.set(s.pal);for(let y=0;y<H;y++){const v=(Math.sin(y*.05+T*1.4)*.5+.5)*63;ib.fill(v|0,y*W,y*W+W);}
    for(let k=0;k<s.count;k++){const cxo=s.count===1?160:(k?220:100);
      for(let y=0;y<H;y++){const a=T*s.sp+k+Math.sin(y*s.k+T*s.sp2)*s.amp,cxx=cxo+Math.sin(y*.02+T+k)*s.wob,w=s.w*(1+beat()*.12),xs=[0,1,2,3].map(i=>cxx+Math.sin(a+i*Math.PI/2)*w),row=y*W,str=s.stripe&&(((y+T*40)|0)>>3)&1;
        for(let i=0;i<4;i++){const x0=xs[i],x1=xs[(i+1)%4];if(x1<=x0)continue;const sh=(x1-x0)/(1.42*w),xa=Math.max(0,x0|0),xb=Math.min(W-1,x1|0);
          for(let x=xa;x<=xb;x++){const u=(x-x0)/(x1-x0+1e-3),l=sh*(.55+.45*Math.sin(u*Math.PI))*(str?.8:1);ib[row+x]=64+i*48+Math.min(47,(l*47)|0);}}}}return true;},
  kaleido(s,pt){const o=(T*s.cyc)|0;for(let i=0;i<256;i++)pal[i]=s.pal[(i+o)&255];const rot=(T*s.rs*KS)|0,z=s.z*(1-beat()*.15),ox=128+T*s.vx,oy=128+T*s.vy,tex=s.tex,KA=s.KA,KR=s.KR;
    for(let i=0;i<N;i++){const ai=(KA[i]+rot)&1023,r=KR[i]*z;ib[i]=tex[((((r*SINT[ai]+oy)|0)&255)<<8)|(((r*COST[ai]+ox)|0)&255)];}return true;},
};
function fireMask(word){const M=new Uint8Array(N),fs=Math.min(32,Math.floor(300/Math.max(1,word.length))),g=document.createElement('canvas');g.width=W;g.height=H;const k=g.getContext('2d',{willReadFrequently:true});
  k.fillStyle='#fff';k.textAlign='center';k.textBaseline='middle';k.font=fs+'px '+FACE;k.fillText(word,160,96);const d=k.getImageData(0,0,W,H).data;for(let i=0;i<N;i++)M[i]=d[i*4+3]>120?1:0;return M;}
function scroller(text,cols,amp){const L=text.length*16,pos=(T*72)%(L+W);for(let pass=0;pass<2;pass++)for(let x=0;x<W;x++){const tx=(x+pos-W)|0;if(tx<0||tx>=L)continue;const k=text.charCodeAt(tx>>4)-32;if(k<=0||k>=96)continue;
  const gx=(tx&15)>>1,y0=(166+Math.sin(x*.034+T*2.6)*amp)|0;for(let r=0;r<16;r++){if(!GL[k*64+(r>>1)*8+gx])continue;if(pass===0){const px=x+1,py=y0+r+2;if(px<W&&py<H&&py>=0)out[py*W+px]=0xff120a0a;}else{const py=y0+r;if(py>=0&&py<H)out[py*W+x]=cols[r];}}}}
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
})();
