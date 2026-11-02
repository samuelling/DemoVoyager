/* Era idioms: the same allowance as Free form, but each tier builds its structure from the habits of its own era of demoscene music.
     400K "2003"  trance and progressive: the song is built by layering. One part enters or leaves every 8 bars; a breakdown strips
                  the drums away, a snare roll builds, the climax brings everything back, the outro takes it apart again.
     4M   "2012"  EDM: build and drop. Hooks as call and response, a pre-drop gap, a big-room or half-time drop, and a second drop
                  that either switches style or lifts the key.
     40M  "2026"  cinematic hybrid scoring: acts instead of verses. Leitmotifs change mood with the story (solemn, darker, threatening,
                  heroic, remembered), ostinatos and drones carry tension, hits mark the cuts, two motifs meet at the climax. */
const ERA_LABEL={1:'2003 trance and progressive',2:'2012 EDM',3:'2026 cinematic scoring'};
function arrangeEra(song,L,knobs){
  const K=knobs||{},used={},kv=(id,v)=>{used[id]=v;return K[id]!=null?K[id]:v;};
  const R=Rng(hashSeed(song.seed,700+L)),M=song.mat,minor=song.minor,up=M.modUp||2;
  const okIn=(iv,d)=>degS(iv,d+4)-degS(iv,d)===7,pool=(minor?PROG_MIN:PROG_MAJ).filter(p=>p.every(d=>okIn(song.iv,d)));
  const mkTheme=(motifs,shape,prog,start)=>{let alt=pool.filter(p=>p.join()!==prog.join());alt=alt.length?R.pick(alt):prog;
    const rel=prog.map(d=>{const r=(d+(minor?2:5))%7;return okIn(song.iv,r)?r:d;});return{motifs,shape,prog,start,alt,rel};};
  const TH={A:mkTheme({A:M.m[0],B:M.m[1],C:varyMotif(R,M.m[0])},M.sh1,M.P1,M.start1),B:mkTheme({A:M.m[2],B:M.m[3],C:varyMotif(R,M.m[2])},M.sh2,M.P2,M.start2)};
  if(L===3){const a=makeMotif(R),b=makeMotif(R);TH.C=mkTheme({A:a,B:b,C:varyMotif(R,a)},R.pick(['AAAB','ABAB']),R.pick(pool.length?pool:[M.P1]),R.pick([0,2]));}
  const INST=L===1?{A:'lead',B:'harm'}:L===2?{A:'lead',B:'keys'}:{A:'oboe',B:'bell',C:'piano'};
  const tree={label:'piece',kids:[]};let grp=null,sg=0;
  const group=label=>{grp={label,kids:[]};tree.kids.push(grp);sg++;};
  const leaf=o=>{const n=Object.assign({role:'state',mat:'A',xf:[],key:{tr:0},bars:8,meter:16,energy:.5,sg},o);if(n.layers)n.energy=o.energy??Math.min(1,.12+.09*n.layers.length);grp.kids.push(n);return n;};
  const ALL=['kick','hats','snare','bass','arp','pad','lead','counter','fx'];
  if(L===1){
    // ---- 2003: a layering arc, one change every 8 bars
    const INTROS=[[['kick'],['kick','hats']],[['hats'],['hats','kick']],[['kick','hats'],['kick','hats','bass']]];
    const ii=INTROS.indexOf(R.pick(INTROS)),intro=INTROS[kv('introOrder',ii)]||INTROS[ii],grow0=R.chance(.5)?['bass','arp']:['arp','bass'],bm0=R.chance(.5)?'B':'A',cb0=R.pick([16,16,32]);
    const STEP=kv('step',8),BEAT=kv('beat','four'),TS=kv('themeSteps',2),BD=kv('breakdown',16),BDK=kv('breakdownKick',false),BU=kv('build',8),CB=kv('climax',cb0),OS=kv('outroSteps',3);
    group('Intro');intro.forEach((ly,i)=>leaf({role:'intro',name:i?`intro + ${ly[ly.length-1]}`:`intro: ${ly.join(', ')}`,layers:ly,drums:BEAT,bassStyle:'pulse',bars:STEP}));
    let cur=intro[intro.length-1].slice();
    group('Groove');for(const g of grow0){if(cur.includes(g))continue;cur=cur.concat(g);leaf({role:'bridge',name:`groove + ${g}`,layers:cur.slice(),drums:BEAT,bassStyle:'pulse',bars:STEP});}
    if(!cur.includes('snare')){cur=cur.concat('snare');}
    group('Theme');for(let i=0;i<TS;i++)leaf({name:i===0?'theme A':i===1?'theme A + pad':`theme A, pass ${i+1}`,layers:i?cur.concat('lead','pad'):cur.concat('lead'),drums:BEAT,bassStyle:'pulse',xf:i?['vary']:[],bars:STEP});
    if(BD>0){group('Breakdown');const h1=Math.max(2,Math.round(BD/4)*2),h2=BD-h1,kk=BDK?['kick']:[];leaf({role:'break',mat:bm0,name:'breakdown: pad',layers:['pad','fx',...kk],drums:BDK?'four':'none',energy:.15,bars:h1});
      if(h2>0)leaf({role:'break',mat:bm0,name:`breakdown + theme ${bm0}`,layers:['pad','lead','fx',...kk],drums:BDK?'four':'none',xf:['augment'],energy:.25,bars:h2});}
    if(BU>0){group('Build');leaf({role:'build',name:'build: snare roll',layers:['snare','pad','arp','fx','bass'],energy:.7,bars:BU});}
    group('Climax');for(let b=0;b<CB;b+=8)leaf({role:'drop',name:b?`climax ${b/8+1}, in thirds`:'climax',layers:ALL.slice(),drums:BEAT,bassStyle:'octave',xf:b?['octave','harmony']:['octave'],energy:1,bars:Math.min(8,CB-b)});
    if(OS>0){group('Outro');let out=['kick','hats','snare','bass','arp','pad'];for(const rm of ['pad','arp','bass','snare'].slice(0,OS)){out=out.filter(x=>x!==rm);leaf({role:'outro',name:`outro − ${rm}`,layers:out.slice(),drums:BEAT,bassStyle:'pulse',bars:STEP});}}
  }
  else if(L===2){
    // ---- 2012: build and drop
    const style0=R.pick(['four','half']),sw0=R.chance(.55),brk0=R.pick([8,16]);
    const style=kv('dropStyle',style0),other=style==='four'?'half':'four',second=kv('secondDrop',sw0?'switch':'lift'),VB=kv('verse',16),CA=kv('callAnswer',true),BU=kv('build',8),GAP=kv('gap',1),BRK=kv('break',brk0),DB=kv('dropBars',16);
    const h=b=>[Math.max(2,Math.round(b/4)*2),b-Math.max(2,Math.round(b/4)*2)];
    const dropLeaf=(name,st,o={})=>leaf(Object.assign({role:'drop',name,drums:st,bassStyle:st==='half'?'sub':'octave',energy:1,layers:ALL.slice(),xf:[],bars:DB/2},o));
    const ca=x=>CA?x:x.filter(y=>y!=='callresp');
    group('Intro');leaf({role:'intro',name:'intro',layers:['pad','arp','hats','fx'],drums:'hats',energy:.2});
    if(VB>0){group('Verse');const [v1,v2]=VB>=8?[VB/2,VB/2]:[VB,0];leaf({name:CA?'verse: call':'verse',layers:['kick','hats','bass','pad','lead'],drums:'groove',bassStyle:'pulse',xf:ca(['callresp','thin']),energy:.5,bars:v1});
      if(v2)leaf({name:CA?'verse: call and answer':'verse 2',layers:['kick','hats','snare','bass','pad','lead','arp'],drums:'groove',bassStyle:'pulse',xf:ca(['callresp']),energy:.6,bars:v2});}
    if(BU>0){group('Build');leaf({role:'build',name:'build',layers:['snare','pad','arp','fx','bass','lead'],xf:['fragment'],bars:BU,gap:GAP});}
    group('Drop');dropLeaf(style==='half'?'drop (half-time)':'drop',style);dropLeaf(CA?'drop, answered':'drop, in thirds',style,{xf:ca(['callresp','harmony'])});
    if(second!=='none'){if(BRK>0){group('Break');leaf({role:'break',mat:'B',name:'break',layers:['pad','lead','fx'],drums:'none',xf:['augment'],energy:.2,bars:BRK});}
      if(BU>0){group('Build 2');leaf({role:'build',name:'build 2',layers:['snare','pad','arp','fx','bass','lead','kick'],xf:['fragment'],bars:BU,gap:GAP});}
      group('Drop 2');if(second==='switch'){dropLeaf(other==='half'?'switch-up (half-time)':'switch-up (four)',other);dropLeaf(CA?'switch-up, answered':'switch-up, in thirds',other,{xf:ca(['callresp','harmony'])});}
      else{dropLeaf('drop 2, lifted',style,{key:{tr:up},xf:['transpose','octave']});dropLeaf('drop 2, in thirds',style,{key:{tr:up},xf:['transpose','harmony']});}}
    group('Outro');leaf({role:'outro',name:'outro',layers:['pad','arp','hats','kick','fx'],drums:'groove',energy:.3});
  }
  else{
    // ---- 2026: acts and leitmotifs
    // every seeded choice is drawn first, in the original order, so a knob changes only what it names
    const lens=[0,0,0,0,0,0,0].map(()=>R.pick([8,10,12,12,16]));const odd0=R.chance(.6)?R.pick([12,14,20]):16,bFirst0=R.chance(.3),her0=R.pick([12,16]),meet0=R.chance(.7),meetLen=R.pick([8,10,12,12,16]);
    const SC=kv('cueScale',1),cue=b=>Math.max(4,Math.round(b*SC/2)*2),OPEN=kv('opening',lens[0]),ORDER=kv('order',bFirst0?'BA':'AB'),MOODS=kv('moods',['darker','threat','pursuit']),ODD=kv('oddMeter',odd0),
      HER=kv('heroic',her0),MEET=kv('meet',meet0),HITS=kv('hits',true),EPI=kv('epilogue',true);
    const hit=x=>HITS?x:x.filter(y=>y!=='hit');
    group('Opening');leaf({role:'intro',name:'opening: drone',inst:'piano',layers:['pad','lead','fx'],xf:['drone','swell','augment'],energy:.15,bars:OPEN});
    group('Act I');leaf({name:'A · statement',inst:'oboe',bars:cue(lens[1]),energy:.6,layers:['pad','arp','lead','bass','counter']});
    leaf({mat:'B',name:'B · introduced',inst:'bell',key:{tr:0,rel:true},xf:hit(['hit']),bars:cue(lens[2]),energy:.5,layers:['pad','arp','lead','bass','hats']});
    if(ORDER==='BA'){grp.kids.reverse();}
    if(MOODS.length){group('Act II');
      if(MOODS.includes('darker'))leaf({name:'A · darker',inst:'oboe',xf:['modal','ostinato'],drums:'tribal',bars:cue(lens[3]),energy:.55,layers:['pad','arp','lead','kick','hats','bass']});
      if(MOODS.includes('threat'))leaf({mat:'C',name:'C · threat',inst:'piano',xf:['invert','ostinato'].concat(ODD!==16?['meter']:[]),drums:'tribal',meter:ODD,bars:cue(lens[4]),energy:.65,layers:['arp','lead','kick','hats','bass','pad']});
      if(MOODS.includes('pursuit'))leaf({role:'build',name:'pursuit',xf:['ostinato','fragment'],bars:cue(8),energy:.8,layers:['arp','snare','kick','pad','fx','lead','bass']});}
    group('Act III');leaf({role:'climax',name:'A · heroic',inst:'leadx',xf:hit(['hit','octave','harmony']),drums:'groove',bars:cue(HER),energy:1,layers:ALL.slice()});
    if(MEET)leaf({role:'climax',name:'A meets B',xf:['combine'],drums:'half',bars:cue(meetLen),energy:.9,layers:ALL.slice()});
    if(EPI){group('Epilogue');leaf({role:'outro',name:'A · remembered',inst:'piano',xf:['augment','drone','modal'],bars:8,energy:.2,layers:['pad','lead','fx']});}
  }
  const leaves=[];for(const g of tree.kids)for(const k of g.kids){k.group=g.label;leaves.push(k);}
  const out=renderPlan(song,L,leaves,TH,INST,R);
  return Object.assign(out,{tree,era:true,themes:TH,inst:INST,knobs:used});
}
