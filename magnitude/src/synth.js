/* Synth: turns score events into sound with Web Audio, one era per level.
   L1 (2003 softsynth): subtractive voices, synth drums, stereo delay, small generated reverb.
   L2 (2012 big room):  + supersaws, sidechain ducking, claps/shakers, risers/impacts, filter sweeps, larger reverb.
   L3 (2026):           + physically modelled sample banks (Karplus-Strong plucks and harp, modal piano and drums),
                          string ensemble, formant choir and oboe, long stereo hall built from a generated impulse response.
   Every buffer the synth generates is reported to meter(label, bytes). */
function makeSynth(ac,L,seed,meter){
  const R=Rng(hashSeed(seed,12)),sr=ac.sampleRate;
  const master=ac.createGain();master.gain.value=L>=3?.55:.6;
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.15;
  const lim=ac.createDynamicsCompressor();lim.threshold.value=-3;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.05;
  master.connect(comp);comp.connect(lim);lim.connect(ac.destination);
  const buf=(ch,len,label)=>{const b=ac.createBuffer(ch,len,sr);meter(label,ch*len*4);return b;};
  // white noise
  const noise=buf(1,L>=3?88200:sr,'noise');{const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  // reverb from a generated impulse response: decaying noise, darker over time, with a few early reflections
  const irLen=[0,1.6,3,5.5][L]*Math.min(1,(L>=3?44100:48000)/sr),ir=buf(2,(sr*irLen)|0,'reverb impulse');
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);let lp=0;for(let i=0;i<d.length;i++){const t=i/sr,k=Math.exp(-t*(6.9/irLen)),a=.25+.7*Math.exp(-t*2);lp+=(Math.random()*2-1-lp)*a;d[i]=lp*k*.5;}
    for(let e=0;e<8;e++){const p=(sr*(.008+e*.011+(c?.004:0)))|0;if(p<d.length)d[p]+=.5*Math.pow(.8,e);}}
  const verb=ac.createConvolver();verb.buffer=ir;const verbIn=ac.createGain();verbIn.gain.value=L>=3?.55:.35;verbIn.connect(verb);verb.connect(master);
  // tempo-synced stereo delay (set by setTempo)
  const dl=ac.createDelay(2),dr=ac.createDelay(2),fb=ac.createGain(),dlIn=ac.createGain(),dlf=ac.createBiquadFilter();fb.gain.value=.38;dlIn.gain.value=.3;dlf.type='lowpass';dlf.frequency.value=3200;
  const ml=ac.createChannelMerger(2);dlIn.connect(dl);dl.connect(dlf);dlf.connect(dr);dr.connect(fb);fb.connect(dl);dl.connect(ml,0,0);dr.connect(ml,0,1);ml.connect(master);ml.connect(verbIn);
  // buses: drums go straight to master; tonal parts go through a ducking bus (sidechain from the kick at L2+) and a sweepable filter
  const duck=ac.createGain(),sweepF=ac.createBiquadFilter();sweepF.type='lowpass';sweepF.frequency.value=18000;sweepF.Q.value=.7;duck.connect(sweepF);sweepF.connect(master);
  const pan=(node,p)=>{if(!ac.createStereoPanner)return node;const s=ac.createStereoPanner();s.pan.value=p;node.connect(s);return s;};
  // ---- primitive voice: oscillators -> filter -> amp envelope
  const P={bassW:R.pick(['sawtooth','square']),leadW:R.pick(['sawtooth','square']),det:R.rf(4,12),cut:R.rf(1800,4200),res:R.rf(2,9),pw:R.rf(.2,.45)};
  const pulse=(()=>{const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let h=1;h<n;h++)im[h]=2/(h*Math.PI)*Math.sin(h*Math.PI*P.pw);meter('wavetables',n*8);return ac.createPeriodicWave(re,im);})();
  function voice(t,d,f,o){const g=ac.createGain(),fl=ac.createBiquadFilter();fl.type=o.ft||'lowpass';fl.Q.value=o.q||1;
    const a=o.a||.005,dec=o.dc||.2,s=o.s??.6,rel=o.r||.15,pk=o.v||.3,end=t+Math.max(d,a+.01);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.setTargetAtTime(pk*s,t+a,dec);g.gain.setValueAtTime(pk*s,end);g.gain.setTargetAtTime(0,end,rel/3);
    const c0=o.c||2000;fl.frequency.setValueAtTime(o.ce?c0*o.ce:c0,t);if(o.ce)fl.frequency.setTargetAtTime(c0,t,o.cd||.12);
    for(const [type,mul,det,lvl] of o.osc){const s=ac.createOscillator();if(type==='pulse')s.setPeriodicWave(pulse);else s.type=type;s.frequency.value=f*mul;s.detune.value=det;
      if(o.vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(o.vib,t+.35);l.connect(lg);lg.connect(s.detune);l.start(t);l.stop(end+rel+.1);}
      if(lvl!==undefined&&lvl!==1){const lg=ac.createGain();lg.gain.value=lvl;s.connect(lg);lg.connect(fl);}else s.connect(fl);s.start(t);s.stop(end+rel+.1);}
    fl.connect(g);let o2=g;if(o.pan!==undefined)o2=pan(g,o.pan);o2.connect(o.to||duck);if(o.vs)o2.connect(verbIn);if(o.ds)o2.connect(dlIn);return g;}
  function nz(t,dur,o){const s=ac.createBufferSource();s.buffer=noise;s.loop=true;const f=ac.createBiquadFilter();f.type=o.ft||'highpass';f.frequency.value=o.f||5000;f.Q.value=o.q||.7;
    const g=ac.createGain();g.gain.setValueAtTime(o.v,t);g.gain.setTargetAtTime(0,t+(o.h||0),dur/4);s.connect(f);f.connect(g);let out=g;if(o.pan!==undefined)out=pan(g,o.pan);out.connect(o.to||master);if(o.vs)out.connect(verbIn);s.start(t,Math.random());s.stop(t+dur*1.5+(o.h||0));return{g,f};}
  // ---- L3 sample banks (generated once, physically modelled)
  const banks={};
  if(L>=3){
    const kr=Math.min(1,44100/sr); // bank lengths shrink at higher sample rates so the bytes (and the 40 MB budget) stay put
    const ks=(lab,damp,bright,len)=>{len*=kr;const bank=[];for(let n=36;n<=96;n+=4){const f=hz(n),N=Math.round(sr/f),b=buf(1,(sr*len)|0,lab),d=b.getChannelData(0),dl2=new Float32Array(N);
        for(let i=0;i<N;i++)dl2[i]=(Math.random()*2-1)*(1-bright)+(i<N/2?1:-1)*bright*.5;let p=0,prev=0;
        for(let i=0;i<d.length;i++){const x=dl2[p],nx=dl2[(p+1)%N];const y=damp*(.5*(x+nx));dl2[p]=y;d[i]=x;p=(p+1)%N;}bank.push({n,b});}return bank;};
    banks.pluck=ks('pluck bank (Karplus-Strong)',.996,.3,1.2);banks.harp=ks('harp bank (Karplus-Strong)',.9985,.6,1.8);
    // modal piano: inharmonic partials with frequency-dependent decay plus a felt hammer thump
    banks.piano=[];for(let n=36;n<=96;n+=4){const f=hz(n),b=buf(1,(sr*2.2*kr)|0,'piano bank (modal)'),d=b.getChannelData(0),B=.0004*Math.pow(2,(n-60)/24);
      const parts=[];for(let k=1;k<=14;k++){const fk=f*k*Math.sqrt(1+B*k*k);if(fk>sr/2.2)break;parts.push([fk*2*Math.PI/sr,Math.pow(k,-1.1)*(k===1?1:.8),1.2+k*.55+f/400,Math.random()*6]);}
      for(let i=0;i<d.length;i++){const t=i/sr;let v=0;for(const [w,a,dc,ph] of parts)v+=a*Math.exp(-t*dc)*Math.sin(w*i+ph);d[i]=v*.35*(1-Math.exp(-t*900))+(i<300?(Math.random()-.5)*.3*(1-i/300):0);}banks.piano.push({n,b});}
    const modal=(lab,modes,len,amp=.6)=>{const b=buf(1,(sr*len)|0,lab),d=b.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/sr;let v=0;for(const [f,a,dc] of modes)v+=a*Math.exp(-t*dc)*Math.sin(2*Math.PI*f*t);d[i]=v*amp+(i<600?(Math.random()-.5)*(1-i/600)*.6:0);}return b;};
    banks.taiko=modal('taiko (modal)',[[58,1,3.2],[93,.6,5],[131,.4,7],[171,.25,9],[222,.15,12]],1.8);
    banks.timp=modal('timpani (modal)',[[hz(36),1,1.2],[hz(36)*1.5,.5,1.8],[hz(36)*1.99,.4,2.4],[hz(36)*2.44,.25,3]],3);
    banks.tom=modal('tom (modal)',[[110,1,6],[176,.5,9],[246,.3,12]],1);
  }
  const playBank=(bank,n,t,v,to,rate=1)=>{let best=bank[0];for(const s of bank)if(Math.abs(s.n-n)<Math.abs(best.n-n))best=s;const src=ac.createBufferSource();src.buffer=best.b;src.playbackRate.value=Math.pow(2,(n-best.n)/12)*rate;const g=ac.createGain();g.gain.value=v;src.connect(g);g.connect(to);src.start(t);return g;};
  // ---- instrument table
  let kickDuck=L>=2;
  const I={
    kick(t,e){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(L>=2?160:140,t);o.frequency.exponentialRampToValueAtTime(L>=2?42:48,t+.09);g.gain.setValueAtTime(e.v*(L>=2?1:.9),t);g.gain.setTargetAtTime(0,t+.04,L>=2?.13:.09);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+.8);nz(t,.012,{f:3000,v:.25*e.v});
      if(kickDuck){duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(1,t);duck.gain.linearRampToValueAtTime(.3,t+.008);duck.gain.setTargetAtTime(1,t+.03,.09);}},
    snare(t,e){nz(t,.14,{ft:'bandpass',f:L>=2?2200:1800,q:.8,v:.5*e.v,pan:.05,vs:L>=2});const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(160,t+.05);g.gain.setValueAtTime(.35*e.v,t);g.gain.setTargetAtTime(0,t,.04);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3);},
    hat(t,e){nz(t,.035,{f:7500,v:.18*e.v,pan:.3});},
    ohat(t,e){nz(t,.22,{f:6500,v:.14*e.v,pan:.3});},
    crash(t,e){nz(t,1.4,{f:4500,v:.22*e.v,pan:-.2,vs:true});},
    clap(t,e){for(let k=0;k<3;k++)nz(t+k*.011,k<2?.012:.12,{ft:'bandpass',f:1300,q:1.2,v:.35*e.v,vs:true});},
    shaker(t,e){nz(t,.03,{f:9000,v:.08*e.v,pan:-.35});},
    bass(t,e,d){const f=hz(e.n);voice(t,Math.min(d,.5),f,{osc:L>=2?[[P.bassW,1,-P.det],[P.bassW,1,P.det],['sine',.5,0,1.2]]:[[P.bassW,1,-P.det],['square',.5,0,.4]],c:L>=2?500:400,ce:3,cd:.08,q:P.res*.6,s:.8,dc:.15,r:.08,v:.32});
      if(L>=3&&banks.pluck)playBank(banks.pluck,e.n,t,.25,duck,.5);},
    lead(t,e,d){voice(t,d,hz(e.n),{osc:L>=2?[['sawtooth',1,-8],['sawtooth',1,8],['square',2,0,.25]]:[[P.leadW,1,-P.det],[P.leadW,1,P.det]],c:P.cut,ce:1.6,q:2,a:.01,s:.75,r:.25,v:.16,vib:18,ds:true,vs:L>=2,pan:.1});},
    echo(t,e,d){voice(t,d,hz(e.n),{osc:[[P.leadW,1,0]],c:1600,a:.01,s:.6,r:.2,v:.12*e.v,pan:-.4,ds:true});},
    harm(t,e,d){voice(t,d,hz(e.n),{osc:[['pulse',1,0],['sawtooth',1,10,.5]],c:2400,a:.02,s:.7,r:.3,v:.09,pan:-.25,vs:true});},
    pad(t,e,d){const sp=L>=2?[-14,-5,5,14]:[-7,7];for(const n of e.ns)voice(t,d,hz(n),{osc:sp.map(x=>['sawtooth',1,x,.55]),c:L>=2?1400:1100,ce:.4,cd:.6,a:.35,dc:.8,s:.9,r:.8,v:.045*e.v,vs:true,pan:(n%5-2)*.2});},
    arp(t,e,d){voice(t,Math.min(d,.18),hz(e.n),{osc:[['pulse',1,0],['square',2,4,.2]],c:L>=2?2800:2200,ce:2,cd:.05,q:3,dc:.06,s:.3,r:.08,v:.09*e.v,ds:true,pan:-.2});},
    stab(t,e,d){for(const n of e.ns)voice(t,.12,hz(n),{osc:[-18,-8,0,8,18].map(x=>['sawtooth',1,x,.5]),c:3800,ce:1.4,cd:.05,a:.003,dc:.1,s:.4,r:.12,v:.03*e.v,vs:true,ds:true,pan:(n%3-1)*.4});},
    riser(t,e,d){const n=nz(t,d,{ft:'bandpass',f:400,q:3,v:.0001,h:d,vs:true});n.g.gain.cancelScheduledValues(t);n.g.gain.setValueAtTime(.001,t);n.g.gain.exponentialRampToValueAtTime(.32,t+d);n.g.gain.setTargetAtTime(0,t+d,.02);n.f.frequency.setValueAtTime(300,t);n.f.frequency.exponentialRampToValueAtTime(7000,t+d);},
    impact(t,e){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+.8);g.gain.setValueAtTime(.7,t);g.gain.setTargetAtTime(0,t+.1,.35);o.connect(g);g.connect(master);g.connect(verbIn);o.start(t);o.stop(t+2.5);nz(t,.6,{f:200,ft:'lowpass',v:.5,vs:true});},
    sweep(t,e,d){const f=sweepF.frequency;f.cancelScheduledValues(t);if(e.dir>0){f.setValueAtTime(500,t);f.exponentialRampToValueAtTime(16000,t+d);}else if(e.dir<0){f.setValueAtTime(16000,t);f.exponentialRampToValueAtTime(600,t+d);}else f.setValueAtTime(18000,t);},
    // ---- L3 orchestra
    pluck(t,e){playBank(banks.pluck,e.n,t,.32*e.v,duck);},
    harp(t,e){const g=playBank(banks.harp,e.n,t,.35*e.v,verbIn);g.connect(duck);},
    piano(t,e){const g=playBank(banks.piano,e.n,t,.5*e.v,duck);g.connect(verbIn);},
    strings(t,e,d){for(const n of e.ns)voice(t,d,hz(n),{osc:[-16,-9,-3,3,9,16].map(x=>['sawtooth',1,x,.4]),c:2200,ft:'lowpass',a:.6,dc:1,s:1,r:1.1,v:.03*e.v,vib:9,vs:true,pan:(n%7-3)*.15});},
    choir(t,e,d){for(const n of e.ns){const g=ac.createGain();g.gain.value=1;for(const [fq,q,a] of [[800,8,1],[1150,10,.6],[2900,12,.25]]){const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;f.Q.value=q;const lg=ac.createGain();lg.gain.value=a;f.connect(lg);lg.connect(verbIn);lg.connect(duck);
        voice(t,d,hz(n),{osc:[['sawtooth',1,-6],['sawtooth',1,6]],c:6000,a:.8,dc:1,s:1,r:1.2,v:.06*e.v,vib:14,to:f});}}},
    oboe(t,e,d){const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1400;f.Q.value=1.5;f.connect(duck);f.connect(verbIn);voice(t,d,hz(e.n),{osc:[['pulse',1,0],['sawtooth',1,0,.4]],c:5000,a:.06,s:.85,r:.2,v:.3,vib:20,to:f});},
    bell(t,e,d){const f=hz(e.n);for(const [m,a,dc] of [[1,1,1.2],[2.76,.5,2],[5.4,.3,3],[8.93,.2,4]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*m;g.gain.setValueAtTime(.08*a,t);g.gain.setTargetAtTime(0,t,1/dc);o.connect(g);g.connect(duck);g.connect(verbIn);o.start(t);o.stop(t+3);}},
    leadx(t,e,d){I.lead(t,e,d);voice(t,d,hz(e.n+12),{osc:[-20,-10,0,10,20].map(x=>['sawtooth',1,x,.4]),c:4500,a:.02,s:.8,r:.3,v:.05,vib:22,vs:true,ds:true,pan:-.1});},
    counter(t,e,d){voice(t,d,hz(e.n),{osc:[['triangle',1,0],['sine',2,0,.3]],c:3000,a:.05,s:.8,r:.3,v:.11*e.v,vib:12,vs:true,pan:-.3});},
    taiko(t,e){const g=playBank([{n:60,b:banks.taiko}],60,t,.9*e.v,master);g.connect(verbIn);},
    timp(t,e){playBank([{n:36,b:banks.timp}],e.n,t,.35*e.v,master).connect(verbIn);},
    tom(t,e){if(banks.tom){playBank([{n:45,b:banks.tom}],e.n,t,.6*e.v,master).connect(verbIn);return;}const o=ac.createOscillator(),g=ac.createGain(),f=hz(e.n||45);o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f,t+.06);g.gain.setValueAtTime(.45*e.v,t);g.gain.setTargetAtTime(0,t+.02,.12);o.connect(g);g.connect(master);g.connect(verbIn);o.start(t);o.stop(t+1);},
    keys(t,e,d){const f=hz(e.n),m=ac.createOscillator(),mg=ac.createGain(),c=ac.createOscillator(),g=ac.createGain();m.frequency.value=f*1;mg.gain.setValueAtTime(f*2.2,t);mg.gain.setTargetAtTime(f*.3,t,.25);m.connect(mg);mg.connect(c.frequency);c.frequency.value=f;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*e.v,t+.004);g.gain.setTargetAtTime(.05*e.v,t+.01,.5);g.gain.setTargetAtTime(0,t+Math.max(d,.2),.3);c.connect(g);g.connect(duck);g.connect(verbIn);if(ac.createStereoPanner){}m.start(t);c.start(t);m.stop(t+d+2);c.stop(t+d+2);},
  };
  return{master,setTempo(bpm){const q=60/bpm*.75;dl.delayTime.value=q;dr.delayTime.value=q;},
    play(e,t,d){const f=I[e.i];if(f)f(t,e,d);},stop(){master.gain.setTargetAtTime(0,ac.currentTime,.3);setTimeout(()=>{try{master.disconnect();}catch(e){}},2000);}};
}
