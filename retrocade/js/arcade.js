const RetroStore={
  key:'retrocadeState',
  defaults:{coins:500,tickets:0,xp:0,plays:0,wins:0,cabinets:{}},
  load(){try{const raw=localStorage.getItem(this.key);const saved=raw?JSON.parse(raw):{};return{...this.defaults,...saved,cabinets:{...this.defaults.cabinets,...(saved.cabinets||{})}}}catch(error){return{...this.defaults,cabinets:{}}}},
  save(state){try{localStorage.setItem(this.key,JSON.stringify({...this.defaults,...state,cabinets:{...(state&&state.cabinets||{})}}))}catch(error){}},
  award(tickets=0,xp=0,coins=0,cabinet='cabinet'){
    const state=this.load();
    state.tickets=Math.max(0,(state.tickets||0)+tickets);
    state.xp=Math.max(0,(state.xp||0)+xp);
    state.coins=Math.max(0,(state.coins||0)+coins);
    state.plays=(state.plays||0)+1;
    state.cabinets=state.cabinets||{};
    state.cabinets[cabinet]=(state.cabinets[cabinet]||0)+1;
    this.save(state);
    return state;
  }
};

function retroLoadScript(id,src,onload){
  if(document.getElementById(id)){if(onload)onload();return;}
  const script=document.createElement('script');
  script.id=id;script.src=src;script.defer=true;
  if(onload)script.onload=onload;
  script.onerror=()=>console.warn('[RETROCADE] optional script unavailable:',src);
  document.head.appendChild(script);
}
function retroLoadAudio(){
  if(window.RetroAudio||window.__retroAudioLoading)return;
  window.__retroAudioLoading=true;
  retroLoadScript('retro-audio-manager','../js/audio-manager.js');
}

const RetroCatalog={
  SNAKE:'Keyboard: arrows/WASD. Mouse or touch: directional controls. Action gives a quick shove.',
  BREAKOUT:'Keyboard: left/right. Mouse or touch: move on the board or use controls. Action launches the ball.',
  INVADERS:'Keyboard: left/right and Space. Mouse or touch: directional controls and Fire.',
  ASTEROIDS:'Keyboard: left/right rotates, up thrusts, Space fires. Mouse or touch: controls below.',
  PONG:'Keyboard: up/down. Mouse or touch: move directly on the board or use controls.',
  'CLAW MACHINE':'Keyboard: left/right and Space. Mouse or touch: aim controls and Drop.',
  'BUBBLE SHOOTER':'Keyboard: arrows and Space. Mouse or touch: select groups directly.',
  'MEMORY MATCH':'Keyboard: arrows and Enter/Space. Mouse or touch: select cards directly.',
  'MINI RACER':'Keyboard: left/right and Space. Mouse or touch: lane controls and Dodge.',
  'RHYTHM PADS':'Keyboard: 1–4 or Space. Mouse or touch: tap the pads.',
  'FALLING BLOCKS':'Keyboard: left/right and Space. Mouse or touch: move directly or use controls.',
  'FROG DASH':'Keyboard: arrows/WASD. Mouse or touch: directional controls or swipe.'
};

const RetroState={
  mount(){if(document.getElementById('retro-state'))return;const overlay=document.createElement('aside');overlay.id='retro-state';overlay.className='retro-state';overlay.setAttribute('aria-hidden','true');overlay.innerHTML='<div class="retro-state-card"><h1 id="retro-state-title">READY</h1><p id="retro-state-sub">PRESS START</p></div>';document.body.appendChild(overlay)},
  show(title='READY',sub='',type='',ms=900){this.mount();const overlay=document.getElementById('retro-state');const heading=document.getElementById('retro-state-title');const text=document.getElementById('retro-state-sub');if(!overlay||!heading||!text)return;overlay.className='retro-state show '+type;overlay.setAttribute('aria-hidden','false');heading.textContent=title;text.textContent=sub;clearTimeout(window.__retroStateTimer);if(ms!==0)window.__retroStateTimer=setTimeout(()=>this.close(),ms)},
  close(){const overlay=document.getElementById('retro-state');if(!overlay)return;overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true')}
};

function retroHud(){const state=RetroStore.load();const hud=document.getElementById('hud');if(hud)hud.textContent='Coins '+(state.coins||0)+' · Tickets '+(state.tickets||0)+' · Level '+(Math.floor((state.xp||0)/100)+1)}
function retroToast(text){let toast=document.getElementById('retro-toast');if(!toast){toast=document.createElement('div');toast.id='retro-toast';document.body.appendChild(toast)}toast.textContent=text;toast.classList.add('show');clearTimeout(window.__retroToastTimer);window.__retroToastTimer=setTimeout(()=>toast.classList.remove('show'),1100)}
function retroWin(tickets=10,xp=20,coins=0,cabinet='cabinet'){const state=RetroStore.award(tickets,xp,coins,cabinet);retroHud();retroToast('+'+tickets+' tickets · +'+xp+' XP'+(coins?' · +'+coins+' coins':''));if(window.RetroAudio){tickets>=20?RetroAudio.bigWin():RetroAudio.score()}return state}

const RetroInput={
  keys:{},preventKeys:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Spacebar'],
  init(){
    if(window.__retroInputReady)return;
    window.__retroInputReady=true;
    document.addEventListener('keydown',event=>{RetroInput.keys[event.key]=true;if(RetroInput.preventKeys.includes(event.key)&&!event.target.matches('input,textarea,select'))event.preventDefault();const key=event.key.toLowerCase();if(key==='m')RetroInput.toggleAudio();if(event.key==='Escape')RetroState.close()},{passive:false});
    document.addEventListener('keyup',event=>{RetroInput.keys[event.key]=false});
    window.addEventListener('blur',()=>{RetroInput.keys={};document.querySelectorAll('.is-pressed').forEach(button=>button.classList.remove('is-pressed'))});
    document.addEventListener('pointerdown',event=>{const button=event.target.closest('button,.arcade-btn,.touch-btn');if(button)button.classList.add('is-pressed')},true);
    ['pointerup','pointercancel','pointerleave'].forEach(type=>document.addEventListener(type,event=>{const button=event.target.closest('button,.arcade-btn,.touch-btn');if(button)button.classList.remove('is-pressed')},true));
  },
  enhanceControls(title){
    this.init();
    document.body.setAttribute('data-cabinet',title.toLowerCase().replace(/\s+/g,'-'));
    document.querySelectorAll('button,.arcade-btn,.touch-btn').forEach(button=>{if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',button.textContent.trim()||'Arcade control');button.setAttribute('draggable','false');button.style.touchAction='manipulation'});
    document.querySelectorAll('[data-dir],[data-move]').forEach(button=>button.classList.add('direction-control'));
    document.querySelectorAll('canvas').forEach(canvas=>{canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.style.touchAction='none';canvas.addEventListener('contextmenu',event=>event.preventDefault())});
    const note=document.querySelector('.note');
    if(note)note.textContent=RetroCatalog[title]||'Keyboard, mouse, and touch controls supported.';
    RetroState.mount();
  },
  toggleAudio(){if(!window.RetroAudio)return retroToast('Audio still loading');RetroAudio.unlock();const muted=RetroAudio.toggleMute();retroToast(muted?'Audio muted':'Audio on')}
};

function retroHeader(title){
  retroLoadAudio();
  const bar=document.createElement('header');
  bar.className='top';
  bar.innerHTML='<a href="../index.html">← RETROCADE</a><b>'+title+'</b><span id="hud"></span>';
  document.body.prepend(bar);
  retroHud();
  setTimeout(()=>RetroInput.enhanceControls(title),0);
}
function retroCanvasPoint(canvas,event){const rect=canvas.getBoundingClientRect();const source=event.touches&&event.touches[0]?event.touches[0]:event;return{x:((source.clientX-rect.left)/rect.width)*canvas.width,y:((source.clientY-rect.top)/rect.height)*canvas.height}}
function retroBindHold(button,down,up){if(!button)return;const release=up||function(){};button.addEventListener('pointerdown',event=>{event.preventDefault();button.classList.add('is-pressed');down(event)});['pointerup','pointerleave','pointercancel'].forEach(type=>button.addEventListener(type,event=>{button.classList.remove('is-pressed');release(event)}))}
function retroSafeBoot(label,fn){try{fn()}catch(error){console.error('[RETROCADE]',label,error);retroToast('Cabinet error logged')}}
window.addEventListener('error',event=>{console.error('[RETROCADE ERROR]',event.message,event.error)});
window.addEventListener('unhandledrejection',event=>{console.error('[RETROCADE PROMISE]',event.reason)});