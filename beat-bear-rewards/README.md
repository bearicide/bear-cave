# Beat Bear Rewards

Standalone rewards-edition fork of MATTBEAR Beat Bear version 13, copied from its original Sites source on 2026-11-23. Original source commit: aba502f67db30f9116ed07df9e93e51dea4b6821.

## Current behavior
Seven tracks, four difficulties, keyboard/touch/MIDI, HUNT, reversal, device best scores, Bear Paws cosmetic unlocks and installable offline play are preserved. Bear Paws are local game points with no cash value. No advertising providers, accounts or payouts are connected. Online score requests are disabled on this static host rather than calling a missing API.

## Local preview
Run `python -m http.server 8080` from this folder, then open http://localhost:8080.

## GitHub Pages
Publish main / (root) using Settings > Pages. Paths support both a repository URL and a custom domain. Add the actual domain through Pages settings after DNS is configured; no domain has been assumed or purchased.

## Backend migration
The original Cloudflare/D1 score implementation and SQLite migration are retained in legacy-backend for reference; GitHub Pages does not execute them. They replay scores but are not an authenticated money backend. Do not use local Bear Paws or replay-only scores to authorize redemptions.

Next integration: Supabase Auth, PostgreSQL ledger with server-only writes and per-user reads, verified offer callbacks with unique transaction IDs, campaign budget reservations, and separately funded redeemable balances. Credentials belong in backend secrets. No production SQL migration or payout service is enabled in this fork.
