const KEY = 'beatbear:rewards:preview:v1';
const safe = n => Number.isSafeInteger(n) && n >= 0 && n <= 100000000;
let stored;
try { stored = JSON.parse(localStorage.getItem(KEY)); } catch {}
function normalize(stored) { return {
  paws: safe(stored?.paws) ? stored.paws : 0,
  earned: safe(stored?.earned) ? stored.earned : 0,
  demo: safe(stored?.demo) ? stored.demo : 0,
  unlocked: ['classic', ...['ember', 'aurora'].filter(id => Array.isArray(stored?.unlocked) && stored.unlocked.includes(id))],
  applied: stored?.applied && typeof stored.applied === 'object' ? stored.applied : {},
  activity: Array.isArray(stored?.activity) ? stored.activity.filter(e => typeof e?.label === 'string' && Number.isSafeInteger(e?.amount) && Number.isFinite(e?.at)).slice(0, 50) : []
}; }
export const wallet = normalize(stored);
window.addEventListener('storage', event => {
  if (event.key !== KEY && event.key !== null) return;
  let incoming;
  try { incoming = JSON.parse(event.newValue); } catch {}
  Object.assign(wallet, normalize(incoming));
  window.dispatchEvent(new Event('bear-wallet'));
});
export function saveWallet() {
  try { localStorage.setItem(KEY, JSON.stringify(wallet)); } catch {
    const status = globalThis.document?.getElementById('shop-status');
    if (status) status.textContent = 'Browser storage is unavailable. Progress lasts for this session only.';
  }
  window.dispatchEvent(new Event('bear-wallet'));
}
function record(amount, label) {
  wallet.activity.unshift({ amount, label, at: Date.now() });
  wallet.activity = wallet.activity.slice(0, 50);
}
export function addPaws(amount, label, source = 'demo') {
  const counter = source === 'earned' ? 'earned' : 'demo';
  if (!safe(amount) || !amount || !safe(wallet.paws + amount) || !safe(wallet[counter] + amount)) return false;
  wallet.paws += amount;
  wallet[counter] += amount;
  record(amount, label);
  saveWallet();
  return true;
}
export function spendPaws(amount, label) {
  if (!safe(amount) || !amount || wallet.paws < amount) return false;
  wallet.paws -= amount;
  record(-amount, label);
  saveWallet();
  return true;
}
export function getDemoSnapshot() {
  const scores = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/^beatbear:score:[a-z]+:(easy|normal|hard|beast)(:hunt-reverse)?$/.test(key)) {
        const value = Number(localStorage.getItem(key));
        if (safe(value)) scores[key] = value;
      }
    }
  } catch { /* Wallet can still be saved when score storage is unavailable. */ }
  return { version: 1, wallet: JSON.parse(JSON.stringify(wallet)), scores };
}
export function replaceDemoSnapshot(snapshot) {
  if (snapshot?.version !== 1 || !snapshot.wallet || typeof snapshot.wallet !== 'object') throw Error('This cloud save has an unsupported format.');
  Object.assign(wallet, normalize(snapshot.wallet));
  const scores = snapshot.scores && typeof snapshot.scores === 'object' ? snapshot.scores : {};
  try {
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/^beatbear:score:[a-z]+:(easy|normal|hard|beast)(:hunt-reverse)?$/.test(key)) remove.push(key);
    }
    for (const key of remove) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(scores)) {
      if (/^beatbear:score:[a-z]+:(easy|normal|hard|beast)(:hunt-reverse)?$/.test(key) && safe(value)) localStorage.setItem(key, value);
    }
  } catch { /* Session-only wallet still works. */ }
  saveWallet();
}
