/* Free structure: each tier writes its own form instead of sharing one.
   The song's material (key, mode, motifs, progressions, groove) stays the same, so only the structure changes.
   What each tier may use grows with its allowance:
     400K  one level: a string of 8-bar sections over two themes; returns get one change (varied, octave, thinned).
     4M    two levels: parts made of sections, three themes, related keys, builds and drops, returns with up to two
           transformations (transposed, fragmented, augmented, reharmonised, half-time, harmonised).
     40M   three levels: movements, sections and phrases of irregular length, five themes, a tonal plan, odd meters,
           returns with up to three transformations (adds inversion, retrograde, diminution, canon, modal mixture),
           themes heard together in counterpoint.
   Every section records what it is (role, material, transformations, key, meter, energy) so the player can draw the form. */
const FREE_SPEC={
  1:{themes:2,nx:1,xf:['vary','octave','thin'],keys:[0],
     pieces:[['AABA'],['ABAB'],['AABAB'],['ABkAB'],['AABkB']],
     lens:{state:[8,8,16],ret:[8,16],break:[8]}},
  2:{themes:3,nx:2,xf:['vary','octave','thin','transpose','fragment','augment','reharm','halftime','harmony'],keys:['rel',5,'up'],
     pieces:[['A|bd|kB|bd','Verse','Drop','Break','Drop 2'],['AB|bd|A|kbd','Verse','Drop','Verse 2','Finale'],['AB|AC|bd|A','Part A','Part B','Peak','Return'],
             ['AtB|bd|kA|bd','Opening','Drop','Interlude','Final drop'],['AB|bdC|kbd','Verse','Drop','Finale']],
     lens:{state:[8,16,16],ret:[8,16],build:[8],drop:[16],break:[8,16],bridge:[4]}},
  3:{themes:5,nx:3,xf:['vary','octave','thin','transpose','fragment','augment','reharm','halftime','harmony','invert','retro','diminish','canon','modal'],keys:['rel',5,7,'up',-2,3],
     pieces:[['AtB|xxb|cBA','Exposition','Development','Recapitulation'],['AB|AC|xb|AD|c','Refrain I','Refrain II','Episode','Refrain III','Apotheosis'],
             ['AB|CxC|bcBA','Rise','Summit','Return'],['Av|vv|xb|cA','Theme','Variations','Development','Finale'],['AtBC|xb|cCBA','Exposition','Development','Mirror recapitulation']],
     lens:{state:[8,12,16],ret:[8,12,16],build:[6,8],climax:[16],break:[8,12],bridge:[4,6],development:[10,12,16],variation:[8,12],combine:[12,16]}},
};
const XF_LABEL={vary:'varied',octave:'octave up',thin:'thinned',transpose:'transposed',fragment:'fragmented',augment:'augmented',reharm:'reharmonised',halftime:'half-time',
  harmony:'in thirds',invert:'inverted',retro:'retrograde',diminish:'diminished',canon:'canon',modal:'modal mixture',meter:'odd meter',sub:'answer',sequence:'sequence',combine:'counterpoint'};

function arrangeFree(song,L){
  const SP=FREE_SPEC[L],R=Rng(hashSeed(song.seed,600+L)),M=song.mat,minor=song.minor,up=M.modUp||2;
  const okIn=(iv,d)=>degS(iv,d+4)-degS(iv,d)===7;
  const pool=(minor?PROG_MIN:PROG_MAJ).filter(p=>p.every(d=>okIn(song.iv,d)));
  // ---- themes: A and B are the song's own; C, D, E are new material grown from the same seed
  const LETTERS='ABCDE',TH={};
  const mkTheme=(motifs,shape,prog,start)=>{let alt=pool.filter(p=>p.join()!==prog.join());alt=alt.length?R.pick(alt):prog;
    const relShift=minor?2:5,rel=prog.map(d=>{const r=(d+relShift)%7;return okIn(song.iv,r)?r:d;});return{motifs,shape,prog,start,alt,rel};};
  TH.A=mkTheme({A:M.m[0],B:M.m[1],C:varyMotif(R,M.m[0])},M.sh1,M.P1,M.start1);
  TH.B=mkTheme({A:M.m[2],B:M.m[3],C:varyMotif(R,M.m[2])},M.sh2,M.P2,M.start2);
  for(let k=2;k<SP.themes;k++){const a=makeMotif(R),b=makeMotif(R);TH[LETTERS[k]]=mkTheme({A:a,B:b,C:varyMotif(R,a)},R.pick(['AABA','ABAC','AAAB','ABAB','AABC']),R.pick(pool.length?pool:[M.P1]),R.pick([0,2,4]));}
  const INST=L===1?{A:'lead',B:'harm'}:L===2?{A:'lead',B:'keys',C:'harm'}:{A:'oboe',B:'bell',C:'piano',D:'lead',E:'keys'};
  // ---- 1. plan: tokens -> nodes, grouped into parts / movements
  const [pc,...gnames]=R.pick(SP.pieces),groups=pc.split('|');
  const keyOf={A:{tr:0}},seen={},nodes=[],tree={label:'piece',kids:[]};let vcount=0,drops=0,xcount=0;
  const keyFrom=k=>k==='rel'?{tr:0,rel:true}:k==='up'?{tr:up}:{tr:k>6?k-12:k};
  const pickXf=(n,ban=[])=>{const pool2=SP.xf.filter(x=>!ban.includes(x)),out=[];while(out.length<n&&pool2.length){const x=pool2.splice(R.ri(0,pool2.length-1),1)[0];
    if((x==='augment'&&out.includes('diminish'))||(x==='diminish'&&out.includes('augment')))continue;out.push(x);}return out;};
  const lenOf=role=>R.pick((SP.lens[role]||SP.lens.state));
  groups.forEach((g,gi)=>{const grp={label:gnames[gi]||null,kids:[]};
    for(const ch of g){let n;
      if(/[A-E]/.test(ch)){const first=!seen[ch];seen[ch]=(seen[ch]||0)+1;
        if(first){if(!keyOf[ch])keyOf[ch]=SP.keys.length>1?keyFrom(R.pick(SP.keys.filter(k=>k!==0))):{tr:0};
          n={role:'state',mat:ch,xf:[],key:keyOf[ch],bars:lenOf('state')};}
        else{const xf=pickXf(R.ri(1,SP.nx));n={role:'ret',mat:ch,xf,prime:seen[ch]-1,bars:lenOf('ret'),
          key:xf.includes('transpose')?{tr:R.pick([5,-2,up,3])}:ch==='A'?{tr:0}:keyOf[ch]};}}
      else if(ch==='b')n={role:'build',mat:'A',xf:[],bars:lenOf('build')};
      else if(ch==='d'){n={role:'drop',mat:'A',xf:drops?['octave']:[],key:{tr:drops?up:0},bars:lenOf('drop')};drops++;}
      else if(ch==='c'){n={role:L===3?'climax':'drop',mat:'A',xf:L===3&&seen.B?['combine']:[],key:{tr:drops?0:up},bars:lenOf(L===3?'combine':'drop')};if(L===3)n.bars=lenOf('climax');drops++;}
      else if(ch==='k')n={role:'break',mat:seen.B?'B':'A',xf:SP.xf.includes('augment')?['augment']:[],key:{tr:0},bars:lenOf('break')};
      else if(ch==='t')n={role:'bridge',mat:'A',xf:['fragment'],bars:lenOf('bridge')};
      else if(ch==='x'){n={role:'development',mat:xcount%2&&seen.B?'B':'A',xf:['fragment','sequence'].concat(pickXf(1,['vary','thin','octave','transpose','fragment'])),key:{tr:0},bars:lenOf('development')};xcount++;}
      else if(ch==='v'){vcount++;n={role:'variation',mat:'A',xf:pickXf(Math.min(3,vcount),['transpose']),key:{tr:0},var:vcount,bars:lenOf('variation')};}
      if(L===3&&/development|variation|break/.test(n.role)&&R.chance(.55)){n.meter=R.pick([12,14,20]);n.xf.push('meter');}
      if(n.xf.includes('modal')&&n.role!=='ret'&&n.role!=='variation')n.xf=n.xf.filter(x=>x!=='modal');
      n.meter=n.meter||16;grp.kids.push(n);nodes.push(n);}
    tree.kids.push(grp);});
  // keys for builds and bridges come from what follows them
  nodes.forEach((n,i)=>{if(!n.key){const nx=nodes.slice(i+1).find(m=>m.key);n.key=nx?nx.key:{tr:0};}});
  // intro and outro wrap the piece
  const intro={role:'intro',mat:'A',xf:[],key:{tr:0},bars:8,meter:16},outro={role:'outro',mat:'A',xf:L===3&&minor?['modal']:[],key:{tr:0},bars:8,meter:16};
  tree.kids.unshift({label:null,kids:[intro]});tree.kids.push({label:null,kids:[outro]});nodes.unshift(intro);nodes.push(outro);
  // energy: a base per role, shaped by an arc that peaks near the golden section
  const BASE={intro:.15,state:.5,ret:.65,build:.6,drop:.95,climax:1,break:.2,bridge:.45,development:.6,variation:.45,outro:.25};
  nodes.forEach((n,i)=>{const p=i/(nodes.length-1);let e=BASE[n.role]+(n.role==='state'&&n.mat!=='A'?.05:0)+(n.var?n.var*.1:0);
    if(!/drop|climax|break|intro|outro/.test(n.role))e+=.18*Math.exp(-Math.pow((p-.62)/.25,2))-.05;n.energy=Math.max(.1,Math.min(1,e));});
  // 40M: long statements and returns split into phrases (a third level)
  const leaves=[];let sg=0;
  for(const grp of tree.kids){grp.kids=grp.kids.map(n=>{n.sg=sg++;
    if(L===3&&/state|ret|variation/.test(n.role)&&n.bars>=12&&R.chance(.8)){const pat=R.pick(n.bars===12?[[[6,6],'aa′'],[[4,4,4],'aba'],[[4,8],'ab']]:[[[8,8],'aa′'],[[4,4,8],'aab'],[[8,4,4],'abb′'],[[4,4,4,4],'aba′b']]);
      const kids=pat[0].map((b,j)=>{const c=pat[1].replace(/′/g,'')[j],pr=pat[1].split(/(?=[ab])/)[j].includes('′');
        return Object.assign({},n,{bars:b,xf:n.xf.concat(c==='b'?['sub']:[],pr?['vary']:[]),phrase:c+(pr?'′':''),energy:Math.min(1,n.energy+j*.04)});});
      kids.forEach(k=>leaves.push(k));return{label:`${n.mat}: ${pat[1]}`,kids,node:n};}
    leaves.push(n);return n;});}
  // names
  const PR=['','′','″','‴','⁗'];
  for(const n of leaves){const m=n.mat+(n.prime?PR[Math.min(4,n.prime)]:'');
    n.name=n.role==='state'?`theme ${n.mat}`+(n.phrase?` ${n.phrase}`:''):n.role==='ret'?m+(n.phrase?` ${n.phrase}`:''):n.role==='variation'?`variation ${n.var}`+(n.phrase?` ${n.phrase}`:''):n.role;}
  const out=renderPlan(song,L,leaves,TH,INST,R);
  return Object.assign(out,{tree,free:true,themes:TH,inst:INST});
}


// which layer of a mix an instrument belongs to (used to switch layers in and out, and to count them)
const LAYER_OF={kick:'kick',taiko:'kick',crash:'kick',hat:'hats',ohat:'hats',shaker:'hats',snare:'snare',clap:'snare',tom:'snare',bass:'bass',arp:'arp',pluck:'arp',harp:'arp',
  pad:'pad',strings:'pad',choir:'pad',stab:'pad',lead:'lead',leadx:'lead',oboe:'lead',bell:'lead',keys:'lead',piano:'lead',harm:'lead',echo:'lead',counter:'counter',riser:'fx',impact:'fx',sweep:'fx',timp:'fx'};
const layerOf=i=>LAYER_OF[i]||'fx';
function renderPlan(song,L,leaves,TH,INST,R){
  const M=song.mat,minor=song.minor,okIn=(iv,d)=>degS(iv,d+4)-degS(iv,d)===7;
  const ev=[],secs=[];let R0=0;const vl=voicer();
  const add=(i,t,o={})=>{ev.push(Object.assign({i,t:R0+t},o));};
  const par=minor?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];
  for(const n of leaves){const ev0=ev.length,BL=n.meter,bars=n.bars,len=BL*bars,iv=n.xf.includes('modal')?par:song.iv,tr=n.key.tr,e=n.energy,T=TH[n.mat],X=x=>n.xf.includes(x);
    secs.push({name:n.name,start:R0,len,bars,meter:BL,role:n.role,mat:n.mat,xf:n.xf.slice(),layers:n.layers||null,group:n.group||null,key:tr+(n.key.rel?(minor?3:-3):0),rel:!!n.key.rel,energy:e,sg:n.sg});
    const ch=d=>chordInfo(iv,d),tones=(d,t2=tr)=>{const h=ch(d),r=song.key+h.root+t2;return{root:r,pcs:[0,h.third,h.fifth].map(x=>pcl(r+x)),iv:[0,h.third,h.fifth,h.sev]};};
    // harmony per bar
    let prog=n.key.rel?T.rel:X('reharm')||X('sub')?T.alt:T.prog;const hr=X('augment')?2:1;
    let chords=Array.from({length:bars},(_,b)=>prog[Math.floor(b/hr)%prog.length]);
    if(n.role==='development'){const circ=[0,3,6,2,5,1,4,0];chords=chords.map((_,b)=>circ[b%8]);}
    if(n.role==='build')chords=chords.map((c,b)=>b>=bars/2?4:c);
    if(n.role==='bridge'||(n.role==='build'&&bars>2))chords[bars-1]=4;
    if((n.role==='ret'||n.role==='state'||n.role==='outro')&&bars>=8&&n.phrase!=='a'&&okIn(iv,4)){chords[bars-2]=4;chords[bars-1]=0;}
    chords=chords.map(d=>okIn(iv,d)||n.role==='development'?d:0);
    // melody
    const aug=X('augment')?2:X('diminish')?.5:1,base=M.leadBase,motifs=X('sub')?{A:T.motifs.B,B:T.motifs.C,C:T.motifs.A}:X('vary')?{A:T.motifs.C,B:T.motifs.B,C:T.motifs.A}:T.motifs;
    const phrase=(mot,shape,start,o={})=>{const out=[],nb=Math.max(1,Math.round(bars/aug));let a=start;
      for(let b=0;b<nb;b++){const m=mot[shape[b%shape.length]],cd=chords[Math.min(bars-1,Math.floor(b*aug))];a=nearestTone(a,cd);let d=a+(o.seq||0)*(b%4);
        let ons=m.on.filter(s=>s<BL).map((s,i)=>({s,mv:m.mv[i]}));if(o.frag)ons=ons.slice(0,o.frag);if(o.thin)ons=ons.filter((x,i)=>i===0||x.s%8===0||R.chance(.45));
        const last=b===nb-1;if(last)ons=ons.filter(x=>x.s<=8);
        ons.forEach((x,i)=>{d+=(o.inv?-1:1)*(x.mv||0);if(x.s%4===0)d=nearestTone(d,cd);if(last&&i===ons.length-1)d=nearestTone(d,cd,true);while(d>9)d-=7;while(d<-4)d+=7;out.push({t:(b*BL+x.s)*aug,deg:d});});}
      out.forEach((q,i)=>{const nx=i+1<out.length?out[i+1].t:len;q.d=Math.max(.5,Math.min(nx-q.t,12*aug));});
      if(o.retro){const tot=len;out.forEach(q=>{q.t=tot-q.t-q.d;});out.reverse();}return out.filter(q=>q.t>=0&&q.t<len);};
    const play=(inst,notes,o={})=>notes.forEach(q=>add(inst,q.t+(o.off||0),{n:base+degS(iv,q.deg+(o.dd||0))+tr+(o.oct||0)*12,d:q.d,v:(o.v||1)}));
    const quiet=n.role==='intro'||n.role==='outro'||n.role==='break';
    if(!(n.role==='intro'&&L<3)){const mel=phrase(motifs,T.shape,T.start+(n.role==='drop'||n.role==='climax'?2:0),{frag:n.role==='development'||n.role==='bridge'||n.role==='build'?3:0,
        seq:n.role==='development'?-1:n.role==='build'?1:0,inv:X('invert')||(n.role==='outro'&&L===3),thin:X('thin')||quiet||e<.35,retro:X('retro')});
      let inst=n.inst||INST[n.mat]||'lead';if(!n.inst){if(L>=2&&e>.85)inst='leadx';if(L===3&&quiet)inst='piano';}
      if(X('callresp')){const resp=phrase({A:T.motifs.B,B:T.motifs.C||T.motifs.A,C:T.motifs.A},T.shape,T.start-2,{thin:true});
        play(inst,mel.filter(q=>Math.floor(q.t/BL)%2===0),{oct:X('octave')?1:0});play(n.resp||'keys',resp.filter(q=>Math.floor(q.t/BL)%2===1),{oct:-1,v:.85});}
      else play(inst,mel,{oct:(X('octave')?1:0)-(quiet&&L<3?1:0),v:quiet?.75:1});
      if(L===1&&e>.45)play('echo',mel,{off:3,v:.35});
      if(X('harmony')||(L>=2&&e>.8))play(L===3?'counter':'harm',mel,{dd:-2,v:.5});
      if(X('canon'))play('counter',mel.filter(q=>q.t+8<len).map(q=>({...q,t:q.t+8})),{dd:-2,oct:-1,v:.6});
      if(X('combine')){const B=TH.B,m2=phrase(B.motifs,B.shape,B.start-2,{});play(INST.B||'bell',m2,{oct:-1,v:.8});}
      // 40M: a counter-melody on the beat, chord tones moving against the tune
      if(L===3&&e>.55&&!X('canon')&&!X('combine')){let c=null;for(let t=0;t<len;t+=4){const Tn=tones(chords[Math.floor(t/BL)]),mq=mel.filter(q=>q.t<=t).pop(),mn=mq?base+degS(iv,mq.deg)+tr:base;
          let best=null,bs=1e9;for(let x=base-17;x<=base-3;x++){if(!Tn.pcs.includes(pcl(x)))continue;let s=c===null?Math.abs(x-(base-10)):Math.abs(x-c);if(mn-x<3)s+=20;if(pcl(mn-x)===0||pcl(mn-x)===7)s+=4;if(s<bs){bs=s;best=x;}}
          if(best!==null){add('counter',t,{n:best,d:4,v:.45});c=best;}}}}
    // accompaniment by energy
    const padI=L===3?'strings':'pad';
    chords.forEach((c,b)=>{const Tn=tones(c),v=vl(Tn.pcs.concat(e>.7?[pcl(Tn.root+Tn.iv[3])]:[]).slice(0,4),48,72);add(padI,b*BL,{ns:X('drone')?v.slice(0,2):v,d:BL,v:(quiet?.6:.75)*(X('swell')?.35+.65*b/Math.max(1,bars-1):1)});
      if(L===3&&e>.8)add('choir',b*BL,{ns:v,d:BL,v:.55});});
    if(e>.3||n.role==='intro'){const ai=X('ostinato')?'pluck':L===3?(e<.5?'harp':'pluck'):'arp',st=X('ostinato')||(L===3&&e>.8)?1:2;chords.forEach((c,b)=>{const Tn=tones(c);for(let r=0;r<BL;r+=st){const k=r/st|0,idx=[0,1,2,1,0,2,1,3][k%8];
        add(ai,b*BL+r,{n:60+pcl(Tn.root)+[0,Tn.iv[1],Tn.iv[2],12][idx],d:ai==='harp'?6:1.5,v:(n.role==='intro'?.2+.6*(b*BL+r)/len:.6)*(r%4?.75:1)});}});}
    // bass
    const bStyle=n.bassStyle||(n.role==='build'?'pedal':n.role==='intro'?'none':quiet?'sub':e>.85?'octave':L===3&&e<.6?'walk':e<.45?'pulse':'tracker');
    chords.forEach((c,b)=>{const Tn=tones(c),root=M.bassBase-song.key+Tn.root,b0=b*BL;
      if(bStyle==='sub')add('bass',b0,{n:root,d:BL,v:.7});else if(bStyle==='pulse')for(let r=0;r<BL;r+=2)add('bass',b0+r,{n:root,d:1.6,v:r%4?.6:.9});
      else if(bStyle==='octave')for(let r=0;r<BL;r+=2)add('bass',b0+r,{n:root+(r%4===2?12:0),d:1.5,v:1});
      else if(bStyle==='pedal')for(let r=0;r<BL;r++)add('bass',b0+r,{n:M.bassBase+degS(iv,4)+tr,d:.8,v:.5+.5*(b0+r)/len});
      else if(bStyle==='walk')for(let q=0;q*4<BL;q++)add('bass',b0+q*4,{n:root+[0,Tn.iv[2],12,Tn.iv[1],7][q%5],d:3.5,v:.85});
      else if(bStyle==='tracker')for(let r=0;r<BL;r++){if(!M.bassT.steps.includes(r%16))continue;add('bass',b0+r,{n:root+(M.bassT.oct.includes(r%16)?12:0),d:M.bassStac?1.5:2,v:.9});}});
    // drums: the groove follows the meter; modes by role and energy
    const mode=n.drums||(n.role==='build'?'roll':n.role==='intro'?(L===1?'hats':'none'):n.role==='break'?'none':X('halftime')?'half':e<.35?'hats':L===3&&e<.6?'tribal':e>.85&&BL===16?'four':'groove');
    const MET={12:{K:[0],S:[4,8],G:[]},14:{K:[0,8],S:[4,11],G:[]},20:{K:[0,12],S:[8,16],G:[]},16:M.D};const D=MET[BL]||M.D;
    for(let b=0;b<bars;b++){const B=b*BL,fill=(b===bars-1)&&mode!=='roll'&&mode!=='none'&&n.role!=='outro';
      for(let s=0;s<BL;s++){const t=B+s,inF=fill&&s>=BL-4;
        if(mode==='four'){if(s%4===0&&!inF)add('kick',t,{v:1});if(s===4||s===12)add(L>=2?'clap':'snare',t,{v:1});if(s%4===2)add('ohat',t,{v:.55});if(L>=2)add('shaker',t,{v:s%2?.35:.5});}
        else if(mode==='groove'){if(D.K.includes(s)&&!inF)add('kick',t,{v:1});if(D.S.includes(s)&&!inF)add('snare',t,{v:1});if(D.G.includes(s))add('snare',t,{v:.3});if(s%2===0)add('hat',t,{v:s%4?.5:.8});}
        else if(mode==='half'){if(s===0)add('kick',t,{v:1});if(s===Math.floor(BL/2))add('snare',t,{v:1});if(s%2===0)add('hat',t,{v:.5});}
        else if(mode==='hats'){if(s%2===0)add('hat',t,{v:s%4?.4:.6});}
        else if(mode==='tribal'){if(s===0||s===6||s===10)add('taiko',t,{v:s?.6:1});if(s%4===2)add('shaker',t,{v:.4});}
        else if(mode==='roll'){const q=t/len,step=q<.25?4:q<.5?2:q<.75?1:.5,gap=b===bars-1&&s>=BL-4,sv=.3+.7*q;if(!gap&&b<bars-1&&s%4===0)add('kick',t,{v:.8});if(!gap&&s%Math.max(1,step)===0){add(L>=2?'clap':'snare',t,{v:sv});if(step<1)add('snare',t+.5,{v:sv*.8});}}
        if(inF)add(R.chance(.5)?'tom':'snare',t,{v:.5+.1*(s-BL+4),n:[50,47,45,43][s-BL+4]});}}
    if(mode==='four'||mode==='groove'){if(n.role==='drop'||n.role==='climax'||R.chance(.5))add('crash',0,{v:1});}
    // effects by era
    if(L>=2){if(n.role==='build'){add('riser',0,{d:len});add('sweep',0,{d:len-4,dir:1});}
      if(n.role==='drop'||n.role==='climax'){add('impact',0);add('sweep',0,{d:4,dir:0});}
      if(n.role==='break'||n.role==='outro')add('sweep',0,{d:len,dir:-1});
      if(L===2&&e>.85)for(let b=0;b<bars;b++)for(const s of [4,12])if(s<BL){const Tn=tones(chords[b]);add('stab',b*BL+s,{ns:[0,1,2].map(j=>60+pcl(Tn.root)+Tn.iv[j]),d:1.5,v:.7});}}
    if(L===3){if(n.role==='build')for(let r=Math.floor(len/2);r<len;r++)add('timp',r,{n:36+pcl(song.key+tr)+degS(iv,4),v:(r-len/2)/(len/2)});
      if(n.role==='climax')for(let b=0;b<bars;b+=4)add('taiko',b*BL,{v:1});
      if(n.role==='outro'){const fin=tones(0);add('piano',len-32,{n:48+pcl(fin.root),d:32,v:.6});add('timp',len-32,{n:36+pcl(song.key),v:.8});}}
    if(X('hit')){add('impact',0);if(L===3)add('taiko',0,{v:1});add('crash',0,{v:.8});}
    // explicit layers (era idioms): keep only the instruments whose layer is switched on
    if(n.layers){const keep=new Set(n.layers);const kept=ev.splice(ev0).filter(q=>keep.has(layerOf(q.i)));ev.push(...kept);}
    R0+=len;}
  ev.sort((a,b)=>a.t-b.t);
  return{ev,secs,rows:R0};
}
