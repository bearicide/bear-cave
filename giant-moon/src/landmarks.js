
import * as THREE from "three";
export class Landmarks{
  constructor(seed,terrain){this.group=new THREE.Group();this.items=[];this.discovered=new Set();this.terrain=terrain;this.make(seed)}
  rand(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return((h^=h>>>16)>>>0)/4294967296}}
  make(seed){
    const r=this.rand(seed+"landmarks");
    const names=["Tall Boring Rock","Decent Crater","Suspicious Ridge","Moon Lump","Professional Dust Area","Long Shadow Peak","Round Hole Deluxe","Quiet Place"];
    for(let i=0;i<names.length;i++){
      const a=r()*Math.PI*2,d=450+r()*2400,x=Math.cos(a)*d,z=Math.sin(a)*d,y=this.terrain.height(x,z);
      let mesh,type=i%4,mat=new THREE.MeshLambertMaterial({color:type===3?0xb9c3ff:0x555555,flatShading:true});
      if(type===0)mesh=new THREE.Mesh(new THREE.ConeGeometry(24,170,5),mat);
      if(type===1){mesh=new THREE.Mesh(new THREE.TorusGeometry(75,8,8,40),mat);mesh.rotation.x=Math.PI/2;}
      if(type===2){mesh=new THREE.Mesh(new THREE.BoxGeometry(130,35,34),mat);mesh.rotation.y=r()*Math.PI;}
      if(type===3)mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(48,0),mat);
      mesh.position.set(x,y+82,z);mesh.name=names[i];this.group.add(mesh);
      this.items.push({name:names[i],mesh,x,z,xp:1000+i*250});
    }
  }
  check(player,ach){
    for(const item of this.items){
      const d=Math.hypot(player.position.x-item.x,player.position.z-item.z);
      item.mesh.visible=d<2700;
      if(d<130&&!this.discovered.has(item.name)){this.discovered.add(item.name);ach.unlock("lm_"+item.name,item.name,item.xp)}
    }
    return this.discovered.size;
  }
}
