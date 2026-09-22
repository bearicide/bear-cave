const VERSION='clock-sync-v3-fx-router-v4-direct';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.mode!=='navigate'||url.origin!==self.location.origin||!url.pathname.startsWith('/the-choppa-2/'))return;
  event.respondWith((async()=>{
    const res=await fetch(req,{cache:'no-store'});
    const type=res.headers.get('content-type')||'';
    if(!type.includes('text/html'))return res;
    let html=await res.text();

    const vars="let ctx,master,filter,delay,fb,delayGain,driveNode,buffer=null,slices=[],chopMode='smart',playMode='oneshot',choke=true,useVel=false,active=[],held=new Map(),looping=new Set(),fullLoop=null,midiOuts=[],killed=new WeakSet(),tapCount=0,tapTimer=null;";
    const varsFixed="let ctx,master,filter,delay,fb,delayGain,driveNode,buffer=null,slices=[],chopMode='smart',playMode='oneshot',choke=true,useVel=false,active=[],held=new Map(),looping=new Set(),fullLoop=null,midiOuts=[],killed=new WeakSet(),tapCount=0,tapTimer=null,loopClockTimer=null,loopClockNext=0,loopClockStep=.5;";
    html=html.replace(vars,varsFixed);

    const setMode="function setChopMode(mode){chopMode=mode;$('smartBtn').classList.toggle('active',mode==='smart');$('gridBtn').classList.toggle('active',mode==='grid');if(buffer)makeSlices(mode==='grid')}";
    const setModeFixed="function setChopMode(mode){if(buffer&&chopMode!==mode)stopActive(true);chopMode=mode;$('smartBtn').classList.toggle('active',mode==='smart');$('gridBtn').classList.toggle('active',mode==='grid');if(buffer)makeSlices(mode==='grid')}";
    html=html.replace(setMode,setModeFixed);

    const stop="function stopActive(clear=false){active.forEach(cancelEntry);active=[];held.clear();if(fullLoop){cancelEntry(fullLoop);fullLoop=null}if(clear){looping.clear();[...padsEl.children].forEach(p=>p.classList.remove('looping'));allLeds('off')}}";
    const stopFixed="function stopLoopClock(){if(loopClockTimer){clearInterval(loopClockTimer);loopClockTimer=null}loopClockNext=0}function stopActive(clear=false){active.forEach(cancelEntry);active=[];held.clear();if(fullLoop){cancelEntry(fullLoop);fullLoop=null}if(clear){stopLoopClock();looping.clear();[...padsEl.children].forEach(p=>p.classList.remove('looping'));allLeds('off')}}";
    html=html.replace(stop,stopFixed);

    const trigger="function trigger(i,vel=1,gate=false){ensureAudio();if(!buffer||!slices[i]){beep(i,vel);hit(i);return null}if(choke&&!gate)stopActive(true);const[s,e]=slices[i],entry=makeSource(s,Math.max(.08,e-s),vel,gate,false);if(!entry)return null;entry.pad=i;active.push(entry);hit(i);led(i,'play');entry.src.onended=()=>{active=active.filter(x=>x.src!==entry.src);if(killed.has(entry.src)){led(i,'off');return}if(looping.has(i))trigger(i,vel);else led(i,'off')};return entry}";
    const clockFns=`function updateLoopClockStep(){if(!buffer)return;const rate=Math.pow(2,+$('pitch').value/12);loopClockStep=Math.max(.08,(buffer.duration/16)/rate)}
function scheduleLoopPad(i,when){if(!buffer||!slices[i]||!looping.has(i))return;const[s,e]=slices[i],src=ctx.createBufferSource(),g=ctx.createGain(),rate=Math.pow(2,+$('pitch').value/12),sourceWindow=Math.min(e-s,loopClockStep*rate),atk=Math.min(+$('attack').value,loopClockStep*.25),rel=Math.min(+$('release').value,loopClockStep*.45),gain=1;src.buffer=buffer;src.playbackRate.value=rate;src.connect(g).connect(filter);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(gain,when+atk);g.gain.setValueAtTime(gain,Math.max(when+atk,when+loopClockStep-rel));g.gain.linearRampToValueAtTime(0,when+loopClockStep);src.start(when,s,Math.max(.02,sourceWindow));src.stop(when+loopClockStep+.02);const entry={src,g,pad:i,clocked:true};active.push(entry);src.onended=()=>{active=active.filter(x=>x.src!==src);if(!looping.has(i))led(i,'off')};hit(i);led(i,'loop')}
function clockTick(){if(!ctx||!buffer||!looping.size)return;updateLoopClockStep();const horizon=ctx.currentTime+.12;while(loopClockNext<horizon){for(const i of looping)scheduleLoopPad(i,loopClockNext);loopClockNext+=loopClockStep}}
function startLoopClock(){if(loopClockTimer)return;updateLoopClockStep();loopClockNext=ctx.currentTime+.06;clockTick();loopClockTimer=setInterval(clockTick,25)}
function trigger(i,vel=1,gate=false){ensureAudio();if(!buffer||!slices[i]){beep(i,vel);hit(i);return null}if(choke&&!gate)stopActive(true);const[s,e]=slices[i],entry=makeSource(s,Math.max(.08,e-s),vel,gate,false);if(!entry)return null;entry.pad=i;active.push(entry);hit(i);led(i,'play');entry.src.onended=()=>{active=active.filter(x=>x.src!==entry.src);if(killed.has(entry.src)){led(i,'off');return}led(i,'off')};return entry}`;
    html=html.replace(trigger,clockFns);

    const toggle="function toggleLoop(i){if(looping.has(i)){looping.delete(i);padsEl.children[i].classList.remove('looping');active.filter(x=>x.pad===i).forEach(cancelEntry);active=active.filter(x=>x.pad!==i);led(i,'off');return}if(choke)stopActive(true);looping.add(i);padsEl.children[i].classList.add('looping');trigger(i,1);led(i,'loop')}";
    const toggleFixed="function toggleLoop(i){if(looping.has(i)){looping.delete(i);padsEl.children[i].classList.remove('looping');active.filter(x=>x.pad===i).forEach(cancelEntry);active=active.filter(x=>x.pad!==i);led(i,'off');if(!looping.size)stopLoopClock();return}if(choke)stopActive(true);looping.add(i);padsEl.children[i].classList.add('looping');startLoopClock();led(i,'loop');log('Pad '+(i+1)+' armed. It enters on the shared clock boundary.')}";
    html=html.replace(toggle,toggleFixed);

    const full="function toggleFullLoop(){if(!buffer){log('Load a loop before Full Loop mode.');return}if(fullLoop){cancelEntry(fullLoop);fullLoop=null;[...padsEl.children].forEach(p=>p.classList.remove('looping'));log('Full Loop stopped.');return}if(choke)stopActive(true);fullLoop=makeSource(0,buffer.duration,1,true,true);if(fullLoop){active.push(fullLoop);[...padsEl.children].forEach(p=>p.classList.add('looping'));log('Full Loop running. Tap any pad again to stop.')}}";
    const fullFixed="function toggleFullLoop(){if(!buffer){log('Load a loop before Full Loop mode.');return}if(fullLoop){const old=fullLoop;cancelEntry(old);active=active.filter(x=>x!==old);fullLoop=null;[...padsEl.children].forEach(p=>p.classList.remove('looping'));log('Full Loop stopped.');return}stopActive(true);fullLoop=makeSource(0,buffer.duration,1,true,true);if(fullLoop){active.push(fullLoop);[...padsEl.children].forEach(p=>p.classList.add('looping'));log('Full Loop running. Tap any pad again to stop.')}}";
    html=html.replace(full,fullFixed);

    const panic="function panic(){stopActive(true);log('Stopped. Choke, held notes, loops, and full loop cleared.')}";
    const panicFixed="function panic(){stopActive(true);log('Stopped. Choke, held notes, clocked loops, and full loop cleared.')}";
    html=html.replace(panic,panicFixed);

    const load="async function loadFile(file){try{await ensureAudio();buffer=await ctx.decodeAudioData(await file.arrayBuffer());setChopMode('smart');log(`Loaded <b>${file.name}</b>. Smart Chop armed.`)}catch(e){console.error(e);log('Could not decode that audio file.')}}";
    const loadFixed="async function loadFile(file){try{await ensureAudio();stopActive(true);buffer=await ctx.decodeAudioData(await file.arrayBuffer());setChopMode('smart');log(`Loaded <b>${file.name}</b>. Smart Chop armed. Slice Loop uses the shared 16-step clock.`)}catch(e){console.error(e);log('Could not decode that audio file.')}}";
    html=html.replace(load,loadFixed);

    const reverse="function reverse(){if(!buffer){log('Load audio before reversing.');return}for(let c=0;c<buffer.numberOfChannels;c++)Array.prototype.reverse.call(buffer.getChannelData(c));makeSlices(chopMode==='grid');log('Audio reversed and re-chopped.')}";
    const reverseFixed="function reverse(){if(!buffer){log('Load audio before reversing.');return}stopActive(true);for(let c=0;c<buffer.numberOfChannels;c++)Array.prototype.reverse.call(buffer.getChannelData(c));makeSlices(chopMode==='grid');log('Audio reversed and re-chopped. Clock reset.')}";
    html=html.replace(reverse,reverseFixed);

    const modeHandler="$('modeBtn').onclick=()=>{const order=['oneshot','gate','loop','full'];playMode=order[(order.indexOf(playMode)+1)%order.length];$('modeBtn').textContent='Mode: '+modeNames[playMode];log('Mode set to <b>'+modeNames[playMode]+'</b>.')}";
    const modeHandlerFixed="$('modeBtn').onclick=()=>{const order=['oneshot','gate','loop','full'];const next=order[(order.indexOf(playMode)+1)%order.length];if(playMode==='loop'&&next!=='loop')stopActive(true);playMode=next;$('modeBtn').textContent='Mode: '+modeNames[playMode];log('Mode set to <b>'+modeNames[playMode]+'</b>.')}";
    html=html.replace(modeHandler,modeHandlerFixed);

    html=html.replace(/<script src="\.\/fx-router\.js\?v=\d+"><\/script>/,'').replace('</body>','<script src="./fx-router.js?v=4"></script></body>');

    const headers=new Headers(res.headers);
    headers.set('cache-control','no-store, max-age=0');
    headers.set('x-choppa-patch',VERSION);
    headers.delete('content-length');
    return new Response(html,{status:res.status,statusText:res.statusText,headers});
  })().catch(()=>fetch(req)));
});