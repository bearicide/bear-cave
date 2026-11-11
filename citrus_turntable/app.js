'use strict';
const $ = (id) => document.getElementById(id);
const crate = [
  ['C-Funk',117,'c_funk','USUAN1100001'],
  ['Got Funk',98,'got_funk','USUAN1200005'],
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

function dragNumber(input, onChange, pixelsPerStep = 5) {
  let drag;
  let editing = false;
  const step = Number(input.step) || 1;
  const decimals = (String(step).split('.')[1] || '').length;
  const normalize = (value) => Number(Math.max(Number(input.min),
    Math.min(input.max === '' ? Infinity : Number(input.max), value)).toFixed(decimals));
  let previous = input.value;
  input.readOnly = true;
  input.title = 'Drag to adjust. Double-tap or press Enter to type.';
  function set(value, notify = false) {
    if (editing || (drag && !notify)) return;
    input.value = normalize(value);
    if (notify) onChange(Number(input.value));
  }
  function edit() {
    if (input.disabled || editing) return;
    editing = true;
    previous = input.value;
    input.readOnly = false;
    input.focus();
    input.select();
  }
  input.ondblclick = edit;
  input.onblur = () => {
    if (!editing) return;
    const value = input.value === '' ? null : input.valueAsNumber;
    editing = false;
    input.readOnly = true;
    if (Number.isFinite(value)) set(value,true);
    else input.value = previous;
  };
  input.onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (editing) input.blur(); else edit();
    } else if (editing && event.key === 'Escape') {
      event.preventDefault();
      input.value = previous;
      input.blur();
    } else if (!editing && ['ArrowUp','ArrowDown','ArrowRight','ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      set(Number(input.value === '' ? input.min : input.value) + step * (['ArrowUp','ArrowRight'].includes(event.key) ? 1 : -1), true);
    }
  };
  input.onpointerdown = (event) => {
    if (editing || input.disabled || event.button !== 0 || drag) return;
    input.focus({preventScroll:true});
    drag = {id:event.pointerId,x:event.clientX,y:event.clientY,value:Number(input.value === '' ? input.min : input.value)};
    input.setPointerCapture(event.pointerId);
  };
  input.onpointermove = (event) => {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX-drag.x;
    const dy = drag.y-event.clientY;
    const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (Math.abs(delta) >= pixelsPerStep) drag.moved = true;
    if (drag.moved) set(drag.value + Math.round(delta/pixelsPerStep)*step,true);
  };
  let lastTap = null;
  input.onpointerup = (event) => {
    if (drag?.id !== event.pointerId) return;
    if (event.pointerType === 'touch' && !drag.moved) {
      if (lastTap !== null && event.timeStamp-lastTap < 400) { edit(); lastTap = null; }
      else lastTap = event.timeStamp;
    } else lastTap = null;
    drag = null;
  };
  input.onpointercancel = input.onlostpointercapture = () => { drag = null; };
  return set;
}

function measureSongTitle(label) {
  const distance = Math.max(0, label.firstElementChild.scrollWidth-label.clientWidth);
  label.classList.toggle('song-title-overflow', distance > 1);
  label.style.setProperty('--title-travel', -distance+'px');
  label.style.setProperty('--title-duration', Math.max(6,distance/32+3)+'s');
}
function measureSongTitles() {
  document.querySelectorAll('.song-title').forEach(measureSongTitle);
}
function setSongTitle(label, name) {
  const text = document.createElement('span');
  text.textContent = name;
  label.classList.add('song-title');
  label.title = name;
  label.replaceChildren(text);
  requestAnimationFrame(() => { if (label.isConnected) measureSongTitle(label); });
}
window.addEventListener('resize',measureSongTitles);
document.fonts?.ready.then(measureSongTitles);

function waveformPeaks(buffer, columns = 256) {
  const channel = buffer.getChannelData(0);
  return Array.from({length:columns}, (_, i) => {
    let peak = 0;
    const start = Math.floor(i*channel.length/columns);
    const end = Math.floor((i+1)*channel.length/columns);
    for (let n=start;n<end;n++) peak = Math.max(peak,Math.abs(channel[n]));
    return peak;
  });
}

function estimateBpm(buffer) {
  if (buffer.duration < 4) return null;
  const channels = Array.from({length:Math.min(2,buffer.numberOfChannels)},(_,i) => buffer.getChannelData(i));
  const frame = Math.round(buffer.sampleRate/100);
  const hop = Math.max(1,Math.round(buffer.sampleRate/6000));
  const frames = Math.floor(Math.min(buffer.length,buffer.sampleRate*75)/frame);
  const onsets = new Float64Array(frames);
  const smoothing = 1-Math.exp(-2*Math.PI*170*hop/buffer.sampleRate);
  const low = channels.map(() => 0);
  let previous = 0;
  for (let j=0;j<frames;j++) {
    let power = 0;
    for (let i=j*frame;i<(j+1)*frame;i+=hop) {
      channels.forEach((samples,k) => {
        const value = samples[i];
        low[k] += smoothing*(value-low[k]);
        power += value*value*.35+low[k]*low[k]*.65;
      });
    }
    const energy = Math.log1p(100*Math.sqrt(power*hop/(frame*channels.length)));
    onsets[j] = Math.max(0,energy-previous);
    previous = energy;
  }
  if (onsets.reduce((sum,value) => sum+(value>.05),0) < 6) return null;
  const mean = onsets.reduce((sum,value) => sum+value,0)/frames;
  const minLag = Math.floor(60*buffer.sampleRate/frame/190);
  const maxLag = Math.ceil(60*buffer.sampleRate/frame/65);
  const scores = [];
  for (let lag=minLag-1;lag<=maxLag+1;lag++) {
    let product = 0, left = 0, right = 0;
    for (let i=lag;i<frames;i++) {
      const a = onsets[i]-mean;
      const b = onsets[i-lag]-mean;
      product += a*b;
      left += a*a;
      right += b*b;
    }
    scores[lag] = product/(Math.sqrt(left*right) || 1);
  }
  let best = 0;
  for (let lag=minLag;lag<=maxLag;lag++) {
    if (scores[lag] < scores[lag-1] || scores[lag] < scores[lag+1]) continue;
    if (!best || scores[lag] > scores[best]+.04) best = lag;
  }
  if (!best || scores[best] < .27) return null;
  const left = scores[best-1], center = scores[best], right = scores[best+1];
  const offset = left+right === 2*center ? 0 : .5*(left-right)/(left-2*center+right);
  return Math.round(600*buffer.sampleRate/frame/(best+offset))/10;
}

function normalizationGain(buffer) {
  const channels = Array.from({length:buffer.numberOfChannels}, (_, index) => buffer.getChannelData(index));
  const blockSize = Math.round(buffer.sampleRate*.4);
  const blocks = [];
  let peak = 0;
  for (let start=0; start<buffer.length; start+=blockSize) {
    const end = Math.min(buffer.length,start+blockSize);
    let sum = 0;
    for (const channel of channels) {
      for (let i=start; i<end; i++) {
        const sample = channel[i];
        sum += sample*sample;
        peak = Math.max(peak,Math.abs(sample));
      }
    }
    const power = sum / ((end-start)*channels.length);
    if (power > 10**(-55/10)) blocks.push(power);
  }
  if (!blocks.length) return 1;
  const mean = values => values.reduce((sum,value) => sum+value,0)/values.length;
  const gate = mean(blocks)/10;
  const active = blocks.filter(power => power >= gate);
  const target = 10**(-18/20);
  const ceiling = 10**(-1.5/20);
  return Math.min(target/Math.sqrt(mean(active)),ceiling/peak,10**(18/20));
}

class Deck {
  constructor(index) {
    this.index = index;
    this.root = $('deck').content.firstElementChild.cloneNode(true);
    $(index ? 'deck-b' : 'deck-a').append(this.root);
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
    this.scratchGrains = new Set();
    this.normalization = audio.createGain();
    audio.createMediaElementSource(this.player).connect(this.normalization);
    let chain = this.normalization;
    for (const [label,type,frequency] of [['Low','lowshelf',200],['Mid','peaking',1100],['High','highshelf',4200],['Level']]) {
      const wrap = document.createElement('label');
      wrap.className = 'value-box';
      const caption = document.createElement('span');
      caption.textContent = ({Low:'Bass',Mid:'Mids',High:'Treble',Level:'Level'})[label]+' ';
      const unit = document.createElement('small');
      unit.textContent = type ? 'dB' : '%';
      caption.append(unit);
      wrap.append(caption);
      const range = document.createElement('input');
      range.type = 'number';
      if (type) {
        const filter = audio.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        chain.connect(filter);
        chain = filter;
        Object.assign(range,{min:-18,max:12,step:1,value:0});
        dragNumber(range, value => filter.gain.setTargetAtTime(value,audio.currentTime,.02));
      } else {
        Object.assign(range,{min:0,max:100,step:1,value:80});
        this.gain.gain.value = .8;
        dragNumber(range, value => this.gain.gain.setTargetAtTime(value/100,audio.currentTime,.02), 2);
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
    this.canvas = this.get('.waveform');
    this.spectrum = this.get('.spectrum');
    this.spectrumPaint = this.spectrum.getContext('2d');
    this.spectrumBins = new Uint8Array(this.analyser.frequencyBinCount);
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
    this.showPosition = dragNumber(this.seek, value => this.jump(value), 2);
    this.showTempo = dragNumber(this.tempo, value => {
      this.rate(value);
      const other = decks[1-this.index];
      if (autoSync && !this.player.paused && !other.player.paused) other.sync(this);
    }, 2);
    dragNumber(this.bpm, () => this.bpm.dispatchEvent(new Event('change')), 2);
    this.bpm.onchange = () => { if (autoSync) syncPlayingDecks(); };
    this.player.onplay = this.player.onpause = this.player.onended = () => this.refresh();
    this.player.onloadedmetadata = () => this.refresh();
    this.player.onerror = () => this.message('This audio could not be opened.');
    this.canvas.onpointerdown = (event) => {
      if (this.loading || !event.isPrimary || event.button !== 0 || !Number.isFinite(this.player.duration)) return;
      const rect = this.canvas.getBoundingClientRect();
      this.scratch = { id: event.pointerId, rect, resume: !this.player.paused, x: event.clientX };
      this.canvas.setPointerCapture(event.pointerId);
      this.player.pause();
      audio.resume().catch(() => {});
      this.jump((event.clientX-rect.left)/rect.width*this.player.duration);
      this.root.classList.add('scratching');
    };
    this.canvas.onpointermove = (event) => {
      const scratch = this.scratch;
      if (!scratch || event.pointerId !== scratch.id) return;
      const delta = event.clientX-scratch.x;
      if (delta === 0) return;
      scratch.x = event.clientX;
      const time = Math.max(0, Math.min(this.player.duration,
        (event.clientX-scratch.rect.left)/scratch.rect.width*this.player.duration));
      this.jump(time);
      this.scratchGrain(time, delta);
    };
    const finishScratch = (event) => {
      if (event.pointerId !== this.scratch?.id) return;
      const { resume } = this.scratch;
      this.scratch = null;
      this.root.classList.remove('scratching');
      if (resume) this.player.play().catch(() => this.message('Press Play to resume.'));
    };
    this.canvas.onpointerup = this.canvas.onpointercancel =
      this.canvas.onlostpointercapture = finishScratch;
  }
  scratchGrain(time, delta) {
    const buffer = this.decoded;
    const now = audio.currentTime;
    if (!buffer || audio.state !== 'running' || now < (this.nextGrain || 0)) return;
    this.nextGrain = now + .032;
    const clip = audio.createBuffer(buffer.numberOfChannels, Math.ceil(.05*buffer.sampleRate), buffer.sampleRate);
    const direction = Math.sign(delta);
    const start = Math.floor(time*buffer.sampleRate);
    for (let channel=0;channel<clip.numberOfChannels;channel++) {
      const source = buffer.getChannelData(channel);
      const output = clip.getChannelData(channel);
      for (let i=0;i<output.length;i++) {
        const index = start+i*direction;
        output[i] = source[index] || 0;
      }
    }
    const grain = audio.createBufferSource();
    const envelope = audio.createGain();
    grain.buffer = clip;
    grain.playbackRate.value = Math.max(.7, Math.min(2, Math.abs(delta)/5));
    const end = now + clip.duration/grain.playbackRate.value;
    envelope.gain.setValueAtTime(0,now);
    envelope.gain.linearRampToValueAtTime(.65,now+.005);
    envelope.gain.linearRampToValueAtTime(0,end);
    grain.connect(envelope).connect(this.normalization);
    this.scratchGrains.add(grain);
    grain.onended = () => { this.scratchGrains.delete(grain); grain.disconnect(); envelope.disconnect(); };
    grain.start(now);
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
    this.seek.disabled = !Number.isFinite(this.player.duration);
    if (!this.seek.disabled) this.seek.max = this.player.duration;
    this.showPosition(this.seek.disabled ? 0 : this.player.currentTime);
    this.get('.time').textContent = clock(this.player.currentTime)+' / '+clock(this.player.duration)+' · Cue '+clock(this.cue);
  }
  rate(percent) {
    const actual = Math.round(Math.max(-50,Math.min(100,percent))*10)/10;
    this.showTempo(actual);
    this.player.playbackRate = 1+actual/100;
  }
  async action(action, reference) {
    if (action === 'play') {
      if (this.loading) return;
      if (!this.player.paused) return this.player.pause();
      if (this.playRequest) return;
      const request = {};
      this.playRequest = request;
      try {
        await audio.resume();
        if (this.playRequest !== request) return;
        const other = reference || decks[1-this.index];
        if (autoSync && other !== this && (reference || !other.player.paused) && this.sync(other) && this.player.currentTime <= this.cue + .08) {
          const sourceBeat = 60 / Number(other.bpm.value);
          const beat = 60 / Number(this.bpm.value);
          const elapsed = (other.player.currentTime-other.cue)/sourceBeat;
          const phase = elapsed-Math.floor(elapsed);
          this.jump(this.cue + phase*beat);
        }
        await this.player.play();
      } catch {
        if (this.playRequest === request) this.message('Playback failed. Try another audio file.');
      } finally {
        if (this.playRequest === request) this.playRequest = null;
      }
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
  local(file, bpm = '') {
    if (file) this.load(URL.createObjectURL(file),file.name,bpm,true,false,file);
  }
  starter([title,bpm,slug]) {
    this.load('assets/'+slug+'.mp3',title,bpm,false,true);
  }
  async load(url,title,bpm,owned=false,loop=false,file) {
    const generation = ++this.generation;
    this.playRequest = null;
    this.loading = true;
    this.playButton.disabled = true;
    this.normalization.gain.value = 1;
    this.player.pause();
    if (this.owned) URL.revokeObjectURL(this.owned);
    this.owned = owned ? url : null;
    this.wave = null;
    this.decoded = null;
    this.player.src = url;
    this.player.loop = loop;
    this.loop.setAttribute('aria-pressed',String(loop));
    this.cue = 0;
    this.bpm.value = bpm;
    this.rate(0);
    setSongTitle(this.get('.title'),title);
    this.message('Normalizing track…');
    this.refresh();
    try {
      const bytes = file ? await file.arrayBuffer() : await (await fetch(url)).arrayBuffer();
      if (generation !== this.generation) return;
      const buffer = await audio.decodeAudioData(bytes);
      if (generation !== this.generation) return;
      const gain = normalizationGain(buffer);
      this.normalization.gain.value = gain;
      this.decoded = buffer;
      this.wave = waveformPeaks(buffer);
      const detected = bpm || estimateBpm(buffer);
      if (!this.bpm.value && detected) this.bpm.value = detected;
      this.message('Normalized · '+(gain > 1 ? '+' : '')+(20*Math.log10(gain)).toFixed(1)+' dB'
        +(bpm ? '' : detected ? ' · Estimated '+detected+' BPM' : ' · Enter BPM manually'));

    } catch {
      if (generation === this.generation) this.message('Normalization unavailable for this file.');
    } finally {
      if (generation === this.generation) {
        this.loading = false;
        this.playButton.disabled = false;
      }
    }
  }
  drawSpectrum() {
    const {width, height} = this.spectrum;
    const ctx = this.spectrumPaint;
    const binHz = audio.sampleRate / this.analyser.fftSize;
    this.analyser.getByteFrequencyData(this.spectrumBins);
    ctx.clearRect(0, 0, width, height);
    for (let band=0; band<10; band++) {
      const low = Math.max(1, Math.floor(55 * 1.65**band / binHz));
      const high = Math.min(this.spectrumBins.length, Math.max(low+1, Math.ceil(55 * 1.65**(band+1) / binHz)));
      let peak = 0;
      for (let bin=low; bin<high; bin++) peak = Math.max(peak, this.spectrumBins[bin]);
      const bar = peak / 255 * (height-5);
      const x = band * width / 10 + 2;
      ctx.fillStyle = '#684263';
      ctx.fillRect(x, height-3, width/10-4, 2);
      ctx.fillStyle = this.index ? '#d7fb75' : '#ffac60';
      ctx.fillRect(x, height-5-bar, width/10-4, bar);
    }
  }
  draw() {
    this.drawSpectrum();
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
const preview = new Audio();
const previewGain = audio.createGain();
audio.createMediaElementSource(preview).connect(previewGain).connect(audio.destination);
let activePreview;
function stopPreview() {
  preview.pause();
  preview.removeAttribute('src');
  preview.load();
  if (activePreview) activePreview.textContent = '▶ Preview';
  activePreview = null;
}
preview.onended = stopPreview;
preview.onerror = stopPreview;

async function crateTrack({name, url, file, sample}) {
  const row = document.createElement('div');
  row.className = 'crate-track';
  const title = document.createElement('strong');
  setSongTitle(title,name);
  const waveform = document.createElement('canvas');
  waveform.width = 144;
  waveform.height = 36;
  waveform.setAttribute('aria-hidden','true');
  const status = document.createElement('small');
  status.textContent = 'Reading audio…';
  status.setAttribute('role','status');
  const buttons = document.createElement('div');
  buttons.className = 'crate-actions';
  const listen = document.createElement('button');
  listen.textContent = '▶ Preview';
  listen.setAttribute('aria-label','Preview '+name);
  listen.disabled = true;
  buttons.append(listen);
  let detectedBpm;
  const loads = decks.map((deck,i) => {
    const button = document.createElement('button');
    button.textContent = 'Load '+'AB'[i];
    button.setAttribute('aria-label','Load '+name+' on deck '+'AB'[i]);
    button.disabled = true;
    button.onclick = () => {
      stopPreview();
      if (file) deck.local(file,detectedBpm || ''); else deck.starter(sample);
      $('track-load-status').textContent = 'Loading '+name+' on Deck '+'AB'[i]+'…';
    };
    buttons.append(button);
    return button;
  });
  if (file) {
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label','Remove '+name+' from the music list');
    remove.onclick = () => {
      if (activePreview === listen) stopPreview();
      URL.revokeObjectURL(url);
      row.remove();
    };
    buttons.append(remove);
  }
  row.append(title,waveform,status,buttons);
  if (sample) {
    const source = document.createElement('a');
    source.href = 'https://incompetech.com/music/royalty-free/index.html?isrc='+sample[3];
    source.textContent = 'Original track';
    source.target = '_blank';
    source.rel = 'noopener';
    row.append(source);
  }
  $('crate').append(row);
  try {
    const bytes = file ? await file.arrayBuffer() : await (await fetch(url)).arrayBuffer();
    if (!row.isConnected) return;
    const buffer = await audio.decodeAudioData(bytes);
    if (!row.isConnected) return;
    const gain = normalizationGain(buffer);
    const ctx = waveform.getContext('2d');
    const peaks = waveformPeaks(buffer,waveform.width);
    const max = Math.max(...peaks) || 1;
    ctx.fillStyle = file ? '#d7fb75' : '#ffac60';
    peaks.forEach((peak,x) => {
      const height = Math.max(1,peak/max*(waveform.height-4));
      ctx.fillRect(x,(waveform.height-height)/2,1,height);
    });
    detectedBpm = sample ? sample[1] : estimateBpm(buffer);
    status.textContent = clock(buffer.duration)+(detectedBpm ? ' · '+(sample ? '' : 'About ')+detectedBpm+' BPM' : ' · BPM unknown');
    listen.disabled = false;
    loads.forEach(button => { button.disabled = false; });
    listen.onclick = async () => {
      if (activePreview === listen) return stopPreview();
      stopPreview();
      activePreview = listen;
      listen.textContent = '■ Stop preview';
      previewGain.gain.value = gain*.65;
      preview.src = url;
      try {
        await audio.resume();
        if (activePreview === listen) await preview.play();
      } catch {
        if (activePreview === listen) stopPreview();
      }
    };
  } catch {
    if (row.isConnected) status.textContent = 'Could not read this audio file.';
  }
}

for (const sample of crate) {
  crateTrack({name:sample[0],url:'assets/'+sample[2]+'.mp3',sample});
}
$('crate-files').onchange = async event => {
  const files = Array.from(event.target.files);
  event.target.value = '';
  for (const file of files) {
    await crateTrack({name:file.name,url:URL.createObjectURL(file),file});
  }
};
const pad = $('mix-pad');
const dot = pad.querySelector('.pad-dot');
let blend = 50;
let volume = 80;
const showBlend = dragNumber($('cross'), value => mix(value, volume), 2);
const showVolume = dragNumber($('master'), value => mix(blend, value), 2);
function mix(x, y) {
  blend = Math.round(Math.max(0, Math.min(100, x)));
  volume = Math.round(Math.max(0, Math.min(100, y)));
  const pan = blend / 100;
  showBlend(blend);
  showVolume(volume);
  dot.style.left = blend+'%';
  dot.style.top = (100-volume)+'%';
  decks[0].fade.gain.setTargetAtTime(Math.cos(pan*Math.PI/2),audio.currentTime,.02);
  decks[1].fade.gain.setTargetAtTime(Math.sin(pan*Math.PI/2),audio.currentTime,.02);
  master.gain.setTargetAtTime(volume/100,audio.currentTime,.02);
}
function pointMix(event) {
  const rect = pad.getBoundingClientRect();
  mix((event.clientX-rect.left)/rect.width*100, (rect.bottom-event.clientY)/rect.height*100);
}
pad.onpointerdown = (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  pad.setPointerCapture(event.pointerId);
  pointMix(event);
};
pad.onpointermove = (event) => {
  if (pad.hasPointerCapture(event.pointerId)) pointMix(event);
};
pad.onkeydown = (event) => {
  const delta = {ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[event.key];
  if (!delta) return;
  event.preventDefault();
  mix(blend+delta[0],volume+delta[1]);
};
$('center').onclick = () => mix(50,volume);
mix(blend,volume);
function stop() {
  stopPreview();
  for (const deck of decks) {
    deck.playRequest = null;
    deck.scratch = null;
    deck.root.classList.remove('scratching');
    for (const grain of deck.scratchGrains) grain.stop();
    deck.scratchGrains.clear();
    deck.player.pause();
    deck.jump(0);
  }
}
$('stop').onclick = stop;
function playAll() {
  const ready = decks.filter(deck => !deck.loading && Number.isFinite(deck.player.duration));
  const lead = ready.find(deck => !deck.player.paused) || ready[0];
  for (const deck of ready) {
    if (deck.player.paused && !deck.scratch) deck.action('play', lead);
  }
}
$('play-all').onclick = playAll;
$('try-mixer').onclick = () => {
  playAll();
  $('play-all').focus();
};

document.addEventListener('keydown',(e) => {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,textarea,select,[contenteditable]')) return;
  const key = e.key.toLowerCase();
  if (key==='escape') stop();
  if (e.code==='Space') {
    e.preventDefault();
    if (activePreview || decks.some(deck => !deck.player.paused || deck.scratch || deck.playRequest)) stop();
    else playAll();
    return;
  }
  if (e.target.closest('button')) return;
  if ('alqp'.includes(key) && key.length===1) decks['lp'.includes(key)?1:0].action('al'.includes(key)?'play':'cue');
});
let musicSearch;
$('music-search').onsubmit = async event => {
  event.preventDefault();
  const query = $('music-query').value.trim();
  if (!query) return;
  musicSearch?.abort();
  const controller = new AbortController();
  musicSearch = controller;
  const status = $('music-status');
  const results = $('music-results');
  results.replaceChildren();
  status.textContent = 'Searching…';
  const params = new URLSearchParams({
    action:'query',generator:'search',gsrsearch:query+' filetype:audio',gsrnamespace:'6',
    gsrlimit:'12',prop:'imageinfo',iiprop:'url|mime|extmetadata',format:'json',origin:'*'
  });
  try {
    const response = await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:controller.signal});
    if (!response.ok) throw Error('Search unavailable');
    const data = await response.json();
    if (data.error) throw Error('Search unavailable');
    if (musicSearch !== controller) return;
    for (const page of Object.values(data.query?.pages || {}).sort((a,b) => a.index-b.index)) {
      const info = page.imageinfo?.[0];
      const license = info?.extmetadata?.LicenseShortName?.value;
      if (!license || !(info.mime?.startsWith('audio/') || info.mime === 'application/ogg') ||
          !info.url?.startsWith('https://upload.wikimedia.org/') ||
          !info.descriptionurl?.startsWith('https://commons.wikimedia.org/')) continue;
      const row = document.createElement('li');
      const title = document.createElement('strong');
      setSongTitle(title,page.title.replace(/^File:/,'').replace(/\.[^.]+$/,'').replaceAll('_',' '));
      const source = document.createElement('a');
      source.href = info.descriptionurl;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = license+' · Source and credits';
      const actions = document.createElement('div');
      actions.className = 'crate-actions';
      decks.forEach((deck,i) => {
        const button = document.createElement('button');
        button.textContent = 'Load '+'AB'[i];
        button.onclick = () => importAudio(new URL(info.url),deck,status,title.textContent);
        actions.append(button);
      });
      row.append(title,source,actions);
      results.append(row);
    }
    status.textContent = results.children.length ? '' : 'No matching audio found. Try another title, artist, or style.';
  } catch {
    if (musicSearch === controller) status.textContent = 'Search is unavailable right now. Try again or add music from your device.';
  }
};
$('remote').onsubmit = async (e) => {
  e.preventDefault();
  const deck = decks[+(e.submitter?.value || 0)];
  const status = $('link-status');
  let url;
  try {
    url = new URL($('url').value.trim());
  } catch {
    return status.textContent = 'Paste a link to an audio file, like an MP3.';
  }
  if (!['http:','https:'].includes(url.protocol)) return status.textContent = 'Paste a link to an audio file, like an MP3.';
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(url.hostname)) {
    status.textContent = 'That’s a YouTube page. Choose a saved audio file or try Find free music.';
    return;
  }
  importAudio(url,deck,status);
};
async function importAudio(url,deck,status,title) {
  const generation = deck.generation;
  const attempt = (deck.importAttempt || 0)+1;
  deck.importAttempt = attempt;
  status.textContent = 'Getting your track…';
  try {
    const response = await fetch(url);
    if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw Error('Invalid audio response');
    const blob = await response.blob();
    if (generation !== deck.generation || attempt !== deck.importAttempt) return;
    status.textContent = 'Sent to Deck '+'AB'[deck.index]+'.';
    deck.load(URL.createObjectURL(blob),title || decodeURIComponent(url.pathname.split('/').pop() || 'Online audio'),'',true,false,blob);
  } catch {
    if (generation===deck.generation && attempt===deck.importAttempt) status.textContent = 'That link didn’t open an audio file. Try Find free music or choose a file saved on this device.';
  }
}
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
      $('record').setAttribute('aria-pressed','false');
      recording = null;
    };
    recorder.start();
    recording = recorder;
    $('record').textContent = '■ Finish recording';
    $('record').setAttribute('aria-pressed','true');
    status.textContent = 'Recording the master output…';
  } catch { status.textContent = 'Recording is unavailable in this browser.'; }
};
setInterval(() => decks.forEach((deck) => deck.draw()),65);

const liveCanvas = $('live-lights');
const livePaint = liveCanvas.getContext('2d');
const lightAnalyser = audio.createAnalyser();
lightAnalyser.fftSize = 1024;
lightAnalyser.smoothingTimeConstant = .35;
limiter.connect(lightAnalyser);
const lightBins = new Uint8Array(lightAnalyser.frequencyBinCount);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let lightFrame = 0;
let beatSensitivity = .6;
let beatEnvelope = 0;
const beatDetector = {average:0,previous:0,last:-Infinity};
const beatMeter = $('beat-meter');
const lightingBoard = document.querySelector('.light-board');
function detectLightBeat(detector,bass,time,sensitivity) {
  const lift = bass-detector.average;
  const rise = bass-detector.previous;
  detector.average += (bass-detector.average)*.08;
  detector.previous = bass;
  if (bass < .13 || lift < .17-sensitivity*.11 || rise < .055-sensitivity*.025 || time-detector.last < 350) return false;
  detector.last = time;
  return true;
}
dragNumber($('beat-sensitivity'),value => { beatSensitivity = value/100; },4);
let lightLevel = .85;
let lightSpeed = 1;
let lightPhase = 0;
let lastLightTime = 0;
let lightScene = 'chase';
let beatSync = true;
let blackout = false;
let bumpUntil = 0;
dragNumber($('light-dimmer'),value => { lightLevel = value/100; },2);
dragNumber($('light-speed'),value => { lightSpeed = value/100; },4);
const sceneButtons = document.querySelectorAll('[data-light-scene]');
sceneButtons.forEach(button => {
  button.onclick = () => {
    lightScene = button.dataset.lightScene;
    lightingBoard.dataset.scene = lightScene;
    sceneButtons.forEach(scene => scene.setAttribute('aria-pressed',String(scene === button)));
  };
});
$('light-sound').onclick = () => {
  beatSync = !beatSync;
  $('light-sound').setAttribute('aria-pressed',String(beatSync));
};
$('light-blackout').onclick = () => {
  blackout = !blackout;
  bumpUntil = 0;
  $('light-blackout').setAttribute('aria-pressed',String(blackout));
  document.body.classList.toggle('light-blackout',blackout);
};
$('light-bump').onclick = () => {
  if (!blackout) bumpUntil = performance.now()+420;
};
const lightPalettes = {
  lime:[82,102,65,175,132,49],
  lemon:[52,60,37,74,46,170],
  orange:[27,324,284,185,307,76]
};
const themePicker = $('live-theme');
try {
  const saved = localStorage.getItem('citrus-live-theme');
  if (Object.hasOwn(lightPalettes,saved)) themePicker.value = saved;
} catch {}
function applyLiveTheme() {
  document.body.dataset.liveTheme = themePicker.value;
}
themePicker.onchange = () => {
  applyLiveTheme();
  try { localStorage.setItem('citrus-live-theme',themePicker.value); } catch {}
};
applyLiveTheme();

const aimPad = $('light-aim');
const aimDot = $('light-aim-dot');
let aim = .5;
let beamSpread = .5;
const fixtures = Array(6).fill(true);
fixtures.forEach((_,i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = String(i+1);
  button.setAttribute('aria-label','Fixture '+(i+1));
  button.setAttribute('aria-pressed','true');
  button.style.setProperty('--fixture-index',i);
  button.onclick = () => {
    fixtures[i] = !fixtures[i];
    button.setAttribute('aria-pressed',String(fixtures[i]));
  };
  $('fixture-bank').append(button);
});
function setLightAim(x,y) {
  aim = Math.max(0,Math.min(1,x));
  beamSpread = Math.max(0,Math.min(1,y));
  aimDot.style.left = aim*100+'%';
  aimDot.style.top = (1-beamSpread)*100+'%';
}
function aimFromPointer(event) {
  const rect = aimPad.getBoundingClientRect();
  setLightAim((event.clientX-rect.left)/rect.width,(rect.bottom-event.clientY)/rect.height);
}
aimPad.onpointerdown = event => {
  if (!event.isPrimary || event.button !== 0) return;
  aimPad.focus({preventScroll:true});
  aimPad.setPointerCapture(event.pointerId);
  aimFromPointer(event);
};
aimPad.onpointermove = event => {
  if (aimPad.hasPointerCapture(event.pointerId)) aimFromPointer(event);
};
aimPad.onkeydown = event => {
  const delta = {ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]}[event.key];
  if (!delta) return;
  event.preventDefault();
  setLightAim(aim+delta[0],beamSpread+delta[1]);
};
setLightAim(aim,beamSpread);

function drawLiveLights(time) {
  const width = innerWidth;
  const height = innerHeight;
  const scale = Math.min(devicePixelRatio || 1,1.5);
  const canvasWidth = Math.round(width*scale);
  const canvasHeight = Math.round(height*scale);
  if (liveCanvas.width !== canvasWidth || liveCanvas.height !== canvasHeight) {
    liveCanvas.width = canvasWidth;
    liveCanvas.height = canvasHeight;
  }
  lightAnalyser.getByteFrequencyData(lightBins);
  const bass = (lightBins[1]*.42+lightBins[2]*.38+lightBins[3]*.20)/255;
  const hit = detectLightBeat(beatDetector,bass,time,beatSensitivity);
  const ctx = livePaint;
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.clearRect(0,0,width,height);
  const spread = Math.max(width,height);
  const still = reduceMotion.matches;
  const elapsed = lastLightTime ? Math.min(40,time-lastLightTime) : 0;
  lastLightTime = time;
  const moving = ['chase','prism','laser'].includes(lightScene);
  if (!still && moving) lightPhase += elapsed*lightSpeed/1500;
  const phase = still || !moving ? 0 : lightPhase;
  beatEnvelope = hit ? 1 : beatEnvelope*Math.exp(-elapsed/135);
  const energy = still || !beatSync ? .16 : .08+beatEnvelope*.88;
  lightingBoard.style.setProperty('--console-light',String(blackout ? 0 : lightLevel*(.5+energy*.5)));
  beatMeter.style.transform = 'scaleX('+(!blackout && beatSync ? (still ? .15 : energy) : 0)+')';
  const brightness = blackout ? 0 : lightLevel;
  const palette = lightPalettes[themePicker.value];
  ctx.globalAlpha = brightness;
  ctx.globalCompositeOperation = 'screen';
  for (let i=0;i<fixtures.length;i++) {
    if (!fixtures[i]) continue;
    const position = .16+.136*i;
    const hue = palette[i];
    const x = width*(position+(aim-.5)*.55);
    const y = height*.37;
    const glow = ctx.createRadialGradient(x,y,0,x,y,spread*(.16+beamSpread*.44));
    glow.addColorStop(0,'hsla('+hue+',100%,57%,'+(.12+energy*.28)+')');
    glow.addColorStop(.5,'hsla('+hue+',100%,50%,'+(.07+energy*.14)+')');
    glow.addColorStop(1,'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,width,height);
  }
  for (let i=0;lightScene !== 'wash' && lightScene !== 'prism' && i<6;i++) {
    const x = width*(.16+.136*i);
    const y = height*.60;
    if (!fixtures[i]) continue;
    const tilt = Math.sin(phase+i*1.25)*.56+(aim-.5)*1.25;
    const beamWidth = spread*(.015+beamSpread*.12);
    const beam = ctx.createLinearGradient(0,y,0,y-spread*.72);
    const hue = palette[i];
    beam.addColorStop(0,'hsla('+hue+',100%,61%,'+(.24+energy*.51)+')');
    beam.addColorStop(1,'transparent');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x-5,y);
    ctx.lineTo(x+tilt*spread-beamWidth,y-spread*.72);
    ctx.lineTo(x+tilt*spread+beamWidth,y-spread*.72);
    ctx.lineTo(x+5,y);
    ctx.fill();
  }
  for (let i=0;(lightScene === 'chase' || lightScene === 'laser') && i<(lightScene === 'laser' ? 18 : 5);i++) {
    if (!fixtures[i%fixtures.length]) continue;
    const x = width*(aim+((lightScene === 'laser' ? i/17 : .17+i*.165)-.5)*(.35+beamSpread*1.3));
    const y = height*(lightScene === 'laser' ? .98 : .70+.045*i);
    ctx.strokeStyle = 'hsla('+palette[(i+1)%palette.length]+',100%,66%,'+(.22+energy*.52)+')';
    ctx.lineWidth = 1+i%2;
    ctx.beginPath();
    ctx.moveTo(width*.5,height*.5);
    ctx.lineTo(x+Math.sin(phase+i)*width*.14,y);
    ctx.stroke();
  }
  if (lightScene === 'prism') {
    for (let i=0;i<8;i++) {
      if (!fixtures[i%fixtures.length]) continue;
      const angle = phase*.8+i*Math.PI/4;
      const x = width*aim+Math.cos(angle)*width*(.13+beamSpread*.42);
      const y = height*.46+Math.sin(angle)*height*.28;
      const radius = Math.min(width,height)*(.09+energy*.08);
      ctx.strokeStyle = 'hsla('+palette[i%palette.length]+',100%,66%,'+(.35+energy*.5)+')';
      ctx.lineWidth = 2+energy*4;
      ctx.beginPath();
      ctx.arc(x,y,radius,0,Math.PI*2);
      ctx.stroke();
    }
  }
  if (!still && time < bumpUntil) {
    ctx.globalAlpha = brightness*Math.min(.36,(bumpUntil-time)/950);
    ctx.fillStyle = '#fffbe8';
    ctx.fillRect(0,0,width,height);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const edge = ctx.createRadialGradient(width*.5,height*.39,Math.min(width,height)*.16,width*.5,height*.46,spread*.62);
  edge.addColorStop(0,'transparent');
  edge.addColorStop(1,'#06020feb');
  ctx.fillStyle = edge;
  ctx.fillRect(0,0,width,height);
  lightFrame = requestAnimationFrame(drawLiveLights);
}
$('live-tracks').onclick = () => {
  const expanded = document.body.classList.toggle('live-tracks-open');
  $('live-tracks').setAttribute('aria-expanded',String(expanded));
  $('live-tracks').textContent = expanded ? 'Hide tracks' : 'Load tracks';
  if (expanded) $('add-your-music').scrollIntoView({block:'nearest'});
};
function showLiveView(enabled) {
  document.body.classList.toggle('live-view',enabled);
  liveCanvas.hidden = !enabled;
  document.querySelector('.live-heading').hidden = !enabled;
  if (enabled && !lightFrame) lightFrame = requestAnimationFrame(drawLiveLights);
  if (!enabled && lightFrame) {
    cancelAnimationFrame(lightFrame);
    lightFrame = 0;
    lastLightTime = 0;
  }
}
function liveFromLocation() {
  showLiveView(new URLSearchParams(location.search).get('view') === 'live');
}
for (const [id,enabled] of [['live-mode',true],['leave-live',false]]) {
  $(id).onclick = event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null,'',event.currentTarget.href);
    showLiveView(enabled);
    $(enabled ? 'leave-live' : 'live-mode').focus();
  };
}
window.addEventListener('popstate',liveFromLocation);
liveFromLocation();
