/* Seeded spaceship generator (shared with Demoseed 40K): lathed hull from random cross-sections, swept wings, tail fin, engine cap (glow faces flagged 1). */
function shipMesh(R,big){
  const n=R.ri(4,6),sd=R.pick([3,4,4,5,6,8]),fl=R.rf(.35,.8),wx=R.rf(.8,1.3),r0=sd===4?Math.PI/4:Math.PI/2,rings=[],V=[[0,0,2.5]],F=[];
  for(let i=0;i<n;i++){const u=i/(n-1);rings.push([1.9-u*3.4,(i?R.rf(.3,.75):R.rf(.12,.3))*(1-.35*u)]);}
  rings.forEach(([z,r])=>{for(let j=0;j<sd;j++){const a=r0+j/sd*2*Math.PI;V.push([Math.cos(a)*r*wx,Math.sin(a)*r*fl,z]);}});
  const tl=V.length,rg=(i,j)=>1+i*sd+((j%sd+sd)%sd);V.push([0,0,rings[n-1][0]-.15]);
  for(let j=0;j<sd;j++)F.push([0,rg(0,j+1),rg(0,j),0],[tl,rg(n-1,j),rg(n-1,j+1),1]);
  for(let i=0;i<n-1;i++)for(let j=0;j<sd;j++)F.push([rg(i,j),rg(i,j+1),rg(i+1,j+1),0],[rg(i,j),rg(i+1,j+1),rg(i+1,j),0]);
  const k=R.ri(1,n-2),[wz,wr]=rings[k],sp=R.rf(1.1,2.6),sw=R.rf(.4,1.6),dh=R.rf(-.3,.4);
  for(const s of [-1,1]){const a=V.length;V.push([s*wr*wx*.9,0,wz+.5],[s*(wr*wx+sp),dh,wz-sw],[s*wr*wx*.9,0,wz-.7]);F.push([a,a+1,a+2,0]);}
  if(R.chance(.6)){const a=V.length,[tz,tr]=rings[n-1];V.push([0,tr*fl,tz+.7],[0,tr*fl+R.rf(.5,1),tz-.3],[0,tr*fl,tz-.1]);F.push([a,a+1,a+2,0]);}
  return{V,F,sc:big?R.rf(2.5,4):1};
}
