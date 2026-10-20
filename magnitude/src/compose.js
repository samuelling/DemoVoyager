/* Recomposition from the song's raw materials (key, mode, two progressions, four motifs, phrase shapes, groove).
   L2 (4M, "2012"): build-and-drop form in 8/16-bar phrases; hook derived from motif A; builds sequence motif fragments
                    upward over a dominant pedal with an accelerating snare roll and a silent gap; breakdown on the second
                    progression with motif B at half speed; second drop modulates.
   L3 (40M, "2026"): through-composed: prelude, theme A, theme B in the relative key, development (fragmentation,
                    sequence round the circle of fifths, canon), build, climax (modulated, counter-melody, secondary-dominant
                    cadence), coda (inverted motif, Picardy third). */
function Comp(song,k){
  const M=song.mat,iv=song.iv,R=Rng(hashSeed(song.seed,k)),ev=[],secs=[],vl=voicer();let R0=0;
  const C={M,R,ev,secs,iv,key:song.key,
    add(i,t,o={}){const e=Object.assign({i,t:R0+t},o);ev.push(e);return e;},
    get R0(){return R0;},sec(name,bars){secs.push({name,start:R0,len:bars*16});},adv(bars){R0+=bars*16;},
    deg2(d,base,tr=0){return base+degS(iv,d)+tr;},
    // chord spec: either a scale degree, or {r: semitones from key, q:'M'|'m'} for chromatic chords
    tones(c,tr=0){if(typeof c==='number'){const h=M.chord(c),r=song.key+h.root+tr;return{root:r,deg:c,pcs:[0,h.third,h.fifth].map(x=>pcl(r+x)),iv:[0,h.third,h.fifth,h.sev]};}
      const r=song.key+c.r+tr,th=c.q==='M'?4:3;return{root:r,deg:c.d??0,pcs:[0,th,7].map(x=>pcl(r+x)),iv:[0,th,7,c.q==='M'?10:10]};},
    ok(d){const h=M.chord(d);return h.fifth===7;},
  };
  // melody from motifs: per motif-bar chord degrees -> notes {t,deg,d}
  C.phrase=(motifs,shape,bars,anchor,o={})=>{const out=[],aug=o.aug||1;let a=anchor;
    for(let b=0;b<bars.length;b++){const m=motifs[shape[b%shape.length]],cd=typeof bars[b]==='number'?bars[b]:bars[b].d??0;a=nearestTone(a,cd);let d=a+(o.seq||0)*b;
      let ons=m.on.map((s,i)=>({s,mv:m.mv[i]}));if(o.frag)ons=ons.slice(0,o.frag);if(o.thin)ons=ons.filter((x,i)=>i===0||x.s%8===0||R.chance(.45));
      const last=o.cad&&b===bars.length-1;if(last)ons=ons.filter(x=>x.s<=8);
      ons.forEach((x,i)=>{d+=(o.inv?-1:1)*(x.mv||0);if(x.s%4===0)d=nearestTone(d,cd);if(last&&i===ons.length-1)d=nearestTone(d,cd,true);while(d>(o.hi??9))d-=7;while(d<(o.lo??-4))d+=7;out.push({t:(b*16+x.s)*aug,deg:d});});}
    out.forEach((n,i)=>{const nx=i+1<out.length?out[i+1].t:bars.length*16*aug;n.d=Math.max(1,Math.min(nx-n.t,o.maxd||12*aug));});return out;};
  C.play=(inst,notes,base,tr,o={})=>notes.map(n=>C.add(inst,n.t+(o.off||0),{n:C.deg2(n.deg,base,tr)+(o.oct||0)*12,d:n.d*(o.leg||1),v:(o.v||1)*(n.v||1)}));
  // pads: one voicing per chord, voice-led
  C.pads=(inst,chords,len,tr,o={})=>chords.forEach((c,i)=>{const T=C.tones(c,tr),v=vl(T.pcs.concat(o.sev?[pcl(T.root+T.iv[3])]:[]).slice(0,4),o.lo||48,o.hi||72).map(n=>n+(o.oct||0)*12);
    if(o.split)v.forEach(n=>C.add(inst,(o.off||0)+i*len,{n,d:len,v:o.v||1}));else C.add(inst,(o.off||0)+i*len,{ns:v,d:len,v:o.v||1});});
  C.arp=(inst,chords,len,tr,o={})=>chords.forEach((c,i)=>{const T=C.tones(c,tr),st=o.step||2,pat=o.pat||[0,1,2,1,0,2,1,3];for(let r=0;r<len;r+=st){const k=r/st|0,idx=pat[k%pat.length],n=(o.base||60)+pcl(T.root)+[0,T.iv[1],T.iv[2],12][idx];
    C.add(inst,(o.off||0)+i*len+r,{n:n+((o.lift&&(k%8)>=6)?12:0),d:o.d||1.5,v:(o.v||.8)*(r%4?.75:1)*(o.ramp?(i*len+r)/(chords.length*len)*.8+.2:1)});}});
  C.bass=(inst,chords,len,tr,style,o={})=>chords.forEach((c,i)=>{const T=C.tones(c,tr),root=M.bassBase-song.key+T.root,nx=chords[i+1]!==undefined?C.tones(chords[i+1],tr).root:null,b0=i*len;
    if(style==='sub')C.add(inst,b0,{n:root,d:len,v:o.v||1});
    else if(style==='pulse')for(let r=0;r<len;r+=2)C.add(inst,b0+r,{n:root,d:1.6,v:(o.v||1)*(r%4?.7:1)});
    else if(style==='octave')for(let r=0;r<len;r+=2)C.add(inst,b0+r,{n:root+(r%4===2?12:0),d:1.5,v:o.v||1});
    else if(style==='pedal')for(let r=0;r<len;r++)C.add(inst,b0+r,{n:M.bassBase+degS(iv,o.ped??4)+tr,d:.8,v:(o.v||1)*(.5+.5*r/len)});
    else if(style==='walk')for(let q=0;q<len/4;q++){let n=root+[0,T.iv[2],12,T.iv[1]][q%4];if(q===len/4-1&&nx!==null)n=M.bassBase-song.key+nx+(R.chance(.5)?-1:1);C.add(inst,b0+q*4,{n,d:3.5,v:o.v||1});}
    else{const st=M.bassT.steps;for(let r=0;r<len;r++){const s=r%16;if(!st.includes(s))continue;C.add(inst,b0+r,{n:root+(M.bassT.oct.includes(s)?12:0)+(M.bassT.fifth.includes(s)?T.iv[2]:0),d:M.bassStac?1.5:2,v:o.v||1});}}});
  // drums by mode across `bars` bars
  C.drums=(bars,mode,o={})=>{const D=M.D,v=o.v||1;
    for(let b=0;b<bars;b++){const B=b*16,phraseEnd=(b%8)===7||b===bars-1,fill=o.fills!==false&&phraseEnd&&mode!=='roll';
      for(let s=0;s<16;s++){const t=B+s,inFill=fill&&s>=12;
        if(mode==='four'){if(s%4===0&&!(inFill&&s>12))C.add('kick',t,{v});if(s===4||s===12)C.add(o.clap?'clap':'snare',t,{v});if(s%4===2)C.add('ohat',t,{v:.55*v});if(o.shaker)C.add('shaker',t,{v:(s%2?.35:.5)*v});}
        else if(mode==='groove'){if(D.K.includes(s)&&!inFill)C.add('kick',t,{v});if(D.S.includes(s)&&!inFill)C.add(o.clap?'clap':'snare',t,{v});if(D.G.includes(s))C.add('snare',t,{v:.3*v});if(s%2===0)C.add('hat',t,{v:(s%4?.5:.8)*v});}
        else if(mode==='half'){if(s===0||s===10&&R.chance(.5))C.add('kick',t,{v});if(s===8)C.add('snare',t,{v});if(s%2===0)C.add('hat',t,{v:.5*v});}
        else if(mode==='hats'){if(s%2===0)C.add('hat',t,{v:(s%4?.4:.6)*v});}
        else if(mode==='tribal'){if(s===0||s===6||s===10)C.add('taiko',t,{v:(s?.6:1)*v});if(s%4===2)C.add('shaker',t,{v:.4*v});}
        else if(mode==='roll'){const q=b/bars,step=q<.25?4:q<.5?2:q<.75?1:.5,gap=b===bars-1&&s>=12,sv=v*(.3+.7*(b*16+s)/(bars*16));if(!gap&&b<bars-1&&s%4===0)C.add('kick',t,{v:v*.8});
          if(!gap&&s%Math.max(1,step)===0){C.add(o.clap?'clap':'snare',t,{v:sv});if(step<1)C.add('snare',t+.5,{v:sv*.8});}}
        if(inFill&&mode!=='hats'&&mode!=='none'){C.add(R.chance(.5)?'tom':'snare',t,{v:.5+.1*(s-12),n:[50,47,45,43][s-12]});}}
      if(o.crash&&b===0)C.add('crash',0,{v});}};
  return C;
}

/* ---------------- L2: 2012 build-and-drop ---------------- */
function composeL2(song){
  const C=Comp(song,21),M=C.M,R=C.R,P1=M.P1,P2=M.P2,mot1={A:M.m[0],B:M.m[1],C:varyMotif(R,M.m[0])},mot2={A:M.m[2],B:M.m[3],C:varyMotif(R,M.m[2])};
  const lead=M.leadBase,up=M.modUp||2,bars=(p,n)=>Array.from({length:n},(_,i)=>p[i%p.length]);
  const hook=C.phrase(mot1,M.sh1,bars(P1,4),M.start1,{cad:true});
  // intro: pads + filtered arp, hats creep in
  C.sec('intro',8);C.pads('pad',bars(P1,8),16,0,{v:.7});C.arp('arp',bars(P1,8),16,0,{ramp:true,v:.7});C.drums(8,'hats',{v:.6,fills:false});C.add('sweep',0,{d:128,dir:1});C.adv(8);
  // verse: motif A an octave down, thinned; tracker groove; pulse bass
  C.sec('verse',16);C.pads('pad',bars(P1,16),16,0,{v:.6});C.bass('bass',bars(P1,16),16,0,'pulse');C.drums(16,'groove',{crash:true});
  for(let k=0;k<4;k++)C.play('lead',C.phrase(mot1,M.sh1,bars(P1,4),M.start1,{thin:true,cad:k%2===1}).map(n=>({...n,t:n.t+k*64})),lead,0,{oct:-1,v:.85});
  C.arp('arp',bars(P1,16),16,0,{v:.55,step:4});C.add('sweep',0,{d:256,dir:0});C.adv(16);
  // build: dominant pedal, motif fragment rising by step each bar, accelerating roll, riser, silence before the drop
  const build=(name)=>{C.sec(name,8);const ch=[P1[0],P1[1],4,4,P1[2],P1[3],4,4].map(d=>C.ok(d)?d:4);C.pads('pad',ch,16,0,{v:.8});C.bass('bass',bars([4],8),16,0,'pedal',{ped:4,v:.8});
    C.play('lead',C.phrase(mot1,'AAAAAAAA',bars([4],8),M.start1,{frag:3,seq:1}),lead,0,{v:.8});C.drums(8,'roll',{clap:true});C.add('riser',0,{d:128});C.add('sweep',0,{d:120,dir:1});C.adv(8);};
  build('build');
  // drop: hook twice (second ending lifted), octave bass, four-on-the-floor, offbeat stabs, shaker, crash + impact
  const drop=(name,tr)=>{C.sec(name,16);C.add('impact',0);C.add('sweep',0,{d:256,dir:0});C.pads('pad',bars(P1,16),16,tr,{v:.8,sev:true});C.bass('bass',bars(P1,16),16,tr,'octave');C.drums(16,'four',{clap:true,shaker:true,crash:true});
    for(let k=0;k<4;k++){const h=k===3?C.phrase(mot1,M.sh1,bars(P1,4),M.start1+2,{cad:true}):hook;C.play(tr?'leadx':'lead',h.map(n=>({...n,t:n.t+k*64})),lead,tr);
      if(tr||k>=2)C.play('harm',h.map(n=>({...n,deg:n.deg-2,t:n.t+k*64})),lead,tr,{v:.55});}
    for(let b=0;b<16;b++)for(const s of [4,12])C.add('stab',b*16+s,{ns:[0,1,2].map(j=>{const T=C.tones(P1[b%4],tr);return 60+pcl(T.root)+T.iv[j];}),d:1.5,v:.7});
    C.arp('arp',bars(P1,16),16,tr,{v:.5,lift:true});C.adv(16);};
  drop('drop',0);
  // breakdown: second progression, motif B at half speed on keys, pads, sub bass, no drums
  C.sec('break',16);C.pads('pad',bars(P2,8),32,0,{v:.9,sev:true});C.bass('bass',bars(P2,8),32,0,'sub',{v:.7});C.add('sweep',0,{d:256,dir:-1});
  C.play('keys',C.phrase(mot2,M.sh2,bars(P2,4),M.start2,{aug:2,cad:true}),lead,0,{oct:-1,v:.9});C.arp('keys',bars(P2,8),32,0,{step:4,base:48,v:.4,d:3});C.adv(16);
  build('build 2');
  drop('drop 2',up);
  // outro: groove thins out, arp fades
  C.sec('outro',8);C.pads('pad',bars(P1,8),16,0,{v:.6});C.arp('arp',bars(P1,8),16,0,{v:.6});C.drums(4,'groove',{fills:false,v:.7});C.add('sweep',0,{d:128,dir:-1});C.adv(8);
  C.ev.sort((a,b)=>a.t-b.t);return{ev:C.ev,secs:C.secs,rows:C.R0};
}

/* ---------------- L3: 2026 through-composed ---------------- */
function composeL3(song){
  const C=Comp(song,31),M=C.M,R=C.R,P1=M.P1,P2=M.P2,lead=M.leadBase,minor=song.minor,up=M.modUp||2;
  const mot1={A:M.m[0],B:M.m[1],C:varyMotif(R,M.m[0])},mot2={A:M.m[2],B:M.m[3],C:varyMotif(R,M.m[2])};
  const bars=(p,n)=>Array.from({length:n},(_,i)=>p[i%p.length]);
  // theme B harmony: centred on the relative key, built from diatonic chords that are not diminished
  const rel=(minor?[2,6,0,5]:[5,3,0,4]).map(d=>C.ok(d)?d:0);
  // circle-of-fifths sequence for the development
  const circle=[0,3,6,2,5,1,4,0];
  // counter-melody: one note per beat, chord tones, favours contrary motion, avoids parallel fifths/octaves and unisons
  const counter=(mel,chordAt,len,tr,inst,v,off=0)=>{let c=null,prevMel=null,prevIv=null;
    for(let t=0;t<len;t+=4){const T=C.tones(chordAt(t),tr),m=mel.filter(n=>n.t<=t).pop(),mn=m?C.deg2(m.deg,lead,tr):lead;
      let best=null,bs=1e9;for(let n=lead-17;n<=lead-3;n++){if(!T.pcs.includes(pcl(n)))continue;let s=c===null?Math.abs(n-(lead-10)):Math.abs(n-c);
        const iv=pcl(mn-n);if(mn-n<3)s+=20;if(prevMel!==null&&c!==null){const dm=Math.sign(mn-prevMel),dc=Math.sign(n-c);if(dm&&dm===dc)s+=3;if((iv===0||iv===7)&&iv===prevIv)s+=12;}
        if(s<bs){bs=s;best=n;}}
      if(c!==null&&Math.abs(best-c)>=3&&Math.abs(best-c)<=4)C.add(inst,off+t-2,{n:snap((best+c)>>1,song),d:2,v:v*.8});
      const m2=mel.find(n=>n.t===t+2),bad=x=>[1,2,6,10,11].includes(pcl(x));
      if(m2&&bad(C.deg2(m2.deg,lead,tr)-best)){let alt=best,ad=99;for(let n=lead-17;n<=lead-3;n++){if(!T.pcs.includes(pcl(n))||bad(C.deg2(m2.deg,lead,tr)-n))continue;const dd=Math.abs(n-best);if(dd<ad){ad=dd;alt=n;}}
        C.add(inst,off+t,{n:best,d:2,v});C.add(inst,off+t+2,{n:alt,d:2,v:v*.9});best=alt;}
      else C.add(inst,off+t,{n:best,d:4,v});prevIv=pcl(mn-best);prevMel=mn;c=best;}};
  // prelude: piano states motif A at half speed, harp arpeggios, no drums
  C.sec('prelude',8);C.play('piano',C.phrase(mot1,'AB',bars(P1,2),M.start1,{aug:4,thin:true}),lead,0,{oct:-1,v:.8});
  C.arp('harp',bars(P1,4),32,0,{step:4,base:48,v:.5,d:6});C.pads('strings',bars(P1,4),32,0,{v:.45});C.add('timp',112,{n:36+pcl(song.key),v:.6});C.adv(8);
  // theme A: full phrase twice (second varied and ending on the root), plucked ostinato, strings, soft taiko pulse
  C.sec('theme A',16);{const p1=C.phrase(mot1,M.sh1,bars(P1,4),M.start1),p2=C.phrase({A:mot1.C,B:mot1.B,C:mot1.A},M.sh1,bars(P1,4),M.start1,{cad:true});
    C.play('oboe',p1,lead,0);C.play('oboe',p2.map(n=>({...n,t:n.t+64})),lead,0);C.play('lead',p2.map(n=>({...n,t:n.t+128})),lead,0,{v:.8});C.play('lead',p1.map(n=>({...n,t:n.t+192})),lead,0,{v:.8});
    C.pads('strings',bars(P1,16),16,0,{v:.7});C.arp('pluck',bars(P1,16),16,0,{step:2,v:.55});C.bass('bass',bars(P1,16),16,0,'tracker',{v:.8});C.drums(16,'tribal',{v:.6,fills:false});}C.adv(16);
  // theme B: relative key, motif B on bells with a counter-melody, half-time drums
  C.sec('theme B',16);{const p=C.phrase(mot2,M.sh2,bars(rel,4),M.start2,{cad:true});for(let k=0;k<4;k++)C.play('bell',p.map(n=>({...n,t:n.t+k*64})),lead,0,{oct:k===3?1:0,v:.9});
    for(let k=1;k<4;k++)counter(p,t=>rel[(t>>4)%4],64,0,'counter',.5,k*64);
    C.pads('strings',bars(rel,16),16,0,{v:.75,sev:true});C.arp('pluck',bars(rel,16),16,0,{step:2,v:.5,pat:[0,2,1,3,2,1]});C.bass('bass',bars(rel,16),16,0,'walk',{v:.8});C.drums(16,'half',{v:.8,crash:true});}C.adv(16);
  // development: motif A fragments sequenced round the circle of fifths, canon a third below and two beats behind
  C.sec('development',16);{const ch=bars(circle,16),frag=C.phrase(mot1,'AAAAAAAAAAAAAAAA',ch,M.start1+2,{frag:4,seq:-1,lo:-5,hi:10});
    C.play('oboe',frag,lead,0,{v:.9});C.play('counter',frag.filter(n=>n.t+8<256).map(n=>{const t=n.t+8,cd=ch[t>>4];return{...n,t,deg:t%4===0?nearestTone(n.deg-2,cd):n.deg-2,d:Math.min(n.d,4)};}),lead,0,{oct:-1,v:.6});
    C.pads('strings',ch,16,0,{v:.8});C.arp('piano',ch,16,0,{step:4,base:48,v:.55,d:6});C.bass('bass',ch,16,0,'sub',{v:.8});C.drums(16,'tribal',{v:.8,fills:false});
    for(let b=8;b<16;b++)C.add('taiko',b*16+8,{v:.5+b*.03});}C.adv(16);
  // build: dominant pedal, pluck ostinato in 16ths, choir rising, timpani roll, snare roll, riser
  C.sec('build',8);{const ch=[P1[0],P1[1],P1[2],P1[3],4,4,4,4].map(d=>C.ok(d)?d:4);C.pads('choir',ch,16,0,{v:.6,oct:0});C.pads('strings',ch,16,0,{v:.8});
    C.arp('pluck',ch,16,0,{step:1,v:.55,pat:[0,1,2,3,2,1]});C.bass('bass',bars([4],8),16,0,'pedal',{ped:4,v:.8});C.drums(8,'roll',{});C.add('riser',0,{d:128});
    for(let r=64;r<128;r++)C.add('timp',r,{n:36+pcl(song.key)+degS(song.iv,4),v:(r-64)/64});}C.adv(8);
  // climax: theme A modulated, full orchestra, counter-melody, secondary-dominant cadence (V/V -> V -> I)
  C.sec('climax',16);{const ch=bars(P1,16);ch[13]={r:degS(song.iv,1),q:'M',d:1};ch[14]={r:degS(song.iv,4),q:'M',d:4};ch[15]=0;
    const p1=C.phrase(mot1,M.sh1,bars(P1,4),M.start1),p2=C.phrase(mot1,M.sh1,[P1[0],P1[1],4,0],M.start1,{cad:true});
    for(let k=0;k<4;k++){const p=k===3?p2:p1;C.play('leadx',p.map(n=>({...n,t:n.t+k*64})),lead,up);}
    counter([...p1,...p1.map(n=>({...n,t:n.t+64})),...p1.map(n=>({...n,t:n.t+128})),...p2.map(n=>({...n,t:n.t+192}))],t=>ch[t>>4],256,up,'counter',.55);
    C.pads('strings',ch,16,up,{v:1,sev:true});C.pads('choir',ch,16,up,{v:.7});C.arp('pluck',ch,16,up,{step:2,v:.55,lift:true});C.bass('bass',ch,16,up,'octave');
    C.drums(16,M.dStyle==='four'?'four':'groove',{clap:true,crash:true,shaker:true});C.add('impact',0);for(let b=0;b<16;b+=4)C.add('taiko',b*16,{v:1});}C.adv(16);
  // coda: motif A inverted and slowed on piano over fading strings; final chord with a Picardy third, timpani
  C.sec('coda',8);{const fin=minor?{r:0,q:'M',d:0}:0,ch=[P1[0],P1[1],P1[2],4,P1[0],3,fin,fin].map(d=>typeof d==='number'&&!C.ok(d)?0:d);
    C.play('piano',C.phrase(mot1,'AA',[P1[0],P1[1]],M.start1,{aug:2,inv:true}),lead,0,{oct:-1,v:.75});C.pads('strings',ch,16,0,{v:.6});C.arp('harp',ch.slice(0,6),16,0,{step:4,base:48,v:.4,d:6});
    C.pads('piano',[fin],32,0,{off:96,split:true,v:.6,lo:48,hi:72});C.pads('choir',[fin],32,0,{off:96,v:.5});C.add('timp',96,{n:36+pcl(song.key),v:.8});}C.adv(8);
  C.ev.sort((a,b)=>a.t-b.t);return{ev:C.ev,secs:C.secs,rows:C.R0};
}
