# Beat Bear Rewards

Standalone rewards edition of the original MATTBEAR Beat Bear version 13. Game, Paw Shop, demo packs, cosmetic unlocks, device wallet/history and installable offline play work. Generated artwork lives in assets/. No cloud player accounts or real dollar purchases are connected yet. Demo Paws have no cash value and are not imported into a future paid wallet.

## Run locally

From this project folder, run `python -m http.server 8080` and open http://localhost:8080. GitHub Pages can serve this folder unchanged; all paths and the PWA scope work under a subdirectory or custom domain. Do not switch Bear Cave's existing Pages source just to publish this branch.

## Update / verify

After asset or source changes, run `node scripts/build-pwa.mjs` to regenerate the versioned offline cache. Then run `node tests/wallet.test.mjs` and `node tests/pwa.test.mjs`. The builder supports this standalone layout and the hosted preview's dist/ layout. Users see an Update & restart button when a newer cached version is ready. Offline assets include tracks and generated art. No payment or account endpoint is cached.

Read QA_NOTES.md for validation and limits, BACKEND_SETUP.md for enabling authenticated server-side balances and Stripe, and ASSET_NOTES.md for artwork briefs. Original Cloudflare/D1 score code remains under legacy-backend for reference only; GitHub Pages does not run it.
