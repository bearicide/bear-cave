/* RETROCADE soundscape v3: lightweight procedural cabinet-specific audio */
(()=>{'use strict';if(window.RetroGameSound)return;
const game=(document.body.dataset.game||location.pathname.split('/').pop().replace('.html','')).toLowerCase();
let ctx=null,lastScore=null,lastLives=null,lastStatus='',lastAction=0;
let muted=localStorage.getItem('retrocade-sound')!=='on';
const Audio=window.AudioContext||window.webkitAudioContext;
function unlock(){if(muted||!Audio)return false;try{ctx=ctx||new Audio();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true}catch{return false}}
function note(f=440,d=.09,type='square',v=.035,slide=1,offset=0){if(!unlock())return;const t=ctx.currentTime+offset,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(35,f),t);o.frequency.exponentialRampToValueAtTime(Math.max(35,f*slide),t+d);g.gain.setValueAtTime(Math.max(.0001,v),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+d+.01)}
function sequence(notes,type='square',vol=.03){notes.forEach(([f,t,d=.08])=>note(f,d,type,vol,1,t))}
const fx={
snake:{move:()=>note(180,.025,'triangle',.009),score:()=>sequence([[523,0],[784,.075]],'triangle'),hit:()=>note(160,.24,'sawtooth',.04,.3)},
breakout:{move:()=>{},score:()=>note(650,.055,'square',.027,1.5),hit:()=>note(250,.07,'triangle',.03,1.7)},
invaders:{move:()=>note(115,.035,'square',.01),score:()=>sequence([[320,0],[480,.05]],'square'),hit:()=>note(130,.28,'sawtooth',.04,.2),action:()=>note(1050,.095,'square',.025,.35)},
asteroids:{move:()=>{},score:()=>note(150,.19,'sawtooth',.04,.18),hit:()=>note(90,.28,'sawtooth',.045,.45),action:()=>note(900,.13,'sawtooth',.024,.18)},
pong:{move:()=>{},score:()=>sequence([[440,0],[660,.08],[880,.16]],'sine'),hit:()=>note(220,.13,'square',.03,.65),action:()=>note(410,.04,'square',.016)},
claw:{move:()=>note(185,.06,'triangle',.012),score:()=>sequence([[392,0],[523,.1],[784,.2]],'triangle'),hit:()=>note(120,.15,'triangle',.025),action:()=>note(260,.22,'triangle',.026,.65)},
bubble:{move:()=>{},score:()=>sequence([[600,0],[840,.05]],'sine',.025),hit:()=>note(210,.08,'sine',.018,.65),action:()=>note(480,.08,'sine',.025,1.4)},
memory:{move:()=>{},score:()=>sequence([[523,0],[659,.08],[784,.16]],'sine'),hit:()=>note(210,.11,'triangle',.02),action:()=>note(350,.08,'triangle',.018,1.3)},
racer:{move:()=>note(85,.07,'sawtooth',.008,1.35),score:()=>note(650,.08,'triangle',.02),hit:()=>note(75,.33,'sawtooth',.04,.3),action:()=>note(110,.13,'sawtooth',.015,1.6)},
rhythm:{move:()=>{},score:()=>note(784,.075,'sine',.02),hit:()=>note(110,.19,'sawtooth',.035),action:()=>note(440,.14,'triangle',.035)},
blocks:{move:()=>note(250,.035,'square',.01),score:()=>sequence([[390,0],[520,.06]],'square'),hit:()=>note(125,.16,'square',.025,.6),action:()=>note(360,.07,'square',.018,.7)},
frog:{move:()=>note(280,.075,'sine',.018,1.7),score:()=>sequence([[500,0],[750,.07]],'triangle'),hit:()=>note(100,.25,'sawtooth',.035,.4)},
'neon-vault':{move:()=>{},score:()=>sequence([[523,0],[659,.07],[784,.14],[1047,.23]],'triangle'),hit:()=>note(150,.12,'triangle',.018),action:()=>sequence([[260,0],[390,.06]],'square',.022)}
};
const current=fx[game]||fx.snake;
function play(name){if(muted)return;if(current[name])current[name]();else if(name==='start')sequence([[330,0],[440,.09],[660,.18]],'triangle');else if(name==='over')sequence([[330,0],[247,.14],[165,.28]],'sawtooth',.025);else if(name==='tap')note(300,.025,'triangle',.012)}
function action(){const t=performance.now();if(t-lastAction<110)return;lastAction=t;play('action')}
document.addEventListener('pointerdown',e=>{unlock();if(e.target.closest('#actionBtn,.fire,[data-action],canvas'))action();else if(e.target.closest('button,.control'))play('move')},{passive:true});
document.addEventListener('keydown',e=>{if(e.repeat)return;unlock();if([' ','Enter','Spacebar'].includes(e.key))action();else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key))play('move')});
function inspect(){if(document.hidden)return;const score=document.getElementById('score'),lives=document.getElementById('lives'),status=document.getElementById('status');if(score){const v=Number(score.textContent);if(Number.isFinite(v)){if(lastScore!==null&&v>lastScore)play('score');lastScore=v}}if(lives){const v=Number(lives.textContent);if(Number.isFinite(v)){if(lastLives!==null&&v<lastLives)play('hit');lastLives=v}}if(status){const s=status.textContent||'';if(s!==lastStatus){if(lastStatus&&/game over|you lose|failed|crashed/i.test(s))play('over');else if(lastStatus&&/playing|started/i.test(s))play('start');lastStatus=s}}}
const timer=setInterval(inspect,140);window.addEventListener('pagehide',()=>{clearInterval(timer);ctx?.suspend().catch(()=>{})},{once:true});
window.RetroGameSound={play,unlock,note,setMuted(v){muted=!!v;localStorage.setItem('retrocade-sound',muted?'off':'on')},get muted(){return muted}};
})();