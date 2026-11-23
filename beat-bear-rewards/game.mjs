import { wallet, saveWallet, addPaws, spendPaws } from './wallet.mjs';
import { setupMidi } from './midi.mjs';
import { tracks, levels, createChart, createRound, rank } from './rhythm.mjs';
import { createAudio } from './audio.mjs';

const $ = id => document.getElementById(id);
const game = $('game');
const field = $('lane-field');
const lanes = [...field.querySelectorAll('.lane')];
const layers = lanes.map(lane => lane.querySelector('.note-layer'));
const pads = [...document.querySelectorAll('.pad')];
const trackSelect = $('track');
const levelSelect = document.querySelector('.difficulty');
const help = $('help-dialog');
const overlay = $('overlay');
const primary = $('primary');
const secondary = $('secondary');
const pauseButton = $('pause');
const judgment = $('judgment');
const huntMode = $('hunt-mode');
const huntButton = $('hunt');
const huntLabel = $('hunt-label');
const reverseButton = $('reverse');
const reverseLabel = $('reverse-label');
const themeSelect = $('theme');
const themeApply = $('theme-apply');
const palettes = { classic: 0, ember: 30, aurora: 30 };
function updateShop(reset = false) {
  const activeTheme = wallet.unlocked.includes(wallet.applied[trackId]) ? wallet.applied[trackId] : 'classic';
  $('game').closest('.cabinet').dataset.theme = activeTheme;
  if (reset) themeSelect.value = activeTheme;
  $('paw-balance').textContent = wallet.paws + ' Bear Paws';
  const choice = themeSelect.value;
  const owned = wallet.unlocked.includes(choice);
  themeApply.textContent = owned ? 'Apply' : 'Buy & apply';
  themeApply.disabled = themeSelect.disabled || choice === activeTheme || (!owned && wallet.paws < palettes[choice]);
}

function buyTheme() {
  if (themeApply.disabled) return;
  const choice = themeSelect.value;
  if (!Object.hasOwn(palettes, choice)) return;
  if (!wallet.unlocked.includes(choice)) {
    if (wallet.paws < palettes[choice]) return;
    if (!spendPaws(palettes[choice], choice + ' track colors')) return;
    wallet.unlocked.push(choice);
  }
  wallet.applied[trackId] = choice;
  saveWallet();
  updateShop();
}
const huntTarget = 12;
let huntCharge = 0;
let huntUntil = 0;
const count = $('count');
const scoreText = $('score');
const comboText = $('combo');
const accuracyText = $('accuracy');
const bestText = $('best');
const progressFill = $('progress-fill');
const clockText = $('clock');
const arrowIds = ['left', 'down', 'up', 'right'];
const laneKeys = { KeyA: 0, KeyS: 1, KeyW: 2, KeyD: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
const feedback = {
  perfect: ['PERFECT', '#c5f955'], great: ['GREAT', '#7de6ec'], good: ['GOOD', '#ffd28b'],
  reverse: ['REVERSE', '#c5f955'], miss: ['MISS', '#ff9a9a'], off: ['OFF BEAT', '#d5ddd0'],
};
const audio = createAudio(() => {
  if (usingAudio && state === 'playing') pause();
});

let state = 'ready';
let pauseWhenReady = false;
let trackId = trackSelect.value;
let difficulty = 'normal';
let chart;
let round;
let usingAudio = false;
let anchor = 0;
let pausedAt = 0;
let frame;
let judgmentUntil = 0;
let nextNote = 0;
let runEvents = [];
let boardRequest = 0;
const scoreboard = $('scoreboard');
const boardMode = () => huntMode.checked ? 'hunt' : 'classic';

async function loadBoard() {
  if (!scoreboard.open) return;
  $('board-scores').replaceChildren();
  $('board-status').textContent = 'Online leaderboard awaits backend connection. Device best scores still work.';
}

async function submitRun() {
  // GitHub Pages has no score API. Keep local scores until the backend is connected.
}
scoreboard.addEventListener('toggle', loadBoard);
document.querySelector('a[href="#scoreboard"]').addEventListener('click', () => {
  scoreboard.open = true;
  scoreboard.querySelector('summary').focus({ preventScroll: true });
});
let best = 0;
const visible = new Map();
const flashes = [0, 0, 0, 0];
const records = new Map();
let muted = readStorage('beatbear:sound') === 'off';

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* In-memory records still work. */ }
}

function recordKey() {
  return 'beatbear:score:' + trackId + ':' + difficulty + (huntMode.checked ? ':hunt-reverse' : '');
}

function loadBest() {
  const key = recordKey();
  if (!records.has(key)) records.set(key, Math.max(0, Number(readStorage(key)) || 0));
  return records.get(key);
}

const points = value => String(value).padStart(6, '0');
const accuracy = value => value === null ? '—' : Math.round(value * 100) + '%';
const timestamp = seconds => {
  const whole = Math.max(0, Math.floor(seconds));
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
};
const now = () => usingAudio ? audio.heardTime() : performance.now() / 1000;
const time = () => now() - anchor;

function announce(message) {
  $('announcer').textContent = message;
}

function updateHunt(position = 0) {
  const boosted = huntMode.checked && state === 'playing' && position < huntUntil && huntUntil > 0;
  const ready = huntCharge === huntTarget;
  const label = boosted ? 'HUNT ACTIVE · ×2' : ready ? 'HUNT READY' : 'HUNT · ' + huntCharge + ' / ' + huntTarget;
  if (huntLabel.textContent !== label) huntLabel.textContent = label;
  huntButton.hidden = !huntMode.checked;
  huntButton.disabled = state !== 'playing' || !ready || boosted;
  const { claws, perfectCharge } = round?.stats() ?? { claws: 0, perfectCharge: 0 };
  const canReverse = state === 'playing' && round.canReverse(position);
  reverseButton.hidden = !huntMode.checked;
  reverseButton.disabled = !canReverse;
  const reverseText = 'REVERSE · ' + claws + ' CLAW' + (claws === 1 ? '' : 'S') + (claws < 3 && !canReverse ? ' · ' + perfectCharge + '/8' : '');
  if (reverseLabel.textContent !== reverseText) reverseLabel.textContent = reverseText;
  huntButton.classList.toggle('boosted', boosted);
  game.classList.toggle('hunt-active', boosted);
}

function activateHunt() {
  if (huntButton.disabled || !huntMode.checked) return;
  const position = time();
  if (position < 0 || position >= chart.duration) return;
  runEvents.push([position, 4]);
  huntCharge = 0;
  huntUntil = position + chart.step * 4 * 8;
  updateHunt(position);
  announce('Hunt active. Double hit points for eight beats.');
  focusGame();
}

function reverseMiss() {
  if (state !== 'playing' || !huntMode.checked) return;
  const position = time();
  applyMisses(position);
  if (!round.reverse(position)) return;
  runEvents.push([position, 5]);
  updateHunt(position);
  updateHUD();
  showJudgment('reverse', 'COMBO RESTORED');
  announce('Combo restored. One claw spent.');
  focusGame();
}

function updateHUD() {
  const stats = round.stats();
  scoreText.textContent = points(stats.score);
  comboText.firstChild.nodeValue = stats.combo;
  accuracyText.textContent = accuracy(stats.accuracy);
  bestText.textContent = points(Math.max(best, stats.score));
}

function updateProgress(position) {
  const elapsed = Math.max(0, Math.min(position, chart.duration));
  progressFill.style.transform = 'scaleX(' + elapsed / chart.duration + ')';
  const label = timestamp(elapsed);
  if (clockText.textContent !== label) clockText.textContent = label;
}

function setState(next) {
  state = next;
  game.dataset.state = state;
  const active = state === 'playing' || state === 'paused' || state === 'starting';
  trackSelect.disabled = levelSelect.disabled = huntMode.disabled = themeSelect.disabled = active;
  updateShop();
  updateHunt(next === 'playing' ? time() : 0);
  pauseButton.disabled = state !== 'playing' && state !== 'paused';
  pauseButton.setAttribute('aria-label', state === 'paused' ? 'Resume' : 'Pause');
  pauseButton.title = (state === 'paused' ? 'Resume' : 'Pause') + ' (Space or Esc)';
  $('pause-icon-use').setAttribute('href', state === 'paused' ? '#play-icon' : '#pause-icon');
}

function setOverlay({ title, copy, action, shortcut, extra, grade, stats }) {
  overlay.hidden = !title;
  if (overlay.hidden) return;
  $('overlay-title').textContent = title;
  $('overlay-copy').textContent = copy;
  $('primary-label').textContent = action;
  $('overlay-shortcut').innerHTML = shortcut ? 'or press <kbd>' + shortcut + '</kbd>' : '';
  $('overlay-shortcut').hidden = !shortcut;
  secondary.hidden = !extra;
  $('secondary-label').textContent = extra || '';
  const mark = $('overlay-mark');
  mark.replaceChildren(grade ? document.createTextNode(grade) : icon('paw'));
  const details = $('result-details');
  details.hidden = !stats;
  details.replaceChildren();
  if (stats) {
    for (const [label, value] of [['PERFECT', stats.counts.perfect], ['MISS', stats.counts.miss], ['MAX COMBO', stats.maxCombo]]) {
      const badge = document.createElement('span');
      badge.textContent = label + ' ' + value;
      details.append(badge);
    }
  }
}

function icon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS(svg.namespaceURI, 'use');
  svg.setAttribute('class', 'icon');
  use.setAttribute('href', '#' + id);
  svg.append(use);
  return svg;
}

function makeNote(lane, demo = false) {
  const node = document.createElement('div');
  node.className = demo ? 'note demo' : 'note';
  node.append(icon(arrowIds[lane]));
  layers[lane].append(node);
  return node;
}

function clearNotes() {
  visible.clear();
  layers.forEach(layer => layer.replaceChildren());
  nextNote = 0;
}

function clearFeedback() {
  judgment.classList.remove('visible');
  judgmentUntil = 0;
  count.hidden = true;
  for (let lane = 0; lane < 4; lane++) {
    flashes[lane] = 0;
    pads[lane].classList.remove('fired');
    lanes[lane].classList.remove('fired');
  }
}

function refreshSetup() {
  huntCharge = huntUntil = 0;
  updateHunt();
  trackId = trackSelect.value;
  updateShop(true);
  difficulty = levelSelect.querySelector('input:checked').value;
  game.dataset.difficulty = difficulty;
  const track = tracks[trackId];
  chart = createChart(trackId, difficulty);
  round = createRound(chart, difficulty, huntMode.checked);
  updateHunt();
  best = loadBest();
  $('track-meta').textContent = track.bpm + ' BPM · ' + track.style;
  $('duration').textContent = timestamp(chart.duration);
  updateHUD();
  updateProgress(0);
  loadBoard();
}

function ready(focusTrack = false) {
  pauseWhenReady = false;
  setState('ready');
  refreshSetup();
  clearNotes();
  clearFeedback();
  for (const [lane, fractions] of [[0, [.24, .71]], [1, [.1, .55]], [2, [.32, .68]], [3, [.19, .58]]]) {
    for (const fraction of fractions) {
      const note = makeNote(lane, true);
      note.style.top = fraction * 100 + '%';
    }
  }
  setOverlay({ title: 'READY TO PLAY?', copy: 'Tap the pads or press A S W D as notes cross the line.', action: 'Play track', shortcut: 'ENTER' });
  if (focusTrack) trackSelect.focus({ preventScroll: true });
}

function finish() {
  audio.stop();
  clearFeedback();
  setState('ended');
  updateProgress(chart.duration);
  const stats = round.stats();
  const earned = Math.floor((stats.counts.perfect + stats.counts.great) / 5);
  if (earned > 0) {
    addPaws(earned, 'Track completed', 'earned');
    saveWallet();
    updateShop();
  }
  if (stats.score > 0) submitRun().catch(() => {
    $('board-status').textContent = 'Could not post this run. Your local score is saved.';
  });
  const newBest = stats.score > best;
  if (newBest) {
    best = stats.score;
    records.set(recordKey(), best);
    writeStorage(recordKey(), best);
  }
  updateHUD();
  const grade = rank(stats.accuracy);
  setOverlay({
    title: newBest ? 'NEW PERSONAL BEST' : 'TRACK COMPLETE',
    copy: points(stats.score) + ' points · ' + accuracy(stats.accuracy) + ' accuracy · Rank ' + grade + ' · +' + earned + ' Bear Paws',
    action: 'Play again', shortcut: 'ENTER', extra: 'Track select', grade, stats,
  });
  announce('Track complete. Rank ' + grade + '. ' + stats.score + ' points and ' + accuracy(stats.accuracy) + ' accuracy.');
  if (document.activeElement === document.body || document.activeElement === game || document.activeElement === pauseButton) {
    primary.focus({ preventScroll: true });
  }
}

function showJudgment(grade, detail = '') {
  const [label, color] = feedback[grade];
  $('judgment-title').textContent = label;
  $('judgment-detail').textContent = detail;
  judgment.style.setProperty('--judgment-color', color);
  judgment.classList.add('visible');
  judgmentUntil = performance.now() + 420;
}

function applyMisses(position) {
  const misses = round.advance(position);
  if (!misses.length) return;
  for (const { note } of misses) removeNote(note);
  showJudgment('miss');
  updateHUD();
}

function removeNote(note) {
  visible.get(note)?.remove();
  visible.delete(note);
}

let fieldHeight = field.clientHeight;
new ResizeObserver(() => {
  fieldHeight = field.clientHeight;
  if (state === 'paused') paintNotes(pausedAt);
}).observe(field);

function paintNotes(position) {
  const travel = levels[difficulty].travel;
  while (nextNote < chart.notes.length && chart.notes[nextNote].time - position <= travel + .05) {
    const note = chart.notes[nextNote++];
    if (note.time >= position - levels[difficulty].good) visible.set(note, makeNote(note.lane));
  }
  const hit = fieldHeight * .85;
  for (const [note, node] of visible) {
    node.style.setProperty('--y', hit * (1 - (note.time - position) / travel) + 'px');
  }
}

function render() {
  if (state !== 'playing') return;
  const position = time();
  const beat = chart.step * 4;
  const countdown = position < -.035 ? String(Math.min(3, Math.ceil(-position / beat))) : position < .25 ? 'GO!' : '';
  count.hidden = !countdown;
  if (count.textContent !== countdown) count.textContent = countdown;
  const perf = performance.now();
  if (judgmentUntil && perf >= judgmentUntil) {
    judgment.classList.remove('visible');
    judgmentUntil = 0;
  }
  for (let lane = 0; lane < 4; lane++) {
    if (!flashes[lane] || perf < flashes[lane]) continue;
    flashes[lane] = 0;
    lanes[lane].classList.remove('fired');
    pads[lane].classList.remove('fired');
  }
  paintNotes(position);
  applyMisses(position);
  updateHunt(position);
  updateProgress(position);
  if (position >= chart.duration + .28) {
    finish();
  } else {
    frame = requestAnimationFrame(render);
  }
}

function flash(lane) {
  flashes[lane] = performance.now() + 105;
  lanes[lane].classList.add('fired');
  pads[lane].classList.add('fired');
  if (state === 'ready' || state === 'ended') {
    setTimeout(() => {
      if (performance.now() < flashes[lane]) return;
      lanes[lane].classList.remove('fired');
      pads[lane].classList.remove('fired');
    }, 115);
  }
}

function hit(lane) {
  if (state !== 'playing' && state !== 'ready' && state !== 'ended') return;
  flash(lane);
  if (state !== 'playing') return;
  const position = time();
  if (position < -levels[difficulty].good || position >= chart.duration) return;
  applyMisses(position);
  const boosted = huntMode.checked && position < huntUntil;
  const result = round.hit(lane, position, boosted ? 2 : 1);
  runEvents.push([position, lane]);
  if (huntMode.checked && !boosted && (result.grade === 'perfect' || result.grade === 'great')) {
    huntCharge = Math.min(huntTarget, huntCharge + 1);
  }
  updateHunt(position);
  if (result.note) removeNote(result.note);
  const { combo, multiplier } = round.stats();
  let detail = combo >= 8 ? combo + ' STREAK · ×' + multiplier : '';
  if (!detail && (result.grade === 'great' || result.grade === 'good')) detail = result.delta < 0 ? 'EARLY' : 'LATE';
  showJudgment(result.grade, detail);
  if (usingAudio) audio.hitSound(lane, result.grade);
  updateHUD();
}

function focusGame() {
  game.setAttribute('tabindex', '-1');
  game.focus({ preventScroll: true });
}

function beginPlayback(offset, countBeats) {
  const warmup = countBeats * chart.step * 4 + .09;
  anchor = (usingAudio ? audio.time() : performance.now() / 1000) - offset + warmup;
  if (usingAudio) audio.start(tracks[trackId], chart, anchor, offset, countBeats);
  setState('playing');
  setOverlay({});
  focusGame();
  render();
  const mustPause = pauseWhenReady || document.hidden || document.querySelector('dialog[open]');
  pauseWhenReady = false;
  if (mustPause) pause();
}

async function start() {
  if (state !== 'ready' && state !== 'ended') return;
  refreshSetup();
  runEvents = [];
  clearNotes();
  clearFeedback();
  setState('starting');
  primary.disabled = true;
  usingAudio = await audio.activate();
  try {
    if (tracks[trackId].audioUrl) {
      if (!usingAudio) throw new Error('Audio is unavailable');
      await audio.prepare(tracks[trackId]);
    }
  } catch {
    primary.disabled = false;
    ready();
    const message = 'Could not load this track. Press Play track to retry.';
    $('overlay-copy').textContent = message;
    announce(message);
    return;
  }
  primary.disabled = false;
  beginPlayback(0, 3);
  announce(tracks[trackId].name + ', ' + difficulty + '. Starting in three beats.' + (usingAudio || muted ? '' : ' Audio is unavailable. Follow the notes on screen.'));
}

function pause() {
  if (state === 'starting') { pauseWhenReady = true; return; }
  if (state !== 'playing') return;
  pausedAt = time();
  cancelAnimationFrame(frame);
  audio.stop();
  clearFeedback();
  setState('paused');
  setOverlay({ title: 'PAUSED', copy: 'Your run is on hold.', action: 'Resume', shortcut: 'SPACE', extra: 'End run' });
  announce('Paused.');
  if (!document.hidden && (document.activeElement === game || document.activeElement === pauseButton || document.activeElement === document.body)) {
    primary.focus({ preventScroll: true });
  }
}

async function resume() {
  if (state !== 'paused') return;
  setState('starting');
  primary.disabled = true;
  secondary.disabled = true;
  usingAudio = await audio.activate();
  primary.disabled = false;
  secondary.disabled = false;
  if (pausedAt < 0) {
    clearNotes();
    beginPlayback(0, 3);
  } else {
    beginPlayback(pausedAt, 0);
  }
  announce('Resumed.');
}

function togglePause() {
  if (state === 'playing') pause();
  else if (state === 'paused') resume();
}

function updateSound() {
  audio.setMuted(muted);
  $('sound-icon').setAttribute('href', muted ? '#mute' : '#sound');
  $('sound-label').textContent = muted ? 'Sound off' : 'Sound on';
  $('sound-button').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
}

function toggleSound() {
  muted = !muted;
  updateSound();
  writeStorage('beatbear:sound', muted ? 'off' : 'on');
}

themeSelect.addEventListener('change', () => updateShop());
themeApply.addEventListener('click', buyTheme);
huntMode.addEventListener('change', () => ready());
huntButton.addEventListener('click', activateHunt);
reverseButton.addEventListener('click', reverseMiss);
trackSelect.addEventListener('change', () => ready());
levelSelect.addEventListener('change', () => ready());
$('sound-button').addEventListener('click', toggleSound);
$('help-button').addEventListener('click', () => {
  help.showModal();
  pause();
});
pauseButton.addEventListener('click', togglePause);
primary.addEventListener('click', () => state === 'paused' ? resume() : start());
secondary.addEventListener('click', () => {
  if (state === 'paused' || state === 'ended') ready(true);
});
pads.forEach((pad, lane) => {
  pad.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    hit(lane);
  });
  pad.addEventListener('click', event => {
    if (event.detail === 0) hit(lane);
  });
});
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
  if (event.target.closest('input, select, textarea, [contenteditable]')) return;
  const lane = laneKeys[event.code];
  const isButton = event.target.closest('button');
  const nativeAction = event.target.closest('a[href], summary');
  if (lane !== undefined) {
    event.preventDefault();
    hit(lane);
  } else if (event.code === 'KeyR') {
    reverseMiss();
  } else if (event.code === 'KeyE') {
    if (!huntButton.disabled) {
      event.preventDefault();
      activateHunt();
    }
  } else if (event.code === 'KeyM') {
    toggleSound();
  } else if (event.code === 'Escape' || (event.code === 'Space' && !nativeAction && (!isButton || isButton === primary || isButton === pauseButton))) {
    if (state === 'playing' || state === 'paused') {
      event.preventDefault();
      togglePause();
    }
  } else if (event.code === 'Enter' && !isButton && !nativeAction && (state === 'ready' || state === 'ended')) {
    event.preventDefault();
    start();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});

updateSound();
ready();

setupMidi(hit, pause);

window.addEventListener('bear-wallet', () => updateShop());
window.addEventListener('bear-shop-open', pause);
document.querySelectorAll('a[href="#paw-shop"]').forEach(link => link.addEventListener('click', pause));
