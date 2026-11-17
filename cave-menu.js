const menuButton = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const header = menuButton.closest('.top');
const compactNav = matchMedia('(max-width: 1024px)');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  mainNav.hidden = compactNav.matches && !open;
}

function syncMenu() {
  const focusInNav = mainNav.contains(document.activeElement);
  const focusOnButton = document.activeElement === menuButton;
  menuButton.hidden = !compactNav.matches;
  if (compactNav.matches && focusInNav) menuButton.focus();
  setMenu(false);
  if (!compactNav.matches && focusOnButton) mainNav.querySelector('a').focus();
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') === 'false');
});

header.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!header.contains(event.target)) setMenu(false);
});

header.addEventListener('focusout', (event) => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
});

mainNav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !compactNav.matches) return;

  setMenu(false);
  if (link.getAttribute('href').startsWith('#')) {
    document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
  }
});

compactNav.addEventListener('change', syncMenu);
syncMenu();
