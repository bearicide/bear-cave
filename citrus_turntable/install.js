'use strict';

const installButtons = document.querySelectorAll('[data-citrus-install]');
const installStatus = document.querySelectorAll('[data-citrus-install-status]');
let installPrompt;

function tellInstall(message) {
  for (const status of installStatus) status.textContent = message;
}

function updateInstallButtons() {
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  for (const button of installButtons) button.hidden = installed;
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  for (const button of installButtons) button.hidden = true;
  tellInstall('Citrus LIVE installed.');
});

for (const button of installButtons) button.onclick = async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = undefined;
    try {
      await prompt.prompt();
      return;
    } catch {}
  }
  tellInstall('On iPhone or iPad, open Safari’s Share menu and choose Add to Home Screen. On other devices, look for Install app or Add to Home screen in your browser menu.');
};

updateInstallButtons();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Citrus offline setup failed',error));
}
