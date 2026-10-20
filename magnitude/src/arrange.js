/* Scores. Every tier from 40K up starts from the same composition (genSong), then:
   L1 (400K): plays the tracker song itself, but every section runs 8 bars: the second pass is varied
              (melodic ornaments, octave lift at the phrase end, a different fill, busier bass), with voice-led pads and real arpeggios.
   L2 (4M), L3 (40M): recomposed from the song's raw materials (see compose.js).
   A score is {ev:[{i,t,n|ns,d,v}], secs:[{name,start,len}], rows}; t and d are in rows (16th notes). */
const pcl=n=>((n%12)+12)%12;
function voicer(){let voice=[52,55,59,64];return(tones,lo,hi)=>{
  let v=voice.map(n=>{let best=n,bd=99;for(let m=lo;m<=hi;m++){if(!tones.includes(pcl(m)))continue;const d=Math.abs(m-n);if(d<bd){bd=d;best=m;}}return best;});
  for(const t of tones)if(!v.some(n=>pcl(n)===t)){let k=-1;for(let j=0;j<v.length;j++)if(v.filter(m=>pcl(m)===pcl(v[j])).length>1){k=j;break;}if(k<0)break;
    let best=v[k],bd=99;for(let m=lo;m<=hi;m++){if(pcl(m)!==t)continue;const d=Math.abs(m-v[k]);if(d<bd){bd=d;best=m;}}v[k]=best;}
  v.sort((a,b)=>a-b);voice=v;return v;};}
function arrange(song,L){return L>=3?composeL3(song):L===2?composeL2(song):arrangeL1(song);}
function arrangeL1(song){
  const R=Rng(hashSeed(song.seed,11)),ev=[],secs=[],vl=voicer();
  const add=(i,t,o={})=>{const e=Object.assign({i,t},o);ev.push(e);return e;};
  const chordAbs=(P,r)=>{const c=P.ch[r],root=song.key+c.root+P.tr;return{root,deg:c.deg,tones:[0,c.third,c.fifth].map(x=>pcl(root+x))};};
  let R0=0;
  for(const sec of song.sections){
    const P=song.pats[sec.pat],nm=sec.name,passes=nm==='intro'||nm==='outro'?1:2,loud=/^A|^B/.test(nm);
    secs.push({name:nm,start:R0,len:ROWS*passes});
    for(let pass=0;pass<passes;pass++){
      const open=[null,null,null,null,null,null],close=(c,r)=>{const o=open[c];if(o){o.d=Math.max(1,R0+r-o.t);open[c]=null;}},leads=[];
      for(let r=0;r<ROWS;r++){const row=P[r],t=R0+r,fillBar=pass===1&&r>=56;
        for(let c=0;c<CH;c++){const cl=row[c];
          if(c<2){if(cl.n>0&&!(fillBar&&c===0&&cl.i!==1)){add(cl.i===1?'kick':cl.i===2?'snare':'hat',t,{v:cl.fx===0xC?cl.p/64:1});}continue;}
          if(cl.n===-1){close(c,r);continue;}
          if(cl.n>0){close(c,r);
            if(c===2){open[c]=add('bass',t,{n:cl.n,v:1,d:1});if(pass===1&&loud&&r%4===2)add('bass',t+1,{n:cl.n+12,v:.6,d:1});}
            else if(c===4){const e=add('lead',t,{n:cl.n,v:1,d:1});open[c]=e;leads.push(e);}
            else if(c===5&&cl.i===6)open[c]=add('echo',t,{n:cl.n,v:cl.fx===0xC?cl.p/64:.3,d:1});}}}
      for(let c=0;c<CH;c++)close(c,ROWS);
      if(pass===1){ // second pass: passing tones into leaps, octave lift on the final phrase note, new fill
        for(let i=0;i+1<leads.length;i++){const a=leads[i],b=leads[i+1],gap=b.t-a.t,iv=b.n-a.n;if(gap>=4&&Math.abs(iv)>=3&&Math.abs(iv)<=5&&R.chance(.6)){a.d=gap/2;add('lead',a.t+gap/2,{n:snap(a.n+Math.sign(iv)*2,song),v:.8,d:gap/2});}}
        const lastL=leads[leads.length-1];if(lastL&&R.chance(.6))lastL.n+=12;
        const kind=R.pick(['snare','tom','both']);for(let r=56;r<ROWS;r+=(r<60?2:1)){const v=.4+.6*(r-56)/8;if(kind!=='tom')add('snare',R0+r,{v});if(kind!=='snare')add('tom',R0+r,{v,n:[50,48,47,45,43,41,40,38][(r-56)%8]});}}
      // voice-led pads at each chord change, arpeggios over the voicing
      let last=null,cs=0;
      for(let r=0;r<=ROWS;r++){const ch=r<ROWS?chordAbs(P,r):null;if(r===ROWS||ch.deg!==last){if(r>0){const c0=chordAbs(P,cs);add('pad',R0+cs,{ns:vl(c0.tones,48,72),d:r-cs,v:nm==='intro'?.6+pass*.2:nm==='outro'?.6:1});}if(r<ROWS){last=ch.deg;cs=r;}}}
      if(nm!=='outro'||pass===0)for(let r=0;r<ROWS;r+=2){if(nm==='intro'&&r<16)continue;const ch=chordAbs(P,r),k=r/2|0,iv=[0,(ch.tones[1]-ch.tones[0]+12)%12,(ch.tones[2]-ch.tones[0]+12)%12,12][[0,1,2,1,0,2,1,3][k%8]];
        add('arp',R0+r,{n:60+pcl(ch.root)+iv+(pass&&r%8===6?12:0),v:(nm==='intro'?.4+.6*r/ROWS:nm==='outro'?1-r/ROWS:.8)*(r%4?.7:1),d:1.5});}
      if(loud){add('crash',R0,{v:pass?.7:1});for(let r=2;r<ROWS;r+=4)if(R.chance(pass?.5:.3))add('ohat',R0+r,{v:.6});}
      R0+=ROWS;}
  }
  ev.sort((a,b)=>a.t-b.t);
  return{ev,secs,rows:R0};
}
function snap(n,song){const iv=song.iv,k=song.key;let best=n,bd=99;for(let m=n-2;m<=n+2;m++){const p=((m-k)%12+12)%12;if(iv.includes(p)&&Math.abs(m-n)<bd){bd=Math.abs(m-n);best=m;}}return best;}
// seconds for a (possibly fractional) row, honouring swing
function timeOf(song,r){const tk=2.5/song.bpm,ri=Math.floor(r),fr=r-ri;return(ri*6+(song.swing?(ri&1):0))*tk+fr*(song.swing?(ri&1?5:7):6)*tk;}
const hz=n=>440*Math.pow(2,(n-69)/12);

/* ---- realtime scheduler: plays a score through an instrument table, exposes sync for the visuals */
function Conductor(ac,song,score,play){
  const ev=score.ev,ts=ev.map(e=>timeOf(song,e.t));let i=0,t0=0,timer=0;
  const kicks=[],snares=[],leads=[];ev.forEach((e,k)=>{if(e.i==='kick'||e.i==='taiko')kicks.push(ts[k]);else if((e.i==='snare'||e.i==='clap')&&e.v>.5)snares.push(ts[k]);else if(/^lead|bell|oboe|keys/.test(e.i))leads.push(ts[k]);});
  const dur=timeOf(song,score.rows)+1.5;
  const pump=()=>{const now=ac.currentTime;while(i<ev.length&&t0+ts[i]<now+1.2){const e=ev[i],tt=t0+ts[i];if(tt>now-.05)play(e,tt,timeOf(song,e.t+(e.d||1))-ts[i]);i++;}};
  const last=(arr,t)=>{let lo=0,hi=arr.length-1,r=-1;while(lo<=hi){const m=(lo+hi)>>1;if(arr[m]<=t){r=m;lo=m+1;}else hi=m-1;}return r<0?-99:arr[r];};
  const tk=2.5/song.bpm,a=song.swing?7:6;
  return{dur,start(at){t0=at;i=0;clearInterval(timer);timer=setInterval(pump,50);pump();},stop(){clearInterval(timer);},
    pos(){const t=ac.currentTime-t0,tt=Math.max(0,t),p=Math.floor(tt/(12*tk)),rem=tt-p*12*tk,row=p*2+(rem<a*tk?rem/(a*tk):1+(rem-a*tk)/((12-a)*tk));
      let si=0;for(let k=0;k<score.secs.length;k++)if(row>=score.secs[k].start)si=k;const S=score.secs[si];
      return{t,row,sec:si,secT:t-timeOf(song,S.start),secLen:timeOf(song,S.start+S.len)-timeOf(song,S.start),name:S.name,kind:S.role||S.name,prog:(row-S.start)/S.len,
        kick:Math.exp(-(t-last(kicks,t))*8),snare:Math.exp(-(t-last(snares,t))*9),lead:Math.exp(-(t-last(leads,t))*4),done:t>=dur};}};
}
