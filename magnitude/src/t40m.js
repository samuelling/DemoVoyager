/* 40M tier visuals — "2026": the GPU simulates instead of just drawing.
   Scenes: a stable-fluids ink tank (advection, vorticity confinement, pressure projection), Gray-Scott reaction-diffusion
   lit as a surface, a volumetric nebula raymarched through a generated 3D noise volume, and a 131,072-particle swarm in a
   curl-noise field that morphs between shapes and spells the demo's title. HDR fp16 frame, bloom chain, ACES.
   Every buffer is allocated once and counted; with the synth's physically modelled sample banks the total stays under 40 MB. */
function vis40m(cv,meter){
  const alloc={};let curMeter=(l,b)=>{alloc[l]=(alloc[l]||0)+b;};
  const G=makeGL(cv,(l,b)=>curMeter(l,b));if(!G||!G.v2||!G.float)return null;const gl=G.gl;
  const IW=1024,IH=576,NP=512*256;let W=cv.width,H=cv.height,q=1,avg=1/60;
  const HD='#version 300 es\nprecision highp float;precision highp sampler3D;in vec2 uv;out vec4 o;\n';
  const PAL='uniform vec3 pa,pb,pd;vec3 pal(float x){return clamp(pa+pb*cos(6.28318*(x+pd)),0.,1.);}\n';
  const P3=fs=>G.prog(G.QV3,HD+fs);
  const N4='float L=texture(X,uv-vec2(px.x,0)).x,R=texture(X,uv+vec2(px.x,0)).x,B=texture(X,uv-vec2(0,px.y)).x,T=texture(X,uv+vec2(0,px.y)).x;';
  // ---- fluid
  const ADV=P3('uniform sampler2D v,x;uniform vec2 vpx;uniform float dt,dis;void main(){o=texture(x,uv-dt*texture(v,uv).xy*vpx)*dis;}');
  const DIV=P3('uniform sampler2D v;uniform vec2 px;void main(){float L=texture(v,uv-vec2(px.x,0)).x,R=texture(v,uv+vec2(px.x,0)).x,B=texture(v,uv-vec2(0,px.y)).y,T=texture(v,uv+vec2(0,px.y)).y;o=vec4(.5*(R-L+T-B),0,0,1);}');
  const CURL=P3('uniform sampler2D v;uniform vec2 px;void main(){float L=texture(v,uv-vec2(px.x,0)).y,R=texture(v,uv+vec2(px.x,0)).y,B=texture(v,uv-vec2(0,px.y)).x,T=texture(v,uv+vec2(0,px.y)).x;o=vec4(.5*(R-L-T+B),0,0,1);}');
  const VORT=P3('uniform sampler2D v,X;uniform vec2 px;uniform float dt,eps;void main(){'+N4+'float C=texture(X,uv).x;vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+1e-4;f*=eps*C*vec2(1,-1);o=vec4(texture(v,uv).xy+f*dt,0,1);}');
  const JAC=P3('uniform sampler2D X,d;uniform vec2 px;void main(){'+N4+'o=vec4((L+R+B+T-texture(d,uv).x)*.25,0,0,1);}');
  const GRAD=P3('uniform sampler2D X,v;uniform vec2 px;void main(){'+N4+'o=vec4(texture(v,uv).xy-.5*vec2(R-L,T-B),0,1);}');
  const SPLAT=P3('uniform sampler2D x;uniform vec2 pt;uniform vec3 c;uniform float r,ar;void main(){vec2 d=uv-pt;d.x*=ar;o=vec4(texture(x,uv).rgb+c*exp(-dot(d,d)/r),1);}');
  const CLR=P3('uniform vec4 c;void main(){o=c;}');
  const FDISP=P3(PAL+'uniform sampler2D d;uniform vec2 px;void main(){vec3 c=texture(d,uv).rgb;float h=dot(c,vec3(.3,.5,.2));'+
    'float hx=dot(texture(d,uv+vec2(px.x,0)).rgb-texture(d,uv-vec2(px.x,0)).rgb,vec3(.33)),hy=dot(texture(d,uv+vec2(0,px.y)).rgb-texture(d,uv-vec2(0,px.y)).rgb,vec3(.33));'+
    'vec3 n=normalize(vec3(-hx*4.,-hy*4.,1.)),l=normalize(vec3(-.4,.6,.7));float sp=pow(max(dot(reflect(-l,n),vec3(0,0,1)),0.),40.);'+
    'o=vec4(c*(.3+.9*max(dot(n,l),0.))+sp*min(h,1.)*.7+pal(.6)*.012,1);}');
  // ---- reaction-diffusion (Gray-Scott); feed and kill drift across the screen so several pattern families grow side by side
  const RDS=P3('uniform sampler2D s;uniform vec2 px,fk;uniform vec3 sp;void main(){vec2 c=texture(s,uv).xy,l=-c;'+
    'l+=.2*(texture(s,uv+vec2(px.x,0)).xy+texture(s,uv-vec2(px.x,0)).xy+texture(s,uv+vec2(0,px.y)).xy+texture(s,uv-vec2(0,px.y)).xy);'+
    'l+=.05*(texture(s,uv+px).xy+texture(s,uv-px).xy+texture(s,uv+vec2(px.x,-px.y)).xy+texture(s,uv-vec2(px.x,-px.y)).xy);'+
    'float F=fk.x+(uv.y-.5)*.008,K=fk.y+(uv.x-.5)*.004,r=c.x*c.y*c.y;vec2 n=c+vec2(l.x-r+F*(1.-c.x),.5*l.y+r-(K+F)*c.y);'+
    'vec2 d=(uv-sp.xy)*vec2(1.78,1.);if(dot(d,d)<sp.z)n.y=.5;o=vec4(clamp(n,0.,1.),0,1);}');
  const RDI=P3('uniform float seed;void main(){float h=fract(sin(dot(floor(uv*vec2(48,27)),vec2(12.9898,78.233))+seed)*43758.5453);o=vec4(1.,step(.93,h)*.5,0,1);}');
  const RDD=P3(PAL+'uniform sampler2D s;uniform vec2 px;uniform float t,kick,lead;void main(){vec2 u=(uv-.5)*(1.-.12*sin(t*.04))+.5;float b=texture(s,u).y;'+
    'float bx=texture(s,u+vec2(px.x,0)).y-texture(s,u-vec2(px.x,0)).y,by=texture(s,u+vec2(0,px.y)).y-texture(s,u-vec2(0,px.y)).y;vec3 n=normalize(vec3(-bx*7.,-by*7.,1.));'+
    'vec3 l=normalize(vec3(cos(t*.2),sin(t*.2),1.1));float df=max(dot(n,l),0.),sp=pow(max(dot(reflect(-l,n),vec3(0,0,1)),0.),60.);'+
    'vec3 base=mix(pal(.1)*.05,pal(.45+b*.7),smoothstep(.08,.32,b));o=vec4(base*(.2+df)+sp*(.5+kick)*pal(.8)*1.5+pal(.55)*smoothstep(.28,.42,b)*(kick*.6+lead*.3),1);}');
  // ---- volumetric nebula through the 3D noise volume
  const NEB=P3(PAL+'uniform sampler3D nz;uniform vec2 R;uniform float t,kick,lead,spd,thr;uniform vec3 P;'+
    'float den(vec3 p){float a=texture(nz,p*.021).r,b=texture(nz,p*.067+vec3(.3)).r;return max(0.,a*.8+b*.35-thr)*2.;}'+
    'void main(){vec2 p=(uv*2.-1.)*vec2(R.x/R.y,1.);float z=t*spd;vec3 ro=vec3(sin(t*.05+P.x)*6.,cos(t*.037+P.y)*4.,z);'+
    'float a=t*.03+P.x,c=cos(a),s=sin(a);vec3 rd=normalize(vec3(mat2(c,-s,s,c)*p,1.7));vec3 lp=ro+vec3(sin(t*.1)*10.,4.,34.);'+
    'vec3 acc=vec3(0);float tr=1.,d=fract(sin(dot(uv,vec2(12.9,78.2))+t)*43758.5)*.9;'+
    'for(int i=0;i<64;i++){vec3 q=ro+rd*d;float de=den(q);if(de>.001){vec3 tl=normalize(lp-q);float sh=den(q+tl*1.5)+den(q+tl*3.5);'+
    'vec3 em=pal(.15+de*1.5+q.z*.003)*(.9*exp(-sh*2.5)+.03)+pal(.85)*exp(-length(lp-q)*.09)*2.*(1.+kick);float al=1.-exp(-de*.9);acc+=tr*al*em;tr*=1.-al;if(tr<.02)break;}d+=.8+d*.025;}'+
    'vec3 sd=floor(rd*260.);float st=pow(fract(sin(dot(sd,vec3(12.9,78.2,37.7)))*43758.5),220.)*5.;'+
    'acc+=tr*(vec3(st)+pal(.85)*(pow(max(dot(rd,normalize(lp-ro)),0.),300.)*30.+pow(max(dot(rd,normalize(lp-ro)),0.),8.)*.15));o=vec4(acc,1);}');
  // ---- particles: state = xyz + speed, fp32, one texel per particle
  const PINIT=P3('uniform float seed,rad;float h(float n){return fract(sin(n*12.9898+seed)*43758.5453);}void main(){float id=floor(gl_FragCoord.y)*512.+floor(gl_FragCoord.x);o=vec4((vec3(h(id),h(id+.37),h(id+.71))-.5)*rad,0.);}');
  const PSIM=P3('uniform sampler2D x,tg;uniform sampler3D nz;uniform float t,dt,ma,mb,mm,pull,flow,boom,kick,seed;'+
    'float h(float n){return fract(sin(n*12.9898+seed)*43758.5453);}'+
    'vec3 nf(vec3 p){return vec3(texture(nz,p).r,texture(nz,p+vec3(.31,.17,.53)).r,texture(nz,p+vec3(.71,.43,.11)).r);}'+
    'vec3 curl(vec3 p){float e=.012;vec3 dx=nf(p+vec3(e,0,0))-nf(p-vec3(e,0,0)),dy=nf(p+vec3(0,e,0))-nf(p-vec3(0,e,0)),dz=nf(p+vec3(0,0,e))-nf(p-vec3(0,0,e));return vec3(dy.z-dz.y,dz.x-dx.z,dx.y-dy.x)/(2.*e);}'+
    'vec3 shape(float m,float id,float r1,float r2,ivec2 c){vec3 j=(vec3(r1,r2,h(id*3.3))-.5);'+
    'if(m<.5){float y=1.-2.*id,r=sqrt(max(0.,1.-y*y)),a=id*131072.*2.39996;return vec3(cos(a)*r,y,sin(a)*r)*2.8+j*.05;}'+
    'if(m<1.5){float an=id*6.28318;vec3 k=vec3((2.+cos(3.*an))*cos(2.*an),(2.+cos(3.*an))*sin(2.*an),sin(3.*an))*1.05;return k+normalize(j)*.32*r1;}'+
    'if(m<2.5){float arm=floor(r1*3.),rr=pow(id,.55)*4.6,a=rr*1.25+arm*2.0944+t*.15/(rr+.4);return vec3(cos(a)*rr,(r2-.5)*.4*(1.-id),sin(a)*rr)+j*(.15+.5*id);}'+
    'if(m<3.5){float a=id*60.,st=step(.5,r1);return vec3(cos(a+st*3.1416)*1.4,(id-.5)*6.5,sin(a+st*3.1416)*1.4)+j*.12;}'+
    'return texelFetch(tg,c,0).xyz;}'+
    'void main(){ivec2 c=ivec2(gl_FragCoord.xy);vec4 s=texelFetch(x,c,0);float id=(float(c.y)*512.+float(c.x))/131072.,r1=h(id*7.13),r2=h(id*13.7+.5);vec3 p=s.xyz;'+
    'vec3 tg2=mix(shape(ma,id,r1,r2,c),shape(mb,id,r1,r2,c),smoothstep(0.,1.,clamp(mm*1.6-r1*.6,0.,1.)));'+
    'vec3 v=curl(p*.035+t*.006)*flow*.07+(tg2-p)*pull*(.6+.8*r2)+normalize(p+1e-3)*boom*kick*(.4+r1);vec3 np=p+v*dt;o=vec4(np,length(v));}');
  const PDRAW=G.prog('#version 300 es\nuniform sampler2D x;uniform mat4 VP;uniform float ps,hue,bright;out vec3 col;'+PAL+
    'void main(){int id=gl_VertexID;vec4 s=texelFetch(x,ivec2(id%512,id/512),0);vec4 cp=VP*vec4(s.xyz,1.);gl_Position=cp;gl_PointSize=clamp(ps/cp.w,1.,10.);'+
    'float h=fract(sin(float(id)*.1234)*4375.85);col=pal(hue+h*.22+min(s.w*.04,.3))*bright*(1.+min(s.w*.1,2.5))/max(1.,gl_PointSize*gl_PointSize*.15);}',
    '#version 300 es\nprecision highp float;in vec3 col;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;o=vec4(col*exp(-dot(d,d)*16.),1);}');
  // ---- post
  const BRT=P3('uniform sampler2D tx;uniform float q;void main(){vec3 c=texture(tx,uv*q).rgb;o=vec4(max(c-.75,0.)*.6,1);}');
  const BLR=P3('uniform sampler2D tx;uniform vec2 dir;void main(){vec3 c=texture(tx,uv).rgb*.227;c+=(texture(tx,uv+dir*1.385).rgb+texture(tx,uv-dir*1.385).rgb)*.316+(texture(tx,uv+dir*3.231).rgb+texture(tx,uv-dir*3.231).rgb)*.07;o=vec4(c,1);}');
  const FIN=P3('uniform sampler2D a,b1,b2,b3;uniform float k,t,qq,fl,ex;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}'+
    'void main(){vec2 c=uv-.5;float ca=dot(c,c)*.01;vec3 col=vec3(texture(a,(uv+c*ca)*qq).r,texture(a,uv*qq).g,texture(a,(uv-c*ca)*qq).b);'+
    'col+=texture(b1,uv).rgb*.6+texture(b2,uv).rgb*.8+texture(b3,uv).rgb*1.1;col=aces(col*ex)+fl;col*=1.-dot(c,c)*.9;'+
    'col+=(fract(sin(dot(uv*1e3+t,vec2(12.9,78.2)))*43758.5)-.5)*.025;o=vec4(pow(col,vec3(.97))*k,1);}');
  // ---- allocate everything once
  const hf=label=>({half:true,label}),fb=(w,h,o)=>G.fbo(w,h,o);
  const main=fb(IW,IH,hf('HDR frame 1024x576 (fp16)'));
  const bl=[[512,288],[256,144],[128,72]].map(([w,h])=>[fb(w,h,hf('bloom chain (fp16)')),fb(w,h,hf('bloom chain (fp16)'))]);
  const FV=[256,144],FD=[512,288],fvo=hf('fluid velocity/pressure (fp16)');
  const vel=[fb(...FV,fvo),fb(...FV,fvo)],prs=[fb(...FV,fvo),fb(...FV,fvo)],dvg=fb(...FV,fvo),crl=fb(...FV,fvo),dye=[fb(...FD,hf('fluid dye 512x288 (fp16)')),fb(...FD,hf('fluid dye 512x288 (fp16)'))];
  const rd=[fb(512,288,hf('reaction-diffusion 512x288 (fp16)')),fb(512,288,hf('reaction-diffusion 512x288 (fp16)'))];
  const po={float:true,nearest:true,label:'particle state 131,072 (fp32)'},pst=[fb(512,256,po),fb(512,256,po)];
  const tgT=G.tex(512,256,null,{float:true,nearest:true,clamp:true,label:'glyph targets (fp32)'});
  // 3D noise volume: three octaves of periodic value noise baked into 96^3 bytes
  const NV=96,vol=new Uint8Array(NV*NV*NV);{const R=Rng(0x40404040),oct=[[6,.55],[12,.3],[24,.15]];const acc=new Float32Array(vol.length);
    for(const [P,amp] of oct){const lat=new Float32Array(P*P*P).map(()=>R.f()),c=NV/P,S=x=>x*x*(3-2*x);let i=0;
      for(let z=0;z<NV;z++){const fz=z/c,z0=fz|0,tz=S(fz-z0),z1=(z0+1)%P;for(let y=0;y<NV;y++){const fy=y/c,y0=fy|0,ty=S(fy-y0),y1=(y0+1)%P;
        for(let x=0;x<NV;x++,i++){const fx=x/c,x0=fx|0,tx=S(fx-x0),x1=(x0+1)%P,L=(a,b,cc)=>lat[(cc*P+b)*P+a];
          const a=L(x0,y0,z0)+(L(x1,y0,z0)-L(x0,y0,z0))*tx,b=L(x0,y1,z0)+(L(x1,y1,z0)-L(x0,y1,z0))*tx,d=L(x0,y0,z1)+(L(x1,y0,z1)-L(x0,y0,z1))*tx,e=L(x0,y1,z1)+(L(x1,y1,z1)-L(x0,y1,z1))*tx;
          const lo=a+(b-a)*ty,hi=d+(e-d)*ty;acc[i]+=(lo+(hi-lo)*tz)*amp;}}}}
    let lo=1e9,hi=-1e9;for(const v of acc){if(v<lo)lo=v;if(v>hi)hi=v;}for(let i=0;i<vol.length;i++)vol[i]=(acc[i]-lo)/(hi-lo)*255;}
  const nz3=G.tex3(NV,vol,'noise volume 96³');
  curMeter=null;
  // ---- per-demo state
  let D={},cur=-1,ksPrev=0,snPrev=0,frames=0;const sw=(a)=>{const t=a[0];a[0]=a[1];a[1]=t;};
  const quad=(pr,f)=>{G.bind(f);G.quad(pr);};
  const setPal=(pr,p)=>pr.set('pa',p.a).set('pb',p.b).set('pd',p.d);
  function glyphs(text){const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');let fs=200;x.font=`900 ${fs}px system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    const w=x.measureText(text).width;if(w>980){fs=fs*980/w;x.font=`900 ${fs|0}px system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;}
    x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(text,512,128);const im=x.getImageData(0,0,1024,256).data,pts=[];
    for(let y=0;y<256;y+=2)for(let i=0;i<1024;i+=2)if(im[(y*1024+i)*4+3]>128)pts.push(i,y);const R=Rng(hashSeed(D.seed,99)),out=new Float32Array(NP*4),n=pts.length/2;
    for(let k=0;k<NP;k++){const j=n?R.ri(0,n-1):0;out[k*4]=((pts[j*2]||512)+R.rf(-1.5,1.5)-512)/1024*11;out[k*4+1]=-((pts[j*2+1]||128)+R.rf(-1.5,1.5)-128)/1024*11;out[k*4+2]=R.rf(-.15,.15);}
    gl.bindTexture(gl.TEXTURE_2D,tgT.t);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,512,256,gl.RGBA,gl.FLOAT,out);}
  function setup(demo,m){for(const k in alloc)m(k,alloc[k]);const R=Rng(hashSeed(demo.seed,31)),th=themeOf(demo.seed);
    D={seed:demo.seed,names:demo.names,p0:th.pal(0),p1:th.pal(1),p2:th.pal(2),P:[R.rf(-1,1),R.rf(-1,1),R.f()],fk:R.pick([[.0367,.0649],[.029,.057],[.039,.058],[.026,.055],[.034,.0618]]),
      order:[0,1,2,3].sort(()=>R.f()-.5),sd:R.f()*100,ems:[R.f()*6,R.f()*6],glyph:''};cur=-1;}
  const resetFluid=()=>{CLR.use().set('c',[0,0,0,1]);for(const f of [...vel,...prs,...dye,dvg,crl])quad(CLR,f);};
  const resetRD=()=>{RDI.use().set('seed',D.sd);quad(RDI,rd[0]);};
  const resetP=rad=>{PINIT.use().set('seed',D.sd).set('rad',rad);quad(PINIT,pst[0]);};
  function fluidStep(s,dt){const px=[1/FV[0],1/FV[1]],ar=IW/IH;gl.disable(gl.BLEND);
    const splat=(x,y,vx,vy,c,r)=>{SPLAT.use().set('pt',[x,y]).set('c',[vx,vy,0]).set('r',r).set('ar',ar).tex('x',vel[0],0);quad(SPLAT,vel[1]);sw(vel);
      SPLAT.use().set('pt',[x,y]).set('c',c).set('r',r).tex('x',dye[0],0);quad(SPLAT,dye[1]);sw(dye);};
    const T=s.T;for(let i=0;i<2;i++){const a=T*.31+D.ems[i]+i*3.14,x=.5+.32*Math.cos(a),y=.5+.3*Math.sin(a*1.31),c=cpal(D.p0,i*.45+T*.015).map(v=>v*dt*(1.2+s.lead*3));
      splat(x,y,-Math.sin(a)*90*(.4+s.lead),Math.cos(a*1.31)*90*(.4+s.lead),c,.0007);}
    if(s.kick>ksPrev+.05){const R=Rng(hashSeed(D.seed,frames+(s.row|0))),x=R.rf(.15,.85),y=R.rf(.2,.8),a=R.f()*6.28;splat(x,y,Math.cos(a)*700,Math.sin(a)*700,cpal(D.p1,R.f()).map(v=>v*.5),.0022);}
    if(s.snare>snPrev+.05){splat(.5+Math.sin(T)*.2,.04,0,900,cpal(D.p2,.7).map(v=>v*.4),.003);}
    CURL.use().set('px',px).tex('v',vel[0],0);quad(CURL,crl);
    VORT.use().set('px',px).set('dt',dt).set('eps',28).tex('v',vel[0],0).tex('X',crl,1);quad(VORT,vel[1]);sw(vel);
    DIV.use().set('px',px).tex('v',vel[0],0);quad(DIV,dvg);
    for(let i=0;i<22;i++){JAC.use().set('px',px).tex('X',prs[0],0).tex('d',dvg,1);quad(JAC,prs[1]);sw(prs);}
    GRAD.use().set('px',px).tex('X',prs[0],0).tex('v',vel[0],1);quad(GRAD,vel[1]);sw(vel);
    ADV.use().set('vpx',px).set('dt',dt).set('dis',.999).tex('v',vel[0],0).tex('x',vel[0],1);quad(ADV,vel[1]);sw(vel);
    ADV.use().set('vpx',px).set('dt',dt).set('dis',.994).tex('v',vel[0],0).tex('x',dye[0],1);quad(ADV,dye[1]);sw(dye);}
  function rdStep(s){const px=[1/512,1/288];let sp=[-1,-1,0];if(s.kick>ksPrev+.05){const R=Rng(hashSeed(D.seed,frames));sp=[R.rf(.1,.9),R.rf(.1,.9),.0004+s.kick*.0006];}
    for(let i=0;i<14;i++){RDS.use().set('px',px).set('fk',D.fk).set('sp',i?[-1,-1,0]:sp).tex('s',rd[0],0);quad(RDS,rd[1]);sw(rd);}}
  function viewport(){gl.bindFramebuffer(gl.FRAMEBUFFER,main.fb);gl.viewport(0,0,IW*q|0,IH*q|0);}
  function nebula(s,spd,thr){viewport();setPal(NEB.use(),D.p2).set('R',[IW*q|0,IH*q|0]).set('t',s.secT+s.sec*11.3).set('kick',s.kick).set('lead',s.lead).set('spd',spd).set('thr',thr).set('P',D.P).tex('nz',nz3,0);G.quad(NEB);}
  function swarm(s,o,dt){gl.disable(gl.BLEND);
    PSIM.use().set('t',s.T).set('dt',Math.min(dt,1/30)).set('ma',o.ma).set('mb',o.mb).set('mm',o.mm).set('pull',o.pull).set('flow',o.flow).set('boom',o.boom||0).set('kick',s.kick).set('seed',D.sd).tex('x',pst[0],0).tex('tg',tgT,1).tex('nz',nz3,2);quad(PSIM,pst[1]);sw(pst);
    viewport();const ar=IW/IH,cam=o.cam,VP=M4.mul(M4.persp(.9,ar,.1,200),M4.look(cam,[0,0,0],[0,1,0]));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.bindBuffer(gl.ARRAY_BUFFER,null);for(let i=0;i<4;i++)gl.disableVertexAttribArray(i);
    setPal(PDRAW.use(),o.pal).set('VP',VP).set('ps',o.ps*q).set('hue',o.hue).set('bright',o.bright).tex('x',pst[0],0);gl.drawArrays(gl.POINTS,0,NP);gl.disable(gl.BLEND);}
  function draw(s,k){frames++;const dt=Math.min(s.dt||1/60,1/20);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
    avg+=(dt-avg)*.05;if(avg>1/36&&q>.5){q-=.125;avg=1/50;}else if(avg<1/57&&q<1){q+=.125;avg=1/50;}
    const sc=s.scene,enter=s.sec!==cur;
    if(enter){const prev=cur>=0?D.last:null;cur=s.sec;D.last=sc;
      if(sc==='fluid')resetFluid();if(sc==='rd')resetRD();
      if(sc==='title'){if(D.glyph!=='t'){glyphs(D.names.title);D.glyph='t';}resetP(40);}
      if(sc==='credits'){glyphs(D.names.group);D.glyph='g';if(prev!=='swarm'&&prev!=='title')resetP(30);}
      if(sc==='swarm'&&prev!=='title'&&prev!=='swarm'&&prev!=='credits')resetP(20);}
    const ph=s.prog*4,bar=Math.floor(ph),f=ph-bar,clim=/climax/.test(s.name);
    if(sc==='fluid'){fluidStep(s,dt);viewport();setPal(FDISP.use(),D.p0).set('px',[1/FD[0],1/FD[1]]).tex('d',dye[0],0);G.quad(FDISP);}
    else if(sc==='rd'){rdStep(s);viewport();setPal(RDD.use(),D.p1).set('px',[1/512,1/288]).set('t',s.secT).set('kick',s.kick).set('lead',s.lead).tex('s',rd[0],0);G.quad(RDD);}
    else if(sc==='nebula'){nebula(s,/build/.test(s.name)?4+s.prog*s.prog*30:5,.7);}
    else if(sc==='title'){nebula(s,1.2,.8);const p=s.prog;swarm(s,{ma:4,mb:4,mm:0,pull:Math.pow(Math.max(0,(p-.08)/.6),2)*3,flow:3.5*(1-Math.min(1,p*1.4))+.15,cam:[Math.sin(s.secT*.05)*1.5,.3,10.5-p*1.5],ps:22,hue:.05,bright:.12,pal:D.p0},dt);}
    else if(sc==='credits'){nebula(s,.8,.78);const p=s.prog;swarm(s,{ma:4,mb:4,mm:0,pull:p<.45?2.5:0,flow:p<.45?.2:2+p*4,cam:[0,.3,10.5],ps:20,hue:.6,bright:.1*(1-Math.max(0,p-.8)*5),pal:D.p1},dt);}
    else{viewport();const bg=cpal(D.p1,.6);gl.clearColor(bg[0]*.02,bg[1]*.02,bg[2]*.03,1);gl.clear(gl.COLOR_BUFFER_BIT);const O=D.order,a=O[bar%4],b=O[(bar+1)%4],T=s.secT*.12;
      swarm(s,{ma:a,mb:b,mm:Math.max(0,(f-.7)/.3),pull:2.2,flow:.35+(clim?.3:0),boom:clim?18:4,cam:[Math.sin(T)*10,3+Math.sin(T*.7)*3,Math.cos(T)*10],ps:20,hue:.1+bar*.13,bright:clim?.16:.13,pal:D.p1},dt);}
    ksPrev=s.kick;snPrev=s.snare;
    // bloom
    gl.disable(gl.BLEND);BRT.use().set('q',q).tex('tx',main,0);quad(BRT,bl[0][0]);
    for(let i=0;i<3;i++){const [A,B]=bl[i];if(i){BLR.use().set('dir',[0,0]).tex('tx',bl[i-1][0],0);quad(BLR,A);}
      BLR.use().set('dir',[1/A.w,0]).tex('tx',A,0);quad(BLR,B);BLR.use().set('dir',[0,1/A.h]).tex('tx',B,0);quad(BLR,A);}
    const fl=/build/.test(s.name)?Math.pow(Math.max(0,s.prog),10)*.85:clim?Math.exp(-s.secT*2)*.9:0;
    G.bind(null,W,H);FIN.use().set('k',k).set('t',s.T%10).set('qq',q).set('fl',fl).set('ex',sc==='rd'||sc==='fluid'?1.1:1.25).tex('a',main,0).tex('b1',bl[0][0],1).tex('b2',bl[1][0],2).tex('b3',bl[2][0],3);G.quad(FIN);}
  return{setup,draw,resize(w,h){W=w;H=h;},idle(){G.bind(null,W,H);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}};
}
