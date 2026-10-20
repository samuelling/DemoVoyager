/* Small WebGL toolkit shared by the 400K, 4M and 40M tiers: programs, buffers, textures, render targets, mat4.
   Every texture and render target is reported to the meter so the page can show how much content it generated. */
function makeGL(canvas,meter,want2){
  const gl=(want2!==false&&canvas.getContext('webgl2',{antialias:false,alpha:false,premultipliedAlpha:false}))||canvas.getContext('webgl',{antialias:false,alpha:false});
  if(!gl)return null;const v2=typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext;
  const fext=v2?gl.getExtension('EXT_color_buffer_float'):gl.getExtension('OES_texture_float');if(v2)gl.getExtension('OES_texture_float_linear');
  const G={gl,v2,float:!!fext};
  G.prog=(vs,fs)=>{const mk=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh)+'\n'+s.split('\n').map((l,i)=>(i+1)+': '+l).join('\n').slice(0,3000));return sh;};
    const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    const U={};return{p,use(){gl.useProgram(p);return this;},u(n){return n in U?U[n]:(U[n]=gl.getUniformLocation(p,n));},a(n){return gl.getAttribLocation(p,n);},
      set(n,v){const l=this.u(n);if(l===null)return this;if(typeof v==='number')gl.uniform1f(l,v);else if(v.length===2)gl.uniform2fv(l,v);else if(v.length===3)gl.uniform3fv(l,v);else if(v.length===4)gl.uniform4fv(l,v);else gl.uniformMatrix4fv(l,false,v);return this;},
      tex(n,t,unit){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(t.d3?gl.TEXTURE_3D:gl.TEXTURE_2D,t.t||t);gl.uniform1i(this.u(n),unit);return this;}};};
  G.buf=(data,label)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);if(label)meter(label,data.byteLength);return b;};
  G.tex=(w,h,data,o={})=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);const fl=o.float&&G.float,hf=!fl&&o.half&&G.float&&v2;
    if(fl)gl.texImage2D(gl.TEXTURE_2D,0,v2?gl.RGBA32F:gl.RGBA,w,h,0,gl.RGBA,gl.FLOAT,data||null);
    else if(hf)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);
    else if(data instanceof HTMLCanvasElement)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,data);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,data||null);
    const lin=o.nearest?gl.NEAREST:gl.LINEAR;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,o.mip?gl.LINEAR_MIPMAP_LINEAR:lin);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,lin);
    const wr=o.clamp?gl.CLAMP_TO_EDGE:gl.REPEAT;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wr);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wr);if(o.mip)gl.generateMipmap(gl.TEXTURE_2D);
    if(o.label)meter(o.label,w*h*4*(fl?4:hf?2:1)*(o.mip?1.33:1));return{t,w,h};};
  G.tex3=(n,data,label)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_3D,t);gl.texImage3D(gl.TEXTURE_3D,0,gl.R8,n,n,n,0,gl.RED,gl.UNSIGNED_BYTE,data);
    for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T,gl.TEXTURE_WRAP_R])gl.texParameteri(gl.TEXTURE_3D,k,gl.REPEAT);gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);if(label)meter(label,n*n*n);return{t,w:n,h:n,d3:1};};
  G.fbo=(w,h,o={})=>{const tx=G.tex(w,h,null,Object.assign({clamp:true},o));const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tx.t,0);
    if(o.depth){const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);if(o.label)meter(o.label,w*h*2);}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{fb,t:tx.t,w,h};};
  G.bind=(f,w,h)=>{gl.bindFramebuffer(gl.FRAMEBUFFER,f?f.fb:null);gl.viewport(0,0,f?f.w:w,f?f.h:h);};
  const tri=G.buf(new Float32Array([-1,-1,3,-1,-1,3]));
  G.quad=pr=>{gl.bindBuffer(gl.ARRAY_BUFFER,tri);const a=pr.a('p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,3);};
  G.QV='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0,1);}';
  G.QV3='#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0,1);}';
  return G;
}
/* mat4 (column-major) */
const M4={
  persp(f,a,n,fa){const t=1/Math.tan(f/2);return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0]);},
  look(e,c,u){const z=n3(s3(e,c)),x=n3(x3(u,z)),y=x3(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-d3(x,e),-d3(y,e),-d3(z,e),1]);},
  mul(a,b){const o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;},
  id(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);},
  rotY(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);},
  rotX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);},
  rotZ(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);},
  tr(x,y,z){const m=M4.id();m[12]=x;m[13]=y;m[14]=z;return m;},
  sc(s){const m=M4.id();m[0]=m[5]=m[10]=s;return m;},
};
const s3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],d3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],x3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],n3=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
/* cosine palettes shared by every tier: one family per seed */
function themeOf(seed){const R=Rng(hashSeed(seed,3)),d0=R.f(),sp=R.pick([.1,.15,.2,.33]),a=R.rf(.42,.58),b=R.rf(.38,.55);
  return{pal:k=>{const R2=Rng(hashSeed(seed,40+k)),d=d0+R2.rf(-.12,.12);return{a:[a,a,a].map(x=>x+R2.rf(-.08,.08)),b:[b,b,b].map(x=>x+R2.rf(-.08,.08)),c:[1,1,1],d:[d,d+sp,d+2*sp]};}};}
const cpal=(p,t)=>[0,1,2].map(j=>Math.max(0,Math.min(1,p.a[j]+p.b[j]*Math.cos(2*Math.PI*(p.c[j]*t+p.d[j])))));
const GLSL_PAL='vec3 pal(float t,vec3 a,vec3 b,vec3 d){return clamp(a+b*cos(6.28318*(t+d)),0.,1.);}';
