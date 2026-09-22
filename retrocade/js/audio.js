const RetroAudio = {
  ctx: null,
  enabled: false,
  init: function () {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
    this.blip(220, 0.08, 'square');
  },
  blip: function (freq, dur, type) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq || 220;
    gain.gain.setValueAtTime(0.045, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (dur || 0.08));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + (dur || 0.08));
  },
  win: function () { this.blip(660, .08, 'triangle'); setTimeout(() => this.blip(990, .12, 'triangle'), 90); },
  lose: function () { this.blip(120, .2, 'sawtooth'); }
};