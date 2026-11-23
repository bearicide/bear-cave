import { wallet, saveWallet, addPaws, spendPaws } from './wallet.mjs';
import { packs } from './catalog.mjs';
const $ = id => document.getElementById(id);
const number = n => n.toLocaleString();
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const dialog = $('pack-dialog');
let selected;
let returnFocus;
function render() {
  $('shop-balance').textContent = number(wallet.paws);
  $('earned-balance').textContent = number(wallet.earned);
  $('demo-balance').textContent = number(wallet.demo);
  document.querySelectorAll('[data-unlock]').forEach(button => {
    const owned = wallet.unlocked.includes(button.dataset.unlock);
    button.textContent = owned ? 'Unlocked · choose in Track colors' : 'Unlock · 30 Paws';
    button.disabled = owned || wallet.paws < 30;
  });
  const entries = wallet.activity.map(entry => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = entry.label;
    const amount = document.createElement('strong');
    amount.textContent = (entry.amount > 0 ? '+' : '') + number(entry.amount) + ' Paws';
    const time = document.createElement('small');
    time.textContent = new Date(entry.at).toLocaleString();
    item.append(label, amount, time);
    return item;
  });
  if (!entries.length) {
    const item = document.createElement('li');
    item.textContent = 'Your next track or demo pack starts the story.';
    entries.push(item);
  }
  $('wallet-activity').replaceChildren(...entries);
}
document.querySelectorAll('[data-pack]').forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.pack;
  const pack = packs[selected];
  if (!pack) return;
  returnFocus = button;
  $('pack-title').textContent = pack.name;
  $('dialog-pack-art').src = 'assets/' + ({ pocket: 'pocket_paws', stash: 'bear_stash', reserve: 'cave_reserve' })[selected] + '.png';
  $('pack-summary').textContent = number(pack.paws) + ' Paws · ' + money(pack.cents) + ' USD example price';
  $('demo-pack-confirm').textContent = 'Add ' + number(pack.paws) + ' demo Paws';
  window.dispatchEvent(new Event('bear-shop-open'));
  dialog.showModal();
}));
$('demo-pack-confirm').addEventListener('click', () => {
  if (!selected) return;
  const pack = packs[selected];
  selected = undefined;
  const added = addPaws(pack.paws, pack.name + ' · demo pack', 'demo');
  $('shop-status').textContent = added ? number(pack.paws) + ' demo Paws added. No payment taken. Try Spend Paws.' : 'This preview wallet has reached its limit.';
  dialog.close();
});
dialog.addEventListener('close', () => { selected = undefined; returnFocus?.focus(); });
document.querySelectorAll('[data-unlock]').forEach(button => button.addEventListener('click', () => {
  const theme = button.dataset.unlock;
  if (wallet.unlocked.includes(theme) || !spendPaws(30, theme + ' track colors')) return;
  wallet.unlocked.push(theme);
  wallet.applied[$('track').value] = theme;
  saveWallet();
  $('shop-status').textContent = theme.toUpperCase() + ' unlocked and applied to your selected track.';
}));
const tabs = [...document.querySelectorAll('.shop-tabs [role="tab"]')];
function activate(tab) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', active);
    item.tabIndex = active ? 0 : -1;
    $(item.getAttribute('aria-controls')).hidden = !active;
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs.at(-1);
    if (next) { event.preventDefault(); activate(next); next.focus(); }
  });
});
window.addEventListener('bear-wallet', render);
document.querySelector('[data-wallet-info]').addEventListener('click', () => { $('wallet-info').open = true; });
render();
