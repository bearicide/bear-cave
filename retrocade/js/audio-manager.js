window.RetroAudio=(function(){
  let ctx=null,master=null,music=null,ambience=null,ui=null,fx=null,noiseBuffer=null;
  const cooldowns={};
  const state={muted:false,enabled:false,ready:false,volume:.72,ambience:true};
  const AudioCtor=()=>window.AudioContext||window.webkitAudioContext;

  function init(){
    if(ctx)return true;
    const Ctor=AudioCtor();
    if(!Ctor)return false;
    ctx=new Ctor();
    master=ctx.createGain(); music=ctx.createGain(); ambience=ctx.createGain(); ui=ctx.createGain(); fx=ctx.createGain();
    master.gain.value=state.volume; music.gain.value=.28; ambience.gain.value=.18; ui.gain.value=.68; fx.gain.value=.86;
    music.connect(master); ambience.connect(master); ui.connect(master); fx.connect(master); master.connect(ctx.destination);
    buildNoise(); state.ready=true; return true;
  }
  function unlock(){ if(!init())return; if(ctx.state==='suspended')ctx.resume(); state.enabled=true; }
  function setVolume(v){ state.volume=Math.max(0,Math.min(1,Number(v)||0)); if(master)master.gain.value=state.volume; return state.volume; }
  function toggleMute(force){ state.muted=typeof force==='boolean'?force:!state.muted; if(master)master.gain.value=state.muted?0:state.volume; return state.muted; }
  function buildNoise(){
    noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*1.5,ctx.sampleRate);
    const data=noiseBuffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,.65);
  }
  function group(name){return {music,ambience,ui,fx}[name]||ui;}
  function envGain(target,vol,dur,attack=.006){
    const g=ctx.createGain(),now=ctx.currentTime;
    g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(Math.max(.0001,vol),now+attack); g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    g.connect(target); return g;
  }
  function tone(type='square',freq=220,duration=.08,groupName='ui',volume=.05,slide=0){
    if(state.muted)return; unlock(); if(!ctx)return;
    const now=ctx.currentTime,o=ctx.createOscillator(),g=envGain(group(groupName),volume,duration);
    o.type=type; o.frequency.setValueAtTime(freq,now); if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(24,freq+slide),now+duration*.92);
    o.connect(g); o.start(now); o.stop(now+duration+.02);
  }
  function chord(notes,dur=.12,type='square',vol=.035,space=18){notes.forEach((n,i)=>setTimeout(()=>tone(type,n,dur,'fx',vol),i*space));}
  function noise(duration=.18,volume=.045,filterFreq=900,groupName='fx'){
    if(state.muted)return; unlock(); if(!ctx||!noiseBuffer)return;
    const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=envGain(group(groupName),volume,duration,.004);
    src.buffer=noiseBuffer; f.type='bandpass'; f.frequency.value=filterFreq; f.Q.value=3.5; src.connect(f); f.connect(g); src.start(); src.stop(ctx.currentTime+duration+.03);
  }
  function click(){tone('square',520,.035,'ui',.025,-80)}
  function hover(){tone('triangle',760,.025,'ui',.012)}
  function confirm(){tone('square',240,.045,'ui',.035,90);setTimeout(()=>tone('triangle',480,.06,'ui',.028),35)}
  function coin(){tone('square',880,.07,'fx',.045);setTimeout(()=>tone('square',1320,.08,'fx',.038),58)}
  function start(){chord([196,262,330,392],.085,'square',.034,45)}
  function move(){tone('triangle',180,.035,'ui',.018,25)}
  function fire(){tone('sawtooth',620,.07,'fx',.04,-250);noise(.05,.018,1800)}
  function pickup(){chord([520,700,940],.055,'triangle',.03,38)}
  function hit(){noise(.12,.055,420);tone('sawtooth',120,.11,'fx',.035,-45)}
  function score(){tone('square',980,.045,'fx',.025);}
  function gameOver(){tone('sawtooth',190,.28,'fx',.075,-90);setTimeout(()=>tone('triangle',96,.44,'fx',.055),120);noise(.38,.045,240)}
  function bigWin(){chord([330,440,554,659,880],.12,'square',.045,62);setTimeout(()=>noise(.18,.035,1600),180)}
  function knob(){tone('triangle',320,.03,'ui',.018,60)}
  function ambientHum(){if(!state.ambience||cooldowns.hum&&Date.now()-cooldowns.hum<9000)return;cooldowns.hum=Date.now();tone('sine',55,2.2,'ambience',.01);setTimeout(()=>tone('triangle',67,1.6,'ambience',.007),320)}
  function attract(){if(cooldowns.attract&&Date.now()-cooldowns.attract<22000)return;cooldowns.attract=Date.now();chord([147,196,247,294],.09,'triangle',.018,80)}

  setInterval(()=>{if(!document.hidden&&state.enabled)ambientHum()},7200);
  document.addEventListener('pointerdown',unlock,{once:true});
  document.addEventListener('keydown',unlock,{once:true});
  document.addEventListener('pointerover',e=>{if(e.target.closest('button,.touch-btn,.arcade-btn,.play-btn,.knob'))hover()});
  document.addEventListener('pointerdown',e=>{if(e.target.closest('button,.touch-btn,.arcade-btn,.play-btn'))click()});

  return{state,unlock,setVolume,toggleMute,click,hover,confirm,coin,start,move,fire,pickup,hit,score,gameOver,bigWin,knob,ambientHum,attract};
})();