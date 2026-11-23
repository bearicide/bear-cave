const hz = midi => 440 * 2 ** ((midi - 69) / 12);

export function createAudio(onInterruption) {
  let context;
  let master;
  let compressor;
  let noise;
  let bus;
  let muted = false;
  let nextPulse = 0;
  let interval;

  async function activate() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      if (!context) {
        context = new AudioContext({ latencyHint: 'interactive' });
        master = context.createGain();
        master.gain.value = muted ? 0 : .74;
        compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -15;
        compressor.ratio.value = 3;
        master.connect(compressor).connect(context.destination);
        noise = context.createBuffer(1, context.sampleRate * .45, context.sampleRate);
        const data = noise.getChannelData(0);
        for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
        context.addEventListener('statechange', () => {
          if (context.state !== 'running') onInterruption();
        });
      }
      if (context.state !== 'running') {
        let timeout;
        try {
          await Promise.race([context.resume(), new Promise(resolve => { timeout = setTimeout(resolve, 500); })]);
        } finally {
          clearTimeout(timeout);
        }
      }
      return context.state === 'running';
    } catch {
      return false;
    }
  }

  function setMuted(value) {
    muted = value;
    if (master) master.gain.setTargetAtTime(muted ? 0 : .74, context.currentTime, .012);
  }

  function oscillator(when, length, frequency, volume, options = {}) {
    const source = context.createOscillator();
    source.type = options.type ?? 'sine';
    source.frequency.setValueAtTime(frequency, when);
    if (options.slide) source.frequency.exponentialRampToValueAtTime(options.slide, when + length * .65);
    voice(source, when, length, volume, options);
  }

  function texture(when, length, volume, filter, frequency) {
    const source = context.createBufferSource();
    source.buffer = noise;
    voice(source, when, length, volume, { filter, frequency });
  }

  function voice(source, when, length, volume, options) {
    const gain = context.createGain();
    const filter = options.filter ? context.createBiquadFilter() : null;
    if (filter) {
      filter.type = options.filter;
      filter.frequency.value = options.frequency;
      filter.Q.value = options.q ?? .7;
      source.connect(filter).connect(gain);
    } else {
      source.connect(gain);
    }
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + (options.attack ?? .004));
    gain.gain.exponentialRampToValueAtTime(.0001, when + length);
    gain.connect(bus);
    source.start(when);
    source.stop(when + length + .006);
    source.onended = () => { source.disconnect(); filter?.disconnect(); gain.disconnect(); };
  }

  function music(track, pulse, when, step) {
    const bar = Math.floor(pulse / 16);
    const slot = pulse % 16;
    const beat = slot % 4 === 0;
    const breaks = track.mode === 'breaks';
    const electro = track.mode === 'electro';
    const section = Math.floor(bar / 4);
    const root = track.root + track.chords[Math.floor(bar / 2) % 4];
    if (breaks ? [0, 7, 10].includes(slot) : electro ? [0, 6, 8, 10].includes(slot) : beat) {
      oscillator(when, .22, electro ? 156 : 134, .66, { slide: electro ? 45 : 47 });
      texture(when, .027, .055, 'lowpass', 4000);
    }
    if (slot === 4 || slot === 12) {
      texture(when, .17, .23, 'bandpass', breaks ? 1450 : 2130);
      oscillator(when, .08, 176, .14, { slide: 96, type: 'triangle' });
    }
    if (slot % 2 === 0 || (section >= 2 && slot % 4 === 3)) {
      const open = slot % 4 === 2;
      texture(when, open ? .092 : .034, open ? .104 : .054, 'highpass', electro ? 6100 : 7600);
    }
    const bassNotes = breaks ? [0, 3, 8, 10, 14] : electro ? [0, 3, 6, 8, 11, 14] : [2, 6, 10, 14];
    if (bassNotes.includes(slot)) {
      const pitch = hz(root + (slot === 14 && bar % 2 ? 12 : slot === 10 && section >= 2 ? 7 : 0));
      oscillator(when, step * 1.62, pitch, .22, { type: 'triangle', filter: 'lowpass', frequency: 410 });
      oscillator(when, step * 1.41, pitch, .1, { type: electro ? 'square' : 'sawtooth', filter: 'lowpass', frequency: electro ? 800 : 500 });
    }
    if ((section > 0 && [0, 7, 10, 14].includes(slot)) || (section === 0 && (slot === 0 || slot === 10))) {
      const pitch = hz(track.root + track.melody[(bar * 2 + Math.floor(slot / 4)) % 8] + (breaks ? 12 : 24));
      oscillator(when, step * 1.75, pitch, .09, { type: 'triangle', filter: 'lowpass', frequency: 2600 });
      oscillator(when + step * 1.5, step * .9, pitch, .025, { type: 'sine' });
    }
    if (slot === 0 && (bar % 2 === 0)) {
      for (const interval of [12, 19, 24]) {
        oscillator(when, step * 6, hz(root + interval), .035, { attack: .05, type: 'triangle', filter: 'lowpass', frequency: 1050 });
      }
    }
  }

  const recordings = new Map();
  let recording;
  async function prepare(track) {
    if (!track.audioUrl || recordings.has(track.audioUrl)) return;
    const response = await fetch(track.audioUrl);
    if (!response.ok) throw new Error('Track download failed');
    recordings.set(track.audioUrl, await context.decodeAudioData(await response.arrayBuffer()));
  }

  function start(track, chart, anchor, offset, countBeats) {
    bus = context.createGain();
    bus.connect(master);
    nextPulse = countBeats ? -countBeats * 4 : Math.max(0, Math.ceil((offset - .006) / chart.step));
    const buffer = recordings.get(track.audioUrl);
    if (buffer && offset < buffer.duration) {
      recording = context.createBufferSource();
      recording.buffer = buffer;
      recording.connect(bus);
      recording.start(anchor + offset, offset);
    }
    const totalPulses = buffer ? 0 : Math.round(chart.duration / chart.step);
    const schedule = () => {
      const now = context.currentTime;
      while (nextPulse < totalPulses && anchor + nextPulse * chart.step < now + .14) {
        const when = anchor + nextPulse * chart.step;
        if (when >= now - .012) {
          const startAt = Math.max(when, now);
          if (nextPulse < 0) {
            if (nextPulse % 4 === 0) oscillator(startAt, .10, nextPulse === -4 ? 950 : 690, .14, { type: 'triangle' });
          } else {
            music(track, nextPulse, startAt, chart.step);
          }
        }
        nextPulse++;
      }
    };
    schedule();
    interval = setInterval(schedule, 24);
  }

  function stop() {
    clearInterval(interval);
    if (recording) { recording.stop(); recording = undefined; }
    if (!bus) return;
    const previous = bus;
    bus = undefined;
    previous.gain.setTargetAtTime(0, context.currentTime, .008);
    setTimeout(() => previous.disconnect(), 85);
  }

  function heardTime() {
    const stamp = context.getOutputTimestamp?.();
    if (stamp?.performanceTime > 0) {
      const elapsed = Math.max(0, performance.now() - stamp.performanceTime) / 1000;
      return Math.min(context.currentTime, stamp.contextTime + elapsed);
    }
    return context.currentTime - (context.outputLatency || context.baseLatency || 0);
  }

  function hitSound(lane, grade) {
    if (!bus || grade === 'off') return;
    oscillator(context.currentTime + .002, .052, [523, 659, 784, 880][lane], .047, { type: 'triangle' });
  }

  return { prepare, activate, setMuted, start, stop, heardTime, hitSound, time: () => context.currentTime };
}
