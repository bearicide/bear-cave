# Beat Bear Rewards: enabling dollar purchases

## What is online now

The original version 13 game plus an interactive shop preview. Three proposed USD packs, a device-only demo wallet, earning from completed tracks, cosmetic purchases, and transaction history work. No payments are accepted. A dedicated Supabase account backend is now provisioned, and the Account panel connects to Auth and private demo cloud saves. Public registration email/redirect configuration remains unfinished; see backend/SETUP_STATUS.md. Preview Paws are intentionally isolated under `beatbear:rewards:preview:v1`; never import them into paid balances.

## Proposed packs (owner can revise before launch)

| ID | USD price | Paws |
| --- | ---: | ---: |
| pocket | 1.99 | 200 |
| stash | 4.99 | 550 |
| reserve | 9.99 | 1200 |

Dollar purchases buy nontransferable digital game currency, with no cash-out or cash-prize entry. Sponsor-funded redeemable rewards need a separate product and ledger. Pricing is illustrative; tax treatment and payment fees must be included in final launch economics. There is currently only a small cosmetic catalog: expand useful unlocks before selling the larger packs.

## Account and payment flow to implement after provisioning

1. Completed: dedicated free Supabase project provisioned after approval in bearicide productions. The existing name-voting database is unchanged.
2. Enable email/password accounts, email confirmation, recovery, rate limits, and production email delivery. Player authentication is separate from GitHub sign-in.
3. Store profiles, server-verified earned Paws, purchased Paws, orders, ledger entries and entitlements in PostgreSQL. Players may read only their own private records through RLS. Only server transactions may change balances. Keep real and demo wallets separate.
4. Connect the owner's Stripe merchant account, first in test mode. Create one-time USD Prices for the approved pack amounts, with no recurring subscription.
5. An authenticated server endpoint accepts only a pack ID. It obtains the player ID from a verified session and loads the Price ID and Paw quantity from a private catalog. It creates a Stripe Checkout Session tied to that user and records a pending order; it never trusts price, user ID or quantity supplied by the browser.
6. Verify Stripe webhook signatures against the raw request body. Retrieve the Checkout Session and verify its paid status, currency, Price, quantity, environment, user and pending order. Atomically credit Paws once per Checkout Session with a database uniqueness constraint. Repeated and concurrent webhook deliveries must not double-credit. Never credit from a success URL or browser storage.
7. Implement atomic spending with sufficient-balance checks and one-time entitlement uniqueness. Keep immutable ledger entries and record refunds/disputes as reversals; review partially spent balances rather than silently losing accounting history.
8. Add receipt/order status, purchase recovery, support contact, privacy and purchase/refund terms appropriate to the final product. Card data stays with Stripe Checkout. Test all of these before switching on live payments.

## Required launch verification

- Two real test accounts cannot read or spend each other's funds.
- A failed, canceled, unpaid or forged payment credits nothing.
- Repeated or simultaneous paid events credit once.
- A paid session with the wrong pack, amount, currency or player cannot credit.
- Concurrent purchases/spends reconcile to the ledger and cannot overspend.
- Refund and dispute handling, including already-spent Paws, is exercised.
- Browser-modified preview Paws and local scores cannot affect real balances.
- Confirm successful card payment, account recovery, receipt, and entitlement delivery in Stripe test mode before considering live mode.

## Hosting

The static game can stay on GitHub Pages with a custom domain. Supabase Auth/database/functions run independently. Only the Supabase URL and publishable key go in the browser. Stripe secrets, webhook secrets and Supabase privileged keys stay on the backend. No home computer needs to stay on.

Current source: `bearicide/bear-cave`, branch `beat-bear-rewards`, project folder `beat-bear-rewards/`. The separate Sites preview is a convenience while GitHub Pages/domain administration is unavailable. Do not switch Bear Cave's Pages source to this branch.
