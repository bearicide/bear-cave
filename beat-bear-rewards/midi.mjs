export function noteOn(data) {
  return data?.length >= 3 && (data[0] & 0xf0) === 0x90 && data[2] > 0 ? data[1] : null;
}

export function setupMidi(hit, pause) {
  const dialog = document.querySelector('#midi-dialog');
  const status = document.querySelector('#midi-status');
  const enable = document.querySelector('#midi-enable');
  const defaults = [36, 37, 38, 39];
  const names = ['Left', 'Down', 'Up', 'Right'];
  const buttons = [...dialog.querySelectorAll('[data-learn]')];
  let notes = [...defaults];
  try {
    const saved = JSON.parse(localStorage.getItem('beatbear:midi:v1'));
    if (Array.isArray(saved) && saved.length === 4 && new Set(saved).size === 4 &&
        saved.every(n => Number.isInteger(n) && n >= 0 && n <= 127)) notes = saved;
  } catch {}
  let learning = -1;
  let access;
  const inputs = new Set();

  function draw() {
    buttons.forEach((button, lane) => {
      button.textContent = names[lane] + ' · ' + (lane === learning ? 'Play a note…' : 'Note ' + notes[lane]);
      button.disabled = !inputs.size;
      button.setAttribute('aria-pressed', String(lane === learning));
    });
  }

  function save() {
    try { localStorage.setItem('beatbear:midi:v1', JSON.stringify(notes)); } catch {}
    draw();
  }

  function receive(event) {
    const note = noteOn(event.data);
    if (note === null) return;
    const previous = notes.indexOf(note);
    if (dialog.open) {
      if (learning < 0) return;
      if (previous >= 0 && previous !== learning) notes[previous] = notes[learning];
      notes[learning] = note;
      learning = -1;
      save();
      return;
    }
    if (!document.hidden && !document.querySelector('dialog[open]') && previous >= 0) hit(previous);
  }

  function sync() {
    const connected = new Set([...access.inputs.values()].filter(port => port.state === 'connected'));
    for (const port of inputs) {
      if (!connected.has(port)) {
        port.onmidimessage = null;
        inputs.delete(port);
      }
    }
    for (const port of connected) {
      if (inputs.has(port)) continue;
      port.onmidimessage = receive;
      inputs.add(port);
    }
    if (!inputs.size) learning = -1;
    status.textContent = inputs.size ? [...inputs].map(port => port.name || 'MIDI input').join(', ') : 'Connect a MIDI controller to continue.';
    draw();
  }

  document.querySelector('#midi-button').addEventListener('click', () => { pause(); dialog.showModal(); });
  dialog.addEventListener('close', () => { learning = -1; draw(); });
  enable.addEventListener('click', async () => {
    if (!navigator.requestMIDIAccess) {
      status.textContent = 'Web MIDI is unavailable in this browser. Try desktop Chrome or Edge.';
      return;
    }
    enable.disabled = true;
    try {
      access = await navigator.requestMIDIAccess({ sysex: false });
      access.addEventListener('statechange', sync);
      enable.hidden = true;
      sync();
    } catch {
      status.textContent = 'MIDI access failed. Check this site’s MIDI permission and retry.';
    } finally {
      enable.disabled = false;
    }
  });
  buttons.forEach((button, lane) => button.addEventListener('click', () => { learning = learning === lane ? -1 : lane; draw(); }));
  document.querySelector('#midi-reset').addEventListener('click', () => { notes = [...defaults]; learning = -1; save(); });
  draw();
}
