const install = document.querySelector('#install-app');
const status = document.querySelector('#offline-status');
const help = document.querySelector('#install-dialog');
const updateNotice = document.querySelector('#app-update');
const updateButton = document.querySelector('#update-app');
let promptEvent;
let registration;
let updating = false;
let cached = false;
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function showStatus() {
  status.textContent = cached
    ? (navigator.onLine ? 'Offline ready · demo progress saved on this device' : 'Offline · game and demo shop are ready')
    : (navigator.onLine ? 'Preparing offline play…' : 'Offline · connect once to finish setup');
}
install.hidden = standalone();
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  promptEvent = event;
  install.hidden = false;
});
window.addEventListener('appinstalled', () => { install.hidden = true; promptEvent = undefined; });
install.addEventListener('click', async () => {
  window.dispatchEvent(new Event('bear-shop-open'));
  if (!promptEvent) { help.showModal(); return; }
  const prompt = promptEvent;
  promptEvent = undefined;
  try {
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') install.hidden = true;
  } catch { help.showModal(); }
});
window.addEventListener('online', showStatus);
window.addEventListener('offline', showStatus);
function offerUpdate() { updateNotice.hidden = !registration?.waiting; }
updateButton.addEventListener('click', () => {
  if (!registration?.waiting || updating) return;
  window.dispatchEvent(new Event('bear-shop-open'));
  updating = true;
  updateButton.disabled = true;
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
});
if ('serviceWorker' in navigator) {
  showStatus();
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (updating) window.location.reload(); });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(async reg => {
    registration = reg;
    offerUpdate();
    function watchInstall() {
      const worker = reg.installing;
      if (!worker) return;
      function changed() {
        if (worker.state === 'installed') offerUpdate();
        if (worker.state === 'redundant' && !cached) {
          status.textContent = 'Offline download interrupted. Reconnect and reload Beat Bear to retry.';
        }
      }
      worker.addEventListener('statechange', changed);
      changed();
    }
    reg.addEventListener('updatefound', watchInstall);
    watchInstall();
    await navigator.serviceWorker.ready;
    cached = true;
    showStatus();
  }).catch(() => { status.textContent = 'Play online · offline storage is unavailable in this browser'; });
} else {
  status.textContent = 'Play online · this browser does not support offline installation';
}
