if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline arcade unavailable', error));
}
const installButton = document.querySelector('#install');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installButton.hidden = false;
  installButton.onclick = async () => {
    installButton.hidden = true;
    await event.prompt();
  };
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; });
