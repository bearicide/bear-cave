import * as THREE from "three";
import "./style.css";
import {MoonTerrain} from "./terrain.js";
import {Landmarks} from "./landmarks.js";
import {Controls} from "./controls.js";
import {Achievements} from "./achievements.js";

const $=s=>document.querySelector(s);
const ui={
 canvas:$("#game"),mainMenu:$("#mainMenu"),settingsMenu:$("#settingsMenu"),creditsMenu:$("#creditsMenu"),pauseMenu:$("#pauseMenu"),
 newMoonBtn:$("#newMoonBtn"),continueBtn:$("#continueBtn"),settingsBtn:$("#settingsBtn"),creditsBtn:$("#creditsBtn"),
 backFromSettings:$("#backFromSettings"),backFromCredits:$("#backFromCredits"),resumeBtn:$("#resumeBtn"),saveBtn:$("#saveBtn"),mainMenuBtn:$("#mainMenuBtn"),
 invertToggle:$("#invertToggle"),sensitivityRange:$("#sensitivityRange"),camDistanceRange:$("#camDistanceRange"),
 xpValue:$("#xpValue"),distanceValue:$("#distanceValue"),seedValue:$("#seedValue"),landmarkValue:$("#landmarkValue"),storyValue:$("#storyValue"),
 achievement:$("#achievement"),achievementList:$("#achievementList"),storyBeat:$("#storyBeat"),stick:$("#stick"),nub:$("#nub"),jumpBtn:$("#jumpBtn")
};

const STORAGE="giantMoonSave_v04";
let state={seed:"42069",xp:0,distanceKm:0,achievements:[],player:{x:0,y:50,z:0},settings:{invert:true,sensitivity:5,camDistance:145}};
try{state={...state,...JSON.parse(localStorage.getItem(STORAGE)||"{}")}}catch{}
ui.invertToggle.checked=state.settings.invert;ui.sensitivityRange.value=state.settings.sensitivity;ui.camDistanceRange.value=state.settings.camDistance;

const renderer=new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x03040a);
scene.fog=new THREE.FogExp2(0x03040a,.00042);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,8000);

scene.add(new THREE.HemisphereLight(0xffe7bc,0x14151d,.72));
const moonLight=new THREE.DirectionalLight(0xffefc2,2.4);moonLight.position.set(-260,720,-900);scene.add(moonLight);
const rim=new THREE.DirectionalLight(0x9fb7ff,.75);rim.position.set(900,340,300);scene.add(rim);

const terrain=new MoonTerrain(state.seed);terrain.radius=3;terrain.mat.color.set(0x8f8d87);scene.add(terrain.group);

function moonTexture(){
 const c=document.createElement("canvas"),s=512;c.width=c.height=s;const g=c.getContext("2d");
 const grad=g.createRadialGradient(s*.34,s*.28,8,s*.52,s*.52,s*.52);grad.addColorStop(0,"#fff7cf");grad.addColorStop(.52,"#d9c899");grad.addColorStop(1,"#6d6454");g.fillStyle=grad;g.fillRect(0,0,s,s);
 const rando=i=>{let x=Math.sin(i*999.17)*10000;return x-Math.floor(x)};
 for(let i=0;i<90;i++){const x=rando(i)*s,y=rando(i+40)*s,r=8+rando(i+80)*42,a=.05+rando(i+5)*.16;g.fillStyle=`rgba(45,40,34,${a})`;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.strokeStyle=`rgba(255,246,210,${a*.8})`;g.lineWidth=Math.max(1,r*.05);g.stroke()}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
const moon=new THREE.Mesh(new THREE.SphereGeometry(560,64,32),new THREE.MeshBasicMaterial({map:moonTexture(),fog:false}));
scene.add(moon);

const stars=new THREE.Group();
for(let i=0;i<520;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({color:0xfff3d4,fog:false}));s.position.set((Math.random()-.5)*5200,Math.random()*2300+260,(Math.random()-.5)*5200);stars.add(s)}
scene.add(stars);

const player=new THREE.Group();
const mat=new THREE.MeshLambertMaterial({color:0x19191f,flatShading:true});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(9,34,6,10),mat);body.position.y=30;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(11,12,8),mat);head.position.y=58;player.add(head);
const armGeo=new THREE.BoxGeometry(8,34,8),legGeo=new THREE.BoxGeometry(8,28,8);
for(const x of [-15,15]){const a=new THREE.Mesh(armGeo,mat);a.position.set(x,31,0);player.add(a)}
for(const x of [-6,6]){const l=new THREE.Mesh(legGeo,mat);l.position.set(x,9,0);player.add(l)}
player.position.set(state.player.x,state.player.y,state.player.z);scene.add(player);

const landmarks=new Landmarks(state.seed,terrain);scene.add(landmarks.group);
const controls=new Controls(ui.canvas,ui);
const achievements=new Achievements(state,ui);
landmarks.items.forEach(item=>achievements.addDef("lm_"+item.name,item.name,"A landmark that explains almost nothing. Naturally, it still pays XP.",item.xp));
achievements.renderList();

const storyBeats=[
 [.08,"The moon is too large to be natural.\nNobody comments on it."],
 [.32,"A marker hums in the distance.\nIt may be a memorial. It may be a loading error."],
 [.75,"The empty space does not explain itself.\nThis makes it feel oddly qualified."],
 [1.4,"You begin to suspect the achievements are not rewards.\nThey are receipts."],
 [2.4,"The story was never missing.\nIt was too spread out to look useful."]
];
let storyIndex=-1,mode="menu",velY=0,jumps=0,still=0,lastPos=player.position.clone(),last=performance.now();
function show(screen){[ui.mainMenu,ui.settingsMenu,ui.creditsMenu,ui.pauseMenu].forEach(s=>s.classList.remove("active"));screen?.classList.add("active")}
function showStory(txt){ui.storyBeat.textContent=txt;ui.storyBeat.style.opacity="1";clearTimeout(showStory.t);showStory.t=setTimeout(()=>ui.storyBeat.style.opacity="0",5200)}
function storyTick(){let next=storyIndex;for(let i=0;i<storyBeats.length;i++)if(state.distanceKm>=storyBeats[i][0])next=i;if(next!==storyIndex){storyIndex=next;showStory(storyBeats[next][1])}}
function start(){mode="play";show(null);achievements.unlock("goodmorning")}
function resetWalk(){state.xp=0;state.distanceKm=0;state.achievements=[];achievements.unlocked.clear();achievements.renderList();player.position.set(0,terrain.height(0,0)+33,0);lastPos.copy(player.position);storyIndex=-1;start()}
function save(){state.player={x:player.position.x,y:player.position.y,z:player.position.z};state.settings={invert:ui.invertToggle.checked,sensitivity:Number(ui.sensitivityRange.value),camDistance:Number(ui.camDistanceRange.value)};localStorage.setItem(STORAGE,JSON.stringify(state));achievements.unlock("saved")}
ui.newMoonBtn.onclick=resetWalk;ui.continueBtn.onclick=start;ui.settingsBtn.onclick=()=>show(ui.settingsMenu);ui.creditsBtn.onclick=()=>show(ui.creditsMenu);
ui.backFromSettings.onclick=()=>show(ui.mainMenu);ui.backFromCredits.onclick=()=>show(ui.mainMenu);ui.resumeBtn.onclick=()=>{mode="play";show(null)};ui.saveBtn.onclick=save;ui.mainMenuBtn.onclick=()=>{mode="menu";save();show(ui.mainMenu)};
addEventListener("keydown",e=>{if(e.key==="Escape"&&mode==="play"){mode="pause";show(ui.pauseMenu)}});

function tick(){
 requestAnimationFrame(tick);
 const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
 terrain.update(player.position.x,player.position.z);
 moon.position.set(player.position.x,760,player.position.z-2650);stars.position.set(player.position.x,0,player.position.z);
 if(mode==="play"){
  const mv=controls.movement(),speed=(controls.keys.shift?165:108)*dt,yaw=controls.yaw;
  if(mv.active){
   const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
   const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
   const delta=right.multiplyScalar(mv.x*speed).add(forward.multiplyScalar(-mv.z*speed));
   player.position.add(delta);player.rotation.y=Math.atan2(delta.x,delta.z);
  }
  const ground=terrain.height(player.position.x,player.position.z)+33;
  if(controls.jump()&&Math.abs(player.position.y-ground)<1){velY=36;jumps++;achievements.unlock("jump")}
  velY-=38*dt;player.position.y+=velY*dt;if(player.position.y<ground){player.position.y=ground;velY=0}
  const moved=player.position.distanceTo(lastPos);state.distanceKm+=moved/1000;still=moved<.04?still+dt:0;lastPos.copy(player.position);
  const found=landmarks.check(player,achievements);achievements.tick({distanceKm:state.distanceKm,jumps,stillSeconds:still,lookSeconds:controls.lookSeconds});storyTick();
  ui.xpValue.textContent=state.xp;ui.distanceValue.textContent=state.distanceKm.toFixed(2);ui.landmarkValue.textContent=found;ui.storyValue.textContent=storyIndex<0?"achievement fragments":"fragment "+(storyIndex+1)+"/"+storyBeats.length;
 }
 const r=Number(ui.camDistanceRange.value),yaw=controls.yaw,pitch=controls.pitch;
 const target=new THREE.Vector3(player.position.x,player.position.y+34,player.position.z);
 camera.position.lerp(new THREE.Vector3(target.x+Math.sin(yaw)*Math.cos(pitch)*r,target.y+Math.sin(pitch)*r,target.z+Math.cos(yaw)*Math.cos(pitch)*r),.14);
 camera.lookAt(target);
 renderer.render(scene,camera);
}
tick();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
