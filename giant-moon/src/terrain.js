
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

export class MoonTerrain {
  constructor(seed="42069"){
    this.seed=seed;
    this.rand=this.seeded(seed);
    this.noise=createNoise2D(this.rand);
    this.group=new THREE.Group();
    this.chunkSize=420;
    this.radius=2;
    this.res=46;
    this.chunks=new Map();
    this.mat=new THREE.MeshLambertMaterial({color:0x9d9d9d,flatShading:true});
  }
  seeded(seed){
    let h=2166136261>>>0;
    for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}
    return()=>{h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return(h>>>0)/4294967295;}
  }
  craterHash(ix,iz){
    const r=this.seeded(`${this.seed}:${ix}:${iz}`);
    return {cx:ix*520+(r()-.5)*340,cz:iz*520+(r()-.5)*340,rad:80+r()*170};
  }
  height(x,z){
    let h=this.noise(x*.0022,z*.0022)*62+this.noise(x*.008,z*.008)*18+this.noise(x*.025,z*.025)*4;
    const gx=Math.floor(x/520),gz=Math.floor(z/520);
    for(let ix=gx-1;ix<=gx+1;ix++)for(let iz=gz-1;iz<=gz+1;iz++){
      const c=this.craterHash(ix,iz),d=Math.hypot(x-c.cx,z-c.cz);
      if(d<c.rad){
        const t=d/c.rad;
        h+=-Math.cos(t*Math.PI*.5)*(18+c.rad*.16)+Math.exp(-Math.pow((t-.92)*8,2))*(10+c.rad*.055);
      }
    }
    return h;
  }
  update(px,pz){
    const cx=Math.floor(px/this.chunkSize),cz=Math.floor(pz/this.chunkSize),needed=new Set();
    for(let x=cx-this.radius;x<=cx+this.radius;x++)for(let z=cz-this.radius;z<=cz+this.radius;z++){
      const key=`${x},${z}`;needed.add(key);if(!this.chunks.has(key))this.createChunk(x,z,key);
    }
    for(const [key,mesh] of this.chunks.entries()){
      if(!needed.has(key)){this.group.remove(mesh);mesh.geometry.dispose();this.chunks.delete(key);}
    }
  }
  createChunk(cx,cz,key){
    const geo=new THREE.PlaneGeometry(this.chunkSize,this.chunkSize,this.res,this.res);
    const pos=geo.attributes.position,ox=cx*this.chunkSize,oz=cz*this.chunkSize;
    for(let i=0;i<pos.count;i++){
      const lx=pos.getX(i),ly=pos.getY(i);
      pos.setZ(i,this.height(ox+lx,oz+ly));
    }
    geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,this.mat);
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set(ox,0,oz);
    this.group.add(mesh);
    this.chunks.set(key,mesh);
  }
}
