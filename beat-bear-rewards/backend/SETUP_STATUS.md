# Backend setup status

The dedicated **Beat Bear Rewards** Supabase project is active in **bearicide productions**, region us-east-2. Project ref: `stbedeglnklwqmsztlfk`. The creation quote was $0/month and the owner approved it. No paid plan or payment provider was enabled.

## Connected

- Supabase Auth email/password client in Account, built from pinned `@supabase/supabase-js` 2.119.2.
- Optional profiles and manual demo cloud saves (Paws, cosmetic unlocks, best scores).
- Separate `paid_wallets` table with client SELECT only; no client insert/update privilege.
- RLS on every exposed project table, explicit grants, own-user predicates and ownership checks.
- `backend/schema.sql` matches the applied `beat_bear_accounts_and_demo_progress` migration.
- No privileged API key is shipped to the browser. `backend-config.mjs` intentionally contains only the project URL and publishable key.

## Verified

Database tests used temporary transaction fixtures and rolled them back. Own reads/updates passed; cross-user reads/updates, owner reassignment, anonymous access and client changes to paid Paws were denied. Security and performance advisors returned no warnings. Public Auth settings are reachable; email confirmation remains enabled. The anonymous Data API cannot read demo progress or paid balances. Frontend form switching and HTML validation were checked without sending signup emails or creating persistent test accounts. Actual signup/email delivery and authenticated browser save/load have not yet been exercised end to end.

## Still required for public registration

1. Configure production transactional SMTP in Supabase Auth. The default mail service is limited to organization-team addresses and low test volumes. Do not disable email confirmation to get around this restriction.
2. Set Site URL and redirect allowlist to the live game origin `https://beat-bear-rewards.mattbear86.chatgpt.site/` and later the chosen GitHub/custom-domain URL. The Supabase connector used here does not expose auth-configuration updates; these settings still need the dashboard or an authorized Management API connection.
3. Set production password/recovery policy, email templates and abuse protections; test confirmation and recovery flows. Password recovery is not exposed in the game until this setup is completed.
4. Test two real consenting test accounts in the browser for signup, login, save/load, logout and recovery. The app does not auto-overwrite local progress on login. Load & restart explicitly replaces demo progress; saves do not merge.

## Payments

Stripe is not connected. Paid Paws stay zero until a server-verified, idempotent payment-credit implementation exists. Local/demo saves cannot increase paid Paws. Preserve the separate demo namespace and do not import demo balances into paid balances.

## Build

`npm ci`, `npm run build`, `npm test`. The generated accounts client is bundled locally for offline startup; Auth and database requests require the internet and are not cached by the PWA. Native installation and a real disconnected Android run still need device testing. The preview remains owner-private behind ChatGPT sign-in, separate from Beat Bear player accounts.
