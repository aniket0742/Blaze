# Blaze

**A modern marketplace storefront — everything, A to Z.**

A rebuild of the core Amazon shopping experience: browse a catalog, fill a cart, create an account, check out, and read the order back later. Built for the 8x assignment.

**[Live demo](https://blaze-aniket0742.vercel.app/)** · **[GitHub](https://github.com/aniket0742/Blaze)**

| | |
|---|---|
| **Demo login** | None seeded — sign up with any email. Email confirmation is off, so an account works immediately. |
| **Stack** | Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Postgres · Drizzle ORM |
| **Catalog** | 24 categories · 194 products · 582 reviews |
| **Tests** | 72 unit · 28 integration (against a real database) |

> **Demo only.** Catalog data comes from [DummyJSON](https://dummyjson.com). Prices are seeded demo values converted at a fixed ₹85 = $1, **not live exchange rates**. No payment is ever taken and nothing ships.

## Overview

Blaze covers a complete commercial flow rather than a catalog demo, with the awkward cases handled:

- **Server-authoritative money** — prices, stock and order totals are recomputed server-side from the database. The browser never sends a price.
- **Orders are immutable snapshots** — an order stores what was bought at what was paid, and still renders after the product is repriced, renamed or deleted.
- **Progressive enhancement** — sign up, sign in, sign out, search, filtering and the two-step checkout all work with JavaScript disabled.
- **Prerendered catalog** — 218 category and product pages are static, because session state is kept out of the root layout.

## Key features

**Browsing** — modular home page (deals, category strip, top-rated rail, new arrivals, A–Z index); 24 category pages and 194 product pages, all prerendered; gallery, specifications and seeded read-only reviews; a concrete delivery date on every card.

**Search** — across title, description, brand, category and tags, with category, price-range and rating filters, six sort orders and pagination. Every filter lives in the URL, so results are shareable and the back button works.

**Cart** — guest cart in an httpOnly cookie, signed-in cart in Postgres. Quantity controls, stock clamping, and out-of-stock lines that stay visible and stop counting toward the total.

**Accounts** — email/password via Supabase Auth. The guest cart merges into the account cart on sign in and sign up. `returnTo` is validated against open redirects.

**Checkout and orders** — validated address form, demo payment, and an explicit review step before anything is placed. Stock is re-checked at checkout and again at submission. Order history at `/orders` and details at `/order/[orderNumber]`.

## Core user journey

`Home → Search / Category → Product → Add to cart → Cart → Sign up / Sign in (cart merges) → Checkout → Review → Demo payment → Confirmation → Order details → Order history`

A guest can browse, search and fill a cart with no account. Signing in at checkout carries that cart across instead of discarding it.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router (server components + server actions) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4, light theme only |
| Database | Supabase Postgres |
| ORM | Drizzle — migrations are plain, reviewable SQL |
| Auth | Supabase Auth |
| Tests | Node's built-in test runner via `tsx` |

No state library, component library, form library or test framework. Every runtime dependency is one the app actually needs.

## Architecture

```
app/          Routes. Catalog pages prerendered; cart, checkout and orders dynamic.
              api/session is the only API route — a read of { email, cartCount }.
components/   Presentational, plus a few client islands.
lib/
  <domain>.ts         Pure logic — no next/headers, no database
  <domain>-server.ts  Database reads
  actions/            Server actions (writes)
  db/schema.ts        Drizzle schema, single source of truth
proxy.ts      Session refresh + route guards (Next 16's middleware)
drizzle/      Generated SQL migrations
tests/        *.test.ts (unit) · *.integration.ts (real database)
```

Each domain splits into a pure module and a server module, so client components and unit tests can import the logic without pulling in the database. Writes go through server actions; reads go through server components.

## Data and auth

| Table | Holds |
|---|---|
| `categories`, `products`, `product_reviews` | The seeded catalog (24 / 194 / 582) |
| `cart_items` | Signed-in carts, one row per product per user |
| `orders` | Order number, snapshotted address, payment method, status, totals |
| `order_items` | Line snapshots: title, slug, brand, thumbnail, unit price, quantity |

All money is stored as integer paise, never floats; formatting to `₹1,499` happens only at the display layer.

Supabase Auth owns credentials — Blaze never sees, hashes or stores a password. Guests keep a cookie cart and signed-in shoppers a database cart, both speaking the same shape. On sign in, quantities are summed, capped at stock, and the cookie is cleared only after the account cart is written. Protected routes are guarded in `proxy.ts` and again in the page, and every order read is scoped to the signed-in user in SQL.

## Checkout and demo payment

**There are no card fields anywhere in Blaze.** The payment step offers "Demo card" or "Cash on delivery" and renders a card-shaped graphic — a picture, not a form. The order records only which option was chosen.

The form posts an address and a payment identifier; every figure is computed on the server. Submitting shows a review step, and only a second submit places the order. Writing the order and clearing the cart happen in one transaction, so the cart empties only if the order exists. Order numbers look like `BLZ-260920-K4M7X`.

## Local setup

Requires Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local    # fill in the three values
npm run db:migrate            # create tables
npm run db:seed               # load the catalog (idempotent)
npm run dev                   # http://localhost:3000
```

### Environment variables

Copy `.env.example` to `.env.local`. It holds placeholders only — `.env.local` is gitignored.

| Variable | Source |
|---|---|
| `DATABASE_URL` | Supabase → Connect → **Session pooler** (port 5432). Needed at build time too, since pages are prerendered from the database. |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API — public and browser-safe, but still not committed |

Two Supabase settings are required or sign-up cannot complete: **Confirm email** off, **Allow new users to sign up** on.

### Database and migrations

Schema changes go `db:generate` → review the SQL → `db:migrate`. There is deliberately no `db:push` script; mixing it with generated migrations desynchronised the migration ledger earlier in this project (see [DECISIONS.md](DECISIONS.md)).

```bash
npm run db:generate    # generate a migration from lib/db/schema.ts
npm run db:migrate     # apply pending migrations
npm run db:seed        # (re)load the catalog
```

## Testing

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # 72 unit tests, no database needed
npm run test:db     # 28 integration tests, needs DATABASE_URL
npm run build       # production build; type-checks and prerenders
```

Unit tests cover cart cookie parsing, the merge rule, open-redirect safety, address validation and order numbers. Integration tests run against a real database and cover cart persistence, checkout pricing, stock refusal, order writing, and that one account cannot read another's order.

## Deployment

Deployed on Vercel at **[blaze-aniket0742.vercel.app](https://blaze-aniket0742.vercel.app/)**.

Set the three environment variables in Project Settings; `DATABASE_URL` must be available at build time because the catalog is prerendered. Run `db:migrate` and `db:seed` against the target database once. `npm run build` is the build command — no other configuration is needed.

## Intentional limitations

These are scope decisions, not oversights. Each is explained in [DECISIONS.md](DECISIONS.md).

| Limitation | Why |
|---|---|
| Stock is validated but never decremented | The catalog is shared demo data baked into prerendered pages; decrementing would drain the demo and be undone by the next reseed. |
| No real payments | By design — there are no card fields at all. |
| Delivery is always free | There is no shipping-cost model. |
| Order status is always `placed` | There is no fulfilment lifecycle. |
| The header account menu needs JavaScript | It is a client island so catalog pages stay prerendered. Without JS the header falls back to a "Sign in" link, and sign-out lives on the `/signin` panel. |
| Reviews are read-only | Seeded from DummyJSON. |
| Light theme only | No dark mode, by design. |

**Out of scope:** order cancellation, returns, refunds, reorder, wishlists, recommendations, profile and address management, and seller tools.

## Assignment notes

- **[DECISIONS.md](DECISIONS.md)** — the design record: what was chosen, what was rejected, and the bugs testing surfaced, including an open-redirect vector and a migration chain that would have failed in a fresh environment.
- **[CAPTURE-TEST.md](CAPTURE-TEST.md)** — how the automatic agent-log capture works, and proof that it does.
- **`.agent-logs/`** — the complete, unedited prompt-and-response record of how this project was built, captured by hooks in `.claude/`.
- The product is **Blaze** throughout; Amazon's name and visual identity are not used anywhere in the application.
