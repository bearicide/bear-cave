/* Retrocade shared game audio: user-gesture unlocked, no external files. */
(()=>{'use strict';if(window.RetroGameSound)return;
let ctx=null,muted=localStorage.getItem('retrocade-sound')!=='on',last=0;
function unlock(){if(muted)return false;try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return true}catch{return false}}
function beep(freq=440,duration=.07,type='square',volume=.035){if(!unlock())return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+duration+.01)}
const sounds={tap:()=>beep(330,.035,'triangle',.018),move:()=>beep(210,.025,'sine',.009),score:()=>{beep(660,.09);setTimeout(()=>beep(880,.11),85)},hit:()=>beep(115,.15,'sawtooth',.03),start:()=>{beep(440,.06);setTimeout(()=>beep(660,.09),75)},over:()=>{beep(250,.14);setTimeout(()=>beep(160,.22),145)}};
function play(name){if(muted)return;sounds[name]?.()}
window.RetroGameSound={play,beep,unlock,setMuted(v){muted=!!v;localStorage.setItem('retrocade-sound',muted?'off':'on')},get muted(){return muted}};
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,.control,.play,.btn'))play('tap');else if(e.target.closest('canvas')){const now=performance.now();if(now-last>90){last=now;play('move')}}}, {passive:true});
document.addEventListener('keydown',e=>{if(e.repeat)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','w','a','s','d'].includes(e.key)){const now=performance.now();if(now-last>85){last=now;play('move')}}});
let scoreText='',statusText='';const observe=()=>{const score=document.getElementById('score');const status=document.getElementById('status');if(score){const v=score.textContent;if(scoreText!==''&&v!==scoreText&&Number(v)>Number(scoreText))play('score');scoreText=v}if(status){const v=status.textContent;if(statusText!==''&&v!==statusText){if(/game over|you lose|crashed|dead|failed/i.test(v))play('over');else if(/start|playing|go!/i.test(v))play('start')}statusText=v}};
const timer=setInterval(observe,180);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();