/* 400K tier visuals — "2003": hardware-accelerated polygons, procedural textures, point-sprite particles,
   render-to-texture glow and feedback trails. Every mesh and texture is generated from the seed at load. */
function vis400k(cv,meter){
  const G=makeGL(cv,(l,b)=>curMeter(l,b));if(!G)return null;const gl=G.gl;
  let curMeter=meter,W=cv.width,H=cv.height,res=[];
  const track=o=>{res.push(o);return o;};
  // ---------- shaders
  const MESH=G.prog(`attribute vec3 p;attribute vec3 n;attribute vec2 t;uniform mat4 P,V,M;varying vec3 wp,wn;varying vec2 uv;
    void main(){vec4 w=M*vec4(p,1.);wp=w.xyz;wn=(M*vec4(n,0.)).xyz;uv=t;gl_Position=P*V*w;}`,
   `precision highp float;uniform sampler2D tx;uniform vec3 cam,ld,lc,amb,fogc,tint,emc;uniform float fogd,headl,emk,uvs,spk;varying vec3 wp,wn;varying vec2 uv;
    void main(){vec4 T=texture2D(tx,uv*uvs);vec3 N=normalize(wn),V=normalize(cam-wp);if(dot(N,V)<0.)N=-N;vec3 L=normalize(mix(ld,V,headl));
    float df=max(dot(N,L),0.),sp=pow(max(dot(N,normalize(L+V)),0.),40.)*spk,d=length(cam-wp),att=mix(1.,1./(1.+d*d*.003),headl);
    vec3 c=T.rgb*tint*(amb+lc*df*att)+lc*sp*att+T.a*emc*emk;gl_FragColor=vec4(mix(c,fogc,1.-exp(-d*fogd)),1.);}`);
  const SPR=G.prog(`attribute vec3 p;attribute vec4 c;uniform mat4 P,V;uniform float ps;varying vec3 col;
    void main(){vec4 v=V*vec4(p,1.);gl_Position=P*v;gl_PointSize=clamp(ps*c.a/max(.1,-v.z),1.,64.);col=c.rgb;}`,
   `precision mediump float;uniform float k;varying vec3 col;void main(){float d=length(gl_PointCoord-.5)*2.,a=max(0.,1.-d);gl_FragColor=vec4(col*a*a*k,1.);}`);
  const SKY=G.prog(G.QV,`precision mediump float;varying vec2 uv;uniform sampler2D tx;uniform vec2 off;uniform vec3 top,bot;uniform float k;
    void main(){vec3 n=texture2D(tx,uv*vec2(1.,.6)+off).rgb;gl_FragColor=vec4(mix(bot,top,uv.y)+n*k,1.);}`);
  const BRIGHT=G.prog(G.QV,`precision mediump float;varying vec2 uv;uniform sampler2D tx;void main(){vec3 c=texture2D(tx,uv).rgb;gl_FragColor=vec4(max(c-.55,0.)*1.8,1.);}`);
  const BLUR=G.prog(G.QV,`precision mediump float;varying vec2 uv;uniform sampler2D tx;uniform vec2 dir;
    void main(){vec3 c=texture2D(tx,uv).rgb*.227;for(int i=1;i<5;i++){float w=i==1?.195:i==2?.122:i==3?.054:.016;c+=(texture2D(tx,uv+dir*float(i))+texture2D(tx,uv-dir*float(i))).rgb*w;}gl_FragColor=vec4(c,1.);}`);
  const COMP=G.prog(G.QV,`precision mediump float;varying vec2 uv;uniform sampler2D a,b;uniform float k,g;
    void main(){vec3 c=texture2D(a,uv).rgb+texture2D(b,uv).rgb*g;vec2 q=uv-.5;c*=1.-dot(q,q)*.9;gl_FragColor=vec4(c*k,1.);}`);
  const FEED=G.prog(G.QV,`precision mediump float;varying vec2 uv;uniform sampler2D tx;uniform float d;void main(){gl_FragColor=vec4(texture2D(tx,(uv-.5)*.995+.5).rgb*d,1.);}`);
  // ---------- render targets
  let scene,pp,small1,small2;
  function targets(){scene=G.fbo(W,H,{depth:true});pp=[G.fbo(W,H),G.fbo(W,H)];small1=G.fbo(W>>2,H>>2);small2=G.fbo(W>>2,H>>2);}
  targets();
  // ---------- geometry helpers: non-indexed [pos3 nrm3 uv2]
  const mesh=(arr,label)=>({b:track(G.buf(new Float32Array(arr),label)),n:arr.length/8});
  function drawMesh(m,M,o){MESH.use().set('M',M).set('tint',o.tint||[1,1,1]).set('emk',o.emk||0).set('emc',o.emc||[1,1,1]).set('uvs',o.uvs||1).set('spk',o.spk??.5).set('headl',o.headl||0).tex('tx',o.tx,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,m.b);const a=[MESH.a('p'),MESH.a('n'),MESH.a('t')];gl.enableVertexAttribArray(a[0]);gl.vertexAttribPointer(a[0],3,gl.FLOAT,false,32,0);
    if(a[1]>=0){gl.enableVertexAttribArray(a[1]);gl.vertexAttribPointer(a[1],3,gl.FLOAT,false,32,12);}if(a[2]>=0){gl.enableVertexAttribArray(a[2]);gl.vertexAttribPointer(a[2],2,gl.FLOAT,false,32,24);}gl.drawArrays(gl.TRIANGLES,0,m.n);}
  const tri=(o,a,b,c,ta,tb,tc)=>{const n=n3(x3(s3(b,a),s3(c,a)));o.push(...a,...n,...ta,...b,...n,...tb,...c,...n,...tc);};
  const quadF=(o,a,b,c,d,u0,v0,u1,v1)=>{tri(o,a,b,c,[u0,v0],[u1,v0],[u1,v1]);tri(o,a,c,d,[u0,v0],[u1,v1],[u0,v1]);};
  // ---------- procedural textures (value-noise fbm, seeded)
  let NZ;
  const noiseOf=R=>{const p=new Uint8Array(512),g=new Float32Array(256);for(let i=0;i<256;i++){p[i]=i;g[i]=R.f();}for(let i=255;i>0;i--){const j=R.ri(0,i);[p[i],p[j]]=[p[j],p[i]];}for(let i=0;i<256;i++)p[i+256]=p[i];
    const v=(x,y,w)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),m=w||256,X=((xi%m)+m)%m,Y=((yi%m)+m)%m,X1=(X+1)%m,Y1=(Y+1)%m,h=(a,b)=>g[p[p[a&255]+(b&255)]];
      return(h(X,Y)*(1-sx)+h(X1,Y)*sx)*(1-sy)+(h(X,Y1)*(1-sx)+h(X1,Y1)*sx)*sy;};
    return{v,fbm:(x,y,o=5,w)=>{let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*v(x*f,y*f,w?w*f:0);a*=.5;f*=2;}return s;}};};
  const mkTex=(S,fn,label,o={})=>{const d=new Uint8Array(S*S*4);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const c=fn(x,y),i=(y*S+x)*4;d[i]=c[0]*255;d[i+1]=c[1]*255;d[i+2]=c[2]*255;d[i+3]=(c[3]||0)*255;}
    return track(G.tex(S,S,d,Object.assign({mip:true,label},o)));};
  const mix3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  // ---------- per-seed content
  let D={};
  function setup(demo,m){
    for(const r of res){if(r.b)gl.deleteBuffer(r.b);if(r.t)gl.deleteTexture(r.t);}res=[];curMeter=m;
    m('render targets',W*H*4*3+W*H*2+(W>>2)*(H>>2)*8);
    const R=Rng(hashSeed(demo.seed,20)),th=themeOf(demo.seed),pA=th.pal(0),pB=th.pal(1),pC=th.pal(2);NZ=noiseOf(R);
    const cA=cpal(pA,.2),cB=cpal(pB,.6),cC=cpal(pC,.4);D={R,pA,pB,pC,cA,cB,cC};
    // tech panels with light strips in alpha (tunnel)
    const cells=[];for(let i=0;i<40;i++)cells.push([R.ri(0,7)*32,R.ri(0,7)*32,R.ri(1,3)*32,R.ri(1,2)*32,R.chance(.35)]);
    D.panel=mkTex(256,(x,y)=>{const n=NZ.fbm(x/32,y/32,4,8);let c=mix3([.18,.19,.22],cA,.35).map(v=>v*(.6+.6*n));let e=0;
      if(x%32<2||y%32<2)c=c.map(v=>v*.35);for(const [cx,cy,w,h,l] of cells)if(x>=cx&&x<cx+w&&y>=cy&&y<cy+h){if(x-cx<2||y-cy<2||cx+w-x<3||cy+h-y<3)c=c.map(v=>v*.5);else if(l&&(y-cy)%8<3&&x-cx>4&&cx+w-x>5)e=1;}
      return[...c,e];},'tunnel panel texture');
    D.hull=mkTex(256,(x,y)=>{const n=NZ.fbm(x/16,y/16,3,16),seam=(x%64<1||y%32<1)?.55:1,riv=((x%64)-2)**2+((y%32)-2)**2<2?1.3:1;const c=mix3([.55,.56,.6],cC,.3).map(v=>v*(.75+.35*n)*seam*riv);return[...c,(x%128>120&&y%64<4)?1:0];},'hull plating texture');
    D.windows=mkTex(256,(x,y)=>{const cx=x%16,cy=y%16,cell=(x>>4)+(y>>4)*16,lit=NZ.v(cell*1.7,3.3)>.55;const c=[.09,.09,.11].map(v=>v*(.8+.4*NZ.v(x/8,y/8)));
      if(cx>3&&cx<13&&cy>3&&cy<12)return lit?[...mix3([1,.85,.55],cB,.3),1]:[.05,.07,.1,0];return[...c,0];},'window texture');
    D.street=mkTex(256,(x,y)=>{const n=.06+.05*NZ.fbm(x/8,y/8,3,32),l=(x%128<3||y%128<3)?1:0;return[n,n,n*1.1,l*.6];},'street texture');
    D.planet=mkTex(512,(x,y)=>{const u=x/512,v=y/512,n=NZ.fbm(u*8,v*8+NZ.fbm(u*4,v*4,3,4)*2,5,8),b=Math.sin(v*30+n*6)*.5+.5;return[...mix3(cpal(pB,n*.6),cpal(pC,.8),b*.4),0];},'planet texture');
    D.nebula=mkTex(256,(x,y)=>{const n=NZ.fbm(x/48,y/48,5,256/48|0||4),m=Math.max(0,n-.42)*2.4;return[...cpal(pA,n+.3).map(v=>v*m),0];},'nebula texture',{});
    const HM=new Float32Array(129*129);for(let z=0;z<129;z++)for(let x=0;x<129;x++)HM[z*129+x]=(NZ.fbm(x/32,z/32,6,4)-.45)*38+Math.max(0,NZ.fbm(x/16+5,z/16,4,8)-.5)*30;
    D.HM=HM;D.colmap=mkTex(256,(x,y)=>{const hx=x/2,hz=y/2,h=HM[(hz|0)*129+(hx|0)],sl=Math.abs(HM[(hz|0)*129+Math.min(128,(hx|0)+1)]-h);
      let c=h<1?[.75,.68,.5]:mix3(cpal(pB,.15),cpal(pA,.55),Math.min(1,h/22));c=mix3(c,[.42,.4,.38],Math.min(1,sl/3));if(h>18)c=mix3(c,[.95,.95,1],Math.min(1,(h-18)/6));return[...c.map(v=>v*(.85+.3*NZ.v(x/3,y/3))),0];},'terrain colour map');
    // logo texture for the title
    const lc=document.createElement('canvas');lc.width=1024;lc.height=256;const lx=lc.getContext('2d');lx.textAlign='center';lx.textBaseline='middle';
    const fit=(s,max)=>{lx.font=`900 ${max}px Tahoma, Verdana, sans-serif`;const w=lx.measureText(s).width;return Math.min(max,max*940/w);};
    D.logoCanvas=t=>{lx.clearRect(0,0,1024,256);const f=fit(t,150);lx.font=`900 ${f}px Tahoma, Verdana, sans-serif`;const g=lx.createLinearGradient(0,60,0,200);g.addColorStop(0,'#fff');g.addColorStop(.48,`rgb(${cA.map(v=>v*255|0)})`);g.addColorStop(.5,'#111');g.addColorStop(1,`rgb(${cB.map(v=>v*255|0)})`);
      lx.lineWidth=10;lx.strokeStyle='#000';lx.strokeText(t,512,128);lx.fillStyle=g;lx.fillText(t,512,128);lx.lineWidth=2;lx.strokeStyle='rgba(255,255,255,.8)';lx.strokeText(t,512,128);return lc;};
    D.logo1=track(G.tex(1024,256,D.logoCanvas(demo.names.group),{clamp:true,label:'logo textures'}));D.logo2=track(G.tex(1024,256,D.logoCanvas(demo.names.title),{clamp:true,label:'logo textures'}));
    // ---- meshes
    // tunnel along a seeded spline
    const sp=[R.rf(.02,.05),R.rf(.03,.07),R.rf(6,14),R.rf(4,10)],path=u=>[Math.sin(u*sp[0])*sp[2]+Math.sin(u*sp[1]*.7)*4,Math.cos(u*sp[1])*sp[3],-u];D.path=path;
    {const o=[],seg=500,sides=R.pick([6,8,12,16]),rad=R.rf(2.6,3.6);D.tubeR=rad;
      for(let i=0;i<seg;i++){const a=path(i),b=path(i+1),ring=(c,u)=>{const t=n3(s3(path(u+1),c)),x=n3(x3([0,1,0],t)),y=x3(t,x);return j=>{const an=j/sides*2*Math.PI;return[c[0]+(Math.cos(an)*x[0]+Math.sin(an)*y[0])*rad,c[1]+(Math.cos(an)*x[1]+Math.sin(an)*y[1])*rad,c[2]+(Math.cos(an)*x[2]+Math.sin(an)*y[2])*rad];};};
        const ra=ring(a,i),rb=ring(b,i+1);for(let j=0;j<sides;j++)quadF(o,ra(j),ra(j+1),rb(j+1),rb(j),j/sides*4,i/6,(j+1)/sides*4,(i+1)/6);}
      D.tube=mesh(o,'tunnel mesh');}
    // ships
    const ship=big=>{const s=shipMesh(R,big),o=[];for(const [a,b,c,g] of s.F){const A=s.V[a],B=s.V[b],C=s.V[c],uv=v=>[v[0]*.3+.5+(g?3:0),v[2]*.2];tri(o,A,B,C,uv(A),uv(B),uv(C));}return mesh(o,'ship meshes');};
    D.ships=[ship(),ship(),ship(true)];D.fleetN=R.ri(5,9);
    // sphere
    {const o=[],S=48,T2=24,P=(i,j)=>{const u=i/S*2*Math.PI,v=j/T2*Math.PI;return[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];};
      for(let i=0;i<S;i++)for(let j=0;j<T2;j++){const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1);const push=(v,u2,v2)=>o.push(...v,...v,u2,v2);push(a,i/S,j/T2);push(b,(i+1)/S,j/T2);push(c,(i+1)/S,(j+1)/T2);push(a,i/S,j/T2);push(c,(i+1)/S,(j+1)/T2);push(d,i/S,(j+1)/T2);}
      D.sphere=mesh(o,'planet mesh');}
    // city blocks
    {const o=[],N=26;for(let bz=0;bz<N;bz++)for(let bx=0;bx<N;bx++){if(R.chance(.12))continue;const cx=(bx-N/2)*10,cz=(bz-N/2)*10,dc=Math.hypot(cx,cz)/(N*5),h=Math.max(3,(1-dc)*R.rf(10,38)*(R.chance(.15)?1.8:1)),w=R.rf(3,4.2),d=R.rf(3,4.2);
      const p=(x,y,z)=>[cx+x*w,y,cz+z*d];const uw=w/2,ud=d/2,uh=h/4;
      quadF(o,p(-1,0,1),p(1,0,1),p(1,h,1),p(-1,h,1),0,0,uw,uh);quadF(o,p(1,0,-1),p(-1,0,-1),p(-1,h,-1),p(1,h,-1),0,0,uw,uh);
      quadF(o,p(1,0,1),p(1,0,-1),p(1,h,-1),p(1,h,1),0,0,ud,uh);quadF(o,p(-1,0,-1),p(-1,0,1),p(-1,h,1),p(-1,h,-1),0,0,ud,uh);quadF(o,p(-1,h,1),p(1,h,1),p(1,h,-1),p(-1,h,-1),.01,.01,.02,.02);}
      D.city=mesh(o,'city mesh');D.cityN=N;}
    {const o=[],S=400;quadF(o,[-S,0,S],[S,0,S],[S,0,-S],[-S,0,-S],0,0,S/32,S/32);D.ground=mesh(o,'ground mesh');}
    // terrain grid
    {const o=[],S=129,sc=4,h=(x,z)=>HM[Math.min(128,z)*129+Math.min(128,x)],P=(x,z)=>[(x-64)*sc,h(x,z),(z-64)*sc];
      for(let z=0;z<128;z++)for(let x=0;x<128;x++){const a=P(x,z),b=P(x+1,z),c=P(x+1,z+1),d=P(x,z+1),u0=x/128,v0=z/128,u1=(x+1)/128,v1=(z+1)/128;
        tri(o,a,d,c,[u0,v0],[u0,v1],[u1,v1]);tri(o,a,c,b,[u0,v0],[u1,v1],[u1,v0]);}D.terrain=mesh(o,'terrain mesh');}
    {const o=[],S=300;quadF(o,[-S,0,S],[S,0,S],[S,0,-S],[-S,0,-S],0,0,S/8,S/8);D.water=mesh(o,'water mesh');}
    // stars + particles
    {const n=2500,a=new Float32Array(n*7);for(let i=0;i<n;i++){const u=R.f()*2*Math.PI,v=Math.acos(R.f()*2-1),r=300;a.set([Math.sin(v)*Math.cos(u)*r,Math.cos(v)*r,Math.sin(v)*Math.sin(u)*r,...mix3([1,1,1],cpal(pA,R.f()),.3),R.rf(150,600)],i*7);}
      D.stars={b:track(G.buf(a,'starfield')),n};}
    D.pN=20000;D.parts=new Float32Array(D.pN*7);D.vel=new Float32Array(D.pN*3);meter('particles',D.pN*40);
    for(let i=0;i<D.pN;i++){const c=cpal(pA,i/D.pN);D.parts.set([R.rf(-8,8),R.rf(-8,8),R.rf(-8,8),...c,R.rf(30,90)],i*7);}
    D.pbuf=track({b:gl.createBuffer()});
    D.cars=new Float32Array(600*7);meter('traffic',600*28);D.carb=track({b:gl.createBuffer()});
    D.cars2=[];for(let i=0;i<600;i++)D.cars2.push([R.ri(-13,13)*10+5*(R.chance(.5)?1:-1)*0,R.f()*260-130,R.chance(.5)?1:-1,R.chance(.5),R.rf(8,20)]);
  }
  // ---------- frame helpers
  let P=M4.id(),V=M4.id(),cam=[0,0,0];
  const setCam=(eye,at,up=[0,1,0],fov=1.1)=>{P=M4.persp(fov,W/H,.1,900);V=M4.look(eye,at,up);cam=eye;MESH.use().set('P',P).set('V',V).set('cam',eye);SPR.use().set('P',P).set('V',V);};
  const light=(o)=>{MESH.use().set('ld',n3(o.ld||[.3,.8,.4])).set('lc',o.lc||[1,1,1]).set('amb',o.amb||[.2,.2,.25]).set('fogc',o.fogc||[0,0,0]).set('fogd',o.fogd||0);};
  const points=(buf,n,ps,k)=>{SPR.use().set('ps',ps).set('k',k);gl.bindBuffer(gl.ARRAY_BUFFER,buf);const a=SPR.a('p'),c=SPR.a('c');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(c);gl.vertexAttribPointer(c,4,gl.FLOAT,false,28,12);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,n);gl.depthMask(true);gl.disable(gl.BLEND);};
  const sky=(top,bot,off,k)=>{gl.disable(gl.DEPTH_TEST);SKY.use().set('top',top).set('bot',bot).set('off',off).set('k',k).tex('tx',D.nebula,0);G.quad(SKY);gl.enable(gl.DEPTH_TEST);};
  const fleet=(s)=>{const t=s.secT,ph=t*.25;for(let i=0;i<D.fleetN;i++){const row=(i/3|0),bx=(i%3-1)*4+Math.sin(t+i)*.4,by=row*1.6-1.5+Math.cos(t*.7+i)*.3,bz=row*4;
      const M=M4.mul(M4.tr(bx*Math.cos(ph)+bz*Math.sin(ph),by,bz*Math.cos(ph)-bx*Math.sin(ph)-18),M4.mul(M4.rotY(ph+Math.PI),M4.rotZ(Math.sin(t*.6)*.35)));
      drawMesh(D.ships[i%2],M,{tx:D.hull,emk:1.5+s.kick*2,emc:D.cB,spk:1});}
    drawMesh(D.ships[2],M4.mul(M4.tr(-40+t*3,6,-60),M4.mul(M4.rotY(-Math.PI/2),M4.sc(3.2))),{tx:D.hull,emk:2,emc:D.cB,spk:.6});};
  // ---------- scenes
  const SC={
    title(s){sky([0,0,0],D.cA.map(v=>v*.15),[s.T*.005,0],.8);setCam([Math.sin(s.T*.1)*2,0,6],[0,0,0]);light({});
      gl.bindBuffer(gl.ARRAY_BUFFER,null);points(D.stars.b,D.stars.n,1,1);
      fleet(s);
      const tx=s.secT<4.2?D.logo1:D.logo2,a=Math.sin(s.T*.7)*.35;const o=[];quadF(o,[-4,-1,0],[4,-1,0],[4,1,0],[-4,1,0],0,1,1,0);if(!D.lq)D.lq=mesh(o,'logo quad');
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);drawMesh(D.lq,M4.mul(M4.tr(0,1.4,0),M4.rotY(a)),{tx,tint:[0,0,0],emk:1.4+s.kick,emc:[1,1,1],spk:0});gl.disable(gl.BLEND);},
    tunnel(s){const u=s.secT*14,e=D.path(u),at=D.path(u+6),r=Math.sin(s.T*.3)*.6;setCam(e,at,[Math.sin(r),Math.cos(r),0],1.25);
      light({ld:[0,0,1],lc:D.cB.map(v=>v*1.6+.4),amb:[.04,.04,.05],fogc:D.cA.map(v=>v*.08),fogd:.035});
      drawMesh(D.tube,M4.id(),{tx:D.panel,headl:1,emk:1.2+s.kick*2.5,emc:D.cB.map(v=>v*1.5),uvs:1});},
    fleet(s){sky([0,0,0],D.cC.map(v=>v*.12),[s.T*.004,.1],.9);const t=s.secT;setCam([Math.sin(t*.12)*14,4+Math.sin(t*.2)*2,8+Math.cos(t*.12)*6],[0,0,-18]);
      light({ld:[-.6,.4,.5],lc:[1.1,1,.95],amb:[.08,.08,.12]});points(D.stars.b,D.stars.n,1,1);
      drawMesh(D.sphere,M4.mul(M4.tr(-30,-14,-90),M4.mul(M4.rotY(s.T*.03),M4.sc(36))),{tx:D.planet,spk:.1});fleet(s);},
    city(s){const t=s.secT,z=90-t*8,x=Math.sin(t*.15)*30;setCam([x,30+Math.sin(t*.4)*8,z],[x+Math.sin(t*.15+.4)*20,2,z-55],[0,1,0],1.1);
      sky(D.cA.map(v=>v*.05),D.cB.map(v=>v*.25),[s.T*.002,0],.25);
      light({ld:[.2,1,.3],lc:D.cB.map(v=>v*.25+.05),amb:[.05,.05,.08],fogc:D.cB.map(v=>v*.2),fogd:.011});
      drawMesh(D.ground,M4.id(),{tx:D.street,emk:.7,emc:D.cB,spk:.1});drawMesh(D.city,M4.id(),{tx:D.windows,emk:.9+s.kick*.5,emc:[1,1,1],spk:.15,uvs:1});
      for(let i=0;i<600;i++){const c=D.cars2[i],a=(c[1]+t*c[4]*c[2]+390)%260-130,lane=Math.floor(i/2)%26-13;const p=c[3]?[lane*10+5,.4,a]:[a,.4,lane*10+5];D.cars.set([...p,...(c[2]>0?[1,.25,.15]:[1,.95,.8]),40],i*7);}
      gl.bindBuffer(gl.ARRAY_BUFFER,D.carb.b);gl.bufferData(gl.ARRAY_BUFFER,D.cars,gl.DYNAMIC_DRAW);points(D.carb.b,600,6,1);},
    particles(s){const t=s.secT,a=D.parts,v=D.vel,dt=Math.min(s.dt,.04),boom=s.kick>.9?1:0;
      for(let i=0;i<D.pN;i++){const j=i*7,k=i*3,x=a[j],y=a[j+1],z=a[j+2],r=Math.hypot(x,y,z)+.01;
        v[k]+=(Math.sin(y*.3+t)-x*.05+boom*x/r*3)*dt;v[k+1]+=(Math.sin(z*.3+t*1.3)-y*.05+boom*y/r*3)*dt;v[k+2]+=(Math.sin(x*.3+t*.7)-z*.05+boom*z/r*3)*dt;
        v[k]*=.985;v[k+1]*=.985;v[k+2]*=.985;a[j]+=v[k]*dt*6;a[j+1]+=v[k+1]*dt*6;a[j+2]+=v[k+2]*dt*6;}
      setCam([Math.sin(t*.2)*26,Math.sin(t*.13)*8,Math.cos(t*.2)*26],[0,0,0]);
      gl.bindBuffer(gl.ARRAY_BUFFER,D.pbuf.b);gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW);points(D.pbuf.b,D.pN,.9,.6);},
    terrain(s){const t=s.secT,z=150-t*9,x=Math.sin(t*.1)*60,hy=(xx,zz)=>{const gx=Math.max(0,Math.min(128,(xx/4+64)|0)),gz=Math.max(0,Math.min(128,(zz/4+64)|0));return D.HM[gz*129+gx];};
      const ey=Math.max(hy(x,z),0)+10;setCam([x,ey,z],[x+Math.sin(t*.1+.3)*30,ey-4,z-40],[0,1,0],1.15);
      const skyc=cpal(D.pA,.1).map(v=>v*.6+.3);sky(skyc.map(v=>v*.6),mix3(skyc,[1,1,1],.4),[s.T*.003,0],.15);
      light({ld:[-.5,.6,-.6],lc:[1.3,1.2,1.05],amb:[.22,.24,.3],fogc:mix3(skyc,[1,1,1],.4),fogd:.0032});
      drawMesh(D.terrain,M4.id(),{tx:D.colmap,spk:.05});
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.blendColor(0,0,0,.6);gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE_MINUS_CONSTANT_ALPHA);
      drawMesh(D.water,M4.tr(0,.4+Math.sin(s.T)*.05,0),{tx:D.nebula,tint:cpal(D.pC,.6).map(v=>v*.5+.2),spk:2,uvs:1});gl.disable(gl.BLEND);},
    credits(s){sky([0,0,0],D.cC.map(v=>v*.12),[s.T*.004,.1],.9);setCam([0,0,0],[Math.sin(s.T*.05),Math.sin(s.T*.03)*.2,-1]);light({});points(D.stars.b,D.stars.n,1,1);}
  };
  let ppi=0;
  return{setup,resize(w,h){W=w;H=h;targets();},
    idle(T){G.bind(null,W,H);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);},
    draw(s,k){const nm=s.scene;
      G.bind(scene);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
      if(nm==='particles'){gl.disable(gl.DEPTH_TEST);G.bind(pp[ppi^1]);FEED.use().set('d',.9).tex('tx',pp[ppi],0);G.quad(FEED);SC.particles(s);ppi^=1;G.bind(scene);gl.disable(gl.DEPTH_TEST);FEED.use().set('d',1).tex('tx',pp[ppi],0);G.quad(FEED);}
      else SC[nm](s);
      gl.disable(gl.DEPTH_TEST);
      G.bind(small1);BRIGHT.use().tex('tx',scene,0);G.quad(BRIGHT);
      for(let i=0;i<2;i++){G.bind(small2);BLUR.use().set('dir',[1/small1.w*1.5,0]).tex('tx',small1,0);G.quad(BLUR);G.bind(small1);BLUR.use().set('dir',[0,1/small1.h*1.5]).tex('tx',small2,0);G.quad(BLUR);}
      G.bind(null,W,H);COMP.use().set('k',k).set('g',1.3+s.kick*.6).tex('a',scene,0).tex('b',small1,1);G.quad(COMP);}};
}
