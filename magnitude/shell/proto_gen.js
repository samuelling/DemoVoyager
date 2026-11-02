// Builds the era prototypes: run each era's generator at its own settings over many seeds, measure every feature,
// and keep the mean, the spread and a one-versus-rest Fisher weight per feature. Run by build.py; prints JSON.
const fs=require('fs'),D=__dirname+'/..';global.document={};global.window={};
eval(['core.js','arrange.js','compose.js','form.js','era.js'].map(f=>fs.readFileSync(D+'/src/'+f,'utf8')).join('\n')+';'+fs.readFileSync(__dirname+'/lib.js','utf8').replace('/*PROTO*/{}','{}')+
  ';globalThis.X={composeAll,composeOne,genSong,featureVec,FEATURES,similarity,idiomStats};');
const N=48,seeds=Array.from({length:N},(_,i)=>(Math.imul(i+1,0x9E3779B1)>>>0));
const samples={'1997':[],'2003':[],'2012':[],'2026':[]};
for(const sd of seeds){const song=X.genSong(sd);
  const t=X.composeAll(sd,'shared').res[1];samples['1997'].push(X.featureVec(t));
  [['2003',1],['2012',2],['2026',3]].forEach(([e,L])=>samples[e].push(X.featureVec(X.composeOne(song,L,'era',null,true))));}
const F=X.FEATURES.length,stat=(rows,i)=>{const xs=rows.map(r=>r[i]).filter(v=>v!=null);const m=xs.reduce((a,b)=>a+b,0)/xs.length;return[m,Math.sqrt(xs.reduce((a,b)=>a+(b-m)*(b-m),0)/xs.length)];};
const out={};
for(const e in samples){const mu=[],sd=[],w=[];
  for(let i=0;i<F;i++){const [m,s]=stat(samples[e],i),floor=X.FEATURES[i][4];const rest=[].concat(...Object.keys(samples).filter(k=>k!==e).map(k=>samples[k]));const [mr,sr]=stat(rest,i);
    const S=Math.max(s,floor),SR=Math.max(sr,floor);mu.push(+m.toFixed(4));sd.push(+S.toFixed(4));w.push((m-mr)*(m-mr)/(S*S+SR*SR));}
  const tw=w.reduce((a,b)=>a+b,0);const W=w.map(x=>+(x/tw).toFixed(4));
  // the era's own spread of distances, to say what "typical" and "at the edge" mean
  const Ds=samples[e].map(v=>Math.sqrt(v.reduce((a,x,i)=>a+(x==null?0:W[i]*Math.pow((x-mu[i])/sd[i],2)),0))).sort((a,b)=>a-b);
  out[e]={mu,sd,w:W,p50:+Ds[Math.floor(N*.5)].toFixed(3),p90:+Ds[Math.floor(N*.9)].toFixed(3),n:N};}
process.stdout.write(JSON.stringify(out));
