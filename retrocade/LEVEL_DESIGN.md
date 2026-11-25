# RETROCADE — LEVEL DESIGN & REWARD BLUEPRINT
Version: Design v1, 2026-11-25. Status: **approved direction / NOT YET IMPLEMENTED**.

## North star
13 real arcade games, each with 8 authored challenge stages followed by an endless mastery loop (9+). Difficulty changes **rules, layouts, and objectives**, not just speed. Keep one-credit entry / free restarts **within a session**. Never block free players from recharging credits or watching an optional house promo. Ticket prizes have no real-world value.

## Shared level contract
```js
{
  gameId, stage, mode: "campaign" | "endless",
  title, goal: { type, target, current },
  modifiers: [], elapsedSeconds, completed,
  bestStage, rewardClaimed, sessionId
}
```
Engine API: `startStage()`, `recordProgress(type, amount)`, `advanceStage()`, `applyModifiers()`, `resetStage()`, `saveBestStage()`, `awardStageClear()`.
- Stage clear overlay: brief, skippable, non-blocking animation; displays stage name, goal, completion reward, and next hazard. Respect reduced-motion settings.
- Always show **Stage X / progress meter / active modifier**. Name waves or rounds as appropriate but keep common UI slots.
- Stage 9+ uses rotating preset combinations, capped velocity/density, progressively tougher goals. Never scale to impossible or spawn unavoidable obstacles.
- Save highest cleared stage and unlocked achievement **locally** with schema/version migration; later sync via authenticated server. Local client balances are not anti-cheat.
- Distinguish score vs ticket ledger vs play credits: tickets are earned; credits admit one session; restart within session never costs another credit.
- Preserve currently implemented gameplay and powerups; retrofit rules incrementally and regression-test before enabling each cabinet.
- Scope modifiers to stage lifecycle; clear timers, hazards, invulnerability, audio, and dynamic pickups when resetting. Avoid double ticket grants.
- Replaying earlier stages yields **score/high-score rewards only**, not repeatable first-clear bonuses. Stage progression is per game and per browser.
- Accessibility: keyboard, mouse, touch, readable colors + symbols, optional reduced motion, no mandatory fast flashing.

## Stage clear economy (proposed, not wired)
| Stage | First-clear tickets | Milestone | Credit bonus |
|---|---:|---|---:|
| 1 | 4 | Apprentice | 0 |
| 2 | 5 | | 0 |
| 3 | 6 | Bronze badge | 1 (once) |
| 4 | 7 | | 0 |
| 5 | 8 | Silver badge | 1 (once) |
| 6 | 10 | | 0 |
| 7 | 12 | Gold badge | 1 (once) |
| 8 | 18 | Master badge | 2 (once) |
Total: **70 first-clear tickets per cabinet** across stages 1–8. Do not stack these with the old `ticket()` wave/level-clear payout without auditing the current code; replace overlapping stage-clear rewards rather than double-paying. Endless stage clear: 2–6 tickets, limited to a configurable per-session cap; no endlessly claimable credits. Existing skill/gameplay scoring tickets must be reviewed against reward costs.

## Prize affordability targets
- Entry digital cosmetic: 25–50 tickets (a few sessions).
- Mid-tier usable theme, badge visual, cabinet accent: 75–140 tickets (roughly 1–2 completed eight-stage campaigns).
- Premium cosmetic bundle, animated frame, marquee: 180–300 tickets.
- **Meaningful, non-pay-to-win uses**: equip badge on game-entry and progress pages; unlock actual frame/colors/cursor/trails/ship variants; unlock cabinet sound packs with mute control. No purchases or real-money redemption.
- Reprice existing Prize Counter only **after measuring real ticket grants**, otherwise first-clear bonuses plus legacy rewards could inflate balances rapidly.
- Optional house promos reward **credits**, never direct tickets. No real ad revenue should be claimed without a provider.
- Future accounts require server-side ledger and idempotent transactions; local storage is a prototype, not secure ownership.

## 13 campaigns (8 stages each)

### Snake — fruit goals, not time
Goal metric = **fruit eaten since stage start**. Advance on goal while keeping score and a short grace period.
| Stage | Name | Fruit goal | New rule |
|---|---|---:|---|
| 1 | Warm Up | 4 | Clear field, normal speed |
| 2 | Quick Bite | 6 | Modest speed-up |
| 3 | Garden Walls | 7 | Two static obstacles; distinct art |
| 4 | Golden Run | 8 | Golden fruit spawns more often; limited lifespan |
| 5 | Tunnel Vision | 8 | Opposite-edge portals; explicit entrance markers |
| 6 | Poison Patch | 9 | Avoid purple poison pickups; no unavoidable spawns |
| 7 | Moving Maze | 10 | One slow moving barrier, telegraphed |
| 8 | Serpent Master | 12 | Safe combination of portals, poison, and barriers |
Endless: choose 2 compatible modifiers; speed capped; ensure legal unoccupied spawn cells.

### Pong — matches won, not unbounded ball acceleration
Goal = **win one match to 7** each stage; show current player/CPU match points.
| Stage | Name | Opponent / mechanic |
|---|---|---|
| 1 | First Serve | Gentle CPU, standard paddles |
| 2 | Fast Return | Slightly quicker ball, speed cap |
| 3 | Narrow Margin | Player paddle 10% shorter |
| 4 | English | Add controllable paddle-contact spin |
| 5 | Center Gate | One slow-moving central obstacle |
| 6 | Doubles | Temporary second ball, distinct tracking |
| 7 | Trick Shot | AI changes targeting but makes mistakes |
| 8 | Final Challenger | Mixed spin, gate, and fair AI |
Endless: cycle opponents and match modifiers; never combine enough effects to make a return impossible. Boost keeps a limited recharge.

### Breakout — authored brick layouts
Goal = **destroy all required bricks**; stage advances on clear.
| Stage | Name | Layout / mechanic |
|---|---|---|
| 1 | First Wall | Rectangular single-hit bricks |
| 2 | Staggered | Checkerboard gaps |
| 3 | Armor Row | Two-hit bricks with visible cracks |
| 4 | Drifters | Two horizontal moving brick rows |
| 5 | Blast Zone | Explosive bricks clear neighbors |
| 6 | Double Trouble | Earnable second ball with controlled cap |
| 7 | Key Wall | Clearly marked key bricks before locks open |
| 8 | Fortress | Two-hit, moving and explosive layout; escape path maintained |
Endless: pick authored patterns; cap ball count and total speed. Power-up drops remain visible.

### Invaders — distinct enemy wave behavior
Goal = **eliminate a full formation/wave**.
| Stage | Name | Enemy composition |
|---|---|---|
| 1 | First Contact | Classic slow formation |
| 2 | Rush Hour | Slight descent pressure |
| 3 | Iron Shells | Some 2-hit shielded invaders |
| 4 | Crossfire | Alternating firing columns, telegraphed |
| 5 | Mini Boss | One large multi-hit saucer at wave end |
| 6 | Side Raid | Occasional UFO with warning |
| 7 | Zigzag | Sine-wave movement for a minority of enemies |
| 8 | Mothership | Boss + escort formation and safe firing windows |
Endless: rotate enemies + bosses; guarantee brief post-hit immunity, show game-over results.

### Memory Match — progressively larger but touch-usable boards
Goal = **match every pair**. Do not exceed accessible mobile tap size.
| Stage | Name | Pairs | Modifier |
|---|---|---:|---|
| 1 | First Flip | 4 | 2×4 board |
| 2 | Collector | 6 | 3×4 board |
| 3 | Classic | 8 | 4×4 board |
| 4 | Quick Glance | 8 | Short initial preview, no forced timer |
| 5 | Double Take | 10 | 4×5 board, responsive scroll |
| 6 | Shuffle Warning | 8 | One *announced* reshuffle of unmatched cards |
| 7 | Combo Hunt | 10 | Streak multiplier and earned Peek |
| 8 | Master Recall | 12 | 4×6 board, preview + gentle timed bonus |
Endless: mix 8–12 pairs and optional modifiers; keep untimed accessibility option. Show exact progress bar pairs/goal.

### Frog Cross — crossings per stage
Goal = **successful crossings**. Crossing resets frog safely.
| Stage | Name | Crossings goal | New twist |
|---|---|---:|---|
| 1 | Park Run | 2 | Gentle traffic |
| 2 | Two-Way | 3 | Alternating lane directions |
| 3 | Rush Hour | 3 | Traffic density increase |
| 4 | Riverbank | 3 | Log stepping section; visible edges |
| 5 | Rain Route | 4 | Reduced contrast *only with optional accessibility override* |
| 6 | Express Lane | 4 | Occasional long fast vehicle with warning |
| 7 | Bonus Hop | 5 | Shield/heart pickups amid denser traffic |
| 8 | Frog Champion | 5 | Mixed traffic + short river safely |
Endless: capped lane density, guaranteed navigable windows, no simultaneous unavoidable blockers.

### Neon Vault — score objectives without gambling-pressure mechanics
Goal = **earn points toward fixed stage target**; fixed fair simulated symbols. No real payouts.
| Stage | Name | Score goal | Mechanic |
|---|---|---:|---|
| 1 | Open Sesame | 100 | Base reels |
| 2 | Lucky Symbols | 160 | New low-tier symbols |
| 3 | Wild Side | 220 | Wild symbol clearly explained |
| 4 | Hold It | 260 | Limited hold/re-spin |
| 5 | Free Spin Alley | 300 | Unlock bonus mini-round |
| 6 | Vault Keys | 350 | Collect 3 keys via fixed objective meter |
| 7 | Golden Reels | 400 | Additional pattern goal, not higher wager |
| 8 | Vault Open | 500 | Final non-monetary vault unlock animation |
Endless: goals rotate; no purchasable spins, misleading near misses, or claims of random financial value. Credits are game entry only, not per spin.

### Space Rocks — asteroid waves
Goal = **clear all rocks from the wave**.
| Stage | Name | Mechanic |
|---|---|---|
| 1 | Drift | Big slow splitting rocks |
| 2 | Shrapnel | More small splits |
| 3 | Faster Orbit | Moderate velocity increase |
| 4 | Saucer Alert | Weak UFO with predictable shots |
| 5 | Mine Drift | Marked stationary mines |
| 6 | Rock Storm | Higher density but safe initial spawn radius |
| 7 | Dual Threat | UFO + limited mines |
| 8 | Belt Breaker | Pattern-based boss asteroid |
Endless: cap split count, spawn avoid radius and motion speed.

### Claw Machine — skill-based quota
Goal = **collect prize quota**; every stage gets a fair drop budget, visible wind/grip.
| Stage | Name | Prize quota | Modifier |
|---|---|---:|---|
| 1 | First Grab | 2 | Light prizes |
| 2 | Mixed Bin | 3 | New weights |
| 3 | Crosswind | 3 | Visible sideways drift |
| 4 | Tight Shelf | 3 | Narrow positioning |
| 5 | Sliding Shelf | 4 | Slow-moving prizes |
| 6 | Crown Hunt | 1 rare + 2 others | Named target with fair probability |
| 7 | Combo Counter | 4 | Super Grip earned via streak |
| 8 | Grand Grab | 5 | Mixed weights and motion, extra drops |
Endless: re-seed quotas and weights; prevent unavoidable random slips; display grip condition.

### Bubble Shooter — purposeful layouts
Goal = **clear all target bubbles**.
| Stage | Name | Palette | Modifier |
|---|---|---|---|
| 1 | Candy Pop | 3 colors | Large connected clusters |
| 2 | Color Splash | 4 colors | Dispersed clusters |
| 3 | Full Spectrum | 5 colors | Classic board |
| 4 | Stone Wall | 4 colors | Neutral blocker bubbles |
| 5 | Bomb School | 5 colors | Earnable bombs, demonstrate use |
| 6 | Rescue Pop | 5 colors | Free marked target color |
| 7 | Combo Rush | 5 colors | Streak target + blockers |
| 8 | Rainbow Finale | 5 colors | Target groups + bomb challenge |
Endless: curated solvable templates, never randomly generate boards with no possible match; hint system finds connected groups.

### Mini Racer — distance stages
Goal = **travel distance safely** (score remains secondary).
| Stage | Name | Distance | Feature |
|---|---|---:|---|
| 1 | Test Drive | 600 m | Sparse cars |
| 2 | Express | 850 m | More traffic |
| 3 | Close Call | 1000 m | Trucks spanning extra space, safe lane preserved |
| 4 | Slick Roads | 1100 m | Clearly marked oil patches |
| 5 | Night Shift | 1250 m | Headlight scene without hiding hazards |
| 6 | Rival Run | 1400 m | One smart rival in another lane |
| 7 | Thunder Road | 1600 m | Rain FX, visible warnings |
| 8 | Finish Line | 1800 m | Mixed obstacles + bonus turbo gate |
Endless: mix track themes and traffic patterns; cap speed and simultaneous occupied lanes. Turbo consumes limited nitro.

### Rhythm Pads — rounds
Goal = **repeat full sequence correctly** for each round.
| Stage | Name | Notes | Modifier |
|---|---|---:|---|
| 1 | Four Beats | 3 | Slow learning pattern |
| 2 | Echoes | 4 | More tones |
| 3 | Faster Hands | 5 | Shorter pauses |
| 4 | Syncopation | 5 | Unusual rhythm spacing |
| 5 | Double Tap | 6 | Repeated pad accents |
| 6 | Memory Jam | 7 | False visual flourishes kept distinct |
| 7 | Endurance | 8 | Long exact sequence + limited hints |
| 8 | Encore | 9 | Fast sequence, clear prep cue |
Endless: generate repeatable seeded sequences and capped tempo; no simultaneous chords unless multi-touch/keyboard accessibility is solved.

### Falling Blocks — timed survival, clear pattern language
Goal = **survive stage timer**. Stop stage timer while paused; keep HUD progress visible.
| Stage | Name | Seconds | Modifier |
|---|---|---:|---|
| 1 | Warmup Drop | 20 | One hazard at a time |
| 2 | Double Drop | 25 | Two separate lanes |
| 3 | Heavy Load | 28 | Larger blocks, extra warning |
| 4 | Fast Fall | 30 | Higher drop speed |
| 5 | Elite Cubes | 32 | Marked armored hazards |
| 6 | Sidewinders | 35 | Slow diagonal drift with shadow |
| 7 | Pattern Rush | 38 | Distinct staggered columns |
| 8 | Last Stand | 45 | Mix of previous patterns, stage 8 only |
Endless: 30–50 second patterns, density cap 3 lanes at once; guarantee at least two safe lanes. Shield, time warp, double-score, and phase dash remain.

## Suggested implementation sequence and launch gates
1. Add shared **stage HUD + safe persistence + goal API** without changing current games. Verify through browser tests.
2. First group: Falling Blocks, Breakout, Invaders, Bubble Shooter, Mini Racer, Claw Machine. Each gets 8 stage descriptors, specific transitions, and progress bar; validate individual mobile landscape.
3. Remaining: Snake, Frog Cross, Memory Match, Space Rocks, Rhythm Pads, Pong, Neon Vault.
4. Audit ticket awards / redemption prices and meaningful cosmetic equipping. Confirm no free-credit paywall traps.
5. Browser regression: open every cabinet, start, pause, restart, complete two stages, intentionally lose, verify saved record, credit deduction once per session, achievement not duplicated, local reward ledger persists, input works in landscape/portrait and with keyboard.
6. Avoid automatic deployment claims without verifying live build. These are design targets, not delivered functionality until coded and tested.
