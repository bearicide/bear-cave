if ('serviceWorker' in navigator) {
  const worker = new URL('sw.js', document.currentScript.src);
  navigator.serviceWorker.register(worker, { updateViaCache: 'none' })
    .then(registration => registration.update())
    .catch(error => console.warn('Arcade update unavailable', error));
}
