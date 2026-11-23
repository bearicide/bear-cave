import { createClient } from '@supabase/supabase-js';
import { backend } from './backend-config.mjs';
import { getDemoSnapshot, replaceDemoSnapshot } from './wallet.mjs';
const $ = id => document.getElementById(id);
const client = createClient(backend.url, backend.publishableKey, {
  auth: { storageKey: 'beatbear:cloud-session:v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
let user;
let signup = false;
let busy = false;
let revision = 0;
let pendingRestore;
const dialog = $('account-dialog');
const status = $('account-status');
function message(text) { status.textContent = text; }
function setBusy(value) {
  busy = value;
  for (const button of dialog.querySelectorAll('[data-account-action]')) button.disabled = value || (!navigator.onLine && button.id !== 'account-signout');
  $('account-submit').textContent = value ? 'Please wait…' : signup ? 'Create account' : 'Sign in';
}
function renderIdentity() {
  $('account-guest').hidden = !!user;
  $('account-member').hidden = !user;
  $('account-open').textContent = user ? 'My account' : 'Account';
  $('account-email-label').textContent = user?.email || '';
  $('account-state-label').textContent = user ? 'Connected · use Save to back up demo progress' : 'Guest · progress stays on this device';
  setBusy(busy);
}
function explain(error) {
  const code = error?.code || '';
  const text = error?.message || '';
  if (!navigator.onLine || /fetch|network/i.test(text)) return 'You are offline. Keep playing here; cloud saves need a connection.';
  if (code === 'invalid_credentials') return 'That email and password did not match. Check them and try again.';
  if (code === 'email_not_confirmed') return 'Confirm your email first, then return here to sign in.';
  if (/email.*not.*authorized|over_email_send_rate_limit|email rate limit/i.test(text) || code === 'email_address_not_authorized') return 'Signup email is limited during this beta. You can keep playing as a guest while email delivery is completed.';
  if (code === 'weak_password') return 'Choose a stronger password with at least eight characters.';
  if (error?.status === 429) return 'Too many attempts. Wait a little before trying again.';
  return 'That request could not finish. Please try again. Your device progress is still saved.';
}
async function refreshIdentity() {
  const request = ++revision;
  if (!navigator.onLine) { renderIdentity(); return; }
  const { data, error } = await client.auth.getUser();
  if (request !== revision) return;
  user = error ? undefined : data.user;
  renderIdentity();
  if (!user) return;
  const owner = user.id;
  const [{ data: profile }, { data: balance }, { data: save }] = await Promise.all([
    client.from('player_profiles').select('display_name').eq('user_id', owner).maybeSingle(),
    client.from('paid_wallets').select('balance').eq('user_id', owner).maybeSingle(),
    client.from('demo_progress').select('updated_at').eq('user_id', owner).maybeSingle()
  ]);
  if (request !== revision || user?.id !== owner) return;
  $('account-name').value = profile?.display_name || 'Bear';
  $('paid-paws').textContent = Number(balance?.balance || 0).toLocaleString();
  $('cloud-save-date').textContent = save ? 'Last cloud save: ' + new Date(save.updated_at).toLocaleString() : 'No cloud save yet. Save this device when you are ready.';
}
$('account-open').addEventListener('click', () => {
  window.dispatchEvent(new Event('bear-shop-open'));
  dialog.showModal();
  if (!navigator.onLine) message('Offline play is ready. Cloud accounts need an internet connection.');
  refreshIdentity().catch(() => message('Could not reach cloud accounts. You can keep playing on this device.'));
});
$('account-switch').addEventListener('click', () => {
  signup = !signup;
  $('account-password').minLength = signup ? 8 : 1;
  $('account-password').autocomplete = signup ? 'new-password' : 'current-password';
  $('account-switch').textContent = signup ? 'Already have an account? Sign in' : 'New here? Create an account';
  $('account-mode-title').textContent = signup ? 'Create your cloud account' : 'Sign in to your cave';
  message(''); setBusy(false);
});
$('account-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !navigator.onLine) return;
  setBusy(true); message('Connecting…');
  const email = $('account-email').value.trim();
  const password = $('account-password').value;
  try {
    const result = signup
      ? await client.auth.signUp({ email, password, options: { emailRedirectTo: new URL('./', window.location.href).href } })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    $('account-password').value = '';
    if (signup && !result.data.session) message('Check your email to confirm the account. After confirming, return to this game and sign in.');
    else { await refreshIdentity(); message('Signed in. Save this device or load your cloud save below.'); }
  } catch (error) { message(explain(error)); }
  finally { setBusy(false); }
});
$('account-save').addEventListener('click', async () => {
  if (!user || busy || !navigator.onLine) return;
  const owner = user.id;
  setBusy(true); message('Saving demo progress…');
  try {
    const snapshot = getDemoSnapshot();
    const { error } = await client.from('demo_progress').upsert({ user_id: owner, snapshot, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    if (user?.id !== owner) return;
    await refreshIdentity();
    message('Demo Paws, unlocks and best scores saved to your account.');
  } catch (error) { message(explain(error)); }
  finally { setBusy(false); }
});
$('account-load').addEventListener('click', async () => {
  if (!user || busy || !navigator.onLine) return;
  const owner = user.id;
  setBusy(true); message('Checking your cloud save…');
  try {
    const { data, error } = await client.from('demo_progress').select('snapshot,updated_at').eq('user_id', owner).maybeSingle();
    if (error) throw error;
    if (user?.id !== owner) return;
    if (!data) { message('No cloud save yet. Save this device first.'); return; }
    pendingRestore = { owner, snapshot: data.snapshot };
    $('restore-date').textContent = new Date(data.updated_at).toLocaleString();
    $('restore-confirmation').hidden = false;
    message('Review the replacement below before loading.');
  } catch (error) { message(explain(error)); }
  finally { setBusy(false); }
});
$('account-restore').addEventListener('click', () => {
  if (!pendingRestore || user?.id !== pendingRestore.owner) return;
  try { replaceDemoSnapshot(pendingRestore.snapshot); pendingRestore = undefined; window.location.reload(); }
  catch (error) { message(error.message); }
});
$('restore-cancel').addEventListener('click', () => { pendingRestore = undefined; $('restore-confirmation').hidden = true; message('Current device progress kept.'); });
$('account-profile').addEventListener('submit', async event => {
  event.preventDefault();
  if (!user || busy || !navigator.onLine) return;
  setBusy(true);
  try {
    const { error } = await client.from('player_profiles').upsert({ user_id: user.id, display_name: $('account-name').value.trim() }, { onConflict: 'user_id' });
    if (error) throw error;
    message('Display name saved.');
  } catch (error) { message(explain(error)); }
  finally { setBusy(false); }
});
$('account-signout').addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  try {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    revision++; user = undefined; pendingRestore = undefined;
    $('restore-confirmation').hidden = true;
    renderIdentity(); message('Signed out on this device. Its demo progress is still here.');
  } catch (error) { message(explain(error)); }
  finally { setBusy(false); }
});
client.auth.onAuthStateChange(() => { setTimeout(() => refreshIdentity().catch(() => {}), 0); });
window.addEventListener('online', () => { renderIdentity(); refreshIdentity().catch(() => {}); });
window.addEventListener('offline', () => { renderIdentity(); if (dialog.open) message('Offline play is ready. Save or load your cloud account after reconnecting.'); });
renderIdentity();
refreshIdentity().catch(() => {});
