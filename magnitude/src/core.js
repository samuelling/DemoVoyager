/* Demoseed core: seed -> names -> composition. Shared by the 400K, 4M and 40M tiers.
   The composition code is the same as Demoseed 40K's, so every tier from 40K up plays the same song for a seed. */
const ROWS=64,CH=6,SR=22050;
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
    P.ch=Array.from({length:ROWS},(_,r)=>cx.chordAt(r));P.tr=cx.tr;P.name=name;
    return P;
  }
  const pats=[],patOf={},sections=[];
  for(const name of form){if(!(name in patOf)){patOf[name]=pats.length;pats.push(build(name));}sections.push({name,pat:patOf[name]});}
  const progTxt=p=>p.map(d=>{const c=chord(d),q=c.third===3?'m':'';const rn=ROMAN[d];return(c.third===3?rn.toLowerCase():rn)+(c.fifth===6?'°':'');}).join('-');
  return{seed,key,modeName,iv,bpm,speed,swing,pats,sections,inst:null,dStyle,minor,
    mat:{P1,P2,s1,s2,D,hStyle,bassT,bassStac,arpType,vib,modUp,m:[m1,m2,m3,m4],sh1,sh2,start1,start2,leadBase,bassBase,chord},
    desc:{key:KEYN[key]+' '+modeName,prog1:progTxt(P1),prog2:progTxt(P2),drums:{four:'FOUR TO THE FLOOR',break:'BREAKBEAT',half:'HALF-TIME',electro:'ELECTRO'}[dStyle],modUp}};
}

