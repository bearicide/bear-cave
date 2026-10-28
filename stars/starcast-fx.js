'use strict';
(()=>{
const api=()=>window.starseedlingsAudio,grid=document.getElementById('fx-grid'),status=document.getElementById('fx-status'),volume=document.getElementById('fx-volume'),output=document.getElementById('fx-volume-value');
if(!grid)return;
const banks={
show:[['⚡','OPENING','rise'],['🔔','STINGER','chime'],['💥','IMPACT','impact'],['🌙','SIGN OFF','fall'],['📡','BREAKING','alarm'],['✨','SPARKLE','spark'],['🎛','SWEEP','sweep'],['⏱','COUNTDOWN','count']],
crowd:[['👏','APPLAUSE','claps'],['🥁','DRUM ROLL','roll'],['🎉','CHEER','cheer'],['😬','AWKWARD','awkward'],['🥊','PUNCH','impact'],['📣','HYPE','hype'],['🫢','GASP','gasp'],['🛎','BELL','chime']],
space:[['☄','LASER','laser'],['🛸','UFO','ufo'],['🌌','NEBULA','nebula'],['🚨','ALERT','alarm'],['🛰','RADAR','radar'],['🌠','WARP','warp'],['🪐','ORBIT','orbit'],['🌑','VOID','void']],
custom:[]};
let bank='show';const playing=new Set(),imports=[];let audioGain=null;
function bus(){const ctx=api().context();if(!audioGain){audioGain=ctx.createGain();audioGain.connect(api().mix())}audioGain.gain.value=Number(volume.value)/100;return audioGain}
function stopAll(){for(const s of playing){try{s.stop()}catch(e){}}playing.clear();status.textContent='ALL FX STOPPED'}
document.getElementById('fx-stop').addEventListener('click',stopAll);
volume.addEventListener('input',()=>{output.textContent=volume.value+'%';if(audioGain)audioGain.gain.value=Number(volume.value)/100});
function note(ctx,at,freq,duration,type='sine',level=.3,endFreq=null){const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(Math.max(25,freq),at);if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),at+duration);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(level,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(g);g.connect(bus());playing.add(osc);osc.onended=()=>playing.delete(osc);osc.start(at);osc.stop(at+duration+.01)}
function noise(ctx,at,duration,level=.2,filterFreq=1700){const len=Math.max(1,Math.ceil(ctx.sampleRate*duration)),b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.4);const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=b;f.type='bandpass';f.frequency.value=filterFreq;g.gain.value=level;src.connect(f);f.connect(g);g.connect(bus());playing.add(src);src.onended=()=>playing.delete(src);src.start(at);src.stop(at+duration+.02)}
function synth(type){const ctx=api().context(),t=ctx.currentTime+.02;switch(type){
case 'rise':case 'sweep':case 'warp':note(ctx,t,110,.75,'sawtooth',.12,type==='warp'?1800:900);break;
case 'fall':case 'void':note(ctx,t,700,.85,'triangle',.2,75);break;
case 'impact':note(ctx,t,150,.24,'sine',.48,38);noise(ctx,t,.16,.25,650);break;
case 'chime':[880,1320,1760].forEach((f,i)=>note(ctx,t+i*.045,f,.5,'sine',.13));break;
case 'alarm':[660,880,660,880].forEach((f,i)=>note(ctx,t+i*.18,f,.17,'square',.11));break;
case 'spark':case 'radar':[1300,1700,2100,2600].forEach((f,i)=>note(ctx,t+i*.08,f,.16,'sine',.12));break;
case 'count':[880,880,880,1320].forEach((f,i)=>note(ctx,t+i*.3,f,.15,'sine',.15));break;
case 'claps':case 'cheer':case 'hype':for(let i=0;i<12;i++)noise(ctx,t+i*.075,.10,.12,1700+i*80);break;
case 'roll':for(let i=0;i<20;i++)noise(ctx,t+i*.042,.08,.12,900);break;
case 'awkward':note(ctx,t,240,.4,'sawtooth',.1,140);note(ctx,t+.45,170,.45,'triangle',.1,100);break;
case 'gasp':noise(ctx,t,.42,.18,2100);break;
case 'laser':note(ctx,t,1400,.35,'sawtooth',.16,120);break;
case 'ufo':case 'nebula':case 'orbit':[220,330,440].forEach((f,i)=>note(ctx,t+i*.09,f,.9,'sine',.12,f*1.2));break;
default:note(ctx,t,440,.25)
}}
async function fire(index){const item=banks[bank][index];if(!item)return;try{await api().init();if(bank==='custom'){const src=api().context().createBufferSource();src.buffer=imports[index].buffer;src.connect(bus());playing.add(src);src.onended=()=>playing.delete(src);src.start()}else synth(item[2]);status.textContent='▶ '+item[1]+' · OUTPUT TO MIX + RECORD';const pad=grid.children[index];pad?.classList.add('firing');setTimeout(()=>pad?.classList.remove('firing'),250)}catch(e){status.textContent='FX ERROR: '+e.message}}
function render(){grid.replaceChildren();const items=bank==='custom'?imports.map((v,i)=>['♫',v.name,i]):banks[bank];if(!items.length){const p=document.createElement('p');p.textContent='Import audio files below to fill this bank.';grid.append(p);return}items.forEach(([icon,name],i)=>{const b=document.createElement('button');b.type='button';b.className='fx-pad';b.innerHTML='<b></b><span></span><small></small>';b.querySelector('b').textContent=icon;b.querySelector('span').textContent=name;b.querySelector('small').textContent=i<4?'KEY '+(i+1):'TAP TO FIRE';b.addEventListener('click',()=>fire(i));grid.append(b)})}
document.querySelectorAll('[data-fx-bank]').forEach(btn=>btn.addEventListener('click',()=>{bank=btn.dataset.fxBank;document.querySelectorAll('[data-fx-bank]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));render();status.textContent=bank.toUpperCase()+' BANK READY'}));
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.repeat||!grid.closest('[data-studio-panel]')?.classList.contains('studio-visible')||/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;const n=Number(e.key);if(n>=1&&n<=4){e.preventDefault();fire(n-1)}});
document.getElementById('fx-files').addEventListener('change',async e=>{const files=[...e.target.files];if(!files.length)return;try{await api().init();for(const f of files){if(imports.length>=16)break;if(!f.type.startsWith('audio/'))continue;try{const buffer=await api().context().decodeAudioData(await f.arrayBuffer());imports.push({name:f.name.replace(/\.[^.]+$/,'').slice(0,20),buffer})}catch(err){status.textContent='Could not decode '+f.name}}bank='custom';document.querySelectorAll('[data-fx-bank]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fxBank==='custom')));render();status.textContent=imports.length+' LOCAL SOUNDS LOADED · Session only'}catch(err){status.textContent=err.message}e.target.value=''});
render();
})();