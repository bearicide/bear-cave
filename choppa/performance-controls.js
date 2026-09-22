(()=>{
'use strict';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const pitch=document.getElementById('pitch');
const drive=document.getElementById('drive');
const filter=document.getElementById('filter');
const delay=document.getElementById('delay');
const knobDeck=document.querySelector('.knobDeck');
if(!pitch||!drive||!filter||!delay||!knobDeck)return;

const style=document.createElement('style');
style.textContent=`
.xyDeck{margin:0 0 16px;border:1px solid rgba(127,215,255,.24);border-radius:18px;background:linear-gradient(180deg,rgba(127,215,255,.07),rgba(255,95,210,.035));padding:12px}
.xyHead{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.xyHead b{text-transform:uppercase;letter-spacing:.12em;color:var(--cyan)}
.xyHead span{color:var(--muted);font-size:.78rem}
.xyPad{position:relative;height:220px;border:1px solid rgba(255,255,255,.18);border-radius:15px;overflow:hidden;touch-action:none;cursor:crosshair;background:linear-gradient(to right,rgba(255,95,210,.08),rgba(127,215,255,.22)),linear-gradient(to top,rgba(0,0,0,.5),rgba(255,255,255,.08)),repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),rgba(255,255,255,.08) calc(25% - 1px) 25%),repeating-linear-gradient(0deg,transparent 0 calc(25% - 1px),rgba(255,255,255,.08) calc(25% - 1px) 25%)}
.xyDot{position:absolute;width:30px;height:30px;border-radius:50%;left:50%;top:100%;transform:translate(-50%,-50%);border:2px solid white;background:radial-gradient(circle,white 0 18%,var(--mag) 22% 52%,rgba(255,95,210,.18) 56%);box-shadow:0 0 22px rgba(255,95,210,.8),0 0 42px rgba(127,215,255,.35);pointer-events:none}
.xyAxis{position:absolute;color:rgba(255,255,255,.72);font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;font-weight:900;pointer-events:none;text-shadow:0 2px 8px #000}
.xyAxis.x{right:10px;bottom:8px}.xyAxis.y{left:8px;top:10px;writing-mode:vertical-rl;transform:rotate(180deg)}
.xyRead{display:flex;justify-content:space-between;gap:10px;margin-top:8px;color:var(--muted);font-size:.75rem}.xyRead b{color:var(--text)}
@media(max-width:620px){.xyPad{height:170px}}
`;
document.head.appendChild(style);

const deck=document.createElement('div');
deck.className='xyDeck';
deck.innerHTML=`<div class="xyHead"><b>XY Performance</b><span>Pitch wheel ±12 • Mod wheel Drive • Double-tap XY to reset</span></div><div id="xyPad" class="xyPad" role="application" aria-label="XY effects pad"><span class="xyAxis x">Filter →</span><span class="xyAxis y">Delay ↑</span><i id="xyDot" class="xyDot"></i></div><div class="xyRead"><span>Filter <b id="xyFilter">20.0 kHz</b></span><span>Delay <b id="xyDelay">0%</b></span><span>Drive <b id="modRead">0%</b></span><span>Bend <b id="bendRead">0 st</b></span></div>`;
knobDeck.insertAdjacentElement('afterend',deck);

const xy=document.getElementById('xyPad');
const dot=document.getElementById('xyDot');
const filterRead=document.getElementById('xyFilter');
const delayRead=document.getElementById('xyDelay');
const modRead=document.getElementById('modRead');
const bendRead=document.getElementById('bendRead');
let dragging=false;
let applyingBend=false;
let bendActive=false;
let pitchBase=+pitch.value;

function dispatch(el){el.dispatchEvent(new Event('input',{bubbles:true}))}
function filterFromX(x){return Math.round(200*Math.pow(100,x))}
function syncReadouts(){
 const fv=+filter.value,dv=+delay.value,drv=+drive.value;
 filterRead.textContent=fv>=1000?(fv/1000).toFixed(fv>=10000?1:2)+' kHz':Math.round(fv)+' Hz';
 delayRead.textContent=Math.round(dv/.8*100)+'%';
 modRead.textContent=Math.round(drv*100)+'%';
 const x=Math.log(clamp(fv,200,20000)/200)/Math.log(100);
 const y=clamp(dv/.8,0,1);
 dot.style.left=(x*100)+'%';
 dot.style.top=((1-y)*100)+'%';
}
function setXY(clientX,clientY){
 const r=xy.getBoundingClientRect();
 const x=clamp((clientX-r.left)/r.width,0,1);
 const y=clamp(1-(clientY-r.top)/r.height,0,1);
 filter.value=filterFromX(x);
 delay.value=(y*.8).toFixed(2);
 dispatch(filter);dispatch(delay);syncReadouts();
}
xy.addEventListener('pointerdown',e=>{dragging=true;xy.setPointerCapture(e.pointerId);setXY(e.clientX,e.clientY)});
xy.addEventListener('pointermove',e=>{if(dragging)setXY(e.clientX,e.clientY)});
xy.addEventListener('pointerup',()=>dragging=false);
xy.addEventListener('pointercancel',()=>dragging=false);
xy.addEventListener('dblclick',()=>{filter.value=20000;delay.value=0;dispatch(filter);dispatch(delay);syncReadouts()});
filter.addEventListener('input',syncReadouts);
delay.addEventListener('input',syncReadouts);
drive.addEventListener('input',syncReadouts);
pitch.addEventListener('input',()=>{if(!applyingBend&&!bendActive)pitchBase=+pitch.value});

function handleMidi(ev){
 const [status,d1,d2]=ev.data;
 const cmd=status&240;
 if(cmd===224){
   const raw=(d2<<7)|d1;
   const norm=clamp((raw-8192)/8192,-1,1);
   const semis=norm*12;
   bendActive=Math.abs(norm)>.002;
   applyingBend=true;
   pitch.value=clamp(pitchBase+semis,+pitch.min,+pitch.max);
   dispatch(pitch);
   applyingBend=false;
   bendRead.textContent=(semis>=0?'+':'')+semis.toFixed(1)+' st';
   if(!bendActive){pitch.value=pitchBase;applyingBend=true;dispatch(pitch);applyingBend=false;bendRead.textContent='0 st'}
 }else if(cmd===176&&d1===1){
   drive.value=(d2/127).toFixed(2);
   dispatch(drive);
   syncReadouts();
 }
}
async function connectWheels(){
 if(!navigator.requestMIDIAccess)return;
 try{
   const access=await navigator.requestMIDIAccess({sysex:false});
   const bind=input=>input.addEventListener('midimessage',handleMidi);
   access.inputs.forEach(bind);
   access.addEventListener('statechange',e=>{if(e.port?.type==='input'&&e.port.state==='connected')bind(e.port)});
 }catch(e){}
}
connectWheels();
syncReadouts();
})();
