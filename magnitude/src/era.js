/* Era idioms: the same allowance as Free form, but each tier builds its structure from the habits of its own era of demoscene music.
     400K "2003"  trance and progressive: the song is built by layering. One part enters or leaves every 8 bars; a breakdown strips
                  the drums away, a snare roll builds, the climax brings everything back, the outro takes it apart again.
     4M   "2012"  EDM: build and drop. Hooks as call and response, a pre-drop gap, a big-room or half-time drop, and a second drop
                  that either switches style or lifts the key.
     40M  "2026"  cinematic hybrid scoring: acts instead of verses. Leitmotifs change mood with the story (solemn, darker, threatening,
                  heroic, remembered), ostinatos and drones carry tension, hits mark the cuts, two motifs meet at the climax. */
const ERA_LABEL={1:'2003 trance and progressive',2:'2012 EDM',3:'2026 cinematic scoring'};
function arrangeEra(song,L){
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
    const intro=R.pick([[['kick'],['kick','hats']],[['hats'],['hats','kick']],[['kick','hats'],['kick','hats','bass']]]);
    group('Intro');intro.forEach((ly,i)=>leaf({role:'intro',name:i?`intro + ${ly[ly.length-1]}`:`intro: ${ly.join(', ')}`,layers:ly,drums:'four',bassStyle:'pulse'}));
    const grow=R.chance(.5)?['bass','arp']:['arp','bass'];let cur=intro[intro.length-1].slice();
    group('Groove');for(const g of grow){if(cur.includes(g))continue;cur=cur.concat(g);leaf({role:'bridge',name:`groove + ${g}`,layers:cur.slice(),drums:'four',bassStyle:'pulse'});}
    if(!cur.includes('snare')){cur=cur.concat('snare');}
    group('Theme');leaf({name:'theme A',layers:cur.concat('lead'),drums:'four',bassStyle:'pulse'});leaf({name:'theme A + pad',layers:cur.concat('lead','pad'),drums:'four',bassStyle:'pulse',xf:['vary']});
    group('Breakdown');const bm=R.chance(.5)?'B':'A';leaf({role:'break',mat:bm,name:'breakdown: pad',layers:['pad','fx'],drums:'none',energy:.15});
    leaf({role:'break',mat:bm,name:`breakdown + theme ${bm}`,layers:['pad','lead','fx'],drums:'none',xf:['augment'],energy:.25});
    group('Build');leaf({role:'build',name:'build: snare roll',layers:['snare','pad','arp','fx','bass'],energy:.7});
    const cb=R.pick([16,16,32]);group('Climax');for(let b=0;b<cb;b+=8)leaf({role:'drop',name:b?`climax ${b/8+1}, in thirds`:'climax',layers:ALL.slice(),drums:'four',bassStyle:'octave',xf:b?['octave','harmony']:['octave'],energy:1});
    group('Outro');let out=['kick','hats','snare','bass','arp','pad'];for(const rm of ['pad','arp','bass']){out=out.filter(x=>x!==rm);leaf({role:'outro',name:`outro − ${rm}`,layers:out.slice(),drums:'four',bassStyle:'pulse'});}
  }
  else if(L===2){
    // ---- 2012: build and drop
    const style=R.pick(['four','half']),other=style==='four'?'half':'four',switchUp=R.chance(.55);
    const dropLeaf=(name,st,o={})=>leaf(Object.assign({role:'drop',name,drums:st,bassStyle:st==='half'?'sub':'octave',energy:1,layers:ALL.slice(),xf:[]},o));
    group('Intro');leaf({role:'intro',name:'intro',layers:['pad','arp','hats','fx'],drums:'hats',energy:.2});
    group('Verse');leaf({name:'verse: call',layers:['kick','hats','bass','pad','lead'],drums:'groove',bassStyle:'pulse',xf:['callresp','thin'],energy:.5});
    leaf({name:'verse: call and answer',layers:['kick','hats','snare','bass','pad','lead','arp'],drums:'groove',bassStyle:'pulse',xf:['callresp'],energy:.6});
    group('Build');leaf({role:'build',name:'build',layers:['snare','pad','arp','fx','bass','lead'],xf:['fragment']});
    group('Drop');dropLeaf(style==='half'?'drop (half-time)':'drop',style);dropLeaf('drop, answered',style,{xf:['callresp','harmony']});
    group('Break');leaf({role:'break',mat:'B',name:'break',layers:['pad','lead','fx'],drums:'none',xf:['augment'],energy:.2,bars:R.pick([8,16])});
    group('Build 2');leaf({role:'build',name:'build 2',layers:['snare','pad','arp','fx','bass','lead','kick'],xf:['fragment']});
    group('Drop 2');if(switchUp){dropLeaf(other==='half'?'switch-up (half-time)':'switch-up (four)',other);dropLeaf('switch-up, answered',other,{xf:['callresp','harmony']});}
    else{dropLeaf('drop 2, lifted',style,{key:{tr:up},xf:['transpose','octave']});dropLeaf('drop 2, in thirds',style,{key:{tr:up},xf:['transpose','harmony']});}
    group('Outro');leaf({role:'outro',name:'outro',layers:['pad','arp','hats','kick','fx'],drums:'groove',energy:.3});
  }
  else{
    // ---- 2026: acts and leitmotifs
    const len=()=>R.pick([8,10,12,12,16]),odd=R.chance(.6)?R.pick([12,14,20]):16,bFirst=R.chance(.3);
    group('Opening');leaf({role:'intro',name:'opening: drone',inst:'piano',layers:['pad','lead','fx'],xf:['drone','swell','augment'],energy:.15,bars:len()});
    group('Act I');const stA=leaf({name:'A · statement',inst:'oboe',bars:len(),energy:.6,layers:['pad','arp','lead','bass','counter']});
    const stB=leaf({mat:'B',name:'B · introduced',inst:'bell',key:{tr:0,rel:true},xf:['hit'],bars:len(),energy:.5,layers:['pad','arp','lead','bass','hats']});
    if(bFirst){grp.kids.reverse();}
    group('Act II');leaf({name:'A · darker',inst:'oboe',xf:['modal','ostinato'],drums:'tribal',bars:len(),energy:.55,layers:['pad','arp','lead','kick','hats','bass']});
    leaf({mat:'C',name:'C · threat',inst:'piano',xf:['invert','ostinato'],drums:'tribal',meter:odd,bars:len(),energy:.65,layers:['arp','lead','kick','hats','bass','pad']});
    leaf({role:'build',name:'pursuit',xf:['ostinato','fragment'],bars:8,energy:.8,layers:['arp','snare','kick','pad','fx','lead','bass']});
    group('Act III');leaf({role:'climax',name:'A · heroic',inst:'leadx',xf:['hit','octave','harmony'],drums:'groove',bars:R.pick([12,16]),energy:1,layers:ALL.slice()});
    if(R.chance(.7))leaf({role:'climax',name:'A meets B',xf:['combine'],drums:'half',bars:len(),energy:.9,layers:ALL.slice()});
    group('Epilogue');leaf({role:'outro',name:'A · remembered',inst:'piano',xf:['augment','drone','modal'],bars:8,energy:.2,layers:['pad','lead','fx']});
  }
  const leaves=[];for(const g of tree.kids)for(const k of g.kids){k.group=g.label;leaves.push(k);}
  const out=renderPlan(song,L,leaves,TH,INST,R);
  return Object.assign(out,{tree,era:true,themes:TH,inst:INST});
}
