const screens = ['home', 'main', 'paw-shop', 'guide'].map(id => document.getElementById(id));
function navigate() {
  const target = document.getElementById(location.hash.slice(1));
  const screen = screens.find(item => item === target || item.contains(target)) || screens[0];
  if (screen.id !== 'main') window.dispatchEvent(new Event('bear-shop-open'));
  for (const item of screens) item.hidden = item !== screen;
  for (const link of document.querySelectorAll('.primary-nav a, .brand')) {
    const active = link.hash === '#' + screen.id || (link.hash === '#top' && screen.id === 'home');
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (target?.id === 'wallet-info') target.open = true;
  if (target && target !== screen && target.id !== 'top') target.scrollIntoView();
  else window.scrollTo({ top: 0, behavior: 'instant' });
  if (target === screen) {
    screen.tabIndex = -1;
    screen.focus({ preventScroll: true });
  }
}
window.addEventListener('hashchange', navigate);
navigate();
