const install = document.querySelector('#install-app');
const status = document.querySelector('#offline-status');
let promptEvent;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  promptEvent = event;
  install.hidden = false;
});
window.addEventListener('appinstalled', () => { install.hidden = true; promptEvent = undefined; });
install.addEventListener('click', async () => {
  if (!promptEvent) return;
  const prompt = promptEvent;
  promptEvent = undefined;
  install.hidden = true;
  try { await prompt.prompt(); }
  catch { status.textContent = 'Use your browser menu to install Beat Bear.'; }
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(registration => {
    const ready = () => { status.textContent = 'Offline ready · game progress stays on this device'; };
    if (registration.active) ready();
    else navigator.serviceWorker.ready.then(ready);
    registration.installing?.addEventListener('statechange', event => {
      if (event.target.state === 'redundant' && !registration.active) status.textContent = 'Offline download failed. Reload to retry.';
    });
  }).catch(() => { status.textContent = 'Offline play unavailable in this browser.'; });
}
