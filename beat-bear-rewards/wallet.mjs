const KEY = 'beatbear:rewards:preview:v1';
const safe = n => Number.isSafeInteger(n) && n >= 0 && n <= 100000000;
let stored;
try { stored = JSON.parse(localStorage.getItem(KEY)); } catch {}
export const wallet = {
  paws: safe(stored?.paws) ? stored.paws : 0,
  earned: safe(stored?.earned) ? stored.earned : 0,
  demo: safe(stored?.demo) ? stored.demo : 0,
  unlocked: ['classic', ...['ember', 'aurora'].filter(id => stored?.unlocked?.includes?.(id))],
  applied: stored?.applied && typeof stored.applied === 'object' ? stored.applied : {},
  activity: Array.isArray(stored?.activity) ? stored.activity.filter(e => typeof e?.label === 'string' && Number.isSafeInteger(e?.amount) && Number.isFinite(e?.at)).slice(0, 50) : []
};
export function saveWallet() {
  try { localStorage.setItem(KEY, JSON.stringify(wallet)); } catch {
    document.getElementById('shop-status').textContent = 'Browser storage is unavailable. Progress lasts for this session only.';
  }
  window.dispatchEvent(new Event('bear-wallet'));
}
function record(amount, label) {
  wallet.activity.unshift({ amount, label, at: Date.now() });
  wallet.activity = wallet.activity.slice(0, 50);
}
export function addPaws(amount, label, source = 'demo') {
  if (!safe(amount) || !amount || !safe(wallet.paws + amount)) return false;
  wallet.paws += amount;
  wallet[source === 'earned' ? 'earned' : 'demo'] += amount;
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
