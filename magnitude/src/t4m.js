/* 4M tier visuals — "2012": every scene is a raymarched distance field in a fragment shader, then bloom, ACES tone curve,
   chromatic aberration, vignette and grain. Budget: all generated buffers (render targets, noise, audio) stay under 4 MB,
   which is why it renders at 800x450 into 8-bit targets. */
function vis4m(cv,meter){
  const G=makeGL(cv,(l,b)=>curMeter(l,b));if(!G)return null;const gl=G.gl;let curMeter=meter;
  const IW=800,IH=450;let W=cv.width,H=cv.height;
  const HEAD=`precision highp float;varying vec2 uv;uniform vec2 R;uniform float t,kick,snare,lead,prog;uniform vec4 P,Q;uniform vec3 pa,pb,pd;uniform sampler2D nz;
vec3 pal(float x){return clamp(pa+pb*cos(6.28318*(x+pd)),0.,1.);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return texture2D(nz,(i+f+.5)/256.).x;}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}
vec3 camd(vec3 ro,vec3 ta,vec2 p,float z){vec3 f=normalize(ta-ro),r=normalize(cross(vec3(0,1,0),f)),u=cross(f,r);return normalize(p.x*r+p.y*u+z*f);}
float sbox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec3 sky(vec3 rd,vec3 sd){float s=max(dot(rd,sd),0.);vec3 c=mix(pal(.05)*.35+vec3(.25,.3,.4),vec3(.03,.05,.1),max(rd.y,0.));return c+vec3(1.,.8,.6)*(pow(s,600.)*8.+pow(s,8.)*.25);}
`;
  const MAIN=body=>HEAD+body+`
void main(){vec2 p=(uv*2.-1.)*vec2(R.x/R.y,1.);vec3 c=render(p);gl_FragColor=vec4(c,1.);}`;
  // ---- scenes (each defines render(vec2 p))
  const SRC={
    terrain:`
float Hh(vec2 p){float h=fbm(p*.013+P.xy)*62.-22.;return h+max(0.,fbm(p*.04)-.5)*20.;}
float Hl(vec2 p){return Hh(p)+fbm(p*.2)*1.2;}
vec3 render(vec2 p){float T=t*7.;vec3 ro=vec3(T*.4,0.,T);ro.y=max(Hh(ro.xz),0.)+14.+sin(t*.3)*3.;vec3 ta=ro+vec3(sin(t*.07)*20.,-6.,40.);vec3 rd=camd(ro,ta,p,1.5),sd=normalize(vec3(-.6,.35+Q.x*.2,.7));
 float d=1.,h=0.;bool hit=false;for(int i=0;i<110;i++){vec3 q=ro+rd*d;h=q.y-max(Hh(q.xz),0.);if(h<.02*d){hit=true;break;}d+=h*.45;if(d>600.)break;}
 vec3 c=sky(rd,sd);if(hit){vec3 q=ro+rd*d;vec2 e=vec2(.3,0.);bool wat=Hh(q.xz)<0.;vec3 n=wat?vec3(0.,1.,0.):normalize(vec3(Hl(q.xz-e.xy)-Hl(q.xz+e.xy),2.*e.x,Hl(q.xz-e.yx)-Hl(q.xz+e.yx)));
  vec3 alb=mix(pal(.1)*.5+vec3(.15,.2,.1),vec3(.35,.32,.3),smoothstep(.75,.55,n.y));alb=mix(alb,vec3(.95),smoothstep(18.,26.,q.y+fbm(q.xz*.1)*8.)*smoothstep(.5,.8,n.y));
  float df=max(dot(n,sd),0.),sh=1.;for(int i=0;i<24;i++){vec3 s=q+n*.5+sd*(1.+float(i)*float(i)*.4);float hh=s.y-Hh(s.xz);sh=min(sh,max(hh,0.)*.6);}
  vec3 col=alb*(df*min(sh,1.)*vec3(1.6,1.4,1.1)+vec3(.25,.3,.4)*(.5+.5*n.y));
  if(wat){vec3 r=reflect(rd,vec3(fbm(q.xz*.5+t)*.08-.04,1.,0.));col=mix(pal(.6)*.15,sky(r,sd),.6+.4*pow(1.-max(-rd.y,0.),5.));}
  c=mix(col,c,1.-exp(-d*.0022));}
 return c;}`,
    fractal:`
float tr;
float map(vec3 p){float s=1.,k0=1.15+P.z*.25;tr=1e3;for(int i=0;i<8;i++){p=-1.+2.*fract(.5*p+.5);float r2=dot(p,p);tr=min(tr,r2);float k=k0/r2;p*=k;s*=k;}return .25*abs(p.y)/s;}
vec3 render(vec2 p){vec3 ro=vec3(.8*cos(t*.05+P.x*3.),.4+.25*sin(t*.07),.8*sin(t*.05+P.x*3.))*(1.+.06*sin(t*.11)),ta=vec3(0.,.1+.2*sin(t*.03),0.);vec3 rd=camd(ro,ta,p,1.5);
 float d=.01,g=0.;int st=0;for(int i=0;i<140;i++){float h=map(ro+rd*d);g+=exp(-h*300.)*.012;if(h<.00025*d||d>6.)break;d+=h;st=i;}
 vec3 c=pal(.65)*.02+pal(.75)*g*(.4+kick*.8);if(d<6.){vec3 q=ro+rd*d;float tt=tr;vec2 e=vec2(.0003*d,0.);vec3 n=normalize(vec3(map(q+e.xyy)-map(q-e.xyy),map(q+e.yxy)-map(q-e.yxy),map(q+e.yyx)-map(q-e.yyx)));
  float ao=pow(1.-float(st)/140.,2.);vec3 l=normalize(vec3(.6,.8,-.3)),alb=pal(clamp(tt,0.,1.)*.6+.15);
  c=alb*(max(dot(n,l),0.)*1.1+.35*(.5+.5*n.y))*ao+pow(max(dot(reflect(rd,n),l),0.),30.)*.5*ao+pal(.9)*smoothstep(.01,.0,tt)*(1.+lead*2.);c=mix(c,pal(.65)*.04,1.-exp(-d*d*.35));}
 return c;}`,
    corridor:`
float id;
float map(vec3 p){vec3 q=p;q.z=mod(q.z,4.)-2.;float room=-sbox(p-vec3(0.,1.,p.z),vec3(3.2,2.6,1e3));
 float fr=max(sbox(q-vec3(0.,1.,0.),vec3(3.4,2.8,.25)),-sbox(q-vec3(0.,.9+P.x*.3,0.),vec3(2.4-P.y*.5,2.,1.)));
 vec3 c=q;c.x=abs(c.x)-2.6;float col=sbox(c-vec3(0.,1.,0.),vec3(.18,2.6,.18));float d=min(room,min(fr,col));id=d==room?0.:d==fr?1.:2.;return d;}
vec3 shade(vec3 ro,vec3 rd,out vec3 hp,out vec3 hn,out float hd){float d=0.;for(int i=0;i<90;i++){float h=map(ro+rd*d);if(h<.001||d>60.)break;d+=h;}hd=d;hp=ro+rd*d;
 vec2 e=vec2(.002,0.);hn=normalize(vec3(map(hp+e.xyy)-map(hp-e.xyy),map(hp+e.yxy)-map(hp-e.yxy),map(hp+e.yyx)-map(hp-e.yyx)));map(hp);
 float strip=hp.y<-1.55?smoothstep(.12,0.,abs(abs(hp.x)-1.6))*(.6+kick*2.):0.;float lamp=id==1.&&hp.y>3.?2.:0.;
 vec3 alb=id==0.?vec3(.32):id==1.?pal(.3)*.9+.1:vec3(.8);float l=0.;for(int i=0;i<2;i++){float lz=floor(hp.z/4.+float(i))*4.;vec3 lp=vec3(0.,3.,lz);vec3 ld=lp-hp;float dd=length(ld);l+=max(dot(hn,ld/dd),0.)*3./(1.+dd*dd*.35);}
 return alb*(l+.04)+pal(.6)*strip*2.+pal(.9)*lamp;}
vec3 render(vec2 p){float z=t*6.;vec3 ro=vec3(sin(t*.4)*.8,1.+sin(t*.3)*.4,z),rd=camd(ro,ro+vec3(sin(t*.2)*.4,0.,4.),p,1.4);
 vec3 hp,hn;float hd;vec3 c=shade(ro,rd,hp,hn,hd);if(hp.y<-1.5&&hd<60.){vec3 hp2,hn2;float hd2;c+=shade(hp+hn*.01,reflect(rd,hn),hp2,hn2,hd2)*.35;}
 return mix(c,pal(.6)*.05,1.-exp(-hd*.05));}`,
    blobs:`
float mat;
float map(vec3 p){float d=1e3;for(int i=0;i<6;i++){float fi=float(i);vec3 c=vec3(sin(t*.5+fi*P.x*3.+1.),.9+sin(t*.7+fi*1.7)*.6,cos(t*.4+fi*2.3))*1.4;d=smin(d,length(p-c)-.55-kick*.12,.7);}
 float fl=p.y+.3;mat=d<fl?1.:0.;return min(d,fl);}
vec3 nrm(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
float soft(vec3 o,vec3 d){float r=1.,s=.02;for(int i=0;i<32;i++){float h=map(o+d*s);r=min(r,10.*h/s);s+=clamp(h,.02,.3);if(h<.001)break;}return clamp(r,0.,1.);}
vec3 render(vec2 p){vec3 ro=vec3(sin(t*.15)*5.,2.+sin(t*.1),cos(t*.15)*5.),rd=camd(ro,vec3(0.,.6,0.),p,1.7),l=normalize(vec3(.5,.8,.3));vec3 c=vec3(0.),k=vec3(1.);
 for(int b=0;b<2;b++){float d=0.;for(int i=0;i<90;i++){float h=map(ro+rd*d);if(h<.001||d>30.)break;d+=h;}
  if(d>30.){c+=k*sky(rd,l)*.6;break;}vec3 q=ro+rd*d,n=nrm(q);map(q);vec3 alb=mat>.5?pal(.15+q.y*.2):vec3(.08)+vec3(.04)*mod(floor(q.x)+floor(q.z),2.);
  float sh=soft(q+n*.01,l),ao=clamp(map(q+n*.2)/.2,0.,1.);vec3 col=alb*(max(dot(n,l),0.)*sh*1.5+.15*ao)+pow(max(dot(reflect(rd,n),l),0.),40.)*sh;
  col=mix(col,vec3(.02),1.-exp(-d*.04));c+=k*col;k*=mat>.5?alb*.6:vec3(.35);ro=q+n*.01;rd=reflect(rd,n);}
 return c;}`,
    cubes:`
float map(vec3 p){vec2 id=floor(p.xz/2.);vec2 q=mod(p.xz,2.)-1.;float h=noise(id*1.7+P.xy*50.)*2.5+.2+kick*noise(id*3.1)*2.+lead*.6*step(.7,noise(id*5.));
 float b=sbox(vec3(q.x,p.y-h*.5,q.y),vec3(.8,h*.5,.8));vec2 dd=(1.-abs(q))+.02;return min(b,max(max(min(dd.x,dd.y),.05),p.y-5.4));}
vec3 render(vec2 p){float T=t*3.;vec3 ro=vec3(sin(t*.2)*8.,6.+sin(t*.3)*2.,T),rd=camd(ro,ro+vec3(sin(t*.15)*5.,-3.,10.),p,1.5),l=normalize(vec3(.4,.8,-.3));
 float d=0.;bool hit=false;for(int i=0;i<160;i++){float h=map(ro+rd*d);if(h<.002){hit=true;break;}if(d>80.)break;d+=h*.9;}vec3 c=sky(rd,l)*.4;
 if(hit){vec3 q=ro+rd*d;vec2 e=vec2(.003,0.);vec3 n=normalize(vec3(map(q+e.xyy)-map(q-e.xyy),map(q+e.yxy)-map(q-e.yxy),map(q+e.yyx)-map(q-e.yyx)));vec2 id=floor(q.xz/2.);
  vec3 alb=pal(noise(id*.9)*.6+.1);float top=step(.9,n.y);vec3 col=alb*(max(dot(n,l),0.)+.12)+top*pal(.7)*kick*1.5*step(.6,noise(id*2.3));c=mix(col,sky(rd,l)*.4,1.-exp(-d*.035));}
 return c;}`,
    tunnel:`
float ringd;
vec2 path(float z){return vec2(sin(z*.06+P.x*3.)*3.,cos(z*.045+P.y*3.)*2.);}
float map(vec3 q){q.xy-=path(q.z);float a=atan(q.y,q.x),r=length(q.xy);
 float w=2.2+.18*sin(a*6.+q.z*.4)+.1*sin(a*3.-q.z*.7+t)-r;float rz=(fract(q.z/6.)-.5)*6.;ringd=length(vec2(r-1.95,rz))-.08;return min(w*.7,ringd);}
vec3 render(vec2 p){float z=t*9.;vec3 ro=vec3(path(z),z),rd=camd(ro,vec3(path(z+5.),z+5.),p,1.3);
 float d=0.,g=0.;for(int i=0;i<100;i++){float h=map(ro+rd*d);g+=exp(-max(ringd,0.)*30.);if(h<.002||d>70.)break;d+=h;}
 vec3 q=ro+rd*d;vec2 e=vec2(.003,0.);vec3 n=normalize(vec3(map(q+e.xyy)-map(q-e.xyy),map(q+e.yxy)-map(q-e.yxy),map(q+e.yyx)-map(q-e.yyx)));map(q);
 vec3 lp=vec3(path(z+14.),z+14.),ld=normalize(lp-q);float ll=length(lp-q);vec2 c2=q.xy-path(q.z);float a=atan(c2.y,c2.x);
 float stripe=smoothstep(.92,1.,sin(a*8.+q.z*.25+t*2.))*(.3+lead);
 vec2 pn=abs(fract(vec2(a*1.2732,q.z*.5))-.5);float pnl=smoothstep(.0,.04,min(pn.x,pn.y)-.02)*(.7+.3*noise(floor(vec2(a*1.2732,q.z*.5))*7.));vec3 alb=ringd<.01?pal(.55)*(1.5+kick*3.):pal(.2+.08*sin(q.z*.05))*.35*pnl;
 vec3 c=alb*(max(dot(n,ld),0.)*2.2+.03)*3./(1.+ll*ll*.02)+pow(max(dot(reflect(rd,n),ld),0.),24.)*.6+pal(.8)*stripe*.5/(1.+d*.05);
 if(ringd<.01)c=pal(.55)*(1.1+kick*2.5);c=mix(c,pal(.6)*.03,1.-exp(-d*.035));return c+pal(.55)*g*.006*(.5+kick*1.5);}`,
  };
  const progs={};for(const k in SRC)progs[k]=G.prog(G.QV,MAIN(SRC[k]));
  const BR=G.prog(G.QV,'precision mediump float;varying vec2 uv;uniform sampler2D tx;uniform float q;void main(){vec3 c=texture2D(tx,uv*q).rgb;gl_FragColor=vec4(max(c-.6,0.)*1.6,1.);}');
  const BL=G.prog(G.QV,'precision mediump float;varying vec2 uv;uniform sampler2D tx;uniform vec2 dir;void main(){vec3 c=texture2D(tx,uv).rgb*.2;for(int i=1;i<6;i++){float w=.2*exp(-float(i*i)*.12);c+=(texture2D(tx,uv+dir*float(i))+texture2D(tx,uv-dir*float(i))).rgb*w;}gl_FragColor=vec4(c*.95,1.);}');
  const FIN=G.prog(G.QV,`precision highp float;varying vec2 uv;uniform sampler2D a,b,c2;uniform float k,t,g,qq,fl;
    vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
    void main(){vec2 q=uv-.5;float ca=dot(q,q)*.012;vec3 col=vec3(texture2D(a,(uv+q*ca)*qq).r,texture2D(a,uv*qq).g,texture2D(a,(uv-q*ca)*qq).b);
    col+=texture2D(b,uv).rgb*g+texture2D(c2,uv).rgb*g*.7;col=aces(col*1.15)+fl;col*=1.-dot(q,q)*1.1;col+=(fract(sin(dot(uv*1e3+t,vec2(12.9,78.2)))*43758.5)-.5)*.035;gl_FragColor=vec4(pow(col,vec3(.95))*k,1.);}`);
  let sc,h1,h2,q1,q2,nzT;
  let tgB=0,q=1,avg=1/60;
  function targets(){curMeter=(l,b)=>{tgB+=b;};const o={label:'render targets'};sc=G.fbo(IW,IH,o);h1=G.fbo(IW>>1,IH>>1,o);h2=G.fbo(IW>>1,IH>>1,o);q1=G.fbo(IW>>2,IH>>2,o);q2=G.fbo(IW>>2,IH>>2,o);}
  targets();
  let D={};
  function setup(demo,m){curMeter=m;m('render targets (800x450 + bloom chain)',tgB);const R=Rng(hashSeed(demo.seed,30)),th=themeOf(demo.seed),p=th.pal(0);
    const n=new Uint8Array(256*256*4);for(let i=0;i<n.length;i++)n[i]=R.f()*255;if(nzT)gl.deleteTexture(nzT.t);nzT=G.tex(256,256,n,{label:'noise texture'});
    D={pa:p.a,pb:p.b,pd:p.d,P:[R.rf(-1,1),R.rf(-1,1),R.f(),R.f()],Q:[R.f(),R.f(),R.f(),R.f()]};}
  return{setup,resize(w,h){W=w;H=h;},idle(){G.bind(null,W,H);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);},
    draw(s,k){const nm=s.scene==='title'?'blobs':s.scene==='credits'?'fractal':s.scene,pr=progs[nm];gl.disable(gl.DEPTH_TEST);
      // adaptive resolution: render the scene into a smaller part of the target when frames run long (never more than the budget)
      avg+=(s.dt-avg)*.05;if(avg>1/38&&q>.5){q-=.125;avg=1/50;}else if(avg<1/57&&q<1){q+=.125;avg=1/50;}
      const fl=/build/.test(s.kind)?Math.pow(Math.max(0,s.prog),8)*.9:/drop|climax/.test(s.kind)?Math.exp(-s.secT*2.5)*.8:0;
      gl.bindFramebuffer(gl.FRAMEBUFFER,sc.fb);gl.viewport(0,0,IW*q|0,IH*q|0);pr.use().set('R',[IW*q|0,IH*q|0]).set('t',s.secT+s.sec*7.3).set('kick',s.kick).set('snare',s.snare).set('lead',s.lead).set('prog',s.prog).set('P',D.P).set('Q',D.Q).set('pa',D.pa).set('pb',D.pb).set('pd',D.pd).tex('nz',nzT,0);G.quad(pr);
      G.bind(h1);BR.use().set('q',q).tex('tx',sc,0);G.quad(BR);G.bind(h2);BL.use().set('dir',[2/h1.w,0]).tex('tx',h1,0);G.quad(BL);G.bind(h1);BL.use().set('dir',[0,2/h1.h]).tex('tx',h2,0);G.quad(BL);
      G.bind(q1);BL.use().set('dir',[2/q1.w,0]).tex('tx',h1,0);G.quad(BL);G.bind(q2);BL.use().set('dir',[0,2/q1.h]).tex('tx',q1,0);G.quad(BL);
      G.bind(null,W,H);FIN.use().set('qq',q).set('fl',fl).set('k',k).set('t',s.T%10).set('g',.9+s.kick*.5).tex('a',sc,0).tex('b',h1,1).tex('c2',q2,2);G.quad(FIN);}};
}
