(() => {
  const install = document.querySelector('[data-bearbeats-install]');
  let prompt;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    prompt = event;
    install.hidden = false;
  });
  install.addEventListener('click', async () => {
    if (!prompt) return;
    const request = prompt;
    prompt = undefined;
    install.hidden = true;
    await request.prompt();
  });
  window.addEventListener('appinstalled', () => {
    prompt = undefined;
    install.hidden = true;
  });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    const page = new URL(location.href);
    page.search = '';
    page.hash = '';
    navigator.serviceWorker.register('bearbeats-sw.js', { scope: page.pathname })
      .catch((error) => console.warn('BearBeats offline setup failed', error));
  }
})();
