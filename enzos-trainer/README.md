# MATTBEAR – Enzo's Trainer

Independent browser training page for menu recall and pizza assembly practice. Red and black interface with generated transparent food assets. Splash and separately requested admin access use the configured four-digit code. Both are convenience locks in a static public site, not authentication protecting private employee data.

## Menu research

Research date: October 1, 2026. 87 entries cover all retrieved Grand Blanc reference menu products, plus Flushing public pizza descriptions, portions and online specials. Sources are preserved in menu.json and shown inside the app. Do not describe this dataset as a verified complete current Flushing menu: HungerRush and the Flushing delivery ordering page blocked automated browser access, and the public website was serving a menu-less redesign preview. Flushing and Grand Blanc reference labels are retained on each item.

Flushing ingredient data: https://postmates.com/store/enzos-pizzeria-flushing/lbZbS5TUV0a67mpTYOfnFA
Flushing item names and portions: https://order.online/store/enzo-s-pizzeria-of-flushing-pierson-29989577
Grand Blanc full reference menu: https://www.orderenzospizzeria.com/
Flushing specials: https://enzospizzeriami.hungerrush.com/Order/Menu/3 (indexed menu text)

Public menus do not establish assembly order. Each initial sequence reproduces ingredient-list order for memory practice. Admin can edit ingredients and sequence, then mark it kitchen-confirmed. No bake temperatures, food safety instructions, portion quantities, hidden sauce recipes or invented universal cheese/base layers are taught. Location-specific recipe differences stay in the dataset's reference notes.

## Functionality

- Ordered topping game for 21 listed pizza builds: pointer drag/drop, tap and keyboard alternatives, crust selection, hints, undo, ticket completion, progress and scores.
- Menu tests: one shuffled question per item, 10/20/all-item sessions, source labels, immediate explanations, results and missed-answer review.
- Searchable menu guide with category and location filters.
- Admin recipe edits, exact order or any-order modes, hint controls, reference-build toggle, JSON export/import, new items, menu restore and score reset.
- Data edits and scores stay in localStorage; unlocking is not remembered after reload.

Serve this folder over HTTPS or a local HTTP development server. SHA-256 passcode checks require a secure context. No external frontend dependencies.

## Assets

Four images generated with the built-in ImageGen tool and converted to WebP without changing alpha. Three four-by-four atlases contain 48 ingredient/condiment sprites, plus an overhead dough base. Ingredient sprites illustrate food types, not actual Enzo's food, proprietary sauce formulas or portion standards. Mozzarella artwork also represents labeled extra cheese; orange cheddar artwork represents Monterey cheddar. Standard pepperoni artwork also illustrates the explicitly labeled cupping pepperoni. Unknown custom ingredients get a labeled generic fallback; do not invent their visual identity. See assets/CREDITS.md.

Build update: sauce and cheese are mandatory topping steps. The saved sequence is always enforced; any-order mode is removed. Unedited saved menus migrate to the new base layers, while custom kitchen recipes are preserved. Default base layers and construction order require kitchen confirmation.
