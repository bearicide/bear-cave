'use strict';
const $ = (id) => document.getElementById(id);
const crate = [
  ['Orange Soda',112,'orange_soda'],
  ['Lime Wire',124,'lime_wire'],
  ['Afterglow',98,'afterglow'],
  ['Peel Break',116,'peel_break'],
];
const audio = new AudioContext();
const master = audio.createGain();
const limiter = audio.createDynamicsCompressor();
const capture = audio.createMediaStreamDestination();
master.connect(limiter);
limiter.connect(audio.destination);
limiter.connect(capture);
let recording;
let autoSync = true;
try { autoSync = localStorage.getItem('citrus-auto-sync') !== 'off'; } catch {}
function showSync() {
  $('autosync').setAttribute('aria-pressed', String(autoSync));
  $('autosync').textContent = autoSync ? 'Auto-sync on' : 'Auto-sync off';
}
$('autosync').onclick = () => {
  autoSync = !autoSync;
  showSync();
  try { localStorage.setItem('citrus-auto-sync', autoSync ? 'on' : 'off'); } catch {}
  if (autoSync) syncPlayingDecks();
};
showSync();
function syncPlayingDecks() {
  const playing = decks.filter(deck => !deck.player.paused);
  if (playing.length === 2) playing[1].sync(playing[0]);
}
const clock = (s) => Number.isFinite(s) ? Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0') : '0:00';

class Deck {
  constructor(index) {
    this.index = index;
    this.root = $('deck').content.firstElementChild.cloneNode(true);
    $('decks').append(this.root);
    this.get = (selector) => this.root.querySelector(selector);
    this.get('h2').textContent = 'Deck ' + 'AB'[index];
    this.player = new Audio();
    this.player.preload = 'metadata';
    this.player.preservesPitch = true;
    this.gain = audio.createGain();
    this.fade = audio.createGain();
    this.analyser = audio.createAnalyser();
    this.analyser.fftSize = 1024;
    this.samples = new Uint8Array(this.analyser.fftSize);
    let chain = audio.createMediaElementSource(this.player);
    for (const [label,type,frequency] of [['Low','lowshelf',200],['Mid','peaking',1100],['High','highshelf',4200],['Level']]) {
      const wrap = document.createElement('label');
      wrap.textContent = label;
      const range = document.createElement('input');
      range.type = 'range';
      if (type) {
        const filter = audio.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        chain.connect(filter);
        chain = filter;
        Object.assign(range,{min:-18,max:12,step:1,value:0});
        range.oninput = () => filter.gain.setTargetAtTime(+range.value,audio.currentTime,.02);
      } else {
        Object.assign(range,{min:0,max:1,step:.01,value:.8});
        this.gain.gain.value = .8;
        range.oninput = () => this.gain.gain.setTargetAtTime(+range.value,audio.currentTime,.02);
      }
      wrap.append(range);
      this.get('.eq').append(wrap);
    }
    chain.connect(this.analyser).connect(this.gain).connect(this.fade).connect(master);
    this.playButton = this.get('[data-act=play]');
    this.seek = this.get('.seek');
    this.bpm = this.get('.bpm');
    this.tempo = this.get('.tempo');
    this.loop = this.get('[data-act=loop]');
    this.canvas = this.get('canvas');
    this.paint = this.canvas.getContext('2d');
    this.cue = 0;
    this.generation = 0;
    this.get('input[type=file]').onchange = (e) => {
      this.local(e.target.files[0]);
      e.target.value = '';
    };
    this.root.ondragover = (e) => {
      e.preventDefault();
      this.root.classList.add('drop');
    };
    this.root.ondragleave = (e) => {
      if (!this.root.contains(e.relatedTarget)) this.root.classList.remove('drop');
    };
    this.root.ondrop = (e) => {
      e.preventDefault();
      this.root.classList.remove('drop');
      this.local(e.dataTransfer.files[0]);
    };
    this.root.onclick = (e) => {
      const action = e.target.closest('button')?.dataset.act;
      if (action) this.action(action);
    };
    this.seek.oninput = () => this.jump(this.player.duration * this.seek.value / 1000);
    this.tempo.oninput = () => {
      this.rate(+this.tempo.value);
      const other = decks[1-this.index];
      if (autoSync && !this.player.paused && !other.player.paused) other.sync(this);
    };
    this.bpm.onchange = () => { if (autoSync) syncPlayingDecks(); };
    this.player.onplay = this.player.onpause = this.player.onended = () => this.refresh();
    this.player.onloadedmetadata = () => this.refresh();
    this.player.onerror = () => this.message('This audio could not be opened.');
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.jump((e.clientX-rect.left)/rect.width*this.player.duration);
    };
  }
  message(value) { this.get('.status').textContent = value; }
  jump(time) {
    if (Number.isFinite(time) && Number.isFinite(this.player.duration)) {
      this.player.currentTime = Math.max(0,Math.min(this.player.duration,time));
    }
  }
  refresh() {
    this.playButton.textContent = this.player.paused ? 'Play' : 'Pause';
    this.root.classList.toggle('playing',!this.player.paused);
    this.seek.value = this.player.duration ? this.player.currentTime / this.player.duration * 1000 : 0;
    this.get('.time').textContent = clock(this.player.currentTime)+' / '+clock(this.player.duration)+' · Cue '+clock(this.cue);
  }
  rate(percent) {
    this.tempo.value = percent;
    const actual = +this.tempo.value;
    this.player.playbackRate = 1+actual/100;
    this.get('.pct').textContent = (actual>0?'+':'')+actual+'%';
  }
  async action(action) {
    if (action === 'play') {
      if (!this.player.paused) return this.player.pause();
      try {
        await audio.resume();
        const other = decks[1-this.index];
        if (autoSync && !other.player.paused && this.sync(other) && this.player.currentTime <= this.cue + .08) {
          const sourceBeat = 60 / Number(other.bpm.value);
          const beat = 60 / Number(this.bpm.value);
          const elapsed = (other.player.currentTime-other.cue)/sourceBeat;
          const phase = elapsed-Math.floor(elapsed);
          this.jump(this.cue + phase*beat);
        }
        await this.player.play();
      } catch { this.message('Playback failed. Try another audio file.'); }
    }
    if (action === 'cue') this.jump(this.cue);
    if (action === 'mark') this.cue = this.player.currentTime;
    if (action === 'back') this.jump(this.player.currentTime-1);
    if (action === 'forward') this.jump(this.player.currentTime+1);
    if (action === 'loop') this.loop.setAttribute('aria-pressed',String(this.player.loop = !this.player.loop));
    if (action === 'sync') {
      const other = decks[1-this.index];
      if (this.sync(other, true)) this.message('Tempo matched. Use the cue to line up beats.');
    }
    this.refresh();
  }
  sync(other, feedback = false) {
    if (!this.bpm.value || !other.bpm.value || !this.bpm.validity.valid || !other.bpm.validity.valid) {
      if (feedback) this.message('Enter the BPM on both decks.');
      return false;
    }
    const target = (other.bpm.value*other.player.playbackRate/this.bpm.value-1)*100;
    if (target < -50 || target > 100) {
      if (feedback) this.message('Target BPM is outside the tempo range.');
      return false;
    }
    this.rate(target);
    return true;
  }
  local(file) {
    if (file) this.load(URL.createObjectURL(file),file.name,'',true,false,file);
  }
  starter([title,bpm,slug]) {
    this.load('assets/'+slug+'.mp3',title,bpm,false,true);
  }
  async load(url,title,bpm,owned=false,loop=false,file) {
    const generation = ++this.generation;
    this.player.pause();
    if (this.owned) URL.revokeObjectURL(this.owned);
    this.owned = owned ? url : null;
    this.wave = null;
    this.player.src = url;
    this.player.loop = loop;
    this.loop.setAttribute('aria-pressed',String(loop));
    this.cue = 0;
    this.bpm.value = bpm;
    this.rate(0);
    this.get('.title').textContent = title;
    this.message('');
    this.refresh();
    try {
      const bytes = file ? await file.arrayBuffer() : await (await fetch(url)).arrayBuffer();
      if (generation !== this.generation) return;
      const buffer = await audio.decodeAudioData(bytes);
      if (generation !== this.generation) return;
      const channel = buffer.getChannelData(0);
      this.wave = Array.from({length:256},(_,i) => {
        let peak = 0;
        const start = Math.floor(i*channel.length/256);
        const end = Math.floor((i+1)*channel.length/256);
        for (let n=start;n<end;n++) peak = Math.max(peak,Math.abs(channel[n]));
        return peak;
      });
    } catch {
      // The media element can still play formats that the decoder cannot inspect.
    }
  }
  draw() {
    this.refresh();
    const {width:w,height:h} = this.canvas;
    const ctx = this.paint;
    ctx.clearRect(0,0,w,h);
    const progress = this.player.duration ? this.player.currentTime/this.player.duration : 0;
    const color = this.index ? '#d7fb75' : '#ffac60';
    if (this.wave) {
      this.wave.forEach((peak,i) => {
        ctx.fillStyle = i/256 <= progress ? color : '#805475';
        const height = Math.max(1,peak*h);
        ctx.fillRect(i*w/256,(h-height)/2,w/256,height);
      });
    } else {
      this.analyser.getByteTimeDomainData(this.samples);
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i=0;i<this.samples.length;i++) {
        const x = i*w/(this.samples.length-1);
        const y = this.samples[i]*h/256;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
  }
}
const decks = [new Deck(0),new Deck(1)];
decks.forEach((deck,i) => deck.starter(crate[i]));
for (const sample of crate) {
  const row = document.createElement('div');
  row.className = 'row';
  const name = document.createElement('span');
  name.textContent = sample[0]+' · '+sample[1]+' BPM';
  const buttons = document.createElement('span');
  decks.forEach((deck,i) => {
    const button = document.createElement('button');
    button.textContent = 'Load '+'AB'[i];
    button.setAttribute('aria-label', 'Load '+sample[0]+' on deck '+'AB'[i]);
    button.onclick = () => deck.starter(sample);
    buttons.append(button);
  });
  row.append(name,buttons);
  $('crate').append(row);
}
function mix() {
  const pan = +$('cross').value;
  $('blend').textContent = pan===.5 ? 'Center' : Math.round(Math.abs(pan-.5)*200)+'% toward '+(pan<.5?'A':'B');
  decks[0].fade.gain.setTargetAtTime(Math.cos(pan*Math.PI/2),audio.currentTime,.02);
  decks[1].fade.gain.setTargetAtTime(Math.sin(pan*Math.PI/2),audio.currentTime,.02);
  master.gain.setTargetAtTime(+$('master').value,audio.currentTime,.02);
}
$('cross').oninput = $('master').oninput = mix;
$('center').onclick = () => { $('cross').value = .5; mix(); };
mix();
function stop() { decks.forEach((deck) => { deck.player.pause(); deck.jump(0); }); }
$('stop').onclick = stop;
document.addEventListener('keydown',(e) => {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,textarea,button,[contenteditable]')) return;
  const key = e.key.toLowerCase();
  if (key==='escape') stop();
  if ('alqp'.includes(key) && key.length===1) decks['lp'.includes(key)?1:0].action('al'.includes(key)?'play':'cue');
});
$('remote').onsubmit = async (e) => {
  e.preventDefault();
  const deck = decks[+(e.submitter?.value || 0)];
  const url = new URL($('url').value);
  if (!['http:','https:'].includes(url.protocol)) return deck.message('Use an HTTP or HTTPS audio link.');
  const generation = deck.generation;
  const attempt = (deck.importAttempt || 0)+1;
  deck.importAttempt = attempt;
  deck.message('Importing audio…');
  try {
    const response = await fetch(url);
    if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw Error('Invalid audio response');
    const blob = await response.blob();
    if (generation !== deck.generation || attempt !== deck.importAttempt) return;
    deck.load(URL.createObjectURL(blob),decodeURIComponent(url.pathname.split('/').pop() || 'Online audio'),'',true,false,blob);
  } catch {
    if (generation===deck.generation && attempt===deck.importAttempt) deck.message('Import failed. Download the audio and use Choose file.');
  }
};
$('record').onclick = async () => {
  const status = $('mixStatus');
  if (recording?.state === 'recording') {
    recording.stop();
    return;
  }
  if (recording) return;
  try {
    await audio.resume();
    if (recording) return;
    const recorder = new MediaRecorder(capture.stream);
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
      const url = URL.createObjectURL(new Blob(chunks,{type}));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'citrus_mix.'+(type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm');
      link.textContent = 'Download mix';
      status.replaceChildren(link);
      link.onclick = () => setTimeout(() => URL.revokeObjectURL(url),60000);
      $('record').textContent = '● Record';
      recording = null;
    };
    recorder.start();
    recording = recorder;
    $('record').textContent = '■ Finish recording';
    status.textContent = 'Recording the master output…';
  } catch { status.textContent = 'Recording is unavailable in this browser.'; }
};
setInterval(() => decks.forEach((deck) => deck.draw()),65);
