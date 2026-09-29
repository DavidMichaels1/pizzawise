---
name: pizzawise-order
description: Order a pizza, compare nearby pizzeria prices, or check an existing order's status through PizzaWise. Use when the user asks to order pizza, build a pizza, compare pizza prices/deals, or check a PizzaWise order's status.
---

# Ordering pizza through PizzaWise

PizzaWise is a pizza aggregator: it compares one pizza build across every nearby pizzeria's real menu and ranks them by value. This skill drives it entirely through its command-line tool at `cli/bin/pizzawise` (run from the repo root as `cli/bin/pizzawise <command>`, or as `pizzawise <command>` if the user has it linked globally). Never call the HTTP API directly — the CLI already handles auth headers, error messages, and remembering the last comparison for you.

Run `cli/bin/pizzawise` with no arguments any time you need a refresher on its exact flags.

## Before anything else: is the user logged in?

Run `cli/bin/pizzawise orders`. If it prints "Not logged in. Run `pizzawise login` first.", you need credentials:

- If the user already has a PizzaWise account, ask for their email and password, then run `cli/bin/pizzawise login --email <email> --password <password>`.
- If they don't, ask for a name, email, and password (8+ characters), then run `cli/bin/pizzawise register --email <email> --password <password> --name <name>`.

Never invent or guess credentials, and never proceed with a placeholder password — ask the user directly.

## Turning a request into a pizza

Map what the user describes onto these exact enum values (case-sensitive, all caps):

- `--size`: `SMALL`, `MEDIUM`, `LARGE`
- `--crust`: `THIN`, `STUFFED`, `GLUTEN_FREE`, `SOURDOUGH`, `PAN`, `NEAPOLITAN`
- `--sauce`: `TOMATO`, `WHITE`, `PESTO`, `BBQ`, `SAN_MARZANO`
- `--topping` (repeatable, one flag per topping): `MUSHROOM`, `ONION`, `OLIVES`, `EXTRA_CHEESE`, `PEPPERONI`, `PINEAPPLE`, `ANCHOVY`, `BUFFALO_MOZZARELLA`, `ARTICHOKE`, `TRUFFLE_OIL`, `PROSCIUTTO`, `CORN`, `JALAPENO`

If the user doesn't specify size, crust, or sauce, the CLI defaults to `MEDIUM` / `THIN` / `TOMATO` — you don't need to ask unless they seem to care. If they name a topping that isn't in this list (e.g. "ham" or "feta"), tell them it isn't one of PizzaWise's supported toppings rather than silently dropping it or guessing a substitute.

## Delivery location

The CLI accepts either:

- `--area "<name>"` — one of: `Dizengoff Center`, `Rothschild Blvd`, `Florentin`, `Neve Tzedek`, `Ramat Aviv`, `Jaffa Port`
- `--lat <number> --lng <number>` — exact coordinates

If the user names a neighborhood close to one of the presets, use that preset. If they give a real address PizzaWise doesn't know, ask them to pick the closest preset area or give coordinates directly — don't guess coordinates for an address yourself.

## Comparing and choosing

Run:

```
cli/bin/pizzawise compare --size <SIZE> --crust <CRUST> --sauce <SAUCE> --topping <T1> --topping <T2> --area "<AREA>"
```

This prints a ranked list (best value first — exact matches before approximate, then by price/distance/ETA) and remembers it for the next `order` call. Summarize the top few results for the user in plain language (pizzeria name, price, and whether it's an exact or approximate match — call out anything missing/substituted). Don't just dump the raw CLI output.

**Never place an order without the user confirming which pizzeria they want**, even if they asked you to "order the best one" — that's confirmation to order rank #1, which is fine, but if they just said "order me a pizza" with no comparison run yet, show them the results first and ask which one (or confirm ordering the top-ranked pick) before spending real money on their behalf.

## Placing the order

Once confirmed:

```
cli/bin/pizzawise order --pick <rank-number-from-the-list>
```

(Or `--pizzeria <id>` if you already know the specific pizzeria ID.) Report back the order ID and confirmed price. If it fails with "Pizzeria is temporarily unavailable" — this is a known, occasional upstream hiccup, not a bug — tell the user and offer to try a different pick from the same results.

## Checking status or cancelling

- One order: `cli/bin/pizzawise status <order-id>`
- All orders: `cli/bin/pizzawise orders`
- Cancel: `cli/bin/pizzawise cancel <order-id>` — confirm with the user before cancelling, same as before ordering.

Order status is one of `PLACED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`, or `CANCELLED`. It's derived live from elapsed time against the pizzeria's ETA, not a fixed value — the same order can report a different status a few minutes later.
